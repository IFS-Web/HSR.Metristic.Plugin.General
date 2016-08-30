/// <reference path="../../../../typings/tsd.d.ts" />
"use strict";
import {RegexCheck, CheckRule, CheckRuleResult} from "../../../check-plugins/regex-check/regex-check";


describe("Regex check", () => {
	let errors = [];
	let filePath: string = '/abc/def.html';

	describe("checking simple rules", () => {
		let simpleRule: CheckRule = <CheckRule>{
			"snippet": {
				"rule": /<img[^<>]*>/igm,
				"min": 3,
				"max": 5,
				"errorMessage": "Not enough image elements or to many found."
			}
		};

		it("should not return error results because #images matches", () => {
			let results = {};
			let fileData: string = `<p>Test</p>
			<img><img><img>
			<div><img
			src="bllc.png" alt="bluff" /></div>
			<img src="abc.jpg">`;

			RegexCheck.checkRule(fileData, simpleRule, filePath, results, errors);
			expect(results[filePath]).toBeUndefined();
		});

		it("should not return error results because #images matches", () => {
			let results = {};
			let fileData: string = `<img><img><img>`;

			RegexCheck.checkRule(fileData, simpleRule, filePath, results, errors);
			expect(results[filePath]).toBeUndefined();
		});

		it("should return error because of to less images", () => {
			let results = {};
			let fileData: string = `<p>Test</p>
			<img>
			<img src="abc.jpg">
			<div></div>`;

			RegexCheck.checkRule(fileData, simpleRule, filePath, results, errors);
			expect(results[filePath].length).toEqual(1);
			expect(results[filePath][0].rule).toEqual(simpleRule);
			expect(results[filePath][0].occurrence).toBe(2);
			expect(results[filePath][0].error).toEqual(simpleRule.snippet.errorMessage);
		});

		it("should return error because of to much images", () => {
			let results = {};
			let fileData: string = `<p>Test</p>
			<img><img><img><img><img
			src="bllc.png" alt="bluff" />
			<img src="abc.jpg">
			<div></div>`;

			RegexCheck.checkRule(fileData, simpleRule, filePath, results, errors);
			expect(results[filePath].length).toEqual(1);
			expect(results[filePath][0].occurrence).toBe(6);
			expect(results[filePath][0].error).toEqual(simpleRule.snippet.errorMessage);
		});
	});

	describe("checking infinity rules", () => {
		it("should not return error results because #images > min", () => {
			let simpleRule:CheckRule = <CheckRule>{
				"snippet": {
					"rule": /<img[^<>]*>/igm,
					"min": 3,
					"max": null,
					"errorMessage": "Not enough image elements or to many found."
				}
			};
			let results = {};
			let fileData:string = `
			<img><img
			src="bllc.png" alt="bluff" />
			<img src="abc.jpg">
			<div></div>`;

			RegexCheck.checkRule(fileData, simpleRule, filePath, results, errors);
			expect(results[ filePath ]).toBeUndefined();
		});

		it("should not return error results because #images < max", () => {
			let simpleRule:CheckRule = <CheckRule>{
				"snippet": {
					"rule": /<img[^<>]*>/igm,
					"min": null,
					"max": 3,
					"errorMessage": "Not enough image elements or to many found."
				}
			};
			let results = {};
			let fileData:string = `
			<img><img
			src="bllc.png" alt="bluff" />
			<img src="abc.jpg">
			<div></div>`;

			RegexCheck.checkRule(fileData, simpleRule, filePath, results, errors);
			expect(results[ filePath ]).toBeUndefined();
		});
	});

	describe("checking snippet rules", () => {
		it("should return errors for missing src attributes", () => {
			let results = {};
			let rule: CheckRule = {
				name: null,
				files: null,
				snippet: null,
				snippetCheck: {
					"rule": /<img[^<>]*src="[^<>]*"[^<>]*>/igm,
					"min": 1,
					"max": 1,
					"valueFormat": "NUMBER", // 'PERCENT' | 'NUMBER'
					"errorMessage": "Image needs source attribute."
				}
			};
			let snippets: string[] = [
				`<img>`,
				`<img
				src="bllc.png" alt="bluff" />`,
				`<img alt="abc.jpg">`
			];

			RegexCheck.checkSnippet(rule, snippets, filePath, results, errors);

			expect(results[filePath].length).toEqual(2);
			expect(results[filePath][0].rule).toBe(rule);
			expect(results[filePath][1].rule).toBe(rule);
			expect(results[filePath][0].occurrence).toBe(0);
			expect(results[filePath][1].occurrence).toBe(0);
			expect(results[filePath][0].error).toEqual(rule.snippetCheck.errorMessage);
			expect(results[filePath][1].error).toEqual(rule.snippetCheck.errorMessage);
		});

		it("should return error for to less percentage of used classes", () => {
			let results = {};
			let rule: CheckRule = {
				name: null,
				files: null,
				snippet: null,
				snippetCheck: {
					"rule": /\.[^\s]*\s+\{[^\{\}]*\}/igm,
					"min": 0.3,
					"max": 0.5,
					"valueFormat": "PERCENT", // 'PERCENT' | 'NUMBER'
					"errorMessage": "To less classes used."
				}
			};
			let snippets: string[] = [
				`p { color: red; }`,
				`#bx { size: big; }`,
				`.fg { background: real; }`,
				`div, span { display: block; }`,
			];

			RegexCheck.checkSnippet(rule, snippets, filePath, results, errors);

			expect(results[filePath].length).toEqual(1);
			expect(results[filePath][0].rule).toBe(rule);
			expect(results[filePath][0].occurrence).toBe(0.25);
			expect(results[filePath][0].error).toEqual(rule.snippetCheck.errorMessage);
		});

		it("should not return error because enough elements have been used", () => {
			let results = {};
			let rule: CheckRule = {
				name: null,
				files: null,
				snippet: null,
				snippetCheck: {
					// match lines with element selectors
					"rule": /^(([^\{\},]*,)*(\s|\t)*[\w\d\s<>~\[\]="]*(\s|\t)*(,[^\{\},]*)*)(\{[^\{\}]*\})/igm,
					"min": 0.5,
					"max": 0.7,
					"valueFormat": "PERCENT", // 'PERCENT' | 'NUMBER'
					"errorMessage": "To less classes used."
				}
			};
			let snippets: string[] = [
				'.abc, [free], span, #a, p > span { color: black; }',
				'div { background: red; color: blue; }',
				'.ab > .dv { color: black; }',
				'[required] { color: red; }',
				"#a, span span {\n\tcolor: red;\n}",
				'.bc > span, span > .fg { color: blue; }'
			];

			RegexCheck.checkSnippet(rule, snippets, filePath, results, errors);

			expect(results[filePath]).toBeUndefined();
		});
	});
});