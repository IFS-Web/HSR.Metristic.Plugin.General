/* tslint:disable:max-line-length */
/* tslint:disable:max-file-line-count */
'use strict';

let Path = require('path');
let FS = require('fs');
let Glob = require("glob");

import {Barrier, Check, Report, HtmlReport} from "metristic-core";
import {rules} from "./default-rules";


export interface Snippet {
	patterns: RegExp[],
	patternLabels?: string[],
	min: number,
	max: number,
	error: CheckMessage
}

export interface SnippetCheck {
	pattern: RegExp,
	min: number,
	max: number,
	valueFormat: string,
	error: CheckMessage
}

export interface CheckRule {
	fileSpanning?: boolean,
	name: string,
	files: string,
	snippet: Snippet,
	snippetCheck?: SnippetCheck
}



export interface CheckMessage {
	message: string,
	type?: string // "error", "info"
}

export interface Bounds {
	min?: number,
	max?: number
}

export interface CheckRuleResult {
	rule:CheckRule,
	occurrence:number,
	error: CheckMessage,
	bounds?: Bounds,
	patternsFailed?: string[],
	patternsSucceeded?: string[]
}


export interface SnippetMatchData {
	snippet: string,
	numberOfMatchesFound: number
}

export interface FileMatchData {
	name: string,
	numberOfMatchesFound: number[],
	snippets?: SnippetMatchData[]
}

export interface MatchData {
	rule: CheckRule,
	files: FileMatchData[]
}


/**
 * Regex checker
 *
 * parameter documentation see ./README.md or ./default-rules.ts
 */
export class RegexCheck implements Check {
	static assetsDirectory: string = null;
	static styleSheetFiles: string[] = [];

	private reportTemplate:string;
	private errors:Error[] = [];
	private rules: CheckRule[] = [
		rules.HTML.bookmarkIconUsage,
		rules.HTML.unexpectedElementsUsage,
		rules.CSS.efficientSelectorsUsage,
		rules.CSS.unitsUsage,
		rules.JS.codeEvaluationUsage
	];
	private results: { [name:string]:CheckRuleResult[] } = {};
	private matchDatas: MatchData[] = [];

	constructor(options:{ [name: string]: any }) {
		this.rules = options['RegexCheck']['rules'] || this.rules;

		this.reportTemplate = FS.readFileSync(Path.join(__dirname, './templates/report-template.html'), "utf8");
	}

	public execute(directory: string, callback: (report: Report, errors?: Error[]) => {}): void {
		let barrier: Barrier = new Barrier(this.rules.length).then(() => {
			this.matchDatas.forEach((matchData) => {
				RegexCheck.validateRuleMatchData(matchData, this.results, this.errors);
			});
			if (Object.keys(this.results).length > 0) {
				let report:Report = new HtmlReport(
					'Custom checks',
					this.reportTemplate,
					{},
					{ reports: this.results }
				);
				callback(report, this.errors);
			} else {
				callback(null);
			}
		});

		this.rules.forEach((rule, ruleIndex) => {
			if (!rule || !rule.name || !rule.files || !rule.snippet || !rule.snippet.patterns || !(rule.snippet.patterns.length > 0) || !rule.snippet.error) {
				this.errors.push(new Error(`Incorrect rule "${rule.name}" (Rule ${ruleIndex}).`));
				barrier.finishedTask(rule);
			} else {
				Glob(Path.join(directory, rule.files), null, (error, filePaths) => {
					if (error) {
						this.errors.push(error);
					}
					barrier.expand(filePaths.length);

					filePaths.forEach((filePath) => {
						if (FS.statSync(filePath).isFile()) { // filter directories in case of incorrect regex
							FS.readFile(filePath, (fileError, fileData) => {
								let relativeFilePath:string = filePath.replace(directory, '');
								if (fileError || !fileData) {
									this.errors.push(new Error(`Could not read file ${relativeFilePath}. Error ${fileError.message}`));
								} else {
									RegexCheck.checkRule(fileData, rule, relativeFilePath, this.matchDatas, this.errors);
								}
								barrier.finishedTask(ruleIndex + filePath);
							});
						} else {
							barrier.finishedTask(ruleIndex + filePath);
						}
					});

					barrier.finishedTask(rule);
				});
			}
		});
	}

	static validateRuleMatchData(matchData: MatchData, results, errors): void {
		let rule = matchData.rule;
		let snippet = rule.snippet;

		// file spanning rule
		if (rule.fileSpanning) {
			let globalName = 'general';
			let totalNumberOfMatchesList: number[] = matchData.files.reduce((numberOfMatchesSums, fileMatchData) => {
					return numberOfMatchesSums.map((sum, index) => sum + fileMatchData.numberOfMatchesFound[index]);
				},
				rule.snippet.patterns.map((pattern) => 0) // we start with an array of 0 values (length = #patterns)
			);
			RegexCheck.checkOutOfBoundsAndAddCreateResultForFailingRules(totalNumberOfMatchesList, snippet, rule, globalName, results);

			if (rule.snippetCheck ) {
				if (rule.snippetCheck.valueFormat == "NUMBER") {
					matchData.files.forEach((fileMatchData: FileMatchData) => {
						if (fileMatchData.snippets) {
							RegexCheck.validateFileRuleSnippet(rule, fileMatchData.name, fileMatchData.snippets, results, errors);
						}
					});
				} else {
					let allSnippetMatches: SnippetMatchData[] = matchData.files.reduce((snippetMatchDataList, fileMatchData) => {
						return snippetMatchDataList.concat(fileMatchData);
					}, []);
					if (allSnippetMatches && allSnippetMatches.length > 0) {
						RegexCheck.validateFileRuleSnippet(rule, globalName, allSnippetMatches, results, errors);
					}
				}
			}
		} else {
			// per file rule
			matchData.files.forEach((fileMatchData: FileMatchData) => {
				RegexCheck.checkOutOfBoundsAndAddCreateResultForFailingRules(fileMatchData.numberOfMatchesFound, snippet, rule, fileMatchData.name, results);

				if (rule.snippetCheck && fileMatchData.snippets) {
					RegexCheck.validateFileRuleSnippet(rule, fileMatchData.name, fileMatchData.snippets, results, errors);
				}
			});
		}
	}

	private static checkOutOfBoundsAndAddCreateResultForFailingRules(totalNumberOfMatchesList: number[], snippet:Snippet, rule:CheckRule, globalName:string, results) {
		let patternsFailed: string[] = [], patternsSucceeded: string[] = [];
		let valuesOutOfBoundsList: boolean[] = totalNumberOfMatchesList.map((num) => RegexCheck.countOutOfBounds(num, snippet));
		if (snippet.patternLabels) {
			RegexCheck.addNamedPatternsToPatternsList(valuesOutOfBoundsList, patternsFailed, rule, patternsSucceeded);
		}
		if (valuesOutOfBoundsList.some((isFailed) => isFailed)) {
			let averageLength: number = totalNumberOfMatchesList.reduce(
				(previous, current) => previous + current
			, 0) / totalNumberOfMatchesList.length;

			RegexCheck.addRuleResult(globalName, rule, averageLength, snippet, snippet.error, results, patternsFailed, patternsSucceeded);
		}
	}

	static validateFileRuleSnippet(rule: CheckRule, fileName: string, snippetMatchesData: SnippetMatchData[], results, errors: Error[]): void {
		let snippetCheck: SnippetCheck = rule.snippetCheck;

		switch (snippetCheck.valueFormat) {
			case("NUMBER"):
				snippetMatchesData.forEach((snippetMatchData: SnippetMatchData) => {
					if (RegexCheck.countOutOfBounds(snippetMatchData.numberOfMatchesFound, snippetCheck)) {
						RegexCheck.addRuleResult(fileName, rule, snippetMatchData.numberOfMatchesFound, snippetCheck, snippetCheck.error, results);
					}
				});
				break;
			case("PERCENT"):
				let numberOfMatchingSnippetRules:number = snippetMatchesData.filter(
					(snippetMatchData: SnippetMatchData) => snippetMatchData.numberOfMatchesFound > 0
				).length;
				let occurrence:number = numberOfMatchingSnippetRules / snippetMatchesData.length;
				if (RegexCheck.countOutOfBounds(occurrence, snippetCheck)) {
					RegexCheck.addRuleResult(fileName, rule, occurrence, snippetCheck, snippetCheck.error, results);
				}
				break;
			default:
				errors.push(new Error(`Rule "${rule.name} specifies invalid snippet check format (${snippetCheck.valueFormat}).`));
		}
	}

	static checkRule(fileData, rule: CheckRule, filePath: string, matchData: MatchData[], errors: Error[]) {
		let fileContent: string = fileData.toString();
		let matchList: string[][] = rule.snippet.patterns.map(
			(pattern) => RegexCheck.match(pattern, fileContent)
		);
		let numberOfMatchesList: number[] = matchList.map((matches) => matches.length);
		// TODO: declare find (typescript does not know it) and use it instead
		let ruleMatchData: MatchData = matchData.filter((entry) => entry.rule == rule)[0] || null;
		if (!ruleMatchData) {
			ruleMatchData = { rule: rule, files: [] };
			matchData.push(ruleMatchData);
		}
		let fileMatchData: FileMatchData = {
				name: filePath,
				numberOfMatchesFound: numberOfMatchesList
		};
		ruleMatchData.files.push(fileMatchData);

		if (rule.snippetCheck) {
			RegexCheck.checkSnippet(rule, matchList, fileMatchData);
		}
	};

	protected static addNamedPatternsToPatternsList(patternsOutOfBounds:boolean[], patternsFailed:string[], rule, patternsSucceeded:string[]) {
		patternsOutOfBounds.forEach((isFailed, index) => {
			if (isFailed) {
				patternsFailed.push(rule.snippet.patternLabels[ index ] || null);
			} else {
				patternsSucceeded.push(rule.snippet.patternLabels[ index ] || null);
			}
		});
	};

	static checkSnippet(rule: CheckRule, matchList: string[][], fileMatchData: FileMatchData) {
		let snippetCheck = rule.snippetCheck;
		let matches: string[] = matchList.reduce(
			(previous: string[], current: string[]) => previous.concat(current)
		, []);

		if (matches.length > 0 && !fileMatchData.snippets) {
			fileMatchData.snippets = [];
		}
		matches.forEach((match) => {
			let snippetMatches: string[] = RegexCheck.match(snippetCheck.pattern, match);
			fileMatchData.snippets.push({ snippet: match, numberOfMatchesFound: snippetMatches.length });
		});
	};

	private static countOutOfBounds(count: number, bounds: {min: number, max: number}) {
		return !(typeof(count) !== 'undefined' && typeof(bounds) !== 'undefined' && (bounds.min == null || count >= bounds.min) && (bounds.max == null || count <= bounds.max));
	};

	private static addRuleResult(filePath: string, rule: CheckRule, occurrence: number, bounds: Bounds, errorMessage: CheckMessage, results, patternsFailed?: string[], patternsSucceeded?: string[]) {
		if (!results[ filePath ]) {
			results[ filePath ] = [];
		}
		let result:CheckRuleResult = {
			rule: rule,
			occurrence: occurrence,
			error: errorMessage
		};
		if (bounds) {
			result['bounds'] = bounds;
		}
		if (patternsFailed && patternsSucceeded) {
			result['patternsFailed'] = patternsFailed;
			result['patternsSucceeded'] = patternsSucceeded;
		}
		results[ filePath ].push(result);
	};

	public static match(pattern: RegExp, text: string): string[] {
		var matches = [];
		var match;
		while (match = pattern.exec(text)) {
			matches.push(match[0]);
		}
		return matches;
	}
}
