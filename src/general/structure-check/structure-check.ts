'use strict';

let Path = require('path');
let FS = require('fs');

import {Barrier, Check, Report, HtmlReport} from "metristic-core";


export interface FileRule {
	type?: string,
	optional?: boolean,
	additionalContentForbidden?: boolean,
	children?: {[name: string]: FileRule}
}

export interface FileResult {
	absolutePath: string,
	wrongType?: boolean,
	missing?: boolean,
	forbidden?: boolean,
	present?: boolean,
	additional?: boolean,
	children?: { [name: string]: FileResult }
}


export class StructureCheck implements Check {
	static assetsDirectory: string = null;
	static styleSheetFiles: string[] = [];

	private reportTemplate:string;
	private partials: {[name:string]:string};

	private rules: FileRule = {};
	private errors: Error[] = [];

	constructor(options:{ [name: string]: any }) {
		this.rules = options['StructureCheck']['rules'] || this.rules;
		this.reportTemplate = FS.readFileSync(Path.join(__dirname, './templates/report-template.html'), "utf8");
		this.partials = {
			directoryPartial: FS.readFileSync(Path.join(__dirname, './templates/directoryPartial.html'), "utf8")
		};
	}

	public execute(directory: string, callback: (report: Report, errors?: Error[]) => {}): void {
		let result: { [name: string]: FileResult } = {};
		let awaiter: Barrier = new Barrier(1).then(() => {
			let report: Report = new HtmlReport('File structure check', this.reportTemplate, this.partials, { result: result });
			callback(report, this.errors);
		});
		StructureCheck.walkStructure(awaiter, FS, directory, null, this.rules, result, this.errors);
	}

	public static walkStructure(awaiter: Barrier, fs, path: string, parentRule: FileRule, rule: FileRule, result: { [name: string]: FileResult }, errors: Error[]): void {
		if (!result[Path.basename(path)]) {
			result[Path.basename(path)] = { absolutePath: path };
		}
		let directoryStatistics: FileResult = result[Path.basename(path)];
		directoryStatistics.children = {};

		fs.readdir(path, (error: Error, files: string[]) => {
			if (error) {
				errors.push(error);
			} else {
				let fileNameList: string[] = StructureCheck.mergeRuleAndDirectoryFiles(rule.children || {}, files);
				awaiter.expand(fileNameList.length);

				fileNameList.forEach((file) => {
					let subPath = Path.join(path, file);
					directoryStatistics['children'][file] = { absolutePath: subPath };
					StructureCheck.checkDirOrFile(fs, rule, (rule.children || {})[file] || null, subPath, directoryStatistics['children'][file]);

					if (fs.existsSync(subPath) && fs.statSync(subPath).isDirectory()) {
						StructureCheck.walkStructure(awaiter, fs, subPath, rule, rule.children[file] || {}, directoryStatistics['children'], errors);
					} else {
						awaiter.finishedTask(subPath);
					}
				});
			}
			awaiter.finishedTask(path);
		});
	}

	private static mergeRuleAndDirectoryFiles(ruleFiles: {[name: string]: FileRule}, files: string[]): string[] {
		let fileNameList = {};
		Object.keys(ruleFiles).forEach((file) => { fileNameList[file] = null; });
		files.forEach((file) => { fileNameList[file] = null; });
		return Object.keys(fileNameList);
	}

	public static checkDirOrFile(fs, parentRule: FileRule, rule: FileRule, path: string, fileResult: FileResult): void {
		if (rule) {
			if (!fs.existsSync(path)) {
				fileResult.present = false;
				if (!rule.optional) {
					fileResult.missing = true;
				}
			} else {
				fileResult.present = true;
				if (rule.type && ((rule.type === 'FILE' && !fs.statSync().isFile()) || (rule.type !== 'FILE' && !fs.statSync().isDirectory()))) {
					fileResult.wrongType = true;
				}
			}
		} else {
			fileResult.present = true;
			fileResult.additional = true;
			if (!parentRule || parentRule.additionalContentForbidden) {
				fileResult.forbidden = true;
			}
		}
	}
}

