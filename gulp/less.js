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
    gulpLess = require("gulp-less"),
    gulpConcat = require("gulp-concat"),
    nop = require("gulp-nop"),
    gulpMinifyCSS = require("gulp-minify-css"),
    path = require("path");

var config = require("./config.js");

// additionalPaths (String | Array) - is used to add new paths where "lesser" will searching for ".less" files
module.exports = function (options, cb) {
    var lessResult,
        options = options || {},
        gulpOptions = {
            cwd: options.projectPath
        },
        defaultModifyVars = {
            themeName: 'default'
        };

    var srcResult = gulp.src(options.sourcePaths, gulpOptions);

    options.projectPath = options.projectPath || __dirname;
    options.modifyVars = options.modifyVars || defaultModifyVars;

    if (options.additionalPaths) {
        var paths = [].concat(options.additionalPaths).map(function (sPath) {
            return path.join(options.projectPath, sPath);
        });
    }

    lessResult = srcResult
        .pipe(gulpLess({
            paths: paths || [],
            relativeUrls: true,        
            modifyVars: options.modifyVars
        }).on('error', function (err) {
            cb && cb(err.message);
        }));

    lessResult.pipe(gulpConcat(options.destinationFileName + ".css"))
        .pipe(gulp.dest(options.destinationPath, gulpOptions));

    return lessResult.pipe(gulpConcat(options.destinationFileName + ".min.css"))
        .pipe(config.minifyCss ? gulpMinifyCSS() : nop())
        .pipe(gulp.dest(options.destinationPath, gulpOptions)).on("end", function () {
        cb && cb();
    });

//    return lessResult
//        .pipe(gulp.dest(destinationPath, gulpOptions));
};
