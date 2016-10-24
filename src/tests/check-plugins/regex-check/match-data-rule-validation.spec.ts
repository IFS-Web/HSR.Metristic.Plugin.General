/* tslint:disable:max-file-line-count */

'use strict';

import {RegexCheck, CheckRule, MatchData} from "../../../general/regex-check/regex-check";


describe("Match data rule validation", () => {
	let results;
	let errors;

	beforeEach(() => {
		errors = [];
		results = {};
	});

	afterEach(() => {
		expect(errors).toEqual([]);
	});

	describe("checking simple match data", () => {
		let filePath: string = 'abc.txt';
		let simpleRule: CheckRule = <CheckRule> {
			name: null,
			files: filePath,
			snippet: {
				patterns: [/<img[^<>]*>/igm],
				min: 3,
				max: 5,
				error: {
					message: "Not enough image elements or to many found."
				}
			}
		};

		it("should not return error results because there are enough matches", () => {
			let simpleMatchData: MatchData = {
				rule: simpleRule,
				files: [
					{
						name: filePath,
						numberOfMatchesFound: [5]
					}
				]
			};
			RegexCheck.validateRuleMatchData(simpleMatchData, results, errors);
			expect(results[filePath]).toBeUndefined();
		});

		it("should not return error results because there are enough matches", () => {
			let simpleMatchData: MatchData = {
				rule: simpleRule,
				files: [
					{
						name: filePath,
						numberOfMatchesFound: [3]
					}
				]
			};

			RegexCheck.validateRuleMatchData(simpleMatchData, results, errors);
			expect(results[filePath]).toBeUndefined();
		});

		it("should return error because of to less matches", () => {
			let simpleMatchData: MatchData = {
				rule: simpleRule,
				files: [
					{
						name: filePath,
						numberOfMatchesFound: [2]
					}
				]
			};

			RegexCheck.validateRuleMatchData(simpleMatchData, results, errors);
			expect(results[filePath].length).toEqual(1);
			expect(results[filePath][0].rule).toEqual(simpleRule);
			expect(results[filePath][0].occurrence).toBe(2);
			expect(results[filePath][0].error).toEqual(simpleRule.snippet.error);
		});

		it("should return error because of to much matches", () => {
			let simpleMatchData: MatchData = {
				rule: simpleRule,
				files: [
					{
						name: filePath,
						numberOfMatchesFound: [6]
					}
				]
			};

			RegexCheck.validateRuleMatchData(simpleMatchData, results, errors);
			expect(results[filePath].length).toEqual(1);
			expect(results[filePath][0].occurrence).toBe(6);
			expect(results[filePath][0].error).toEqual(simpleRule.snippet.error);
		});

		it("should not fail on 0 matches", () => {
			let simpleMatchData: MatchData = {
				rule: simpleRule,
				files: [
					{
						name: filePath,
						numberOfMatchesFound: [0]
					}
				]
			};

			RegexCheck.validateRuleMatchData(simpleMatchData, results, errors);

			expect(results[filePath].length).toEqual(1);
			expect(results[filePath][0].rule).toEqual(simpleRule);
			expect(results[filePath][0].occurrence).toBe(0);
			expect(results[filePath][0].error).toEqual(simpleRule.snippet.error);
		});
	});

	describe("validating infinity patterns", () => {
		let filePath = 'abc/ghk.jk';
		it("should not return error results because #matches > min", () => {
			let simpleRule:CheckRule = <CheckRule> {
				snippet: {
					patterns: [/<img[^<>]*>/igm],
					min: 3,
					max: null,
					error: {
						message: "Not enough image elements or to many found."
					}
				}
			};
			let simpleMatchData: MatchData = {
				rule: simpleRule,
				files: [
					{
						name: filePath,
						numberOfMatchesFound: [3]
					}
				]
			};

			RegexCheck.validateRuleMatchData(simpleMatchData, results, errors);
			expect(results[ filePath ]).toBeUndefined();
		});

		it("should not return error results because #matches < max", () => {
			let simpleRule: CheckRule = <CheckRule> {
				snippet: {
					patterns: [/<img[^<>]*>/igm],
					min: null,
					max: 3,
					error: {
						message: "Not enough image elements or to many found."
					}
				}
			};
			let simpleMatchData: MatchData = {
				rule: simpleRule,
				files: [
					{
						name: filePath,
						numberOfMatchesFound: [3]
					}
				]
			};

			RegexCheck.validateRuleMatchData(simpleMatchData, results, errors);
			expect(results[ filePath ]).toBeUndefined();
		});
	});
});
