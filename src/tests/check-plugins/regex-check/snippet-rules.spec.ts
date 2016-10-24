/* tslint:disable:max-file-line-count */

'use strict';

import { RegexCheck, CheckRule, MatchData, FileMatchData } from "../../../general/regex-check/regex-check";


describe("Regex check", () => {
	let filePath: string = '/abc/def.html';
	let matchData: MatchData[];
	let fileMatchData: FileMatchData;
	let errors;
	let simpleSnippetCheckDefaultRule: CheckRule = null;
	let complexDefaultRule: CheckRule = null;

	beforeEach(() => {
		errors = [];
		matchData = [];
		fileMatchData = {
			name: filePath,
			numberOfMatchesFound: []
		};
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
		it("should find 1 match of 3 snippets", () => {
			simpleSnippetCheckDefaultRule.snippetCheck = {
				pattern: /<img[^<>]*src="[^<>]*"[^<>]*>/igm,
				min: 1,
				max: 1,
				valueFormat: "NUMBER", // 'PERCENT' | 'NUMBER'
				error: {
					message: "Image needs source attribute."
				}
			};
			let snippets: string[][] = [[
				`<img>`,
				`<img
				src="bllc.png" alt="bluff" />`,
				`<img alt="abc.jpg">`
			]];

			RegexCheck.checkSnippet(simpleSnippetCheckDefaultRule, snippets, fileMatchData);

			expect(fileMatchData.snippets).toEqual([
				{
					snippet: '<img>',
					numberOfMatchesFound: 0
				},
				{
					snippet: `<img
				src="bllc.png" alt="bluff" />`,
					numberOfMatchesFound: 1
				},
				{
					snippet: '<img alt="abc.jpg">',
					numberOfMatchesFound: 0
				}
			]);
		});

		it("should find 1 match of 4 snippets", () => {
			simpleSnippetCheckDefaultRule.snippetCheck = {
				pattern: /\.[^\s]*\s+\{[^\{\}]*\}/igm,
				min: 0.3,
				max: 0.5,
				valueFormat: "PERCENT", // 'PERCENT' | 'NUMBER'
				error: {
					message: "To less classes used."
				}
			};
			let snippets: string[][] = [[
				`p { color: red; }`,
				`#bx { size: big; }`,
				`.fg { background: real; }`,
				`div, span { display: block; }`
			]];

			RegexCheck.checkSnippet(simpleSnippetCheckDefaultRule, snippets, fileMatchData);

			expect(fileMatchData.snippets).toEqual([
				{
					snippet: `p { color: red; }`,
					numberOfMatchesFound: 0
				},
				{
					snippet: `#bx { size: big; }`,
					numberOfMatchesFound: 0
				},
				{
					snippet: `.fg { background: real; }`,
					numberOfMatchesFound: 1
				},
				{
					snippet: `div, span { display: block; }`,
					numberOfMatchesFound: 0
				}
			]);
		});
	});
});
