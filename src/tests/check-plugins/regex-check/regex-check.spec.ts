/* tslint:disable:max-file-line-count */

'use strict';

import {RegexCheck, CheckRule} from "../../../general/regex-check/regex-check";


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

		it("should not return error results because the patterns matches", () => {
			let fileData:string = `<p>Test</p>
			<img src="blubb.jpg"><address
			class="main">My Address</address>
			<img>
			<div><span class="raw">Blubb</span>
			</div>
			<span><address>His address</address></span>`;

			RegexCheck.checkRule(fileData, multiRule, filePath, results, errors);
			expect(results[ filePath ]).toBeUndefined();
		});

		it("should return error results because 2 elements are missing", () => {
			let fileData:string = `<p>Test</p>
			<img src="blubb.jpg"><address
			class="main">My Address</address>
			<img>
			<div><span class="raw">Blubb</span>
			</div>`;

			RegexCheck.checkRule(fileData, multiRule, filePath, results, errors);
			expect(results[filePath].length).toEqual(1);
			expect(results[filePath][0].rule).toEqual(multiRule);
			expect(results[filePath][0].occurrence).toBe(4 / 3);
			expect(results[filePath][0].error).toEqual(multiRule.snippet.error);
		});
	});


	describe("checking infinity patterns", () => {
		it("should not return error results because #images > min", () => {
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
			let fileData:string = `
			<img><img
			src="bllc.png" alt="bluff" />
			<img src="abc.jpg">
			<div></div>`;

			RegexCheck.checkRule(fileData, simpleRule, filePath, results, errors);
			expect(results[ filePath ]).toBeUndefined();
		});

		it("should not return error results because #images < max", () => {
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
			let fileData:string = `
			<img><img
			src="bllc.png" alt="bluff" />
			<img src="abc.jpg">
			<div></div>`;

			RegexCheck.checkRule(fileData, simpleRule, filePath, results, errors);
			expect(results[ filePath ]).toBeUndefined();
		});
	});
});
