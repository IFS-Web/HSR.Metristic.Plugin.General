let Path = require('path');
let FS = require('fs');
let Glob = require("glob");

import {Barrier} from "../../domain/model/barrier";
import {Check} from "../../domain/model/check";
import {Report} from "../../domain/model/report";
import {HtmlReport} from "../../domain/model/html-report";

export interface CheckRule {
	name: string,
	files: string,
	snippet: {
		patterns: RegExp[],
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

export interface CheckRuleResult {
	rule:CheckRule,
	occurrence:number,
	error: CheckMessage
}


export class RegexCheck implements Check {
	private reportTemplate:string;
	private errors:Error[] = [];
	private rules: CheckRule[] = [
		{
			name: "Time element usage",
			files: "*.html",
			snippet: {
				patterns: [/<time[^<>\/]*>[^<>\/]*<\/time>/igm],
				min: 0, // min: null means bound will not be checked
				max: 30, // max: null means bound will not be checked
				error: {
					message: "Not enough or to less time elements found. Please use <time> for every time occurence.",
					type: "warning"
				}
			},
			snippetCheck: {
				pattern: /<time [^<>\/]*datetime="((\d{4}(-\d{2}){0,2})|(-\d{2}){0,2}|(\d{4}-W\d{2})|(\d{4}(-\d{2}){2}(T| )\d{2}:\d{2}(:\d{2}(.\d{3})?)?)|(\d{2}:\d{2}((\+|\-)\d{2}:\d{2})?))"[^<>\/]*>[^<>\/]*<\/time>/igm,
				min: 1,
				max: 1,
				valueFormat: "NUMBER", // 'PERCENT' | 'NUMBER'
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
				patterns: [/<link[^<>]*rel="icon"[^<>]*\/?>/igm],
				min: 1,
				max: 1,
				error: {
					message: 'No bookmark icon found.',
					type: "warning"
				}
			}
		},
		{
			name: "Stylesheets",
			files: "*.html",
			snippet: {
				patterns: [/<link[^<>]*rel="stylesheet"[^<>]*\/?>/igm],
				min: 1,
				max: null,
				error: {
					message: 'No stylesheet found',
					type: "info"
				}
			}
		}
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
						patterns: /<time[^<>\/]*>[^<>\/]*<\/time>/igm,
						min: 0, // min: null means bound will not be checked
						max: 10, // max: null means bound will not be checked
						error: {
							message: "Not enough time elements found. Please use <time> for every time occurence.",
							type: "warning" // "info" | "warning" | "error"
						}
					},
					snippetCheck: {
						pattern: /<time [^<>\/]*datetime="(\d{4}(-\d{2}){0,2})|(-\d{2}){0,2}|(\d{4}-W\d{2})|(\d{4}(-\d{2}){2}(T| )\d{2}:\d{2}(:\d{2}(.\d{3})?)?)|(\d{2}:\d{2}((\+|\-)\d{2}:\d{2})?)"[^<>\/]*>[^<>\/]*<\/time>/igm,
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
						patterns: /<link[^<>\/]*rel="icon"[^<>\/]*\\?>/igm,
						min: 1,
						max: 1,
						error: {
							message: 'No bookmark icon found.',
							type: "warning"
						}
					}
				]
			}
		}
	 *
	 * "NUMBER", "PERCENT":
	 * NUMBER checks if the number of occurences in the snippet matches the bounds
	 * Example: min 1, max 2: in the snippets from the snippet patterns match must be found
	 *          1 or 2 occurrences of the snippet check patterns matches
	 * PERCENT checks if the percentage of the matching snippets is between the bounds
	 * Example: min 0.2, max null: Minimal 40% of the snippet found by the snippet patterns match
	 *          must match the snippet check patterns
	 **/
	constructor(options:{ [name: string]: any }) {
		this.rules = options['RegexCheck']['rules'] || this.rules;

		this.reportTemplate = FS.readFileSync(Path.join(__dirname, './templates/report-template.html'), "utf8");
	}

	public execute(directory: string, callback: (report: Report, errors?: Error[]) => {}): void {
		let barrier: Barrier = new Barrier(this.rules.length).then(() => {
			if(Object.keys(this.results).length > 0) {
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
			Glob(Path.join(directory, rule.files), null, (error, filePaths) => {
				if(error) {
					this.errors.push(error);
				}
				barrier.expand(filePaths.length);

				filePaths.forEach((filePath) => {
					FS.readFile(filePath, (fileError, fileData) => {
						let relativeFilePath: string = filePath.replace(directory, '');
						if(fileError || !fileData) {
							this.errors.push(new Error(`Could not read file ${relativeFilePath}. Error ${fileError.message}`));
						} else {
							RegexCheck.checkRule(fileData, rule, relativeFilePath, this.results, this.errors);
						}
						barrier.finishedTask(ruleIndex+filePath);
					});
				});

				barrier.finishedTask(rule);
			});
		});
	}

	static checkRule(fileData, rule, filePath, results, errors) {
		let matchList: string[][] = rule.snippet.patterns.map(
			(pattern) => fileData.toString().match(pattern) || [] // match returns null if 0 found;
		);

		if (matchList.some((matches) => RegexCheck.countOutOfBounds(matches.length, rule.snippet))) {
			let averageLength: number = matchList.reduce((previous, current) => previous+current.length,0)/matchList.length;
			RegexCheck.addRuleResult(filePath, rule, averageLength, rule.snippet.error, results);
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
					let snippetMatches: string[] = match.match(snippetCheck.pattern) || []; // match returns null if 0 found
					let occurrence:number = snippetMatches.length;
					if (RegexCheck.countOutOfBounds(occurrence, snippetCheck)) {
						RegexCheck.addRuleResult(filePath, rule, occurrence, snippetCheck.error, results);
					}
				});
				break;
			case("PERCENT"):
				let numberOfMatchingSnippetRules:number = matches.filter(
					(matchResult) => Boolean(matchResult.match(snippetCheck.pattern))
				).length;
				let occurrence:number = numberOfMatchingSnippetRules / matches.length;
				if (RegexCheck.countOutOfBounds(occurrence, snippetCheck)) {
					RegexCheck.addRuleResult(filePath, rule, occurrence, snippetCheck.error, results);
				}
				break;
			default:
				errors.push(new Error(`Rule "${rule.name} specifies invalid snippet check format (${snippetCheck.valueFormat}).`))
		}
	};

	private static countOutOfBounds(count: number, bounds: {min: number, max: number}) {
		return !(typeof(count) !== 'undefined' && typeof(bounds) !== 'undefined' && (bounds.min == null || count >= bounds.min) && (bounds.max == null || count <= bounds.max));
	};

	private static addRuleResult(filePath, rule, occurrence, errorMessage, results) {
		if (!results[ filePath ]) {
			results[ filePath ] = [];
		}
		let result:CheckRuleResult = {
			rule: rule,
			occurrence: occurrence,
			error: errorMessage
		};
		results[ filePath ].push(result);
	};
}