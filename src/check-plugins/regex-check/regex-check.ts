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
		errorMessage: string
	},
	snippetCheck?: {
		rule: RegExp,
		min: number,
		max: number,
		valueFormat: string,
		errorMessage: string
	}
}

export interface CheckRuleResult {
	rule:CheckRule,
	occurrence:number,
	error:string
}


export class RegexCheck implements Check {
	private reportTemplate:string;
	private partials:{[name:string]:string};
	private errors:Error[] = [];
	private rules: CheckRule[] = [
		{
			"name": "Time element",
			"files": "*.html",
			"snippet": {
				"rule": /<time.*>.*<\/time>/igm,
				"min": 5,
				"max": 30, // max: null means infinity
				"errorMessage": "No time elements found. Please use <time> for every time occurence."
			},
			"snippetCheck": {
				"rule": /<time .*datetime="\d{6}-\d{6}".*>.*<\/time>/igm,
				"min": 1,
				"max": 1,
				"valueFormat": "NUMBER", // 'PERCENT' | 'NUMBER'
				"errorMessage": "Time element not used correct. Don't forget datetime attribute and content."
			}
		}
	];
	private results: { [name:string]:CheckRuleResult[] } = {};


	constructor(private options:{ [name: string]: any }) {
		this.reportTemplate = FS.readFileSync(Path.join(__dirname, './templates/reportTemplate.html'), "utf8");
		this.partials = {}
	}

	public execute(directory: string, callback: (report: Report, errors?: Error[]) => {}): void {
		let barrier: Barrier = new Barrier(this.rules.length).then(() => {
			if(Object.keys(this.results).length > 0) {
				let report:Report = new HtmlReport(
					'CSS metrics',
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
							RegexCheck.checkRule(fileData, rule, filePath, this.results, this.errors);
							barrier.finishedTask(filePath);
						}
					});
				});

				barrier.finishedTask(rule);
			});
		});
	}

	static checkRule(fileData, rule, filePath, results, errors) {
		let matches:string[] = fileData.toString().match(rule.snippet.rule);
		if (RegexCheck.countOutOfBounds(matches.length, rule.snippet)) {
			RegexCheck.addRuleResult(filePath, rule, matches.length, rule.snippet.errorMessage, results);
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
						RegexCheck.addRuleResult(filePath, rule, occurrence, snippetCheck.errorMessage, results);
					}
				});
				break;
			case("PERCENT"):
				let numberOfMatchingSnippetRules:number = matches.filter(
					(matchResult) => Boolean(matchResult.match(snippetCheck.rule))
				).length;
				let occurrence:number = numberOfMatchingSnippetRules / matches.length;
				if (RegexCheck.countOutOfBounds(occurrence, snippetCheck)) {
					RegexCheck.addRuleResult(filePath, rule, occurrence, snippetCheck.errorMessage, results);
				}
				break;
			default:
				errors.push(new Error(`Rule "${rule.name} specifies invalid snippet check format (${snippetCheck.valueFormat}).`))
		}
	};

	private static countOutOfBounds(count, bounds) {
		return !(typeof(count) !== 'undefined' && (bounds.min == null || count >= bounds.min) && (bounds.max == null || count <= bounds.max));
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