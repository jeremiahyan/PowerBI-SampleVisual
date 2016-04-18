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
    gulpMinifyCSS = require("gulp-minify-css"),
    nop = require("gulp-nop"),
	sourceMaps = require("gulp-sourcemaps"),
	expect = require('gulp-expect-file');

var config = require("./config.js");

/**
 * Bundle a group of CSS files into a single bundle file. This technique helps boost page load time
 * 
 * @param {String} projectPath The project path
 * @param {Array} sourcePaths The source paths of the CSS files that need to be grouped into a single CSS file
 * @param {Array} destinations An array of destinations paths that the output CSS will be copied to
 * @param {String} destinationFileName The destination filename that will be created
 * @param {Boolean} minify if set to true, the output CSS bundle will be minified
 */
function cssConcat(projectPath, sourcePaths, destinations, destinationFileName, minify) {

    var gulpOptions = {
            cwd: projectPath
        };

    var result = gulp.src(sourcePaths, gulpOptions)
	    .pipe(expect({ checkRealFile: true, errorOnFailure: true }, sourcePaths))
	    .pipe(config.generateMaps ? sourceMaps.init({loadMaps: true}) : nop())
        .pipe(gulpConcat(destinationFileName))
		.pipe(config.generateMaps ? sourceMaps.write('.') : nop())
        .pipe(minify && config.minifyCss ? gulpMinifyCSS() : nop());
	destinations.forEach(function (dir) {
		result.pipe(gulp.dest(dir, gulpOptions));
	});
	return result;
}

module.exports = cssConcat;