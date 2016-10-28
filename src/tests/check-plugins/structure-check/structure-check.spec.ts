/* tslint:disable:max-file-line-count */

'use strict';

import { StructureCheck, FileRule, FileResult } from "../../../general/structure-check/structure-check";
import { Barrier } from "metristic-core";

/* file structure:
root
	index.html
	LICENSE

	scripts
		font-size.js
	styles
		style.css
		app.css
 */

let paths = [
	'/root', '/root/index.html', '/root/LICENSE', '/root/scripts', '/root/styles',
	'/root/scripts/font-size.js',
	'/root/styles/style.css', '/root/styles/app.css'
];
let dirs = ['/root', '/root/scripts', '/root/styles', '/root/LICENSE'];
let files = ['/root/index.html', '/root/scripts/font-size.js', '/root/styles/style.css', '/root/styles/app.css'];

let fs = {
	readdir: (path: string, callback: (error: Error, files: string[]) => void) => {
		switch (path) {
			case '/root': callback(null, ['index.html', 'LICENSE', 'scripts', 'styles']); break;
			case '/root/scripts': callback(null, ['font-size.js']); break;
			case '/root/styles': callback(null, ['style.css', 'app.css']); break;
			default: callback(null, []);
		}
	},
	existsSync: (path): boolean => {
		return paths.indexOf(path) >= 0;
	},
	statSync: (path): { isDirectory: () => boolean, isFile: () => boolean } => {
		if (paths.indexOf(path) >= 0) {
			return {
				isDirectory: () => {
					return dirs.indexOf(path) >= 0;
				},
				isFile: () => {
					return files.indexOf(path) >= 0;
				}
			};
		} else {
			throw new Error(`ENOENT: no such file or directory, stat ${path}`);
		}
	}
};


describe("Structure check", () => {
	let errors;
	let fileResult;

	beforeEach(() => {
		errors = [];
		fileResult = {};
	});

	afterEach(() => {
		expect(errors).toEqual([]);
	});

	describe("checking directory or file [1] ", () => {
		it('should return "present" for present file [1.1]', () => {
			StructureCheck.checkDirOrFile(fs, null, {}, '/root/index.html', fileResult);
			expect(fileResult).toEqual({ present: true });
		});

		it('should return "missing" for not present file [1.2]', () => {
			StructureCheck.checkDirOrFile(fs, null, {}, '/root/README.md', fileResult);
			expect(fileResult).toEqual({ present: false, missing: true });
		});

		it('should not return "missing" for not present optional file [1.3]', () => {
			StructureCheck.checkDirOrFile(fs, null, { optional: true }, '/root/README.md', fileResult);
			expect(fileResult).toEqual({ present: false });
		});

		it('should return "forbidden" for present file missing parent rule [1.4]', () => {
			StructureCheck.checkDirOrFile(fs, null, null, '/root/index.html', fileResult);
			expect(fileResult).toEqual({ present: true, additional: true, forbidden: true });
		});

		it('should return "forbidden" for present file not allowed in parent rule [1.5]', () => {
			StructureCheck.checkDirOrFile(fs, { additionalContentForbidden: true }, null, '/root/index.html', fileResult);
			expect(fileResult).toEqual({ present: true, additional: true, forbidden: true });
		});

		it('should not return "forbidden" for present file allowed in parent rule [1.6]', () => {
			StructureCheck.checkDirOrFile(fs, {}, null, '/root/index.html', fileResult);
			expect(fileResult).toEqual({ present: true, additional: true });
		});

		it('should return "wrongType" for expected file which is a directory [1.7]', () => {
			StructureCheck.checkDirOrFile(fs, null, { type: 'FILE' }, '/root/styles', fileResult);
			expect(fileResult).toEqual({ present: true, wrongType: true });
		});

		it('should return "wrongType" for expected directory which is a file [1.8]', () => {
			StructureCheck.checkDirOrFile(fs, null, { type: 'DIR' }, '/root/index.html', fileResult);
			expect(fileResult).toEqual({ present: true, wrongType: true });
		});

		it('should not return "wrongType" for expected directory which is not present and a file [1.9]', () => {
			StructureCheck.checkDirOrFile(fs, null, { type: 'DIR' }, '/root/README.md', fileResult);
			expect(fileResult).toEqual({ present: false, missing: true });
		});

		it('should not return "wrongType" for expected file which is not present and a directory [1.9]', () => {
			StructureCheck.checkDirOrFile(fs, null, { type: 'DIR' }, '/root/images', fileResult);
			expect(fileResult).toEqual({ present: false, missing: true });
		});
	});

	describe("checking complete structure [2] ", () => {
		let rule: FileRule = {
			additionalContentForbidden: true,
			children: {
				'index.html': {},
				'README.md': {},
				'LICENSE': { type: 'FILE' },
				'humans.txt': { optional: true },
				'styles': {
					children: {
						'style.css': {},
						'*': {
							type: 'DIR'
						}
					}
				}
			}
		};
		let expectedResults: { [name: string]: FileResult } = {
			'root': {
				absolutePath: '/root',
				children: {
					'index.html': { absolutePath: '/root/index.html', present: true },
					'README.md': { absolutePath: '/root/README.md', present: false, missing: true },
					'LICENSE': {
						absolutePath: '/root/LICENSE',
						present: true,
						wrongType: true,
						children: {}
					},
					'humans.txt': { absolutePath: '/root/humans.txt', present: false },
					'styles': {
						absolutePath: '/root/styles',
						present: true,
						children: {
							'style.css': { absolutePath: '/root/styles/style.css', present: true },
							'app.css': {
								absolutePath: '/root/styles/app.css',
								present: true,
								wrongType: true
							}
						}
					},
					'scripts' : {
						absolutePath: '/root/scripts',
						present: true,
						additional: true,
						forbidden: true,
						children: {
							'font-size.js': {
								absolutePath: '/root/scripts/font-size.js',
								present: true,
								additional: true
							}
						}
					}
				}
			}
		};

		it('should match expected results [2.1]', () => {
			let barrier = new Barrier(1).then(() => {});
			StructureCheck.walkStructure(barrier, fs, '', '/root', null, rule, fileResult, errors);
			expect(fileResult).toEqual(expectedResults);
			expect(barrier.waitingFor()).toBe(0);
		});
	});

	describe("checking for empty rules [3]", () => {
		it("should not fail on missing child rule [3.1]", () => {
			let paths2 = ['/root', '/root/calculator', '/root/calculator/script.js'];
			let fs2 = {
				readdir: (path: string, callback: (error: Error, files: string[]) => void) => {
					switch (path) {
						case '/root': callback(null, ['calculator']); break;
						case '/root/calculator': callback(null, ['script.js']); break;
						default: callback(null, []);
					}
				},
				existsSync: (path): boolean => {
					return paths2.indexOf(path) >= 0;
				},
				statSync: (path): { isDirectory: () => boolean, isFile: () => boolean } => {
					if (paths2.indexOf(path) >= 0) {
						return {
							isDirectory: () => {
								return ['/root', '/root/calculator'].indexOf(path) >= 0;
							},
							isFile: () => {
								return ['/root/calculator/script.js'].indexOf(path) >= 0;
							}
						};
					} else {
						throw new Error(`ENOENT: no such file or directory, stat ${path}`);
					}
				}
			};

			let expectedResults: { [name: string]: FileResult } = {
				'root': {
					absolutePath: '/root',
					children: {
						'calculator': {
							absolutePath: '/root/calculator',
							present: true,
							additional: true,
							children: {
								'script.js': {
									absolutePath: '/root/calculator/script.js',
									present: true,
									additional: true
								}
							}
						}
					}
				}
			};

			let rule = <FileRule> {};
			let barrier = new Barrier(1).then(() => {});
			StructureCheck.walkStructure(barrier, fs2, '', '/root', null, rule || {}, fileResult, errors);
			expect(fileResult).toEqual(expectedResults);
			expect(barrier.waitingFor()).toBe(0);
		});
	});
});
