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
    path = require("path"),
    utils = require("../../../gulp/utils.js");

var externalsJs = [
    "../Externals/ThirdPartyIP/JQuery/2.1.3/jquery.min.js",
    "../Externals/ThirdPartyIP/jqueryui/1.11.4/jquery-ui.min.js",
    "../Externals/ThirdPartyIP/D3/d3.min.js",
    "../Externals/ThirdPartyIP/LoDash/lodash.min.js",
    "../Externals/ThirdPartyIP/GlobalizeJS/globalize.min.js",
    "../Externals/ThirdPartyIP/GlobalizeJS/globalize.culture.en-US.js"
    ];

module.exports = projects.initProject(
    "visuals", // proj name
    __dirname, // project folder
    {
        deps: [
            require("../VisualsContracts/gulpProject"),
            require("../VisualsCommon/gulpProject"),
            require("../VisualsData/gulpProject")
        ], // dependencies
        staticFiles: [
            {
                source: externalsJs,
                dest: config.paths.VisualsDropScripts,
                join: "powerbi-visuals-externals.min.js"
            },
            {
                source: [
                    "../Typedefs/jquery/jquery.d.ts",
                    "../Typedefs/d3/d3.d.ts"
                ],
                dest: config.paths.VisualsDropScripts,
                join: "powerbi-externals.d.ts"
            },
        ],
        drop: [
            {
                source: ["./obj/*.js", "./obj/*.map"],
                dest: config.paths.VisualsDropScripts
            },
            {
                source: ["./obj/*.d.ts"],
                dest: config.paths.VisualsDropScripts,
                transform: utils.transform.rmRefs()
            },
            {
                source: ["./styles/*.css"],
                dest: config.paths.VisualsDropStyles
            },
            {
                source: ["./images/visuals.sprites.png", "./images/locationButton.svg"],
                dest: path.join(config.paths.VisualsDropStyles, "images")
            },
            {
                source: [
                    "../VisualsContracts/obj/VisualsContracts.d.ts",
                    "../VisualsCommon/obj/VisualsCommon.d.ts",
                    "../VisualsData/obj/VisualsData.d.ts",
                    "../Visuals/obj/Visuals.d.ts"
                ],
                join: "powerbi-visuals.d.ts",
                transform: utils.transform.rmRefs(),
                dest: config.paths.VisualsDropScripts,
            },
            {
                source: [
                    "../VisualsContracts/obj/VisualsContracts.nonmin.js",
                    "../VisualsCommon/obj/VisualsCommon.nonmin.js",
                    "../VisualsData/obj/VisualsData.nonmin.js",
                    "../Visuals/obj/Visuals.nonmin.js"
                ],
                join: "powerbi-visuals.nonmin.js",
                dest: config.paths.VisualsDropScripts,
            },
            {
                source: [
                    "../VisualsContracts/obj/VisualsContracts.js",
                    "../VisualsCommon/obj/VisualsCommon.js",
                    "../VisualsData/obj/VisualsData.js",
                    "../Visuals/obj/Visuals.js"
                ],
                join: "powerbi-visuals.js",
                dest: config.paths.VisualsDropScripts,
                produceMaps: true,
                inform: true
            },
            {
                source: [
                    "../VisualsContracts/obj/VisualsContracts.min.js",
                    "../VisualsCommon/obj/VisualsCommon.min.js",
                    "../VisualsData/obj/VisualsData.min.js",
                    "../Visuals/obj/Visuals.min.js"
                ],
                join: "powerbi-visuals.min.js",
                dest: config.paths.VisualsDropScripts,
                produceMaps: true,
                inform: true
            },
            {
                source: [
                    "../../../lib/powerbi-visuals-externals.min.js",
                    "../VisualsContracts/obj/VisualsContracts.min.js",
                    "../VisualsCommon/obj/VisualsCommon.min.js",
                    "../VisualsData/obj/VisualsData.min.js",
                    "../Visuals/obj/Visuals.min.js"
                ],
                join: "powerbi-visuals.all.min.js",
                dest: config.paths.VisualsDropScripts,
//                errorIfMissing: true
            },
            {
                source: [
                    "../../../lib/powerbi-visuals-externals.min.js",
                    "../VisualsContracts/obj/VisualsContracts.js",
                    "../VisualsCommon/obj/VisualsCommon.js",
                    "../VisualsData/obj/VisualsData.js",
                    "../Visuals/obj/Visuals.js"
                ],
                join: "powerbi-visuals.all.js",
                dest: config.paths.VisualsDropScripts,
            },
        ],
        tsc: {
            outFileName: 'Visuals'
        },
        less: {
            sourcePaths: [
                "../Externals/ThirdPartyIP/jqueryui/1.11.4/jquery-ui.min.css",
                "./styles/visuals.less"
            ],
            destinationPath: "./styles",
            destinationFileName: "visuals",
            modifyVars: {
                themeName: 'default'
            }
        },
        sprites: {
            sourcePaths: "images/sprite-src/*.png",
            destinationPath: "images",
            destinationFileName: "visuals",
        },
        watch: {
            includes: ["/styles/*.less", '/**/*.ts']
        }
    });
