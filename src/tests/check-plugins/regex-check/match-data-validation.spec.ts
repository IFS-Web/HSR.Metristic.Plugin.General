/* tslint:disable:max-file-line-count */

'use strict';

import {RegexCheck, CheckRule, MatchData} from "../../../general/regex-check/regex-check";


describe("Match data complete rule validation", () => {
	let results;
	let errors;
	let defaultRule: CheckRule = null;
	let matchData: MatchData = null;

	beforeEach(() => {
		errors = [];
		results = {};
		// check if there are enough patterns 'aa????dd' and if its are of the format 'aabbccdd' or 'aaaadddd'.
		defaultRule = {
			name: "Letters",
			files: "*.txt",
			snippet: {
				patterns: [/aa.{4}dd>/igm],
				min: 1,
				max: 3,
				error: {
					message: "Not enough letter patterns found."
				}
			},
			snippetCheck: {
				pattern: /aa(bbcc|aadd)dd/igm,
				min: 1,
				max: 1,
				valueFormat: "NUMBER",
				error: {
					message: "Letters not used the correct way"
				}
			}
		};
		matchData = {
			rule: defaultRule,
			files: [
				{
					name: 'auto.txt',
					numberOfMatchesFound: [2],
					snippets: [
						{
							snippet: 'aabbccdd',
							numberOfMatchesFound: 1
						},
						{
							snippet: 'aaaadddd',
							numberOfMatchesFound: 1
						}
					]
				},
				{
					name: 'bla.txt',
					numberOfMatchesFound: [4],
					snippets: [
						{
							snippet: 'aa----dd',
							numberOfMatchesFound: 0
						},
						{
							snippet: 'aabbccdd',
							numberOfMatchesFound: 1
						},
						{
							snippet: 'aaaadddd',
							numberOfMatchesFound: 1
						},
						{
							snippet: 'aa----dd',
							numberOfMatchesFound: 0
						}
					]
				},
				{
					name: 'trula.txt',
					numberOfMatchesFound: [0],
					snippets: []
				}
			]
		};
	});

	afterEach(() => {
		expect(errors).toEqual([]);
	});

	describe("checking match data", () => {
		it('for file specific rule should validate correct', () => {
			defaultRule.fileSpanning = false;

			RegexCheck.validateRuleMatchData(matchData, results, errors);
			expect(Object.keys(results).length).toEqual(2);
			expect(results['auto.txt']).toBeUndefined();
			expect(results['bla.txt'][0].occurrence).toEqual(4);
			expect(results['bla.txt'][0].error).toEqual(defaultRule.snippet.error);
			expect(results['bla.txt'][1].occurrence).toEqual(0);
			expect(results['bla.txt'][1].error).toEqual(defaultRule.snippetCheck.error);
			expect(results['bla.txt'][2].occurrence).toEqual(0);
			expect(results['bla.txt'][2].error).toEqual(defaultRule.snippetCheck.error);
			expect(results['trula.txt'][0].occurrence).toEqual(0);
			expect(results['trula.txt'][0].error).toEqual(defaultRule.snippet.error);
		});

		it('for global rule should validate correct', () => {
			defaultRule.fileSpanning = true;

			RegexCheck.validateRuleMatchData(matchData, results, errors);
			expect(Object.keys(results).length).toEqual(2);
			expect(results['auto.txt']).toBeUndefined();
			expect(results['general'][0].occurrence).toEqual(6);
			expect(results['general'][0].error).toEqual(defaultRule.snippet.error);
			expect(results['bla.txt'][0].occurrence).toEqual(0);
			expect(results['bla.txt'][0].error).toEqual(defaultRule.snippetCheck.error);
			expect(results['bla.txt'][1].occurrence).toEqual(0);
			expect(results['bla.txt'][1].error).toEqual(defaultRule.snippetCheck.error);
		});
	});


	describe("checking match data 2", () => {
		let file = 'efz/deh.txt';
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
			/* `<h1>Test</h1>
			<p><time datetime="1850-08-02">2.8.1850</time>bla bla bla.</p>
			<footer>Published on <time datetime="2016-08-01">1. Aug. 16</time>.</footer>`*/

			let matchData2 = {
				rule: rule,
				files: [
					{
						name: file,
						numberOfMatchesFound: [2],
						snippets: [
							{
								snippet: '<time datetime="1850-08-02">2.8.1850</time>',
								numberOfMatchesFound: 1
							},
							{
								snippet: '<time datetime="2016-08-01">1. Aug. 16</time>',
								numberOfMatchesFound: 1
							}
						]
					}
				]
			};

			RegexCheck.validateRuleMatchData(matchData2, results, errors);
			expect(results[file]).toBeUndefined();
		});

		it("should return an error for a missing datetime", () => {
			/* `<h1>Test</h1>
			<p><time>2.8.1850</time>bla bla bla.</p>
			<footer>Published on <time datetime="2016-08-01">1. Aug. 16</time>.</footer>` */

			let matchData2 = {
				rule: rule,
				files: [
					{
						name: file,
						numberOfMatchesFound: [2],
						snippets: [
							{
								snippet: '<time>2.8.1850</time>',
								numberOfMatchesFound: 0
							},
							{
								snippet: '<time datetime="2016-08-01">1. Aug. 16</time>',
								numberOfMatchesFound: 1
							}
						]
					}
				]
			};

			RegexCheck.validateRuleMatchData(matchData2, results, errors);
			expect(results[file].length).toEqual(1);
			expect(results[file][0].rule).toEqual(rule);
			expect(results[file][0].occurrence).toEqual(0);
			expect(results[file][0].error).toEqual(rule.snippetCheck.error);
		});
	});
});
