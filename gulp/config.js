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

var lodash = require("lodash"),
    path = require("path"),
    cliOptions = require("./cliParser.js");

/**
 * Get config and apply CLI arguments.
 * Note:  CLI arguments have more priority.
 * 
 * Use this method instead of require("./config.json")
 * 
 * @returns {Object} Json object with settings.
 */
module.exports = function () {
    var confJSON = require("./config.json");

    return lodash.defaults({
        uglifyJs: strToBool("uglifyJs"),
        nonminJs: strToBool("nonminJs"),
        minifyCss: strToBool("minifyCss"),
        generateMaps: strToBool("generateMaps"),
        tslintOnBuild: strToBool("tslintOnBuild"),
        tslintOnChange: strToBool("tslintOnChange"),
        includeContentToMap: strToBool("includeContentToMap"),
        enableIncrementalBuild: strToBool("enableIncrementalBuild"),
        showMSBuildFullLog: strToBool("showFullLog"),
        showMSBuildLogOnError: strToBool("showMSBuildLogOnError"),
        sourceRootMapPrefix: cliOptions.sourceRootMapPrefix,
        sourceRootMapFullPath: cliOptions.sourceRootMapFullPath,
        emitTsLintError: strToBool("emitTsLintError"),
        paths: {
            VisualsDropFolder: path.resolve(__dirname, confJSON.paths.VisualsDropFolder),
            VisualsDropStyles: path.resolve(__dirname, confJSON.paths.VisualsDropStyles),
            VisualsDropScripts: path.resolve(__dirname, confJSON.paths.VisualsDropScripts),
            VisualsDropTests: path.resolve(__dirname, confJSON.paths.VisualsDropTests),
        }
    }, confJSON);

    function strToBool(option) {
        var arg = cliOptions[option];

        // if option doesn't exist return undefined else check value.
        return arg && arg === "true";
    }
}();
