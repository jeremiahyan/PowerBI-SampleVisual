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
    gulpTsLint = require("gulp-tslint"),
    lodash = require("lodash"),
    path = require("path"),
    config = require("../config.js"),
    utils = require("../utils.js");

/**
 * Runs TypeScript linter for given paths.
 * 
 * @param {String} projectPath Path of project which will be linted. Used as CWD.
 * @param {String | Array} includePaths Paths where linter will be searching .ts files.
 * @param {String | Array} excludePaths Excluded paths.
 */
function tslint(projectPath, includePaths, excludePaths, options) {
    var paths,
        reportOptions = lodash.defaults(options || {}, {
            emitError: config.emitTsLintError || false,
        }),
        includePaths = includePaths || "/**/*.ts",
        paths = utils.getPaths(includePaths, excludePaths);

    return gulp.src(paths, { cwd: projectPath })
        .pipe(gulpTsLint({
            configuration: path.join(__dirname, "../../src/Clients/tslint.json")
        }))
        .pipe(gulpTsLint.report("full", reportOptions));
}

module.exports = tslint;