/* tslint:disable:max-file-line-count */

'use strict';

import {RegexCheck, CheckRule} from "../../../general/regex-check/regex-check";


describe("Regex check", () => {
	let filePath: string = '/abc/def.html';
	let results;
	let errors;
	let simpleSnippetCheckDefaultRule: CheckRule = null;
	let complexDefaultRule: CheckRule = null;

	beforeEach(() => {
		errors = [];
		results = {};
		simpleSnippetCheckDefaultRule = {
			name: null,
			files: null,
			snippet: null,
			snippetCheck: null
		};
		complexDefaultRule = {
			name: null,
			files: null,
			snippet: null,
			snippetCheck: {
				pattern: /[aeou]/igm,
				min: 1,
				max: 1,
				valueFormat: "NUMBER",
				error: {
					message: "To less vocals."
				}
			}
		};
	});

	afterEach(() => {
		expect(errors).toEqual([]);
	});

	describe("checking snippet patterns", () => {
		it("should return errors for missing src attributes", () => {
			simpleSnippetCheckDefaultRule.snippetCheck = {
				pattern: /<img[^<>]*src="[^<>]*"[^<>]*>/igm,
				min: 1,
				max: 1,
				valueFormat: "NUMBER", // 'PERCENT' | 'NUMBER'
				error: {
					message: "Image needs source attribute."
				}
			};
			let snippets: string[] = [
				`<img>`,
				`<img
				src="bllc.png" alt="bluff" />`,
				`<img alt="abc.jpg">`
			];

			RegexCheck.checkSnippet(simpleSnippetCheckDefaultRule, snippets, filePath, results, errors);

			expect(results[filePath].length).toEqual(2);
			expect(results[filePath][0].rule).toBe(simpleSnippetCheckDefaultRule);
			expect(results[filePath][1].rule).toBe(simpleSnippetCheckDefaultRule);
			expect(results[filePath][0].occurrence).toBe(0);
			expect(results[filePath][1].occurrence).toBe(0);
			expect(results[filePath][0].error).toEqual(simpleSnippetCheckDefaultRule.snippetCheck.error);
			expect(results[filePath][1].error).toEqual(simpleSnippetCheckDefaultRule.snippetCheck.error);
		});

		it("should return error for to less percentage of used classes", () => {
			simpleSnippetCheckDefaultRule.snippetCheck = {
				pattern: /\.[^\s]*\s+\{[^\{\}]*\}/igm,
				min: 0.3,
				max: 0.5,
				valueFormat: "PERCENT", // 'PERCENT' | 'NUMBER'
				error: {
					message: "To less classes used."
				}
			};
			let snippets: string[] = [
				`p { color: red; }`,
				`#bx { size: big; }`,
				`.fg { background: real; }`,
				`div, span { display: block; }`
			];

			RegexCheck.checkSnippet(simpleSnippetCheckDefaultRule, snippets, filePath, results, errors);

			expect(results[filePath].length).toEqual(1);
			expect(results[filePath][0].rule).toBe(simpleSnippetCheckDefaultRule);
			expect(results[filePath][0].occurrence).toBe(0.25);
			expect(results[filePath][0].error).toEqual(simpleSnippetCheckDefaultRule.snippetCheck.error);
		});

		it("should not return error because enough elements have been used", () => {
			simpleSnippetCheckDefaultRule.snippetCheck = {
				// match lines with element selectors
				pattern: /^(([^\{\},]*,)*(\s|\t)*[\w\d\s<>~\[\]="]*(\s|\t)*(,[^\{\},]*)*)(\{[^\{\}]*\})/igm,
				min: 0.5,
				max: 0.7,
				valueFormat: "PERCENT",
				error: {
					message: "To less classes used."
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

			RegexCheck.checkSnippet(simpleSnippetCheckDefaultRule, snippets, filePath, results, errors);

			expect(results[filePath]).toBeUndefined();
		});

		describe("having null bounds", () => {
			it("should not return error if absolute max is null", () => {
				complexDefaultRule.snippetCheck.max = null;

				let snippets: string[] = ['abc', 'def', 'ago', 'aeo'];

				RegexCheck.checkSnippet(complexDefaultRule, snippets, filePath, results, errors);

				expect(results[filePath]).toBeUndefined();
			});

			it("should not return error if absolute min is null", () => {
				complexDefaultRule.snippetCheck.min = null;
				complexDefaultRule.snippetCheck.max = 3;
				complexDefaultRule.snippetCheck.error.message = "To much vocals.";

				let snippets: string[] = ['abc', 'def', 'ghi', 'jkl'];

				RegexCheck.checkSnippet(complexDefaultRule, snippets, filePath, results, errors);

				expect(results[filePath]).toBeUndefined();
			});

			it("should not return error if percentage max is null", () => {
				complexDefaultRule.snippetCheck.min = 0.4;
				complexDefaultRule.snippetCheck.max = null;
				complexDefaultRule.snippetCheck.valueFormat = "PERCENT";

				let snippets: string[] = ['abc', 'def', 'ghi', 'jkl'];

				RegexCheck.checkSnippet(complexDefaultRule, snippets, filePath, results, errors);

				expect(results[filePath]).toBeUndefined();
			});

			it("should not return error if percentage min is null", () => {
				complexDefaultRule.snippetCheck.min = null;
				complexDefaultRule.snippetCheck.max = 0.5;
				complexDefaultRule.snippetCheck.valueFormat = "PERCENT";

				let snippets: string[] = ['abc', 'def', 'ghi', 'jkl'];

				RegexCheck.checkSnippet(complexDefaultRule, snippets, filePath, results, errors);

				expect(results[filePath]).toBeUndefined();
			});
		});

		describe("checking rule and snippet", () => {
			let rule = {
				name: "Time element",
				files: "*.html",
				snippet: {
					patterns: [/<time[^<>\/]*>[^<>\/]*<\/time>/igm],
					min: 1,
					max: 3, // max: null means infinity
					error: {
						message: "No time elements found. Please use <time> for every time occurence."
					}
				},
				"snippetCheck": {
					pattern: /<time [^<>\/]*datetime="\d{4}-\d{2}-\d{2}"[^<>\/]*>[^<>\/]*<\/time>/igm,
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
