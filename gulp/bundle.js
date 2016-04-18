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

var CONCATJS_TASK_SUFFIX = "-concat-js",
	CONCATCSS_TASK_SUFFIX = '-concat-css';
	
var gulp = require("gulp"),
    runSequence = require("run-sequence").use(gulp),    
    jsConcat = require("./jsConcat.js"),
	cssConcat = require("./cssConcat.js"),
    gutil = require('gulp-util');

/**
 * Create JS script bundles (min and unmin bundles) from a given configuration
 * 
 * @param {String} projFolder The project folder. It will be used as a starting point for all relative source paths
 * @param {Object} scriptBundles The script bundles will be created based on this configuration
 * @param {String} taskNamePrefix This prefix will be concatenanted to the task name
 */
function createScriptBundles(projFolder, scriptBundles, taskNamePrefix) {
	var jsSourceFuncFilter = function(s) { return s.path; };
	var minJsSourceFuncFilter = function(s) { return typeof s.minPath !== 'undefined' ? s.minPath : s.path.replace('.js', '.min.js'); };
	var taskNames = [];
    scriptBundles.forEach(function(bundle) {
        taskNames.push(createJsConcatTask(projFolder, bundle, '.bundle.js', taskNamePrefix, '-unmin-', jsSourceFuncFilter));
        taskNames.push(createJsConcatTask(projFolder, bundle, '.bundle.min.js', taskNamePrefix, '-min-', minJsSourceFuncFilter));	        
    });
    return taskNames;
}

/**
 * Create a JS concat task
 *
 * @param {Object} scriptBundle The script bundle settings
 * @param {String} bundleSuffix This suffix will be added to the output bundle filename
 * @param {String} taskNamePrefix This prefix will be concatenanted to the task name
 * @param {String} taskNameSuffix This suffix will be concatenanted to the task name
 * @param {Function} sourcesFuncFilter This function will transform the source files that are defined in scriptBundle.sources
 */
function createJsConcatTask(projFolder, scriptBundle, bundleSuffix, taskNamePrefix, taskNameSuffix, sourcesFuncFilter) {
    var taskName = taskNamePrefix + CONCATJS_TASK_SUFFIX + taskNameSuffix + scriptBundle.name;
    var sources = scriptBundle.sources.map(sourcesFuncFilter);
	gulp.task(taskName, function() {
		return jsConcat(sources, scriptBundle.name + bundleSuffix, scriptBundle.destinations, projFolder);        
	});
	return taskName;
}


/**
 * Create CSS bundles (min/unmin x ltr/rtl CSS bundles) based on the given configuration
 *
 * @param {String} projFolder The project folder. It will be used as a starting point for all relative source paths
 * @param {Object} styleBundles The CSS style bundles will be created based on this configuration
 * @param {String} taskNamePrefix This prefix will be concatenanted to the task name
 */
function createStyleBundles(projFolder, styleBundles, taskNamePrefix) {
	var cssSourceFuncFilter = function(s) { return s.path; };
	var cssMinSourceFuncFilter = function (s) { return typeof s.minPath !== 'undefined' ? s.minPath : s.path.replace('.css', '.min.css'); };
	var cssRtlSourceFuncFilter = function(s) { return typeof s.rtlPath !== 'undefined' ? s.rtlPath : s.path.replace('.css', '.rtl.css'); };
	var cssMinRtlSourceFuncFilter = function(s) { return typeof s.rtlMinPath !== 'undefined' ? s.rtlMinPath : s.path.replace('.css', '.rtl.min.css'); };
	
    var taskNames = [];
    styleBundles.forEach(function(bundle) {
        taskNames.push(createCssConcatTask(projFolder, bundle, '.bundle.css', taskNamePrefix, '-unmin-', false, cssSourceFuncFilter));
        taskNames.push(createCssConcatTask(projFolder, bundle, '.bundle.min.css', taskNamePrefix, '-min-', true, cssMinSourceFuncFilter));
        taskNames.push(createCssConcatTask(projFolder, bundle, '.bundle.rtl.css', taskNamePrefix, '-unmin-rtl-', false, cssRtlSourceFuncFilter));
        taskNames.push(createCssConcatTask(projFolder, bundle, '.bundle.rtl.min.css', taskNamePrefix, '-min-rtl-', true, cssMinRtlSourceFuncFilter));        
    });
    return taskNames;
}

/**
 * Create a CSS concat task
 *
 * @param {Object} styleBundle The style bundle settings.
 * @param {String} bundleSuffix This suffix will be added to the output bundle filename
 * @param {String} taskNamePrefix This prefix will be concatenanted to the task name
 * @param {String} taskNameSuffix This suffix will be concatenanted to the task name
 * @param {Boolean} minify if set to true, the output CSS bundle will be minified
 * @param {Function} sourcesFuncFilter This function will transform the source files that are defined in styleBundle.sources
 */
function createCssConcatTask(projFolder, styleBundle, bundleSuffix, taskNamePrefix, taskNameSuffix, minify, sourcesFuncFilter) {
	var taskName = taskNamePrefix + CONCATCSS_TASK_SUFFIX + taskNameSuffix + styleBundle.name;
    var sources = styleBundle.sources.map(sourcesFuncFilter);
	gulp.task(taskName, function() {
		return cssConcat(projFolder, sources, styleBundle.destinations, styleBundle.name + bundleSuffix, minify);
	});
	return taskName;
}

module.exports = {
	createScriptBundles: createScriptBundles,
    createStyleBundles: createStyleBundles	
};