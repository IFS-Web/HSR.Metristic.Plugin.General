/* tslint:disable:max-line-length */
'use strict';

let Path = require('path');
let FS = require('fs');
let Glob = require("glob");

import {Barrier} from "metristic-core";
import {Check} from "metristic-core";
import {Report} from "metristic-core";
import {HtmlReport} from "metristic-core";
import {rules} from "./default-rules";


export interface CheckRule {
	name: string,
	files: string,
	snippet: {
		patterns: RegExp[],
		patternLabels?: string[],
		min: number,
		max: number,
		error: CheckMessage
	},
	snippetCheck?: {
		pattern: RegExp,
		min: number,
		max: number,
		valueFormat: string,
		error: CheckMessage
	}
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

	constructor(options:{ [name: string]: any }) {
		this.rules = options['RegexCheck']['rules'] || this.rules;

		this.reportTemplate = FS.readFileSync(Path.join(__dirname, './templates/report-template.html'), "utf8");
	}

	public execute(directory: string, callback: (report: Report, errors?: Error[]) => {}): void {
		let barrier: Barrier = new Barrier(this.rules.length).then(() => {
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
						FS.readFile(filePath, (fileError, fileData) => {
							let relativeFilePath:string = filePath.replace(directory, '');
							if (fileError || !fileData) {
								this.errors.push(new Error(`Could not read file ${relativeFilePath}. Error ${fileError.message}`));
							} else {
								RegexCheck.checkRule(fileData, rule, relativeFilePath, this.results, this.errors);
							}
							barrier.finishedTask(ruleIndex + filePath);
						});
					});

					barrier.finishedTask(rule);
				});
			}
		});
	}

	static checkRule(fileData, rule, filePath, results, errors) {
		let patternsFailed: string[] = [];
		let patternsSucceeded: string[] = [];
		let fileContent = fileData.toString();
		let matchList: string[][] = rule.snippet.patterns.map(
			(pattern) => RegexCheck.match(pattern, fileContent)
		);
		let patternsOutOfBounds: boolean[] = matchList.map((matches) => RegexCheck.countOutOfBounds(matches.length, rule.snippet));
		if (rule.snippet.patternLabels) {
			RegexCheck.addNamedPatternsToPatternsList(patternsOutOfBounds, patternsFailed, rule, patternsSucceeded);
		}

		if (patternsOutOfBounds.some((isFailed) => isFailed)) {
			let averageLength: number = matchList.reduce((previous, current) => previous + current.length, 0) / matchList.length;
			RegexCheck.addRuleResult(filePath, rule, averageLength, rule.snippet, rule.snippet.error, results, patternsFailed, patternsSucceeded);
		} else {
			if (rule.snippetCheck) {
				let allMatches: string[] = matchList.reduce(
					(previous: string[], current: string[]) => previous.concat(current)
				, []);
				RegexCheck.checkSnippet(rule, allMatches, filePath, results, errors);
			}
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
	}

	static checkSnippet(rule, matches, filePath, results, errors) {
		let snippetCheck = rule.snippetCheck;
		switch (snippetCheck.valueFormat) {
			case("NUMBER"):
				matches.forEach((match) => {
					let snippetMatches: string[] = RegexCheck.match(snippetCheck.pattern, match);
					let occurrence:number = snippetMatches.length;
					if (RegexCheck.countOutOfBounds(occurrence, snippetCheck)) {
						RegexCheck.addRuleResult(filePath, rule, occurrence, snippetCheck, snippetCheck.error, results);
					}
				});
				break;
			case("PERCENT"):
				let numberOfMatchingSnippetRules:number = matches.filter(
					(matchResult) => RegexCheck.match(snippetCheck.pattern, matchResult).length > 0
				).length;
				let occurrence:number = numberOfMatchingSnippetRules / matches.length;
				if (RegexCheck.countOutOfBounds(occurrence, snippetCheck)) {
					RegexCheck.addRuleResult(filePath, rule, occurrence, snippetCheck, snippetCheck.error, results);
				}
				break;
			default:
				errors.push(new Error(`Rule "${rule.name} specifies invalid snippet check format (${snippetCheck.valueFormat}).`));
		}
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
