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

	/**
	 * @options available params:
		{
			RegexCheck: {
				patterns: [
					{
					name: "Time element usage",
					files: "*.html",
					snippet: {
						patterns: [/<time[^<>\/]*>[^<>\/]*<\/time>/igm],
						min: 0, // min: null means bound will not be checked
						max: 10, // max: null means bound will not be checked
						error: {
							message: "Not enough time elements found. Please use <time> for every time occurence.",
							type: "warning" // "info" | "warning" | "error"
						}
					},
					snippetCheck: {
						pattern: [/<time [^<>\/]*datetime="(\d{4}(-\d{2}){0,2})|(-\d{2}){0,2}|(\d{4}-W\d{2})|(\d{4}(-\d{2}){2}(T| )\d{2}:\d{2}(:\d{2}(.\d{3})?)?)|(\d{2}:\d{2}((\+|\-)\d{2}:\d{2})?)"[^<>\/]*>[^<>\/]*<\/time>/igm],
						min: 1,
						max: 1,
						valueFormat: "NUMBER", // "PERCENT" | "NUMBER"
						error: {
							message: "Time element not used correct. Don't forget datetime attribute and value (http://www.w3schools.com/tags/att_time_datetime.asp).",
							type: "error"
						}
					}
				},
				{
					name: "Bookmark icon",
					files: "*.html",
					snippet: {
						patterns: [/<link[^<>\/]*rel="icon"[^<>\/]*\\?>/igm],
						min: 1,
						max: 1,
						error: {
							message: 'No bookmark icon found.',
							type: "warning"
						}
					}
				},
				{
					name: "Required elements",
					files: "*.html",
					snippet: {
						patterns: [
							/<address[^<>]*>/igm,
							/<meta[^<>]*name="\w*"[^<>]*>/igm,
							/<link[^<>]*rel="icon"[^<>]*>/igm,
							/<iframe[^<>]*>/igm,
							/<track[^<>]*>/igm,
							/<dl>((?!<\/dl>)[\S\s])*<\/dl>/igm,
							/<ul>((?!<\/ul>)[\S\s])*<\/ul>/igm,
							/<ol>((?!<\/ol>)[\S\s])*<\/ol>/igm,
							/<main[^<>]*>/igm,
							/<nav[^<>]*>/igm,
							/<aside[^<>]*>/igm,
							/<article[^<>]*>/igm,
							/<header[^<>]*>/igm,
							/<footer[^<>]*>/igm,
							/<figure[^<>]*>/igm,
							/<figcaption[^<>]*>/igm,
							/<small[^<>]*>/igm,
							/<object[^<>]*>/igm,
							/<form[^<>]*>/igm
						],
						patternLabels: [
							'address', 'meta', 'link', 'iframe', 'track', 'definition list', 'unordered list', 'ordered list', 'main', 'nav', 'aside', 'article', 'header', 'footer', 'figure', 'figcaption', 'small', 'object', 'form'
						],
						min: 1,
						max: null,
						error: {
							message: "Some of the following expected elements not found: address, meta, bookmark icon, iframe, video track, definition-, un- y ordered list, main, nav, aside, article, header, footer, figure, figcaption, small, object, form",
							type: "error"
						}
					}
				},
			]
		}
	 *
	 * "NUMBER", "PERCENT":
	 * NUMBER checks if the number of occurences in the snippet matches the bounds
	 * Example: min 1, max 2: in the snippets from the snippet patterns match must be found
	 *          1 or 2 occurrences of the snippet check patterns matches
	 * PERCENT checks if the percentage of the matching snippets is between the bounds
	 * Example: min 0.2, max null: Minimal 40% of the snippet found by the snippet patterns match
	 *          must match the snippet check patterns
	 *
	 * Tipp: use https://regex101.com/#javascript
	 *
	 * More example rules see default-rules.ts
	 **/
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
			patternsOutOfBounds.forEach((isFailed, index) => {
				if (isFailed) {
					patternsFailed.push(rule.snippet.patternLabels[ index ] || null);
				} else {
					patternsSucceeded.push(rule.snippet.patternLabels[ index ] || null);
				}
			});
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
