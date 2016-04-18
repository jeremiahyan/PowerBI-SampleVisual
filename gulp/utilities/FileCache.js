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

var fs = require('fs'),
    through = require('through2'),
    path = require('path'),
    utils = require('../utils.js'),
    crypto = require('crypto'),
    consume = require('stream-consume'),
    Q = require('q');

function FileCache(name) {
    this.cacheFileLocation = name || 'gulp.cache';
    this.output = {};

    // load cache
    try {

        this._cache = fs.existsSync(this.cacheFileLocation) ?
            JSON.parse(fs.readFileSync(this.cacheFileLocation, 'utf8')) :
            {
                outputFiles: {}
            };

    } catch (err) {
        this._cache = {
            outputFiles: {}
        };
    }
}

FileCache.prototype.buildCache = function () {
    var me = this;
    me._cacheUpdate = {
        outputFiles: {}
    };

    return through.obj(function (file, enc, callback) {
        var cache = me.getInputFileModificationTimeCached(file.path),
//            actual = file.stat && file.stat.mtime.getTime();
            actual = sha1(file.contents);

        me._cacheUpdate[file.path] = actual;

        me._inputHasChanged = me._inputHasChanged || (!(cache && actual && cache === actual));

        this.push(file);
        return callback();
    });
};

FileCache.prototype.save = function () {
    var me = this;
    try {

        // add time for build artefacts
        Object.keys(this.output).forEach(function (filePath) {
            var time = me.getFileHash(filePath);
            if (time !== null) {
                me._cacheUpdate.outputFiles[filePath] = time;
            }
        });

        //flush
        fs.writeFileSync(this.cacheFileLocation, JSON.stringify(this._cacheUpdate));
    } catch (err) {
    }
};

FileCache.prototype.getFileHash = function (path) {
    if (!fs.existsSync(path)) {
        return null;
    }

    return sha1(fs.readFileSync(path, "utf8"));
};

FileCache.prototype.getInputFileModificationTimeCached = function (path) {
    return this._cache[path];
};

FileCache.prototype.getCachedOutputFileHash = function (path) {
    return this._cache.outputFiles[path];
};

FileCache.prototype.hasOutputFilesChanged = function () {
    var me = this;

    var isActual = Object.keys(this._cache.outputFiles).every(function (filePath) {

        var actual = me.getFileHash(filePath);
        var cache = me.getCachedOutputFileHash(filePath);

        return actual === cache;
    });

    return !isActual;
};

FileCache.prototype.registerOutputFiles = function (dest) {
    var me = this;

    return through.obj(function (file, enc, callback) {
        try {

            //TODO: investigate why the given file.path here is incorrect.
            var artifact = path.relative(file.base, file.path);
            if (utils.isAbsolute(artifact)) {
//                console.log(artifact);
                me.output[artifact] = "";
            } else {
                me.output[path.join(file.base, dest || "obj", artifact)] = "";
//                console.log("registerOutputFiles " + path.join(file.base, dest || "obj", artifact));
            }
        } catch (e) {
            console.log(e);
        }
        return callback(null, file);
    });

}

FileCache.prototype.isFileStreamChanged = function (opts) {
//    this.outputFiles =  opts.outputFiles;

    var deferred = Q.defer();
    var me = this;

    // validate output files
    var outputHasChanged = this.hasOutputFilesChanged();

    // validate input files
    var inputStream = opts.inputFiles;
    inputStream
        .on('end', function () {
            deferred.resolve(me._inputHasChanged || outputHasChanged);
        })
        .on('error', deferred.reject);
    // Ensure that the stream completes
    consume(inputStream.pipe(this.buildCache()));

    return deferred.promise;
};

function sha1(buf) {
	return crypto.createHash('sha1').update(buf).digest('hex');
}

module.exports = FileCache;
