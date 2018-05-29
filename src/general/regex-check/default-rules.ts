/* tslint:disable:max-line-length */
/* tslint:disable:max-file-line-count */


export const rules = {
	HTML: {
		bookmarkIconUsage: {
			name: "Bookmark icon",
			files: "*.html",
			snippet: {
				patterns: [/<link[^<>]*rel="icon"[^<>]*\/?>/igm],
				min: 1,
				max: 1,
				error: {
					message: 'No bookmark icon found.',
					type: "warning"
				}
			}
		},
		styleSheetUsage: {
			name: "Stylesheets",
			files: "*.html",
			snippet: {
				patterns: [/<link[^<>]*rel="stylesheet"[^<>]*\/?>/igm],
				min: 1,
				max: null,
				error: {
					message: 'No stylesheet found',
					type: "info"
				}
			}
		},
		hreflangAttribute: {
			name: "Hreflang attribute for external links",
			files: "*/*.html",
			snippet: {
				patterns: [ /<a[^<>]*hreflang="\w{2}"[^<>]*>[^<>\/]*<\/a>/igm ],
				min: 2,
				max: 4,
				error: {
					message: "Not enough links with hreflang attribute found.",
					type: "error",
					hideOccurrencesInReport: true
				}
			}
		},
		timeElementUsage: {
			name: "Time element usage",
			files: "*/*.html",
			snippet: {
				patterns: [ /<time[^<>\/]*>[^<>\/]*<\/time>/igm ],
				min: 15,
				max: null,
				error: {
					message: "Not enough time elements found. Please use <time> for every time designation.",
					type: "warning"
				}
			},
			snippetCheck: {
				pattern: /<time [^<>\/]*datetime="((\d{4}(-\d{2}){0,2})|(-\d{2}){0,2}|(\d{4}-W\d{2})|(\d{4}(-\d{2}){2}(T| )\d{2}:\d{2}(:\d{2}(.\d{3})?)?)|(\d{2}:\d{2}((\+|\-)\d{2}:\d{2})?))"[^<>\/]*>[^<>\/]*<\/time>/igm,
				min: 1,
				max: 1,
				valueFormat: "NUMBER",
				error: {
					message: "Time element not used correct. Don't forget datetime attribute and value (http://www.w3schools.com/tags/att_time_datetime.asp).",
					type: "error"
				}
			}
		},
		unexpectedElementsUsage: {
			name: "Unexpected elements usage",
			files: "*/*.html",
			snippet: {
				// [\S\s] = all characters incl. whitespace
				// ((?!<(\/?dl|\/?nav)>)[\S\s])* = all characters excluding <(\/?dl|\/?nav)>
				patterns: [
					/(<br( )?\/?>)/igm,
					/(<embed[^<>]*>)/igm,
					/(<input[^<>]*type="(submit|reset|button)"[^<>]*\/?>)/igm,
					/(class="clear(-fix)?")/igm ,
					/(<d(t|d)[^<>]*>[^<>]*<a[^<>]*>((?!<\/a>)[\S\s])*<\/a>[^<>]*<\/d(t|d)>)/igm ,
					/(<img[^<>]*src="data:[^<>]*"[^<>]*\/?>)/igm ],

				patternLabels: [ 'br', 'embed', 'input submit/reset/button', 'clear-fix', 'dl-navigations', 'data URI' ],
				min: null,
				max: 0,
				error: {
					message: "Unexpected elements or attributes used like br, embed, input for submit/reset/button, clear-fix classes, img data uri's or dl for navigations.",
					type: "warning"
				}
			}
		},
		requiredElements: {
			name: "Required elements",
			files: "*/*.html",
			snippet: {
				patterns: [
					/<address[^<>]*>/igm,
					/<meta[^<>]*name="\w*"[^<>]*>/igm,
					/<iframe[^<>]*>/igm,
					/<track[^<>]*>/igm,
					/<dl>((?!<\/dl>)[\S\s])*<\/dl>/igm,
					/<ul>((?!<\/ul>)[\S\s])*<\/ul>/igm,
					/<ol>((?!<\/ol>)[\S\s])*<\/ol>/igm,
					/<main[^<>]*>/igm,
					/<nav[^<>]*>/igm,
					/<aside[^<>]*>/igm,
					/<article[^<>]*>/igm,
					/<header[^<>]*>/igm,
					/<footer[^<>]*>/igm,
					/<figure[^<>]*>/igm,
					/<figcaption[^<>]*>/igm,
					/<small[^<>]*>/igm,
					/<object[^<>]*>/igm,
					/<form[^<>]*>/igm,
					/<a\s*href="tel:[^<>]*>/igm,
					/<a\s*href="mailto:[^<>]*>/igm
				],
				patternLabels: [ 'address', 'meta', 'iframe', 'track', 'definition list', 'unordered list', 'ordered list', 'main', 'nav', 'aside', 'article', 'header', 'footer', 'figure', 'figcaption', 'small', 'object', 'form', 'a href="tel:', 'a href="mailto:'],
				min: 1,
				max: null,
				error: {
					message: "Some of the following expected elements not found: address, meta, bookmark icon, iframe, video track, definition-, un- y ordered list, main, nav, aside, article, header, footer, figure, figcaption, small, object, form, a with tel/mailto",
					type: "error"
				}
			}
		},
		requiredFormElements: {
			name: "Required form elements",
			files: "*/*.html",
			snippet: {
				patterns: [
					/<output[^<>]*>/igm,
					/<input[^<>]*type="range"[^<>]*>/igm,
					/<input[^<>]*type="search"[^<>]*>/igm,
					/<input[^<>]*type="radio"[^<>]*>/igm,
					/<input[^<>]*type="email"[^<>]*>/igm,
					/<input[^<>]*type="url"[^<>]*>/igm,
					/<select[^<>]*>[^<>]*(<option[^<>]*value="[^<>]*"[^<>]*>[^<>]*<\/option>[^<>]*)*[^<>]*<\/select>/igm,
					/<textarea[^<>]*>/igm
				],
				patternLabels: [ 'output', 'range input', 'search input', 'radio input', 'email input', 'url input', 'select ( all values are required )', 'textarea'
				],
				min: 1,
				max: null,
				error: {
					message: "Some of the following expected form elements not found: output, range/search/radio/email/url input, select, textarea",
					type: "error"
				}
			}
		},
		rolesUsage: {
			name: "Usage of role attributes",
			files: "*/*.html",
			snippet: {
				patterns: [
					/<object[^<>]*role="img"[^<>]*>/igm
				],
				min: 1,
				max: null,
				error: {
					message: 'No role="img" found. SVG objects should be tagged by role.',
					type: "warning"
				}
			}
		},
		articleUsage: {
			name: "Usage of article",
			files: "*/*.html",
			snippet: {
				patterns: [
					/<article[^<>]*>((?!<\/article>)[\S\s])*<\/article>/igm
				],
				min: 5,
				max: 10,
				error: {
					message: 'To less or to many article elements found.',
					type: "warning"
				}
			},
			snippetCheck: {
				pattern: /<article[^<>]*>((?!<\/article>)[\S\s])*<header[^<>]*>((?!<\/article>)[\S\s])*<h\d>((?!<\/article>)[\S\s])*<\/h\d>((?!<\/article>)[\S\s])*<\/header>((?!<\/article>)[\S\s])*<\/article>/igm,
				min: 1,
				max: 1,
				valueFormat: "NUMBER",
				error: {
					message: "Article element not used complete. Don't forget header.",
					type: "warning",
					hideOccurrencesInReport: true
				}
			}
		},
		completeArticleUsage: {
			name: "Usage of complete articles",
			files: "*/*.html",
			snippet: {
				patterns: [
                    /<article[^<>]*>((?!<\/article>)[\S\s])*<header[^<>]*>((?!<\/article>)[\S\s])*<h\d>((?!<\/article>)[\S\s])*<\/h\d>((?!<\/article>)[\S\s])*<\/header>((?!<\/article>)[\S\s])*<footer[^<>]*>((?!<\/article>)[\S\s])*<\/footer>((?!<\/article>)[\S\s])*<\/article>/igm
				],
				min: 5,
				max: null,
				error: {
					message: 'Not enough articles found containing header, footer.',
					type: "error"
				}
			}
		},
		svgObjectUsage: {
			name: "SVG usage",
			files: "*/*.html",
			snippet: {
				patterns: [
					/<object[^<>]*(data="[^<>"]*\.svg"[^<>]*type="image\/svg\+xml"|type="image\/svg\+xml"[^<>]*data="[^<>"]*\.svg")[^<>]*>[\s\S]*?<\/object>/ig
				],
				min: 1,
				max: 1,
				error: {
					message: 'Not enough or too many SVG objects found.',
					type: "error"
				}
			}
		},
		figureUsage: {
			name: "Usage of figures",
			files: "*/*.html",
			snippet: {
				patterns: [
					/<figure[^<>]*>((?!<\/figure>)[\S\s])*(<(img|video|audio|object|iframe)[^<>]*>((?!<\/figure>)[\S\s])*)+((?!<\/figure>)[\S\s])*<figcaption[^<>]*>((?!<\/figure>)[\S\s])*<\/figcaption>((?!<\/figure>)[\S\s])*<\/figure>/igm
				],
				min: 4,
				max: null,
				error: {
					message: "Not enough figures used. Don't forget to use figcaption.",
					type: "error"
				}
			}
		}
	},
	CSS: {
		floatUsage: {
			name: "Usage of float",
			fileSpanning: true,
			files: "*/styles/*.css",
			snippet: {
				patterns: [ /float:\s?(left|right);/igm ],
				min: null,
				max: 3,
				error: {
					message: "Too many float alignment used. Use float only to float text around images and not for containers.",
					type: "error"
				}
			}
		},
		stateEffectUsage: {
			name: "Usage of pseudostates",
			fileSpanning: true,
			files: "*/styles/*.css",
			snippet: {
				patterns: [ /:hover/igm, /:active/igm, /:focus/igm, /:before/igm ],
				patternLabels: [ 'hover', 'active', 'focus', 'before'],
				min: 2,
				max: null,
				error: {
					message: "Too less state depending styling found. Add hover, active, focus styles for links and buttons and use :before",
					type: "error",
					hideOccurrencesInReport: false
				}
			}
		},
		/**
		 * match
		 *	{
		 * 		counter-reset: someHeadingName;
		 *	}
		 * and
		 * 	h3:before {
		 *		counter-increment: someHeadingName;
		 *		content: counter(someHeadingName);
		 *	}
		 */
		headingNumbersUsage: {
			name: "Usage of automatic numbers for headings",
			fileSpanning: true,
			files: "*/styles/*.css",
			snippet: {
				patterns: [
					/h\d:{1,2}before[^\{\}]*\{[^\{\}]*content:\s?counter\(\w*\)[\s"']*;[^\{\}]*\}/igm,
					/h\d:{1,2}before[^\{\}]*\{[^\{\}]*counter-increment:\s?\w*;[^\{\}]*\}/igm,
					/\{[^\{\}]*counter-reset:\s?\w*;[^\{\}]*\}/igm
				],
				min: 1,
				max: null,
				error: {
					message: "No heading numbering found.",
					type: "error",
					hideOccurrencesInReport: true
				}
			}
		},
		/**
		 * count % of 'abz > def' of al selectors containing multiple parts
		 *
		 * .foo[data-val|="blubb] > span.go4it-def , ... { ... }
		 * `---------v----------´   `------v-----´
		 *      [^,{}\s\/]            [^,{}\s\/]
		 *                      `-v-´              `-----v------´
		 *               (\s|\s(>|~|\+)\s)    ((?=,[^}]*{)|\s*(?={))
		 */
		efficientSelectorsUsage: {
			name: "Usage of efficient selectors",
			fileSpanning: true,
			files: "**/*.css",
			snippet: {
				patterns: [
					/([^,{}\s\/]+((\s|\s(>|~|\+)\s)[^,{}\s\/]+)+)((?=,[^}]*{)|\s*(?={))/igm
				],
				min: null,
				max: null,
				error: { message: "---", type: "info" }
			},
			snippetCheck: {
				pattern: /[^,{}\s\/]+\s(>|~|\+)\s[^,{}\s\/]+/igm,
				min: 0.6,
				max: null,
				valueFormat: "PERCENT",
				error: {
					message: "Too many inefficient selectors found",
					type: "warning",
					hideOccurrencesInReport: true
				}
			}
		},
		unitsUsage: {
			name: "Usage of relative and absolute units",
			fileSpanning: true,
			files: "**/*.css",
			snippet: {
				patterns: [/\d+(em|ex|ch|rem|vw|vh|vmin|vmax|%|cm|mm|in|px|pt|pc)/igm],
				min: null,
				max: null,
				error: { message: "---", type: "info" }
			},
			snippetCheck: {
				pattern: /\d+(em|ex|ch|rem|vw|vh|vmin|vmax|%)/igm,
				min: 0.75,
				max: null,
				valueFormat: "PERCENT",
				error: {
					message: "Too many absolute units used. Please use more relative units like 'em', 'rem', '%', 'vw' or 'vh'.",
					type: "warning"
				}
			}
		},
		nthChildUsage: {
			name: "Alternate row colors",
			fileSpanning: true,
			files: "*/styles/*.css",
			snippet: {
				patterns: [/tr:nth\-child\((2n|even|odd)\)/igm ],
				min: 1,
				max: null,
				error: {
					message: "Nth-child not or wrong used.",
					type: "warning",
					hideOccurrencesInReport: true
				}
			}
		},
		calcUsage: {
			name: "Usage of calc()",
			fileSpanning: true,
			files: "*/styles/*.css",
			snippet: {
				patterns: [/calc\([^;]*\);/igm],
				min: 2,
				max: null,
				error: {
					message: "Too less calc() found.",
					type: "error"
				}
			},
			// calc should be used like this: calc( 56.25%-of-the-page-with - the-margins ), examples:
			// calc( 100vw*0.5625 - 1rem )
			// calc( 56.25vw - 2*0.5rem )
			// calc( 0.5625*100vw - 0.5rem - 0.5rem )
			// calc((100vw * 9/16) - 120px)
			snippetCheck: {
				pattern: /calc\((\s?\(?\d+(\.\d+)?\s?\*)?\s?\d+(\.\d+)?(vw|%)(\s?\*\s?\d+(\.\d+)?\s?)?\)?(\s?\-(\s?\d+(\.\d+)?\s?\*)?\s?\d+(\.\d+)?(em|rem|px)\s?)+\)/igm,
				min: 1,
				max: 1,
				valueFormat: "NUMBER",
				error: {
					message: "Calc not used the proposed way. (Proposed way: 56.25% * ViewportWidth - Margins)",
					type: "warning",
					hideOccurrencesInReport: true
				}
			}
		}
	},
	JS: {
		codeEvaluationUsage: {
			name: "Usage of dangerous code evaluation",
			files: "**/*.js",
			snippet: {
				patterns: [/eval\(/igm, /new\sfunction\(/igm, /setTimeout\(/igm],
				min: null,
				max: 0,
				error: {
					message: "eval(), new function() or setTimeout() used.",
					type: "error"
				}
			}
		}
	}
};
