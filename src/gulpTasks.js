"use strict";

var gulp = require('gulp-help')(require('gulp')),
    runSequence = require("run-sequence").use(gulp);

var projects = require("../gulp/projects.js");

var powerBIVisualslayground = require("./Clients/PowerBIVisualsPlayground/gulpProject"),
    visualsProject = require("./Clients/Visuals/gulpProject"),
    customVisuals = require("./Clients/CustomVisuals/gulpProject");

require("../gulp/visualsPlayground.js");
require("../gulp/visualsTest.js");
require("./Clients/VisualsContracts/gulpProject");
require("./Clients/VisualsCommon/gulpProject");
require("./Clients/VisualsData/gulpProject");

gulp.task("buildAll", ["build", "build:tests"]);

gulp.task("build", "Build the project", function (cb) {
    return runSequence(powerBIVisualslayground.buildWithDepsTask, cb);
});

gulp.task("default", function (cb) {
    return runSequence(powerBIVisualslayground.buildWithDepsTask, cb);
});

// aliases for running tests
gulp.task("test", "Build and run tests", function(cb) {
    return runSequence("test:visuals", cb);
});

gulp.task("build:tests", "Build tests", function(cb) {
    return runSequence("build:visualsTests", cb);
});

gulp.task("run:tests", "Run tests", function(cb) {
    return runSequence("run:test:visuals", cb);
});

// TODO: add deprecated tasks like package, etc
gulp.task("package", "This command has been depricated. Please use 'build' instead.", function(cb) {
    console.warn("'package' command has been depricated. Please use 'build' instead.");
    return runSequence("build", cb);
});

gulp.task("init", "Run the build and then start watchers which will build project parts after you save changes to any file", function (cb) {
    return runSequence("build", "watch", cb);
});

gulp.task("watch", function (cb) {
    visualsProject.createWatchTask();
    customVisuals.createWatchTask();
    powerBIVisualslayground.createWatchTask();

    return runSequence(
        "watch:visuals",
        "watch:customVisuals",
        "watch:powerBIVisualsPlayground",
        cb);
});

gulp.task("tslint", "Check the source files for TypeScript Lint errors", function (callback) {

    var tasks = [];

    var allProjects = projects.get();

    for (var projectName in allProjects) {

        var project = allProjects[projectName];

        if (project.params.tsc) {
            project.createTypeScriptLintTask();
            tasks.push(project.lintTask);
        }
    }

    // run tslint tasks in parallel
    runSequence(tasks, callback);
});