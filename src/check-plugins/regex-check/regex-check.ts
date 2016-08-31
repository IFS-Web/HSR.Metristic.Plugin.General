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
		rule: RegExp,
		min: number,
		max: number,
		error: CheckMessage
	},
	snippetCheck?: {
		rule: RegExp,
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
	private partials:{[name:string]:string};
	private errors:Error[] = [];
	private rules: CheckRule[] = [
		{
			name: "Time element usage",
			files: "*.html",
			snippet: {
				rule: /<time[^<>\/]*>[^<>\/]*<\/time>/igm,
				min: 0, // min: null means bound will not be checked
				max: 10, // max: null means bound will not be checked
				error: {
					message: "Not enough time elements found. Please use <time> for every time occurence.",
					type: "warning"
				}
			},
			snippetCheck: {
				rule: /<time [^<>\/]*datetime="(\d{4}(-\d{2}){0,2})|(-\d{2}){0,2}|(\d{4}-W\d{2})|(\d{4}(-\d{2}){2}(T| )\d{2}:\d{2}(:\d{2}(.\d{3})?)?)|(\d{2}:\d{2}((\+|\-)\d{2}:\d{2})?)"[^<>\/]*>[^<>\/]*<\/time>/igm,
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
				rule: /<link[^<>\/]*rel="icon"[^<>\/]*\\?>/igm,
				min: 1,
				max: 1,
				error: {
					message: 'No bookmark icon found.',
					type: "warning"
				}
			}
		}
	];
	private results: { [name:string]:CheckRuleResult[] } = {};


	constructor(private options:{ [name: string]: any }) {
		this.reportTemplate = FS.readFileSync(Path.join(__dirname, './templates/report-template.html'), "utf8");
		this.partials = {}
	}

	public execute(directory: string, callback: (report: Report, errors?: Error[]) => {}): void {
		let barrier: Barrier = new Barrier(this.rules.length).then(() => {
			if(Object.keys(this.results).length > 0) {
				let report:Report = new HtmlReport(
					'Custom checks',
					this.reportTemplate,
					this.partials,
					{ reports: this.results }
				);
				callback(report, this.errors);
			} else {
				callback(null);
			}
		});

		this.rules.forEach((rule) => {
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
						barrier.finishedTask(filePath+rule.name);
					});
				});

				barrier.finishedTask(rule);
			});
		});
	}

	static checkRule(fileData, rule, filePath, results, errors) {
		let matches:string[] = fileData.toString().match(rule.snippet.rule) || []; // match returns null if 0 found;
		if (RegexCheck.countOutOfBounds(matches.length, rule.snippet)) {
			RegexCheck.addRuleResult(filePath, rule, matches.length, rule.snippet.error, results);
		} else {
			if (rule.snippetCheck) {
				RegexCheck.checkSnippet(rule, matches, filePath, results, errors);
			}
		}
	};

	static checkSnippet(rule, matches, filePath, results, errors) {
		let snippetCheck = rule.snippetCheck;
		switch (snippetCheck.valueFormat) {
			case("NUMBER"):
				matches.forEach((match) => {
					let snippetMatches: string[] = match.match(snippetCheck.rule) || []; // match returns null if 0 found
					let occurrence:number = snippetMatches.length;
					if (RegexCheck.countOutOfBounds(occurrence, snippetCheck)) {
						RegexCheck.addRuleResult(filePath, rule, occurrence, snippetCheck.error, results);
					}
				});
				break;
			case("PERCENT"):
				let numberOfMatchingSnippetRules:number = matches.filter(
					(matchResult) => Boolean(matchResult.match(snippetCheck.rule))
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

	private static countOutOfBounds(count, bounds) {
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