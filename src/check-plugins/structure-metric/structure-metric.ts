var Path = require('path');
var FS = require('fs');

import {Check} from "./../../domain/model/check";
import {Report} from "./../../domain/model/report";
import {HtmlReport} from "./../../domain/model/html-report";


export class StructureMetric implements Check {
	private reportTemplate: string;
	private partials: {[name:string]:string};

	constructor(private options: { [name: string]: any }) {
		this.reportTemplate = FS.readFileSync(Path.join(__dirname,'./templates/reportTemplate.html'), "utf8");
		this.partials = {
			directoryPartial: FS.readFileSync(Path.join(__dirname,'./templates/directoryPartial.html'), "utf8")
		}
	}


	public execute(directory: string, callback: (report: Report) => {}): void {
		let statistics: any = {
			structure: {},
			counts: {
				numberOfDirectories: 0,
				numberOfFiles: 0
			}
		};
		StructureMetric.walkStructure(directory, statistics.structure, statistics.counts);
		callback(new HtmlReport('File structure', this.reportTemplate, this.partials, statistics));
	};

	protected static walkStructure(path, structure, counts: any): void {
		structure['name'] = Path.basename(path);
		structure['directories'] = [];
		structure['files'] = [];

		FS.readdirSync(path).forEach((file) => {
			let subPath = Path.join(path, file);
			if(FS.lstatSync(subPath).isDirectory()) {
				counts.numberOfDirectories++;
				let subDirectory = {};
				structure['directories'].push(subDirectory);
				StructureMetric.walkStructure(subPath, subDirectory, counts);
			} else {
				counts.numberOfFiles++;
				structure['files'].push(Path.basename(file));
			}
		});
	}
}