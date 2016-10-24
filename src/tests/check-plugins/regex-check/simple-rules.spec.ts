/* tslint:disable:max-file-line-count */

'use strict';

import {RegexCheck, MatchData, CheckRule} from "../../../general/regex-check/regex-check";


describe("Regex check", () => {
	let filePath: string = '/abc/def.html';
	let matchData: MatchData[] = null;
	let errors = [];

	beforeEach(() => {
		errors = [];
		matchData = [];
	});

	afterEach(() => {
		expect(errors).toEqual([]);
	});

	describe("checking simple patterns", () => {
		let simpleRule: CheckRule = <CheckRule> {
			snippet: {
				patterns: [/<img[^<>]*>/igm],
				min: 3,
				max: 5,
				error: {
					message: "Not enough image elements or to many found."
				}
			}
		};

		it("should find 5 matches", () => {
			let fileData: string = `<p>Test</p>
			<img><img><img>
			<div><img
			src="bllc.png" alt="bluff" /></div>
			<img src="abc.jpg">`;

			RegexCheck.checkRule(fileData, simpleRule, filePath, matchData, errors);
			expect(matchData).toEqual([{
				rule: simpleRule,
				files: [
					{
						name: filePath,
						numberOfMatchesFound: [5]
					}
				]
			}]);
		});

		it("should find 2 matches", () => {
			let fileData: string = `<p>Test</p>
			<img>
			<img src="abc.jpg">
			<div></div>`;

			RegexCheck.checkRule(fileData, simpleRule, filePath, matchData, errors);
			expect(matchData).toEqual([{
				rule: simpleRule,
				files: [
					{
						name: filePath,
						numberOfMatchesFound: [2]
					}
				]
			}]);
		});

		it("should find 0 matches", () => {
			let fileData: string = `<p>Test</p>`;

			RegexCheck.checkRule(fileData, simpleRule, filePath, matchData, errors);

			expect(matchData).toEqual([{
				rule: simpleRule,
				files: [
					{
						name: filePath,
						numberOfMatchesFound: [0]
					}
				]
			}]);
		});
	});


	describe("checking multiple patterns to find a list of elements", () => {
		let multiRule:CheckRule = <CheckRule> {
			snippet: {
				patterns: [ /<img[^<>]*>/igm, /<address[^<>]*>/igm, /<span[^<>]*>/igm ],
				min: 2,
				max: 2,
				error: {
					message: "Not enough image elements or to many found."
				}
			}
		};

		it("should find [2,2,2] matches", () => {
			let fileData:string = `<p>Test</p>
			<img src="blubb.jpg"><address
			class="main">My Address</address>
			<img>
			<div><span class="raw">Blubb</span>
			</div>
			<span><address>His address</address></span>`;

			RegexCheck.checkRule(fileData, multiRule, filePath, matchData, errors);
			expect(matchData).toEqual([{
				rule: multiRule,
				files: [
					{
						name: filePath,
						numberOfMatchesFound: [ 2, 2, 2 ]
					}
				]
			}]);
		});

		it("should find [2,1,1] matches", () => {
			let fileData:string = `<p>Test</p>
			<img src="blubb.jpg"><address
			class="main">My Address</address>
			<img>
			<div><span class="raw">Blubb</span>
			</div>`;

			RegexCheck.checkRule(fileData, multiRule, filePath, matchData, errors);
			expect(matchData).toEqual([{
				rule: multiRule,
				files: [
					{
						name: filePath,
						numberOfMatchesFound: [ 2, 1, 1 ]
					}
				]
			}]);
		});
	});
});
