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
    objfolder = "./obj",
    stylesFolder = "./styles";

module.exports = projects.initProject(
    "powerBIVisualsPlayground", // proj name
    __dirname, // project folder
    {
        deps: [
            require("../VisualsContracts/gulpProject"),
            require("../VisualsCommon/gulpProject"),
            require("../VisualsData/gulpProject"),
            require("../Visuals/gulpProject"),
            require("../CustomVisuals/gulpProject")
        ],
        staticFiles: [
            {
                source: "./images/ui-icons_222222_256x240.png",
                dest: "./styles/images"
            },
            {
                source: "./../../../lib/powerbi-visuals.all.js",
                dest: objfolder
            },
            {
                source: "./../../../lib/powerbi-visuals.all.js.map",
                dest: objfolder,
            },
            {
                source: "./../../../lib/visuals.css",
                dest: stylesFolder
            },
            {
                source: "./../CustomVisuals/styles/customVisuals.css",
                dest: stylesFolder
            },
            {
                source: [
                    "./../CustomVisuals/obj/CustomVisuals.js",
                    "./../CustomVisuals/obj/CustomVisuals.js.map"
                ],
                dest: objfolder
            }
        ],
        tsc: {
            outFileName: 'PowerBIVisualsPlayground'
        },
        less: {
            sourcePaths: [
                "./styles/**/*.less"
            ],
            destinationPath: "./styles",
            destinationFileName: "app",
        },
        watch: {
            includes: ["/styles/*.less", "/**/*.ts"]
        }
    });
