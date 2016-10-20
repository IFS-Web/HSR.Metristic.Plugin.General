regex-check parameter documentation
===================================

* "NUMBER", "PERCENT":
  * NUMBER checks if the number of occurences in the snippet matches the bounds
    Example: min 1, max 2: in the snippets from the snippet patterns match must be found 1 or 2 occurrences of the
    snippet check patterns matches
  * PERCENT checks if the percentage of the matching snippets is between the bounds
    Example: min 0.2, max null: Minimal 40% of the snippet found by the snippet patterns match
    must match the snippet check patterns
* Tipp: use https://regex101.com/#javascript
* More example rules see default-rules.ts

```javascript
/**
 * @param options example
 */
{
	RegexCheck: {
		patterns: [
			{
			name: "Time element usage",
			files: "*.html",
			snippet: {
				patterns: [/<time[^<>\/]*>[^<>\/]*<\/time>/igm],
				min: 0, // min: null means bound will not be checked
				max: 10, // max: null means bound will not be checked
				error: {
					message: "Not enough time elements found. Please use <time> for every time occurence.",
					type: "warning" // "info" | "warning" | "error"
				}
			},
			snippetCheck: {
				pattern: [/<time [^<>\/]*datetime="(\d{4}(-\d{2}){0,2})|(-\d{2}){0,2}|(\d{4}-W\d{2})|(\d{4}(-\d{2}){2}(T| )\d{2}:\d{2}(:\d{2}(.\d{3})?)?)|(\d{2}:\d{2}((\+|\-)\d{2}:\d{2})?)"[^<>\/]*>[^<>\/]*<\/time>/igm],
				min: 1,
				max: 1,
				valueFormat: "NUMBER", // "PERCENT" | "NUMBER"
				error: {
					message: "Time element not used correct. Don't forget datetime attribute and value (http://www.w3schools.com/tags/att_time_datetime.asp).",
					type: "error"
				}
			}
		},
		{
			name: "Bookmark icon",
			files: "*.html",
			snippet: {
				patterns: [/<link[^<>\/]*rel="icon"[^<>\/]*\\?>/igm],
				min: 1,
				max: 1,
				error: {
					message: 'No bookmark icon found.',
					type: "warning"
				}
			}
		},
		{
			name: "Required elements",
			files: "*.html",
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
				patternLabels: [
					'address', 'meta', 'link', 'iframe', 'track', 'definition list', 'unordered list', 'ordered list', 'main', 'nav', 'aside', 'article', 'header', 'footer', 'figure', 'figcaption', 'small', 'object', 'form'
				],
				min: 1,
				max: null,
				error: {
					message: "Some of the following expected elements not found: address, meta, bookmark icon, iframe, video track, definition-, un- y ordered list, main, nav, aside, article, header, footer, figure, figcaption, small, object, form",
					type: "error"
				}
			}
		},
	]
}
```