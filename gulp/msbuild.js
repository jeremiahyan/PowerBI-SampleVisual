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
    gutil = require("gulp-util"),
    utils = require("./utils"),
    path = require("path"),
    lodash = require("lodash"),
    args = require("./cliParser.js"),
    gulpMsbuild = require("gulp-msbuild"),
    config = require("./config.js");

var BUILD_LOG_FILE_NAME = "Build.log";

/**
 * Calls MSBuild tool to build project file
 *
 * @param {String} options.projectPath Path to the project file
 * @param {String} options.projectFile Name of project file
 * @param {String} options.toolsVersion Version of tools (ToolsVersion) in csproj file, it can be overrided by passing cli param: --msbuildVersion or --msbv
 * @param {Array} options.targets MSBuild targets, for example ['Clean', 'Build']
 * @param {Boolean} options.stdout If true then output messages will be showen in console.
 */
module.exports = function (options) {

    var gulpOptions = {
        cwd: options.projFolder
    };

    var BUILD_LOG_FILE_PATH = path.resolve(options.projFolder, BUILD_LOG_FILE_NAME);

    // merge props and assign defaults
    lodash.defaults(options, {
        targets: ["Build"],
        errorOnFail: true,
        toolsVersion: args.msbuildVersion || options.toolsVersion || 14,
        maxBuffer: 1024 * 1024 * 2,
        fileLoggerParameters: 'LogFile=' + BUILD_LOG_FILE_PATH,
        stdout: config.showMSBuildFullLog || false,
        stderr: false,
        properties: utils.isBuildInsideVS() ? {
            GulpBuildInsideVS: true
        } : ""
    });

    return gulp.src(options.projFile, gulpOptions)
        .pipe(gulpMsbuild(options))
        .on('error', function () {
            gutil.log(gutil.colors.red('Full log: ') + gutil.colors.green(BUILD_LOG_FILE_PATH));

            if (config.showMSBuildLogOnError) {
                process.stdout.write(require("fs").readFileSync(BUILD_LOG_FILE_PATH, "utf8"));
            }
        });
};