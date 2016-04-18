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

var exec = require("child_process").exec,
    pathModule = require("path"),
    pathToBondcExe = "src/Clients/JsCommon/telemetry/bond/bondc.exe",
    pathToDefaultTemplate = "src/Clients/JsCommon/telemetry/bondTypeScriptTransform.TT";

/**
 * Calls Microsoft Bond Compiler to convert *.bond files to typeScript files
 *
 * @param {object} options - Microsoft Bond Compiler options.
 * @param {string} options.cwd - Current Working Directory.
 * @param {string} options.source - Path to the source bond file.
 * @param {string} options.templateFile - Path to the template (TT) file.
 * @param {string} options.destination - Directory to put TypeScript result file.
 * @param {string} options.destinationFilename - Name of the TypeScript result fiie (without extension).
 * @param {Function} callback.
 */
function bondc(options, callback) {
    var pathToBondc,
        execOptions,
        command,
        previousCwd = process.cwd();

    process.chdir(pathModule.join(__dirname, ".."));

    options = options || {};
    options.cwd = options.cwd || __dirname;
    options.templateFile =
        options.templateFile || pathModule.relative(options.cwd, pathToDefaultTemplate);

    pathToBondc = pathModule.relative(options.cwd, pathToBondcExe);

    process.chdir(previousCwd);

    command = [
        pathToBondc,
        "/T:" + options.templateFile,
        "/O:" + options.destination,
        "/ProjectName:" + options.destinationFilename,
        options.source
    ];

    execOptions = {
        cwd: options.cwd
    };

    exec(command.join(" "), execOptions, function (error, stdout, stderr) {
        if (error && stdout) {
            // trace error message to output console
            console.log(stdout);
        }

        callback(error);
    });
}

module.exports = bondc;
