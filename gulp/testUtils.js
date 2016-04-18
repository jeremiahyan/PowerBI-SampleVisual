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

var gulp = require("gulp"),
    fs = require("fs"),
    shelljs = require("shelljs"),
    path = require("path"),
    glob = require("glob");

function addLink(link) {
    return '<link rel="stylesheet" type="text/css" href="' + link + '"/>';
}

function addScript(script) {
    return '<script type="text/javascript" src="' + script + '"></script>\r\n';
}

function addPaths(paths) {
    var cssExtension = /.+\.css/,
        jsExtension = /.+\.js/;

    return (paths.map(function (path) {
        if (jsExtension.test(path)) {
            return addScript(path);
        } else if (cssExtension.test(path)) {
            return addLink(path);
        }
    })).join("");
}

function addTestName(testName) {
    if (testName && testName.length > 0) {
        var specName = "?spec=" + encodeURI(testName);

        return "<script>" + "if (window.location.search !=='" + specName + "') {" +
            "window.location.search = '" + specName + "';}</script>";
    } else {
        return "";
    }
}

function createHtmlTestRunner(fileName, paths, testName) {
    var html = "<!DOCTYPE html><html>",
        head =
        "<head>" +
        '<meta charset="utf-8">' +
        "<title>Jasmine Spec Runner</title>" +
        addPaths(paths) +
        addTestName(testName) + "</head>",
        body = "<body></body>";

    html = html + head + body + "</html>";
    
    shelljs.mkdir('-p', path.dirname(fileName));
    fs.writeFileSync(fileName, html);
}

module.exports = {
  createHtmlTestRunner: createHtmlTestRunner  
};