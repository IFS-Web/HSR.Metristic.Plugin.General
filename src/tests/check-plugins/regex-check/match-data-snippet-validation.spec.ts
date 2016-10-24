/* tslint:disable:max-file-line-count */

'use strict';

import { RegexCheck, CheckRule, SnippetMatchData } from "../../../general/regex-check/regex-check";


describe("Match data validation", () => {
	let filePath: string = 'abc/auto.txt';
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
			files: '*.txt',
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

	describe("validating snippet match data", () => {
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
			let snippetMatchData: SnippetMatchData[] = [
				{ snippet: '<img>', numberOfMatchesFound: 0 },
				{ snippet: `<img
				src="bllc.png" alt="bluff" />`, numberOfMatchesFound: 1 },
				{ snippet: '<img alt="abc.jpg">', numberOfMatchesFound: 0 }
			];

			RegexCheck.validateFileRuleSnippet(simpleSnippetCheckDefaultRule, filePath, snippetMatchData, results, errors);

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
			let snippetMatchData: SnippetMatchData[] = [
				{ snippet: `p { color: red; }`, numberOfMatchesFound: 0 },
				{ snippet: `#bx { size: big; }`, numberOfMatchesFound: 0 },
				{ snippet: `.fg { background: real; }`, numberOfMatchesFound: 1 },
				{ snippet: `div, span { display: block; }`, numberOfMatchesFound: 0 }
			];
			RegexCheck.validateFileRuleSnippet(simpleSnippetCheckDefaultRule, filePath, snippetMatchData, results, errors);

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

			let snippetMatchData: SnippetMatchData[] = [
				{ snippet: '.abc, [free], span, #a, p > span { color: black; }', numberOfMatchesFound: 1 },
				{ snippet: 'div { background: red; color: blue; }', numberOfMatchesFound: 1 },
				{ snippet: '.ab > .dv { color: black; }', numberOfMatchesFound: 0 },
				{ snippet: '[required] { color: red; }', numberOfMatchesFound: 1 },
				{ snippet: "#a, span span {\n\tcolor: red;\n}", numberOfMatchesFound: 1 },
				{ snippet: '.bc > span, span > .fg { color: blue; }', numberOfMatchesFound: 0 }
			];
			RegexCheck.validateFileRuleSnippet(simpleSnippetCheckDefaultRule, filePath, snippetMatchData, results, errors);

			expect(results[filePath]).toBeUndefined();
		});
	});


	describe("having null bounds", () => {
		it("should not return error if absolute max is null", () => {
			complexDefaultRule.snippetCheck.max = null;

			let snippetMatchData: SnippetMatchData[] = [
				{ snippet: 'abc', numberOfMatchesFound: 1 },
				{ snippet: 'def', numberOfMatchesFound: 1 },
				{ snippet: 'ago', numberOfMatchesFound: 2 },
				{ snippet: 'aeo', numberOfMatchesFound: 3 }
			];

			RegexCheck.validateFileRuleSnippet(complexDefaultRule, filePath, snippetMatchData, results, errors);

			expect(results[filePath]).toBeUndefined();
		});

		it("should not return error if absolute min is null", () => {
			complexDefaultRule.snippetCheck.min = null;
			complexDefaultRule.snippetCheck.max = 3;
			complexDefaultRule.snippetCheck.error.message = "To much vocals.";

			let snippetMatchData: SnippetMatchData[] = [
				{ snippet: 'abc', numberOfMatchesFound: 1 },
				{ snippet: 'def', numberOfMatchesFound: 1 },
				{ snippet: 'ghi', numberOfMatchesFound: 1 },
				{ snippet: 'jkl', numberOfMatchesFound: 0 }
			];

			RegexCheck.validateFileRuleSnippet(complexDefaultRule, filePath, snippetMatchData, results, errors);

			expect(results[filePath]).toBeUndefined();
		});

		it("should not return error if percentage max is null", () => {
			complexDefaultRule.snippetCheck.min = 0.4;
			complexDefaultRule.snippetCheck.max = null;
			complexDefaultRule.snippetCheck.valueFormat = "PERCENT";

			let snippetMatchData: SnippetMatchData[] = [
				{ snippet: 'abc', numberOfMatchesFound: 1 },
				{ snippet: 'def', numberOfMatchesFound: 1 },
				{ snippet: 'ghi', numberOfMatchesFound: 1 },
				{ snippet: 'jkl', numberOfMatchesFound: 0 }
			];

			RegexCheck.validateFileRuleSnippet(complexDefaultRule, filePath, snippetMatchData, results, errors);

			expect(results[filePath]).toBeUndefined();
		});

		it("should not return error if percentage min is null", () => {
			complexDefaultRule.snippetCheck.min = null;
			complexDefaultRule.snippetCheck.max = 0.5;
			complexDefaultRule.snippetCheck.valueFormat = "PERCENT";

			let snippetMatchData: SnippetMatchData[] = [
				{ snippet: 'abc', numberOfMatchesFound: 1 },
				{ snippet: 'def', numberOfMatchesFound: 1 },
				{ snippet: 'ghi', numberOfMatchesFound: 0 },
				{ snippet: 'jkl', numberOfMatchesFound: 0 }
			];

			RegexCheck.validateFileRuleSnippet(complexDefaultRule, filePath, snippetMatchData, results, errors);

			expect(results[filePath]).toBeUndefined();
		});
	});
});
