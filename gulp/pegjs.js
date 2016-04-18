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
    gulpPegJs = require("gulp-peg"),
    gulpRename = require("gulp-rename"),
    utils = require("./utils.js");

/**
 * Calls PEG.js (Parser Generator for JavaScript).
 * 
 * @param {object} options - Gulp and PEG.js options.
 * @param {string} options.cwd - Current Working Directory.
 * @param {(string|string[])} options.source - Source files.
 * @param {(string|string[])} options.excludeSource - Exclude files.
 * @param {string} options.destinationFilename - Destination filename.
 * @param {string} options.destination - Destination path.
 * @param {object} options.pegOptions - PEG.js options.
 * @param {string} options.pegOptions.optimize - Selects between optimizing the generated 
 * parser for parsing speed ("speed") or code size ("size").
 * @param {string|Function} options.pegOptions.exportVar - The variable to which the 
 * generated parser will be assigned in the output file.
 */
function pegjs(options) {
    var gulpOptions,
        paths;

    if (!options) {
        return;
    }

    gulpOptions = {
        cwd: options.cwd || __dirname
    };

    options.pegOptions = options.pegOptions || {};
    options.source = options.source || "/**/*.pegjs";
    options.pegOptions.optimize = options.pegOptions.optimize || "size";

    paths = utils.getPaths(options.source, options.excludeSource);

    return gulp.src(paths, gulpOptions)
        .pipe(gulpPegJs(options.pegOptions))
        .pipe(gulpRename(options.destinationFilename))
        .pipe(gulp.dest(options.destination, gulpOptions));
}

module.exports = pegjs;