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
    rename = require("gulp-rename"),
    cssjanus = require("gulp-cssjanus"),
    nop = require("gulp-nop"),
    gulpMinifyCSS = require("gulp-minify-css"),
    merge = require("merge2"),
    clone = require("gulp-clone");

var config = require("./config.js");

module.exports = transform;

/**
 * Converts CSS stylesheets between left-to-right and right-to-left.
 *
 * projectPath {String} Path to project folder
 * sourceFile {String} Stylesheet file to transform
 * destPath {String} Output dir
 * destFileName {String} Name of destination file
 */
function transform(projectPath, sourceFile, destPath, destFileName, cb) {
    var gulpOptions = {
        cwd: projectPath
    },
    cssjanusResult;

    cssjanusResult = gulp.src(sourceFile + ".css", gulpOptions)
        .pipe(cssjanus({
            swapLtrRtlInUrl: true
        })).on("error", function () {
        cb && cb();
    });

    return merge([
        cssjanusResult
            .pipe(rename(destFileName + ".rtl.css"))
            .pipe(gulp.dest(destPath, gulpOptions)),
        cssjanusResult
            .pipe(clone())
            .pipe(config.minifyCss ? gulpMinifyCSS() : nop())
            .pipe(rename(destFileName + ".rtl.min.css"))
            .pipe(gulp.dest(destPath, gulpOptions).on("end", function () {
                cb && cb();
            }))
    ]);
}