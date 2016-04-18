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

var gulpProject = require("./GulpProject");

var projects = {};

function getProjectByName(projName) {
    return projects[projName];
}

function getProjectByPath(path) {

    for (var projectName in projects) {

        var project = projects[projectName];

        if (project.projFolder.toUpperCase() === path.toUpperCase()) {
            return project;
        }
    }
}

function getProjects() {
    return projects;
}

/**
 * Initialize GulpProject.
 * 
 * @param {String} projName Gulp project name.
 * @param {String} projFolder path to project folder. (Commonly used `__dirname` global variable)
 * @param {Object} params Configuration for gulp project that describe what exacly tasks will be created (TS compilation, LESS, etc.) //TODO: add description for all options properties. 
 * @returns {GulpProject} Inited project.
 */
function initProject(projName, projFolder, params) {
    var proj = getProjectByName(projName);

    if (!proj) {
        // does not exist, create it
        proj = new gulpProject(projName, projFolder, params);
        projects[projName] = proj;
        proj.createTasks();
    }

    return proj;
}

module.exports = {
    getProjectByName: getProjectByName,
    getProjectByPath: getProjectByPath,
    get: getProjects,
    initProject: initProject
};