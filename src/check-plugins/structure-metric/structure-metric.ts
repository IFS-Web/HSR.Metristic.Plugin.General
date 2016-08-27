"use strict";
var Path = require('path');
var FS = require('fs');

import {Check} from "./../../domain/model/check";
import {Report} from "./../../domain/model/report";
import {HtmlReport} from "./../../domain/model/html-report";
import {Barrier} from "../../domain/model/barrier";


export class StructureMetric implements Check {
	private reportTemplate: string;
	private partials: {[name:string]:string};
	private errors: Error[] = [];

	constructor(private options: { [name: string]: any }) {
		this.reportTemplate = FS.readFileSync(Path.join(__dirname,'./templates/reportTemplate.html'), "utf8");
		this.partials = {
			directoryPartial: FS.readFileSync(Path.join(__dirname,'./templates/directoryPartial.html'), "utf8")
		}
	}


	public execute(directory: string, callback: (report: Report, errors?:Error[]) => {}): void {
		let statistics: any = {
			structure: {},
			counts: {
				numberOfDirectories: 0,
				numberOfFiles: 0
			}
		};
		let awaiter: Barrier = new Barrier(1).then(() => {
			let report: Report = new HtmlReport('File structure', this.reportTemplate, this.partials, statistics);
			callback(report, this.errors);
		});
		StructureMetric.walkStructure(awaiter, directory, statistics.structure, statistics.counts, this.errors);
	};

	protected static walkStructure(awaiter: Barrier, path: string, structure, counts: any, errors: Error[]): void {
		structure['name'] = Path.basename(path);
		structure['directories'] = [];
		structure['files'] = [];

		FS.readdir(path, (error: Error, files: string[]) => {
			if(error) {
				errors.push(error);
			} else {
				awaiter.expand(files.length);
				files.forEach((file) => {
					let subPath = Path.join(path, file);
					if (FS.lstatSync(subPath).isDirectory()) {
						// TODO: use async, handle error
						counts.numberOfDirectories++;
						let subDirectory = {};
						structure[ 'directories' ].push(subDirectory);
						StructureMetric.walkStructure(awaiter, subPath, subDirectory, counts, errors);
					} else {
						counts.numberOfFiles++;
						structure[ 'files' ].push(Path.basename(file));
						awaiter.finishedTask(file);
					}
				});
			}
			awaiter.finishedTask(path);
		});
	}
}