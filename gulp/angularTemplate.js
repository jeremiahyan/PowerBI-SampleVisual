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

var through = require("through2"),
    gulp = require("gulp"),
    gulpConcat = require("gulp-concat"),
    charsToUnicode = [
        "\\",
        "'"
    ];

module.exports = prefetch;

/**
 * Angular prefetching task.
 *
 * @param {String} projectPath - Working directory.
 * @param {String} angularAppName - Angular application name.
 * @param {String} destinationFileName - Output file name.
 * @param {String|String[]} paths - Paths with html templates to include.
 *
 * @returns {String} - Task name.
 */
function prefetch(projectPath, angularAppName, destinationFileName, paths) {
    var gulpOptions = {
            cwd: projectPath
        };

    return gulp.src(paths, gulpOptions)
        .pipe(gulpPrefetch(gulpOptions))
        .pipe(gulpConcat(destinationFileName + ".templates.ts"))
        .pipe(gulpPrefetchContent({angularAppName: angularAppName, projectPath: projectPath}))
        .pipe(gulp.dest("./", gulpOptions));
}

function gulpPrefetchContent(options) {

    options.angularAppName = options.angularAppName || "";

    return through.obj(function(file, enc, callback) {
        var content = file.contents.toString();

        content = "angular.module('" + options.angularAppName +"').run(['$templateCache', function (t) {" +
                content + "}]);";

        file.contents = new Buffer(content);

        this.push(file);

        callback();
    });
}

function gulpPrefetch(options) {

    options = options || {};
    options.cwd = options.cwd || process.cwd();

    return through.obj(function(file, enc, callback) {
        var path = file.path,
            template,
            content = convertCharsToUnicode(file.contents.toString(), charsToUnicode);

        path = path
            .split(options.cwd)[1]
            .slice(1)
            .replace(/\\/gm, "/");

        template = [
            "t.put('",
            path,
            "', '",
            content.replace(/(\r)|([^\r]\n)/gm, "\\\r"),
            "');"
        ];

        file.contents = new Buffer(template.join(""));

        this.push(file);

        callback();
    });
}

function convertCharsToUnicode(data, chars) {
    var template,
        unicodeChar = "",
        i = 0;

    for (i = 0; i < chars.length; i++) {
        template = new RegExp("\\" + chars[i], "gm");
        unicodeChar = "\\u" + ("000" + chars[i].charCodeAt(0).toString(16)).substr(-4);

        data = data.replace(template, unicodeChar);
    }

    return data;
}
