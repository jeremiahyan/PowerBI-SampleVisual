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

var gulp = require("gulp-help")(require("gulp")),
    path = require("path"),
    runSequence = require("run-sequence").use(gulp),
    bondc = require("./bondc.js"),
    tsc = require("./tsc.js"),
    tslint = require("./tsLint/tslint.js"),
    less = require("./less.js"),
    cssTransform = require("./cssjanus.js"),
    watcher = require("./watcher.js"),
    prefetchAngular = require("./angularTemplate.js"),
    msbuild = require("./msbuild.js"),
    spritesmith = require("./spritesmith.js"),
    utils = require("./utils.js"),
    pegjs = require("./pegjs.js"),
    ts = require("gulp-typescript"),
    gutil = require("gulp-util"),
    Q = require("q"),
    minimatch = require("minimatch");

var config = require("./config.js");

var DEFAULT_TASK_NAME = "default",
    BUILD_TASK_PREFIX = "build:",
    TSLINT_TASK_PREFIX = "tslint:",
    WATCHER_TASK_PREFIX = "watch:",
    TSLINT_ON_WATCH_TASK_SUFFIX = "-on-watch",
    AFTER_BUILD_TASK_SUFFIX = "-afterBuild",
    DROP_ARTIFACTS_TASK_SUFFIX = "-drop",
    TS_TASK_SUFFIX = "-ts",
    LESS_TASK_SUFFIX = "-less",
    ANG_PREF_TASK_SUFFIX = "-html",
    BOND_TASK_SUFFIX = "-bond",
    MSBUILD_TASK_SUFFIX = "-msbuild",
    SPRITES_TASK_SUFFIX = "-sprites",
    PEGJS_TASK_SUFFIX = "-pegjs",
    STATIC_FILES_TASK_SUFFIX = "-staticFiles",
    TS_CONFIG_FILE_NAME = "tsconfig.json",
    JS_OUT_FOLDER_NAME = "obj";

// Prevents the following error:
// Possible EventEmitter memory leak detected. 11 listeners added. ...
gulp.setMaxListeners(0);

//To show correct error messages.
Q.longStackSupport = true;

function GulpProject(projName, projFolder, params) {

    if (!projName) {
        throw new Error("projName has not been specified");
    }

    if (!projFolder) {
        throw new Error("projFolder has not been specified");
    }

    this.projName = projName;
    this.projFolder = projFolder;
    this.params = params || {};
    this.deps = params.deps || [];
    this.isWatcherStarted = false;
    this.buildWithDepsTask = BUILD_TASK_PREFIX + this.projName;
    this.watchTask = WATCHER_TASK_PREFIX + this.projName;
    this.lintTask = TSLINT_TASK_PREFIX + this.projName;
    this.buildTasks = null;
}

GulpProject.prototype.createTasks = function () {

    var me = this;

    gulp.task(this.buildWithDepsTask, this.deps.map(function (dep) {
        return BUILD_TASK_PREFIX + dep.projName;
    }), function (callback) {
        me.initBuildTasks();
        
        //Run TsLint task in parallel with other tasks
        if (config.tslintOnBuild && me.params.tsc) {
            runSequence(me.lintTask);
        }

        runSequence.apply(null, me.buildTasks.concat(callback));
    });

    gulp.task(DEFAULT_TASK_NAME, [this.buildWithDepsTask]);

};

GulpProject.prototype.initBuildTasks = function () {
    if (this.buildTasks)
        return;

    var buildTasks = [];

    if (this.params.staticFiles) {
        buildTasks.push(this.createProcessStaticFilesTask(this.params.staticFiles));
    }

    if (this.params.bondc) {
        // bond is part of full build, we don't need to re-build those files every time
        buildTasks.push(this.createBondTask(this.params.bondc));
    }

    if (this.params.sprites) {
        buildTasks.push(this.createSpritesTask(this.params.sprites));
    }

    if (this.params.less) {
        buildTasks.push(this.createLessTask(this.params.less));
    }

    if (this.params.html) {
        buildTasks.push(this.createAngularPrefethTask(this.params.html));
    }

    if (this.params.tsc) {
        this.createTypeScriptLintTask();

        buildTasks.push(this.createTypeScriptTask());
    }

    if (this.params.msbuild) {
        buildTasks.push(this.createMsBuildTask(this.params.msbuild));
    }

    if (this.params.pegjs) {
        buildTasks.push(this.createPegJsTask(this.params.pegjs));
    }

    // create post build task if we have extra assets or custom after build task
    if (this.params.afterBuild || this.params.copyDepsArtifacts) {
        buildTasks.push(this.createAfterBuildTask());
    }

    if (this.params.drop) {
        buildTasks.push(this.createDropArtifactsTask());
    }

    this.buildTasks = buildTasks;
};

GulpProject.prototype.createTypeScriptTask = function () {

    var me = this;
    var taskName = BUILD_TASK_PREFIX + this.projName + TS_TASK_SUFFIX;
    
    gulp.task(taskName, function (cb) {

        var tsProject = ts.createProject(path.join(me.projFolder, TS_CONFIG_FILE_NAME), {
            module: "amd",
            sortOutput: false,
            target: "ES5",
            declarationFiles: me.params.tsc.declarationFiles !== undefined ? me.params.tsc.declarationFiles : true, //TODO: refactor this - use lodash
            noEmitOnError: false,
            //removeComments:true,
            projectName: me.projName, // custom property
            outFileName: me.params.tsc.outFileName, // custom property
            out: me.params.tsc.outFileName ? path.join(/*me.projFolder, */JS_OUT_FOLDER_NAME, me.params.tsc.outFileName + ".js") : undefined,
            outDir: JS_OUT_FOLDER_NAME
        });
        
        tsc({
            projectPath: me.projFolder,
            tsProject: tsProject,
            callback: cb,
            mapConfig: me.params.tsc.mapConfig,
            transform: me.params.tsc.transform,
            nonminJs: me.params.tsc.nonminJs,
            uglifyJs: me.params.tsc.uglifyJs
        });
    });

    return taskName;
};

GulpProject.prototype.createTypeScriptLintTask = function () {

    var me = this;
    var taskName = this.lintTask;

    gulp.task(taskName, function () {
        return tslint(me.projFolder, null, me.params.tsc.tsLintExcludePaths || null);
    });

    return taskName;
};

GulpProject.prototype.createBondTask = function (bondConfig) {

    var taskName = BUILD_TASK_PREFIX + this.projName + BOND_TASK_SUFFIX;

    bondConfig.cwd = bondConfig.cwd || this.projFolder;

    gulp.task(taskName, function (callback) {
        bondc(bondConfig, callback);
    });

    return taskName;
};

GulpProject.prototype.createMsBuildTask = function (msbuildConfig) {
    var me = this;
    var taskName = BUILD_TASK_PREFIX + this.projName + MSBUILD_TASK_SUFFIX;

    gulp.task(taskName, function () {
        msbuildConfig.projFolder = me.projFolder;

        return msbuild(msbuildConfig);
    });

    return taskName;
};

GulpProject.prototype.createPegJsTask = function (pegjsConfig) {
    var me = this;
    var taskName = BUILD_TASK_PREFIX + this.projName + PEGJS_TASK_SUFFIX;

    gulp.task(taskName, function () {
        return pegjs({
            cwd: me.projFolder,
            pegOptions: pegjsConfig.pegOptions || {},
            source: pegjsConfig.source,
            destination: pegjsConfig.destination,
            destinationFilename: pegjsConfig.destinationFileName
        });
    });

    return taskName;
};

GulpProject.prototype.createWatchTask = function () {
    // already created
    if (gulp.hasTask(this.watchTask)) {
        return;
    }

    var me = this;
    var taskName = WATCHER_TASK_PREFIX + this.projName;
    var includes = me.params.watch.includes.map(function (incl) {
        return path.join(me.projFolder, incl);
    });

    var copyDepsConfig = me.params.copyDepsArtifacts || {};
    var copyDrop = me.params.drop;

    var TS_TASK = BUILD_TASK_PREFIX + me.projName + TS_TASK_SUFFIX,
        BOND_TASK = BUILD_TASK_PREFIX + me.projName + BOND_TASK_SUFFIX,
        ANGULAR_TASK = BUILD_TASK_PREFIX + me.projName + ANG_PREF_TASK_SUFFIX,
        LESS_TASK = BUILD_TASK_PREFIX + me.projName + LESS_TASK_SUFFIX;


    // automatically watch for project dependencies (known file extensions in obj dir)
    this.deps.map(function (dep) {
        includes.push(path.join(dep.projFolder, "obj", "*.d.ts"));

        if (copyDepsConfig.js) {
            includes.push(path.join(dep.projFolder, "obj", "*.js"));
            includes.push(path.join(dep.projFolder, "obj", "*.map"));
        }

        if (copyDepsConfig.css) {
            includes.push(path.join(dep.projFolder, "styles", "*.css"));
        }
    });

//    includes.push(path.join(me.projFolder, "tsconfig.json"));

    if (copyDrop) {
        includes.push(path.join(me.projFolder, "obj/*.js"));
        includes.push("!" + path.join(me.projFolder, "obj/*.min.js"));
        includes.push("!" + path.join(me.projFolder, "obj/*.nonmin.js"));
        includes.push("!" + path.join(me.projFolder, "obj/*.d.ts"));

        if (me.params.less) {
            var watchPath = me.params.less.destinationPath ? me.params.less.destinationPath : "styles";
            includes.push(path.join(me.projFolder, watchPath, "*.css"));
            includes.push("!" + path.join(me.projFolder, watchPath, "*.min.css"));
            includes.push("!" + path.join(me.projFolder, watchPath, "*.rtl.css"));
        }
    } else {
        // exclude own obj folder (as we usually specify **/*.ts as watch target,
        // but such filter also covers produced obj/ .d.ts file)
        includes.push("!" + path.join(me.projFolder, "obj/**"));
    }
    // include static files required watch
    var staticFilesForWatch = [];
    if (me.params.staticFiles) {
        // filter files
        staticFilesForWatch = me.params.staticFiles.filter(function (item) {
            return item.watch;
        });

        // specify watch
        staticFilesForWatch.forEach(function (item) {
            item.source.forEach(function (src) {
                includes.push(path.join(me.projFolder, src));
            });
        });
    }

    function findStaticFileSection(file) {
        for (var idx = 0; idx < staticFilesForWatch.length; idx++) {
            var item = staticFilesForWatch[idx];
            for (var idx2 = 0; idx2 < item.source.length; idx2++) {
                var src = path.join(me.projFolder, item.source[idx2]);
                if (minimatch(file, src))
                    return item;
            }
        }
        // no match
        return null;
    }

    gulp.task(taskName, function () {

        me.isWatcherStarted = true;

        // this is requied if watcher has been started manually w/o building the project
        // so internal build tasks have not been initialized
        me.initBuildTasks();

        // dependency projects should start their watchers as well (if not started yet)
        me.deps.forEach(function (dependency) {
            // ensure there is startWatcher method available
            if (dependency.startWatcher) {
                dependency.startWatcher();
            }
        });

        var tsLintOnWatchTask = me.lintTask + TSLINT_ON_WATCH_TASK_SUFFIX;

        gulp.task(tsLintOnWatchTask, function () {
            return tslint(me.projFolder, null, me.params.tsc.tsLintExcludePaths || null, { emitError: false });
        });

        // currrent project watcher
        watcher(me.projFolder, includes, function (evt) {

            var fileExt = path.extname(evt.path);
            var tasksToRun = [];

            // check if it is a watchable static file
            var copyItem = findStaticFileSection(evt.path);

            if (copyItem) {
                utils.copy({
                    cwd: me.projFolder,
                    source: copyItem.source,
                    destination: copyItem.dest,
                    join: copyItem.join
                });
                notifyWaitingForChangesDelayed();
                return;
            } else if (me.params.drop && isFileInDrop(me, evt.path)) {
                dropArtifacts(me);
                notifyWaitingForChangesDelayed();
                return;
            }

            //serviceMessageLog(me.projName + " watcher detected a change: " + JSON.stringify(evt));

            switch (fileExt) {
                case ".css":

                    if (copyDrop && !evtType(evt).isDeleted()) {
                        // TODO: refactor this - copy only changed files.
                        dropArtifacts(me);
                        tasksToRun = [];
                    }

                    if (copyDepsConfig.css && !evtType(evt).isDeleted()) {
                        utils.copy({
                            cwd: me.projFolder,
                            source: evt.path,
                            destination: copyDepsConfig.css
                        });
                        // handled, no actions required
                        tasksToRun = [];
                    }
                    break;
                case ".map":
                case ".js":

                    if (copyDrop && !evtType(evt).isDeleted()) {
                        dropArtifacts(me);
                        tasksToRun = [];
                    }

                    if (copyDepsConfig.js && !evtType(evt).isDeleted()) {
                        utils.copy({
                            cwd: me.projFolder,
                            source: evt.path,
                            destination: copyDepsConfig.js
                        });
                        // handled, no actions required
                        tasksToRun = [];
                    }
                    break;
//                case ".json":
                case ".ts":
                    // run tslint and  tsc tasks
                    if (gulp.hasTask(TS_TASK)) {
                        
                        // running these tasks in parallel 
                        tasksToRun = [[tsLintOnWatchTask, TS_TASK]];

                        if (!config.tslintOnChange) {
                            tasksToRun = [TS_TASK];
                        }
                    }
                    break;
                case ".less":
                    tasksToRun = [LESS_TASK];
                    break;
                case ".bond":
                    // compile bond and then check and compile typescript
                    // we don't need here tslint because if events.ts is changed linting will start during 'ts' task.
                    tasksToRun = [BOND_TASK, TS_TASK];

                    if (!config.tslintOnChange) {
                        tasksToRun.shift();
                    }
                    break;
                case ".html":
                    // angular prefetch
                    tasksToRun = [ANGULAR_TASK, TS_TASK];
                    break;
                default:
                    console.warn("Unable to determine correct gulp task to update project based on file extension: " + fileExt);
                    break;
            }

            // this logic shows 'Waiting for changes' notification when last task is completed
            // since tasks and detected changes occur async we use extra delay before showing message
            // to ensure some task didn't trigger new change and associated task
            if (tasksToRun && tasksToRun.length > 0) {
                _numDelayedNotifications++;
                tasksToRun.push(function () {
                    _numDelayedNotifications--;
                    notifyWaitingForChangesDelayed();
                });
                runSequence.apply(null, tasksToRun);
            } else {
                notifyWaitingForChangesDelayed();
            }
        });

        notifyWaitingForChangesDelayed();
    });

    return taskName;

    function evtType(evt) {
        return {
            isChanged: function () {
                return evt.type === "changed";
            },
            isAdded: function () {
                return evt.type === "added";
            },
            isDeleted: function () {
                return evt.type === "deleted";
            }
        };
    }

    function isFileInDrop(proj, path) {
        //TODO: improve: return only mathed path/dest.
        return [].concat(proj.params.drop).some(function (dropItem) {
            return [].concat(dropItem.source).some(function (src) {
                return minimatch(path, src);
            });
        });
    }
};

GulpProject.prototype.startWatcher = function () {

    // avoid multiple watchers for the same project
    if (this.isWatcherStarted) {
        return;
    }

    this.isWatcherStarted = true;

    if (!this.params.watch) {
        // project does not require watcher (no settings/configuration)
        return;
    }

    this.createWatchTask();
    runSequence(this.watchTask);

};

/**
 * Creates "less" task that generates *.css and *.rtl.css.
 *
 * @param {Object} lessConfig - Options for task creation.
 * @param {String | String[]} lessConfig.sourcePaths - Paths to less.
 * @param {String} lessConfig.destinationPath - Destination folder.
 * @param {String} lessConfig.destinationFileName - Name of output css file.
 * @param {String} lessConfig.destinationRTLFileName - Name of output rtl.css file.
 *
 * @returns {String} - Task name.
 */
GulpProject.prototype.createLessTask = function (lessConfig) {

    var me = this,
        lessTaskName = BUILD_TASK_PREFIX + this.projName + LESS_TASK_SUFFIX,
        cssTask = BUILD_TASK_PREFIX + this.projName + "-css",
        cssRTLTask = cssTask + "-rtl", // rtl - right to left
        lessConfigs = [].concat(lessConfig);

    gulp.task(lessTaskName, function (cb) {
        runSequence.apply(null, [cssTask, cssRTLTask, cb]);
    });

    // TODO: rewrite these additional tasks using promises 
    // helper task we shouldn"t show it in "help"
    gulp.task(cssTask, false, function (cb) {
        lessConfigs.forEach(function (currentLessConfig, index) {

            currentLessConfig.projectPath = me.projFolder;

            less(currentLessConfig, lessConfigs.length - 1 === index ? cb : undefined); // if we have several less configs than we have to pass callback to the last call.
        });
    });

    // helper task we shouldn"t show it in "help"
    gulp.task(cssRTLTask, false, function (cb) {
        return lessConfigs.map(function (currentLessConfig, index) {
            return cssTransform(
                me.projFolder,
                path.join(currentLessConfig.destinationPath, currentLessConfig.destinationFileName),
                currentLessConfig.destinationPath,
                currentLessConfig.destinationFileName,
                lessConfigs.length - 1 === index ? cb : undefined);
        });
    });

    return lessTaskName;
};

GulpProject.prototype.createSpritesTask = function (spritesConfig) {

    var me = this,
        taskName = BUILD_TASK_PREFIX + this.projName + SPRITES_TASK_SUFFIX;

    gulp.task(taskName, function () {
        return spritesmith(me.projFolder, spritesConfig.destinationFileName, spritesConfig.sourcePaths);
    });

    return taskName;
};

/**
 * Angular prefetching task.
 * 
 * @param {Object} htmlConfig - Options for task creation.
 * @param {String} htmlConfig.angularAppName - Paths to html files.
 * @param {String} htmlConfig.destinationFileName - Output file name.
 * @param {String|String[]} htmlConfig.includePaths - Paths with html templates to include.
 * 
 * @returns {String} - Task name.
 */
GulpProject.prototype.createAngularPrefethTask = function (htmlConfig) {

    var me = this,
        taskName = BUILD_TASK_PREFIX + this.projName + ANG_PREF_TASK_SUFFIX;

    gulp.task(taskName, function () {
        return prefetchAngular(me.projFolder, htmlConfig.angularAppName, htmlConfig.destinationFileName, htmlConfig.includePaths);
    });

    return taskName;
};

GulpProject.prototype.createProcessStaticFilesTask = function (staticFiles) {
    var me = this,
        taskName = BUILD_TASK_PREFIX + this.projName + STATIC_FILES_TASK_SUFFIX;

    gulp.task(taskName, false, function () {

        if (staticFiles) {
            return Q.all(staticFiles.map(function (copyItem) {
                return utils.copy({
                    cwd: me.projFolder,
                    source: copyItem.source,
                    destination: copyItem.dest,
                    join: copyItem.join,
                    produceMaps: copyItem.produceMaps,
                });
            }));
        }
    });

    return taskName;
};

GulpProject.prototype.createAfterBuildTask = function () {
    var me = this,
        taskName = BUILD_TASK_PREFIX + this.projName + AFTER_BUILD_TASK_SUFFIX;

    gulp.task(taskName, false, function () {

        return copyDeps(me).then(function () {
            if (me.params.afterBuild) {
                return Q.nfcall(runSequence, me.params.afterBuild(me));
            }
        });
    });

    return taskName;
};

GulpProject.prototype.createDropArtifactsTask = function () {
    var me = this,
        taskName = BUILD_TASK_PREFIX + this.projName + DROP_ARTIFACTS_TASK_SUFFIX;

    gulp.task(taskName, false, function () {
        return dropArtifacts(me);
    });

    return taskName;
};

function dropArtifacts(proj) {
    if (proj.params.drop) {
        return Q.all([].concat(proj.params.drop).map(function (dropItem) {
            var options = {
                cwd: proj.projFolder,
                source: dropItem.source,
                destination: dropItem.dest,
                join: dropItem.join,
                transform: dropItem.transform,
                errorIfMissing: dropItem.errorIfMissing,
                produceMaps: dropItem.produceMaps,
            };
            
            var description = gutil.colors.cyan(options.join ? options.join : "");
            
            if (dropItem.inform) {
                var startMsg = dropItem.inform[0];
                gutil.log(startMsg || "Starting drop: '" + description + "' ...");
            }
            
            return utils.copy(options).then(function () {
                if (dropItem.inform) {
                    var endMsg = dropItem.inform[1];
                    gutil.log(endMsg || "Finished drop: '" + description + "'");
                }
            });
        }));
    }

    return Q.resolve();    
}

function copyDeps(proj) {

    var depsToCopy = proj.deps,
        copyDepsConfig = proj.params.copyDepsArtifacts,
        allCopyTasks = [];

    if (copyDepsConfig) {
        depsToCopy.forEach(function (dep) {
            if (copyDepsConfig.js) {
                [].concat(copyDepsConfig.js).forEach(function (jsDropFolder) {
                    allCopyTasks.push(copy(path.join(dep.projFolder, JS_OUT_FOLDER_NAME, "!(*nonmin.)@(js|map)"), jsDropFolder));
                });
            }

            if (copyDepsConfig.css && dep.params.less) {
                [].concat(copyDepsConfig.css).forEach(function (cssDropFolder) {
                    [].concat(dep.params.less).forEach(function (currentLess) {
                        allCopyTasks.push(copy(path.join(dep.projFolder, currentLess.destinationPath, currentLess.destinationFileName + ".css"), cssDropFolder));
                        allCopyTasks.push(copy(path.join(dep.projFolder, currentLess.destinationPath, currentLess.destinationFileName + ".min.css"), cssDropFolder));
                        allCopyTasks.push(copy(path.join(dep.projFolder, currentLess.destinationPath, currentLess.destinationFileName + ".rtl.css"), cssDropFolder));
                        allCopyTasks.push(copy(path.join(dep.projFolder, currentLess.destinationPath, currentLess.destinationFileName + ".rtl.min.css"), cssDropFolder));
                    });
                });
            }
        });
    }

    return Q.all(allCopyTasks);


    function copy(source, dest) {
        utils.copy({
            cwd: proj.projFolder,
            source: source,
            destination: dest
        });
    }
}

module.exports = GulpProject;

// Refernce to the latest notification instance
var _lastNotification;
// Number of pending notifications at the end of async gulp tasks
var _numDelayedNotifications = 0;

/**
 * Notifies that all changes have been processed and watchers.
 * Additional delayed is used to ensure message is showed when all work is done.
 */
function notifyWaitingForChangesDelayed() {

    if (_numDelayedNotifications > 0)
        return;

    var thisNotification;
    thisNotification = _lastNotification = setTimeout(function () {
        if (thisNotification === _lastNotification) {
            gutil.log("", "", gutil.colors.magenta("Waiting for changes..."));
        }
    }, 1000);
}
