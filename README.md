# HSR.Metristic.Plugin.General
General plugins for Metristic application


## Lisence
![Apache License Version 2.0](https://www.apache.org/img/asf_logo.png)
[Apache License Version 2.0](./LICENSE)


## Releases / Production

⬇ Download on the [Release page](https://github.com/wasabideveloper/HSR.Metristic.Plugin.General/releases)


## Installation

* Install [node.js](https://nodejs.org/en/)
Verify wc is available: `which wc`
* Extract archive
* Enter the extracted directory, e.g. `cd Metristic-plugin-general-1.0`.
* Run `npm install --production` to install the dependencies.


## Usage

Import the plugins in the project.js of your main project:
```javascript
"use strict";

var StructureMetric = require("metristic-plugin-general").StructureMetric;
var RegexCheck = require("metristic-plugin-general").RegexCheck;
var rules = require("metristic-plugin-general").rules;

module.exports = {	
	"general": {
		name: 'General project',
		description: 'Check file structure',
		checks: [StructureMetric],
		options: {}
	},	
	"webCheck": {
		name: 'Web project checking',
		description: 'Validate HTML and JS and check for Selector and unit usage in CSS.',
		checks: [StructureMetric, RegexCheck],
		options: {
			RegexCheck: {
				rules: [
					rules.HTML.bookmarkIconUsage,
					rules.HTML.unexpectedElementsUsage,
					rules.CSS.efficientSelectorsUsage,
					rules.CSS.unitsUsage,
					rules.JS.codeEvaluationUsage
				]
			}
		}
	},
	...
};
```


## Development / build the project from source

See [HSR.Metristic documentation: development](https://github.com/wasabideveloper/HSR.Metristic#development)


### Commands

Deploy app to directory `app`:
```shell
gulp deploy
```

Compile TS and run tests:
```shell
gulp test
# or
npm test
```
