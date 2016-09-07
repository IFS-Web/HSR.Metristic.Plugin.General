/// <reference path="../../../../typings/tsd.d.ts" />
"use strict";
import {RegexCheck, CheckRule, CheckRuleResult} from "../../../check-plugins/regex-check/regex-check";


describe("Regex check", () => {
	let filePath: string = '/abc/def.html';
	let results;
	let errors;

	beforeEach(() => {
		errors = [];
		results = {};
	});

	afterEach(() => {
		expect(errors).toEqual([]);
	});

	describe("checking simple rules", () => {
		let simpleRule: CheckRule = <CheckRule>{
			snippet: {
				rule: /<img[^<>]*>/igm,
				min: 3,
				max: 5,
				error: {
					message: "Not enough image elements or to many found."
				}
			}
		};

		it("should not return error results because #images matches", () => {
			let fileData: string = `<p>Test</p>
			<img><img><img>
			<div><img
			src="bllc.png" alt="bluff" /></div>
			<img src="abc.jpg">`;

			RegexCheck.checkRule(fileData, simpleRule, filePath, results, errors);
			expect(results[filePath]).toBeUndefined();
		});

		it("should not return error results because #images matches", () => {
			let fileData: string = `<img><img><img>`;

			RegexCheck.checkRule(fileData, simpleRule, filePath, results, errors);
			expect(results[filePath]).toBeUndefined();
		});

		it("should return error because of to less images", () => {
			let fileData: string = `<p>Test</p>
			<img>
			<img src="abc.jpg">
			<div></div>`;

			RegexCheck.checkRule(fileData, simpleRule, filePath, results, errors);
			expect(results[filePath].length).toEqual(1);
			expect(results[filePath][0].rule).toEqual(simpleRule);
			expect(results[filePath][0].occurrence).toBe(2);
			expect(results[filePath][0].error).toEqual(simpleRule.snippet.error);
		});

		it("should return error because of to much images", () => {
			let fileData: string = `<p>Test</p>
			<img><img><img><img><img
			src="bllc.png" alt="bluff" />
			<img src="abc.jpg">
			<div></div>`;

			RegexCheck.checkRule(fileData, simpleRule, filePath, results, errors);
			expect(results[filePath].length).toEqual(1);
			expect(results[filePath][0].occurrence).toBe(6);
			expect(results[filePath][0].error).toEqual(simpleRule.snippet.error);
		});

		it("should not fail on 0 occurrences", () => {
			let fileData: string = `<p>Test</p>`;

			RegexCheck.checkRule(fileData, simpleRule, filePath, results, errors);

			expect(results[filePath].length).toEqual(1);
			expect(results[filePath][0].rule).toEqual(simpleRule);
			expect(results[filePath][0].occurrence).toBe(0);
			expect(results[filePath][0].error).toEqual(simpleRule.snippet.error);
		});
	});

	describe("checking infinity rules", () => {
		it("should not return error results because #images > min", () => {
			let simpleRule:CheckRule = <CheckRule>{
				snippet: {
					rule: /<img[^<>]*>/igm,
					min: 3,
					max: null,
					error: {
						message: "Not enough image elements or to many found."
					}
				}
			};
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
				snippet: {
					rule: /<img[^<>]*>/igm,
					min: null,
					max: 3,
					error: {
						message: "Not enough image elements or to many found."
					}
				}
			};
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
			let rule: CheckRule = {
				name: null,
				files: null,
				snippet: null,
				snippetCheck: {
					rule: /<img[^<>]*src="[^<>]*"[^<>]*>/igm,
					min: 1,
					max: 1,
					valueFormat: "NUMBER", // 'PERCENT' | 'NUMBER'
					error: {
						message: "Image needs source attribute."
					}
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
			expect(results[filePath][0].error).toEqual(rule.snippetCheck.error);
			expect(results[filePath][1].error).toEqual(rule.snippetCheck.error);
		});

		it("should return error for to less percentage of used classes", () => {
			let rule: CheckRule = {
				name: null,
				files: null,
				snippet: null,
				snippetCheck: {
					rule: /\.[^\s]*\s+\{[^\{\}]*\}/igm,
					min: 0.3,
					max: 0.5,
					valueFormat: "PERCENT", // 'PERCENT' | 'NUMBER'
					error: {
						message: "To less classes used."
					}
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
			expect(results[filePath][0].error).toEqual(rule.snippetCheck.error);
		});

		it("should not return error because enough elements have been used", () => {
			let rule: CheckRule = {
				name: null,
				files: null,
				snippet: null,
				snippetCheck: {
					// match lines with element selectors
					rule: /^(([^\{\},]*,)*(\s|\t)*[\w\d\s<>~\[\]="]*(\s|\t)*(,[^\{\},]*)*)(\{[^\{\}]*\})/igm,
					min: 0.5,
					max: 0.7,
					valueFormat: "PERCENT",
					error: {
						message: "To less classes used."
					}
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

		describe("having null bounds", () => {
			let defaultRule: CheckRule = {
				name: null,
				files: null,
				snippet: null,
				snippetCheck: {
					rule: /[aeou]/igm,
					min: 1,
					max: 1,
					valueFormat: "NUMBER",
					error: {
						message: "To less vocals."
					}
				}
			};

			it("should not return error if absolute max is null", () => {
				let rule: CheckRule = (<any>Object).assign({}, defaultRule);
				rule.snippetCheck.max = null;

				let snippets: string[] = ['abc', 'def', 'ago', 'aeo'];

				RegexCheck.checkSnippet(rule, snippets, filePath, results, errors);

				expect(results[filePath]).toBeUndefined();
			});

			it("should not return error if absolute min is null", () => {
				let rule: CheckRule = (<any>Object).assign({}, defaultRule);
				rule.snippetCheck.min = null;
				rule.snippetCheck.max = 3;
				rule.snippetCheck.error.message = "To much vocals.";

				let snippets: string[] = ['abc', 'def', 'ghi', 'jkl'];

				RegexCheck.checkSnippet(rule, snippets, filePath, results, errors);

				expect(results[filePath]).toBeUndefined();
			});

			it("should not return error if percentage max is null", () => {
				let rule: CheckRule = (<any>Object).assign({}, defaultRule);
				rule.snippetCheck.min = 0.4;
				rule.snippetCheck.max = null;
				rule.snippetCheck.valueFormat = "PERCENT";

				let snippets: string[] = ['abc', 'def', 'ghi', 'jkl'];

				RegexCheck.checkSnippet(rule, snippets, filePath, results, errors);

				expect(results[filePath]).toBeUndefined();
			});

			it("should not return error if percentage min is null", () => {
				let rule: CheckRule = (<any>Object).assign({}, defaultRule);
				rule.snippetCheck.min = null;
				rule.snippetCheck.max = 0.5;
				rule.snippetCheck.valueFormat = "PERCENT";

				let snippets: string[] = ['abc', 'def', 'ghi', 'jkl'];

				RegexCheck.checkSnippet(rule, snippets, filePath, results, errors);

				expect(results[filePath]).toBeUndefined();
			});
		});

		describe("checking rule and snippet", () => {
			let rule: CheckRule = {
				name: "Time element",
				files: "*.html",
				snippet: {
					rule: /<time[^<>\/]*>[^<>\/]*<\/time>/igm,
					min: 1,
					max: 3, // max: null means infinity
					error: {
						message: "No time elements found. Please use <time> for every time occurence."
					}
				},
				"snippetCheck": {
					rule: /<time [^<>\/]*datetime="\d{4}-\d{2}-\d{2}"[^<>\/]*>[^<>\/]*<\/time>/igm,
					min: 1,
					max: 1,
					valueFormat: "NUMBER", // 'PERCENT' | 'NUMBER'
					error: {
						message: "Time element not used correct. Don't forget datetime attribute and content."
					}
				}
			};

			it("should not return errors", () => {
				let fileData: string = `<h1>Test</h1>
				<p><time datetime="1850-08-02">2.8.1850</time>bla bla bla.</p>
				<footer>Published on <time datetime="2016-08-01">1. Aug. 16</time>.</footer>`;

				RegexCheck.checkRule(fileData, rule, filePath, results, errors);
				expect(results[filePath]).toBeUndefined();
			});

			it("should return an error for a missing datetime", () => {
				let fileData: string = `<h1>Test</h1>
				<p><time>2.8.1850</time>bla bla bla.</p>
				<footer>Published on <time datetime="2016-08-01">1. Aug. 16</time>.</footer>`;

				RegexCheck.checkRule(fileData, rule, filePath, results, errors);
				expect(results[filePath].length).toEqual(1);
				expect(results[filePath][0].rule).toEqual(rule);
				expect(results[filePath][0].occurrence).toEqual(0);
				expect(results[filePath][0].error).toEqual(rule.snippetCheck.error);
			});
		});
	});
});