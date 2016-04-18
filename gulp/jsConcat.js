 /*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved. 
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *   
 *  The above copyright notice and this permission notice shall be included in 
 *  all copies or substantial portions of the Software.
 *   
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

"use strict";

var gulp = require("gulp"),
    gulpConcat = require("gulp-concat"),
	sourceMaps = require("gulp-sourcemaps"),
    nop = require("gulp-nop"),    
	expect = require('gulp-expect-file'),
    config = require("./config.js");

/**
 * Combine JS script files into a single bundled JS file. This technique helps boost page load time
 *
 * @param {Array} sources An array of string which specify the source paths of the JS script files that need to be combined together
 * @param {String} destinationFilename The destination filename that will be created
 * @param {Array} destinations An array of string which specify the destination folders
 * @param {String} projFolder The project folders
 */ 
function jsConcat(sources, destinationFilename, destinations, projFolder) {
	var options = {
                    cwd: projFolder
                  };
	var result = gulp.src(sources, options)
	    .pipe(expect({ checkRealFile: true, errorOnFailure: true }, sources))	
		.pipe(config.generateMaps ? sourceMaps.init({loadMaps: true}) : nop())
		.pipe(gulpConcat(destinationFilename))
		.pipe(config.generateMaps ? sourceMaps.write('.') : nop());

	destinations.forEach(function (dir) {
		result.pipe(gulp.dest(dir, options));
	});
	return result;
}

module.exports = jsConcat;