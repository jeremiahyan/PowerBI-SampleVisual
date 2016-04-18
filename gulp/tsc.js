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
    ts = require("gulp-typescript"),
    maps = require("gulp-sourcemaps"),
    changed = require("gulp-changed"),
    uglify = require("gulp-uglify"),
    path = require("path"),
    clone = require("gulp-clone"),
    thr = require("through2"),
    gutil = require("gulp-util"),
    rename = require("gulp-rename"),
    nop = require("gulp-nop"),
    merge = require("merge2"),
    Q = require("q"),
    lodash = require("lodash"),
    plumber = require('gulp-plumber'),
    consume = require('stream-consume');

var FileCache = require("./utilities/FileCache");

//To show correct error messages.
Q.longStackSupport = true;

var config = require("./config.js"),
    utils = require("./utils.js");

var isDebug = config.debug || false;


/**
 * TypeScript compile.
 * 
 * Map production notes:
 *   Path by default to sources for portal - "../ts/" + project name
 *   To debug in some other place:
 *    * change sourceRootMapPrefix option eg "../../" - to refer to sources from "<proj>/obj" folder
 *    * run "gulp build --sourceRootMapPrefix=../../" from proj folder gives the same result.
 *
 * Note: If sourceRootMapFullPath option is defined in gulp/config.json then such path will be used instead 
 *  of "sourceRootMapPrefix + Project name" for all projects. To override path for single project:
 *  cd proj_folder && gulp build --sourceRootMapFullPath=some/path
 *  
 * @param {String} options.projectPath
 * @param {TsProjecrt} options.tsProjecrt
 * @param {Function} options.callback callback from gulp task that have to be called when this task is done.
 */
function tsc(options) {

    var tsProject = options.tsProject,
        cb = options.callback,
        transform = options.transform,
        projectPath = options.projectPath,
        // TODO: update config.json structure
        mapConfig = lodash.defaults(options.mapConfig || {}, {
            sourceRootMapFullPath: config.sourceRootMapFullPath,
            sourceRootMapPrefix: config.sourceRootMapPrefix,
            includeContentToMap: config.includeContentToMap,
            generateMaps: config.generateMaps,
        }),
        nonminJs = options.nonminJs !== undefined ? options.nonminJs : config.nonminJs,
        uglifyJs = options.uglifyJs !== undefined ? options.uglifyJs : config.uglifyJs;


    // TODO: refactor - super complex to understand/debug and maintain/modify.

    var projectName = tsProject.options.projectName,
        sourceRootPath = config.sourceRootMapFullPath || config.sourceRootMapPrefix + projectName,
        outFileName = tsProject.options.outFileName;

    var callback = new utils.CallbackHelper(cb);

    var enableIncrementalBuild = config.enableIncrementalBuild;
    var fileCache = enableIncrementalBuild ? new FileCache(path.join(projectPath, "obj", config.cacheFileName)) : null;

    var isFileStreamChanged = enableIncrementalBuild ?
        fileCache.isFileStreamChanged({ inputFiles: tsProject.src() }) :
        // dummy promise in case incremental build is disabled
        Q.resolve(true);

    isFileStreamChanged.then(function (hasChanged) {
        if (!hasChanged) {
            gutil.log("Skipping target", gutil.colors.yellow("'build:" + projectName + "-ts'"), "bacause all output files are up-to-date");
            callback.run();
            return;
        }

        var gulpOptions = {
            // cwd: projectPath
        };
        
        var errorCache = new utils.ErrorCache();

        process.chdir(projectPath);

        var tscResult = tsProject.src()
            .pipe(plumber({ errorHandler: errorCache.catchError }))
            .pipe(mapConfig.generateMaps ? maps.init() : nop())
            .pipe(ts(tsProject, undefined, ts.reporter.longReporter()))
            .on("end", function () {
                if (errorCache.hasErrors()) {
                    callback.run(errorCache.getErrors());
                }
            });
            
        var dtsStream = tscResult.dts
            .pipe(plumber({ errorHandler: errorCache.catchError }))
            .pipe(enableIncrementalBuild ? fileCache.registerOutputFiles() : nop())
            .pipe(transform ? thr.obj(transform) : gutil.noop())
            .pipe(changed("./obj", {
                hasChanged: changed.compareSha1Digest,
                cwd: projectPath,
                extension: ".ts"
            }))
            .pipe(gulp.dest("./obj", gulpOptions));

        var nonminJsStream = nonminJs ? tscResult.js.pipe(clone())
            .pipe(plumber({ errorHandler: errorCache.catchError }))
            .pipe(changed("./obj", {
                hasChanged: changed.compareSha1Digest,
                cwd: projectPath,
                extension: ".js"
            }))
            .pipe(rename({ extname: ".nonmin.js" }))
            .pipe(uglify(getNonminJsUglifyOptions()))
            .pipe(gulp.dest("./obj", gulpOptions)) : nop();

        var jsStream = tscResult.js
            .pipe(plumber({ errorHandler: errorCache.catchError }))
            .pipe(enableIncrementalBuild ? fileCache.registerOutputFiles() : nop())
            .pipe(changed("./obj", {
                hasChanged: changed.compareSha1Digest,
                cwd: projectPath,
                extension: ".js"
            }))
            .pipe(mapConfig.generateMaps ? maps.write("./", getWriteMapOptions(sourceRootPath)) : nop())
            .pipe(gulp.dest("./obj", gulpOptions))
            .pipe(utils.filterStream({ ext: ".js" }))
            .pipe(utils.removeSourceMapProp()) //If file contains property sourceMap, gulp-sourcemap won't load map files during init
            .pipe(mapConfig.generateMaps ? maps.init({loadMaps: true}) : nop())
            .pipe(uglifyJs ? uglify(getJsUglifyOptions(isDebug)) : nop())
            .pipe(rename({ extname: ".min.js" }))
            .pipe(mapConfig.generateMaps ? maps.write("./", getWriteMapOptions()): nop())
            .pipe(gulp.dest("./obj", gulpOptions));
        
        var streamsToRun = [dtsStream, jsStream];
        
        if (nonminJs) {
            streamsToRun.push(nonminJsStream);
        }
        
        // Note: merged stream doesn't stop if there is passed nop (noop) operation into merge sequence.
        consume(merge(streamsToRun)
            .on("end", function () {
                if (!callback.hasCalled()) {
                    callback.run(errorCache.getErrorsIfExist());
                }

                // if incremental build is enabled we should save file cache before exit
                if (enableIncrementalBuild && !errorCache.hasErrors()) {
                    fileCache.save();
                }
            }));
    });

    /**
     * Options to generate source maps.
     * 
     * @param {String} sourcePath Path to sources that will be used in map files.
     * @returns {Object}
     */
    function getWriteMapOptions(sourcePath) {
        return {
            // includeContent: true - useful when you don't have sources on server.
            includeContent: mapConfig.includeContentToMap || false,
            sourceRoot: sourcePath
        };
    }
}

/**
 * Options for uglify module.
 * 
 * @param {Boolean} isDebug defines if debug mode is enabled/disabled
 * @returns {Object} options.
 */
function getJsUglifyOptions(isDebug) {
    return {
        compress: {
            drop_console: true,
            pure_funcs: [
                "debug.assertValue",
                "debug.assertFail",
                "debug.assert",
                "debug.assertAnyValue",
                "debug.assertNonEmpty",
            ],
            warnings: false,
            dead_code: true,
            sequences: true,
            properties: true,
            conditionals: true,
            comparisons: true,
            booleans: true,
            cascade: true,
            unused: true,
            loops: true,
            if_return: true,
            join_vars: true,
            global_defs: {
                "DEBUG": isDebug
            }
        }
    };
}

/**
 * Options for .nonmin uglify module.
 * 
 * @param {Boolean} isDebug defines if debug mode is enabled/disabled
 * @returns {Object} options.
 */
function getNonminJsUglifyOptions() {
    var options = getJsUglifyOptions(false);

    options.mangle = false;
    options.output = {
        beautify: true
    };

    return options;
}

module.exports = tsc;