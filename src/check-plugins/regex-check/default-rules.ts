import {CheckRule} from "regex-check";


export const rules: {[name:string]: CheckRule} = {
	hreflangAttribute: {
		name: "Hreflang attribute for external links",
			files: "*/*.html",
			snippet: {
			patterns: [/<a[^<>]*hreflang="\w{2}"[^<>]*>[^<>\/]*<\/a>/igm],
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
			patterns: [/<time[^<>\/]*>[^<>\/]*<\/time>/igm],
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
			patterns: [/((<br( )?\/?>)|(<embed[^<>]*>)|(<input[^<>]*type="(submit|reset|button)"[^<>]*\/?>)|(class="clear(-fix)?")|(<d(t|d)[^<>]*>[^<>]*<a[^<>]*>((?!<\/a>)[\S\s])*<\/a>[^<>]*<\/d(t|d)>)|(<img[^<>]*src="data:[^<>]*"[^<>]*\/?>))/igm],

			patternLabels: ['br', 'embed', 'input submit/reset/button', 'clear-fix', 'dl-navigations', 'data URI'],
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
				/<link[^<>]*rel="icon"[^<>]*>/igm,
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
				/<form[^<>]*>/igm
			],
			patternLabels: ['address', 'meta', 'link', 'iframe', 'track', 'definition list', 'unordered list', 'ordered list', 'main', 'nav', 'aside', 'article', 'header', 'footer', 'figure', 'figcaption', 'small', 'object', 'form'
			],
			min: 1,
			max: null,
				error: {
				message: "Some of the following expected elements not found: address, meta, bookmark icon, iframe, video track, definition-, un- y ordered list, main, nav, aside, article, header, footer, figure, figcaption, small, object, form",
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
			patternLabels: [ 'output', 'range input', 'search input', 'radio input', 'email input', 'url input', 'select', 'textarea'
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
				/<object[^<>]*role="img"[^<>]*>/igm,
			],
			min: 1,
			max: null,
			error: {
				message: 'No role="img" found. SVG objects should be tagged by role.',
				type: "warning"
			}
		}
	}
};
