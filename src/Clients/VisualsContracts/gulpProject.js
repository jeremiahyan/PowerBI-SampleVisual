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

var projects = require("../../../gulp/projects.js"),
    config = require("../../../gulp/config.js"),
    utils = require("../../../gulp/utils.js"),
    glob = require("glob"),
    fs = require("fs");

var project = module.exports = projects.initProject(
    "VisualsContracts", // proj name
    __dirname, // project folder
    {
        drop: [
            {
                source: ["./obj/*.js", "./obj/*.map"],
                dest: [config.paths.VisualsDropScripts]
            },
            {
                source: ["./obj/*.d.ts"],
                dest: [config.paths.VisualsDropScripts],
                transform: utils.transform.rmRefs()
            }
        ],
        tsc: {
            outFileName: "VisualsContracts",
            transform: combineVisualsContractsDTS
        },
        watch: {
            includes: ["/**/*.ts"]
        }
    });

function combineVisualsContractsDTS(file, enc, callback) {
    // TODO: check file extension to make sure it .d.ts file
    // this function is currently called for .d.ts, but we should do the same for other artefacts
    var projectPath = project.projFolder;

    var jsCommentRegExp = /(?:\/\*(?:[\s\S]*?)(?:copyright)(?:[\s\S]*?)\*\/)|(?:([\s;]?)+\/\/(?:.*)(?:<reference)(?:.*)$)/igm;
    var windowsNewLineRegExp = /\r\n/g;
    var newLine = "\n";
    // Note: logic below is sync as I was unable to get through2 transformation
    // callback working correct - stream is closed before I call `callback` async.

    //copyright notice + external typedefs
    var content = fs.readFileSync(projectPath + "/typedefs/typedefs.ts", "utf8") + newLine;
    // compiled d.ts - contains definitions from enums.ts
    content += file.contents.toString().replace(jsCommentRegExp,"");
    // concatenate all other d.ts files directly
    content += glob.sync(projectPath + "/**/*.d.ts", {
        ignore: projectPath + "/obj/*.*"
    }).map(function (filePath) {
        return fs.readFileSync(filePath, "utf8").replace(jsCommentRegExp,"");
    }).join(newLine);

    // update resultant content
    file.contents = new Buffer(content.replace(windowsNewLineRegExp, newLine), "utf8");

    return callback(null, file);
}
