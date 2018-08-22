(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
module.exports = asPromise;

/**
 * Callback as used by {@link util.asPromise}.
 * @typedef asPromiseCallback
 * @type {function}
 * @param {Error|null} error Error, if any
 * @param {...*} params Additional arguments
 * @returns {undefined}
 */

/**
 * Returns a promise from a node-style callback function.
 * @memberof util
 * @param {asPromiseCallback} fn Function to call
 * @param {*} ctx Function context
 * @param {...*} params Function arguments
 * @returns {Promise<*>} Promisified function
 */
function asPromise(fn, ctx/*, varargs */) {
    var params  = new Array(arguments.length - 1),
        offset  = 0,
        index   = 2,
        pending = true;
    while (index < arguments.length)
        params[offset++] = arguments[index++];
    return new Promise(function executor(resolve, reject) {
        params[offset] = function callback(err/*, varargs */) {
            if (pending) {
                pending = false;
                if (err)
                    reject(err);
                else {
                    var params = new Array(arguments.length - 1),
                        offset = 0;
                    while (offset < params.length)
                        params[offset++] = arguments[offset];
                    resolve.apply(null, params);
                }
            }
        };
        try {
            fn.apply(ctx || null, params);
        } catch (err) {
            if (pending) {
                pending = false;
                reject(err);
            }
        }
    });
}

},{}],2:[function(require,module,exports){
"use strict";

/**
 * A minimal base64 implementation for number arrays.
 * @memberof util
 * @namespace
 */
var base64 = exports;

/**
 * Calculates the byte length of a base64 encoded string.
 * @param {string} string Base64 encoded string
 * @returns {number} Byte length
 */
base64.length = function length(string) {
    var p = string.length;
    if (!p)
        return 0;
    var n = 0;
    while (--p % 4 > 1 && string.charAt(p) === "=")
        ++n;
    return Math.ceil(string.length * 3) / 4 - n;
};

// Base64 encoding table
var b64 = new Array(64);

// Base64 decoding table
var s64 = new Array(123);

// 65..90, 97..122, 48..57, 43, 47
for (var i = 0; i < 64;)
    s64[b64[i] = i < 26 ? i + 65 : i < 52 ? i + 71 : i < 62 ? i - 4 : i - 59 | 43] = i++;

/**
 * Encodes a buffer to a base64 encoded string.
 * @param {Uint8Array} buffer Source buffer
 * @param {number} start Source start
 * @param {number} end Source end
 * @returns {string} Base64 encoded string
 */
base64.encode = function encode(buffer, start, end) {
    var parts = null,
        chunk = [];
    var i = 0, // output index
        j = 0, // goto index
        t;     // temporary
    while (start < end) {
        var b = buffer[start++];
        switch (j) {
            case 0:
                chunk[i++] = b64[b >> 2];
                t = (b & 3) << 4;
                j = 1;
                break;
            case 1:
                chunk[i++] = b64[t | b >> 4];
                t = (b & 15) << 2;
                j = 2;
                break;
            case 2:
                chunk[i++] = b64[t | b >> 6];
                chunk[i++] = b64[b & 63];
                j = 0;
                break;
        }
        if (i > 8191) {
            (parts || (parts = [])).push(String.fromCharCode.apply(String, chunk));
            i = 0;
        }
    }
    if (j) {
        chunk[i++] = b64[t];
        chunk[i++] = 61;
        if (j === 1)
            chunk[i++] = 61;
    }
    if (parts) {
        if (i)
            parts.push(String.fromCharCode.apply(String, chunk.slice(0, i)));
        return parts.join("");
    }
    return String.fromCharCode.apply(String, chunk.slice(0, i));
};

var invalidEncoding = "invalid encoding";

/**
 * Decodes a base64 encoded string to a buffer.
 * @param {string} string Source string
 * @param {Uint8Array} buffer Destination buffer
 * @param {number} offset Destination offset
 * @returns {number} Number of bytes written
 * @throws {Error} If encoding is invalid
 */
base64.decode = function decode(string, buffer, offset) {
    var start = offset;
    var j = 0, // goto index
        t;     // temporary
    for (var i = 0; i < string.length;) {
        var c = string.charCodeAt(i++);
        if (c === 61 && j > 1)
            break;
        if ((c = s64[c]) === undefined)
            throw Error(invalidEncoding);
        switch (j) {
            case 0:
                t = c;
                j = 1;
                break;
            case 1:
                buffer[offset++] = t << 2 | (c & 48) >> 4;
                t = c;
                j = 2;
                break;
            case 2:
                buffer[offset++] = (t & 15) << 4 | (c & 60) >> 2;
                t = c;
                j = 3;
                break;
            case 3:
                buffer[offset++] = (t & 3) << 6 | c;
                j = 0;
                break;
        }
    }
    if (j === 1)
        throw Error(invalidEncoding);
    return offset - start;
};

/**
 * Tests if the specified string appears to be base64 encoded.
 * @param {string} string String to test
 * @returns {boolean} `true` if probably base64 encoded, otherwise false
 */
base64.test = function test(string) {
    return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(string);
};

},{}],3:[function(require,module,exports){
"use strict";
module.exports = codegen;

/**
 * Begins generating a function.
 * @memberof util
 * @param {string[]} functionParams Function parameter names
 * @param {string} [functionName] Function name if not anonymous
 * @returns {Codegen} Appender that appends code to the function's body
 */
function codegen(functionParams, functionName) {

    /* istanbul ignore if */
    if (typeof functionParams === "string") {
        functionName = functionParams;
        functionParams = undefined;
    }

    var body = [];

    /**
     * Appends code to the function's body or finishes generation.
     * @typedef Codegen
     * @type {function}
     * @param {string|Object.<string,*>} [formatStringOrScope] Format string or, to finish the function, an object of additional scope variables, if any
     * @param {...*} [formatParams] Format parameters
     * @returns {Codegen|Function} Itself or the generated function if finished
     * @throws {Error} If format parameter counts do not match
     */

    function Codegen(formatStringOrScope) {
        // note that explicit array handling below makes this ~50% faster

        // finish the function
        if (typeof formatStringOrScope !== "string") {
            var source = toString();
            if (codegen.verbose)
                console.log("codegen: " + source); // eslint-disable-line no-console
            source = "return " + source;
            if (formatStringOrScope) {
                var scopeKeys   = Object.keys(formatStringOrScope),
                    scopeParams = new Array(scopeKeys.length + 1),
                    scopeValues = new Array(scopeKeys.length),
                    scopeOffset = 0;
                while (scopeOffset < scopeKeys.length) {
                    scopeParams[scopeOffset] = scopeKeys[scopeOffset];
                    scopeValues[scopeOffset] = formatStringOrScope[scopeKeys[scopeOffset++]];
                }
                scopeParams[scopeOffset] = source;
                return Function.apply(null, scopeParams).apply(null, scopeValues); // eslint-disable-line no-new-func
            }
            return Function(source)(); // eslint-disable-line no-new-func
        }

        // otherwise append to body
        var formatParams = new Array(arguments.length - 1),
            formatOffset = 0;
        while (formatOffset < formatParams.length)
            formatParams[formatOffset] = arguments[++formatOffset];
        formatOffset = 0;
        formatStringOrScope = formatStringOrScope.replace(/%([%dfijs])/g, function replace($0, $1) {
            var value = formatParams[formatOffset++];
            switch ($1) {
                case "d": case "f": return String(Number(value));
                case "i": return String(Math.floor(value));
                case "j": return JSON.stringify(value);
                case "s": return String(value);
            }
            return "%";
        });
        if (formatOffset !== formatParams.length)
            throw Error("parameter count mismatch");
        body.push(formatStringOrScope);
        return Codegen;
    }

    function toString(functionNameOverride) {
        return "function " + (functionNameOverride || functionName || "") + "(" + (functionParams && functionParams.join(",") || "") + "){\n  " + body.join("\n  ") + "\n}";
    }

    Codegen.toString = toString;
    return Codegen;
}

/**
 * Begins generating a function.
 * @memberof util
 * @function codegen
 * @param {string} [functionName] Function name if not anonymous
 * @returns {Codegen} Appender that appends code to the function's body
 * @variation 2
 */

/**
 * When set to `true`, codegen will log generated code to console. Useful for debugging.
 * @name util.codegen.verbose
 * @type {boolean}
 */
codegen.verbose = false;

},{}],4:[function(require,module,exports){
"use strict";
module.exports = EventEmitter;

/**
 * Constructs a new event emitter instance.
 * @classdesc A minimal event emitter.
 * @memberof util
 * @constructor
 */
function EventEmitter() {

    /**
     * Registered listeners.
     * @type {Object.<string,*>}
     * @private
     */
    this._listeners = {};
}

/**
 * Registers an event listener.
 * @param {string} evt Event name
 * @param {function} fn Listener
 * @param {*} [ctx] Listener context
 * @returns {util.EventEmitter} `this`
 */
EventEmitter.prototype.on = function on(evt, fn, ctx) {
    (this._listeners[evt] || (this._listeners[evt] = [])).push({
        fn  : fn,
        ctx : ctx || this
    });
    return this;
};

/**
 * Removes an event listener or any matching listeners if arguments are omitted.
 * @param {string} [evt] Event name. Removes all listeners if omitted.
 * @param {function} [fn] Listener to remove. Removes all listeners of `evt` if omitted.
 * @returns {util.EventEmitter} `this`
 */
EventEmitter.prototype.off = function off(evt, fn) {
    if (evt === undefined)
        this._listeners = {};
    else {
        if (fn === undefined)
            this._listeners[evt] = [];
        else {
            var listeners = this._listeners[evt];
            for (var i = 0; i < listeners.length;)
                if (listeners[i].fn === fn)
                    listeners.splice(i, 1);
                else
                    ++i;
        }
    }
    return this;
};

/**
 * Emits an event by calling its listeners with the specified arguments.
 * @param {string} evt Event name
 * @param {...*} args Arguments
 * @returns {util.EventEmitter} `this`
 */
EventEmitter.prototype.emit = function emit(evt) {
    var listeners = this._listeners[evt];
    if (listeners) {
        var args = [],
            i = 1;
        for (; i < arguments.length;)
            args.push(arguments[i++]);
        for (i = 0; i < listeners.length;)
            listeners[i].fn.apply(listeners[i++].ctx, args);
    }
    return this;
};

},{}],5:[function(require,module,exports){
"use strict";
module.exports = fetch;

var asPromise = require("@protobufjs/aspromise"),
    inquire   = require("@protobufjs/inquire");

var fs = inquire("fs");

/**
 * Node-style callback as used by {@link util.fetch}.
 * @typedef FetchCallback
 * @type {function}
 * @param {?Error} error Error, if any, otherwise `null`
 * @param {string} [contents] File contents, if there hasn't been an error
 * @returns {undefined}
 */

/**
 * Options as used by {@link util.fetch}.
 * @typedef FetchOptions
 * @type {Object}
 * @property {boolean} [binary=false] Whether expecting a binary response
 * @property {boolean} [xhr=false] If `true`, forces the use of XMLHttpRequest
 */

/**
 * Fetches the contents of a file.
 * @memberof util
 * @param {string} filename File path or url
 * @param {FetchOptions} options Fetch options
 * @param {FetchCallback} callback Callback function
 * @returns {undefined}
 */
function fetch(filename, options, callback) {
    if (typeof options === "function") {
        callback = options;
        options = {};
    } else if (!options)
        options = {};

    if (!callback)
        return asPromise(fetch, this, filename, options); // eslint-disable-line no-invalid-this

    // if a node-like filesystem is present, try it first but fall back to XHR if nothing is found.
    if (!options.xhr && fs && fs.readFile)
        return fs.readFile(filename, function fetchReadFileCallback(err, contents) {
            return err && typeof XMLHttpRequest !== "undefined"
                ? fetch.xhr(filename, options, callback)
                : err
                ? callback(err)
                : callback(null, options.binary ? contents : contents.toString("utf8"));
        });

    // use the XHR version otherwise.
    return fetch.xhr(filename, options, callback);
}

/**
 * Fetches the contents of a file.
 * @name util.fetch
 * @function
 * @param {string} path File path or url
 * @param {FetchCallback} callback Callback function
 * @returns {undefined}
 * @variation 2
 */

/**
 * Fetches the contents of a file.
 * @name util.fetch
 * @function
 * @param {string} path File path or url
 * @param {FetchOptions} [options] Fetch options
 * @returns {Promise<string|Uint8Array>} Promise
 * @variation 3
 */

/**/
fetch.xhr = function fetch_xhr(filename, options, callback) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange /* works everywhere */ = function fetchOnReadyStateChange() {

        if (xhr.readyState !== 4)
            return undefined;

        // local cors security errors return status 0 / empty string, too. afaik this cannot be
        // reliably distinguished from an actually empty file for security reasons. feel free
        // to send a pull request if you are aware of a solution.
        if (xhr.status !== 0 && xhr.status !== 200)
            return callback(Error("status " + xhr.status));

        // if binary data is expected, make sure that some sort of array is returned, even if
        // ArrayBuffers are not supported. the binary string fallback, however, is unsafe.
        if (options.binary) {
            var buffer = xhr.response;
            if (!buffer) {
                buffer = [];
                for (var i = 0; i < xhr.responseText.length; ++i)
                    buffer.push(xhr.responseText.charCodeAt(i) & 255);
            }
            return callback(null, typeof Uint8Array !== "undefined" ? new Uint8Array(buffer) : buffer);
        }
        return callback(null, xhr.responseText);
    };

    if (options.binary) {
        // ref: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Sending_and_Receiving_Binary_Data#Receiving_binary_data_in_older_browsers
        if ("overrideMimeType" in xhr)
            xhr.overrideMimeType("text/plain; charset=x-user-defined");
        xhr.responseType = "arraybuffer";
    }

    xhr.open("GET", filename);
    xhr.send();
};

},{"@protobufjs/aspromise":1,"@protobufjs/inquire":7}],6:[function(require,module,exports){
"use strict";

module.exports = factory(factory);

/**
 * Reads / writes floats / doubles from / to buffers.
 * @name util.float
 * @namespace
 */

/**
 * Writes a 32 bit float to a buffer using little endian byte order.
 * @name util.float.writeFloatLE
 * @function
 * @param {number} val Value to write
 * @param {Uint8Array} buf Target buffer
 * @param {number} pos Target buffer offset
 * @returns {undefined}
 */

/**
 * Writes a 32 bit float to a buffer using big endian byte order.
 * @name util.float.writeFloatBE
 * @function
 * @param {number} val Value to write
 * @param {Uint8Array} buf Target buffer
 * @param {number} pos Target buffer offset
 * @returns {undefined}
 */

/**
 * Reads a 32 bit float from a buffer using little endian byte order.
 * @name util.float.readFloatLE
 * @function
 * @param {Uint8Array} buf Source buffer
 * @param {number} pos Source buffer offset
 * @returns {number} Value read
 */

/**
 * Reads a 32 bit float from a buffer using big endian byte order.
 * @name util.float.readFloatBE
 * @function
 * @param {Uint8Array} buf Source buffer
 * @param {number} pos Source buffer offset
 * @returns {number} Value read
 */

/**
 * Writes a 64 bit double to a buffer using little endian byte order.
 * @name util.float.writeDoubleLE
 * @function
 * @param {number} val Value to write
 * @param {Uint8Array} buf Target buffer
 * @param {number} pos Target buffer offset
 * @returns {undefined}
 */

/**
 * Writes a 64 bit double to a buffer using big endian byte order.
 * @name util.float.writeDoubleBE
 * @function
 * @param {number} val Value to write
 * @param {Uint8Array} buf Target buffer
 * @param {number} pos Target buffer offset
 * @returns {undefined}
 */

/**
 * Reads a 64 bit double from a buffer using little endian byte order.
 * @name util.float.readDoubleLE
 * @function
 * @param {Uint8Array} buf Source buffer
 * @param {number} pos Source buffer offset
 * @returns {number} Value read
 */

/**
 * Reads a 64 bit double from a buffer using big endian byte order.
 * @name util.float.readDoubleBE
 * @function
 * @param {Uint8Array} buf Source buffer
 * @param {number} pos Source buffer offset
 * @returns {number} Value read
 */

// Factory function for the purpose of node-based testing in modified global environments
function factory(exports) {

    // float: typed array
    if (typeof Float32Array !== "undefined") (function() {

        var f32 = new Float32Array([ -0 ]),
            f8b = new Uint8Array(f32.buffer),
            le  = f8b[3] === 128;

        function writeFloat_f32_cpy(val, buf, pos) {
            f32[0] = val;
            buf[pos    ] = f8b[0];
            buf[pos + 1] = f8b[1];
            buf[pos + 2] = f8b[2];
            buf[pos + 3] = f8b[3];
        }

        function writeFloat_f32_rev(val, buf, pos) {
            f32[0] = val;
            buf[pos    ] = f8b[3];
            buf[pos + 1] = f8b[2];
            buf[pos + 2] = f8b[1];
            buf[pos + 3] = f8b[0];
        }

        /* istanbul ignore next */
        exports.writeFloatLE = le ? writeFloat_f32_cpy : writeFloat_f32_rev;
        /* istanbul ignore next */
        exports.writeFloatBE = le ? writeFloat_f32_rev : writeFloat_f32_cpy;

        function readFloat_f32_cpy(buf, pos) {
            f8b[0] = buf[pos    ];
            f8b[1] = buf[pos + 1];
            f8b[2] = buf[pos + 2];
            f8b[3] = buf[pos + 3];
            return f32[0];
        }

        function readFloat_f32_rev(buf, pos) {
            f8b[3] = buf[pos    ];
            f8b[2] = buf[pos + 1];
            f8b[1] = buf[pos + 2];
            f8b[0] = buf[pos + 3];
            return f32[0];
        }

        /* istanbul ignore next */
        exports.readFloatLE = le ? readFloat_f32_cpy : readFloat_f32_rev;
        /* istanbul ignore next */
        exports.readFloatBE = le ? readFloat_f32_rev : readFloat_f32_cpy;

    // float: ieee754
    })(); else (function() {

        function writeFloat_ieee754(writeUint, val, buf, pos) {
            var sign = val < 0 ? 1 : 0;
            if (sign)
                val = -val;
            if (val === 0)
                writeUint(1 / val > 0 ? /* positive */ 0 : /* negative 0 */ 2147483648, buf, pos);
            else if (isNaN(val))
                writeUint(2143289344, buf, pos);
            else if (val > 3.4028234663852886e+38) // +-Infinity
                writeUint((sign << 31 | 2139095040) >>> 0, buf, pos);
            else if (val < 1.1754943508222875e-38) // denormal
                writeUint((sign << 31 | Math.round(val / 1.401298464324817e-45)) >>> 0, buf, pos);
            else {
                var exponent = Math.floor(Math.log(val) / Math.LN2),
                    mantissa = Math.round(val * Math.pow(2, -exponent) * 8388608) & 8388607;
                writeUint((sign << 31 | exponent + 127 << 23 | mantissa) >>> 0, buf, pos);
            }
        }

        exports.writeFloatLE = writeFloat_ieee754.bind(null, writeUintLE);
        exports.writeFloatBE = writeFloat_ieee754.bind(null, writeUintBE);

        function readFloat_ieee754(readUint, buf, pos) {
            var uint = readUint(buf, pos),
                sign = (uint >> 31) * 2 + 1,
                exponent = uint >>> 23 & 255,
                mantissa = uint & 8388607;
            return exponent === 255
                ? mantissa
                ? NaN
                : sign * Infinity
                : exponent === 0 // denormal
                ? sign * 1.401298464324817e-45 * mantissa
                : sign * Math.pow(2, exponent - 150) * (mantissa + 8388608);
        }

        exports.readFloatLE = readFloat_ieee754.bind(null, readUintLE);
        exports.readFloatBE = readFloat_ieee754.bind(null, readUintBE);

    })();

    // double: typed array
    if (typeof Float64Array !== "undefined") (function() {

        var f64 = new Float64Array([-0]),
            f8b = new Uint8Array(f64.buffer),
            le  = f8b[7] === 128;

        function writeDouble_f64_cpy(val, buf, pos) {
            f64[0] = val;
            buf[pos    ] = f8b[0];
            buf[pos + 1] = f8b[1];
            buf[pos + 2] = f8b[2];
            buf[pos + 3] = f8b[3];
            buf[pos + 4] = f8b[4];
            buf[pos + 5] = f8b[5];
            buf[pos + 6] = f8b[6];
            buf[pos + 7] = f8b[7];
        }

        function writeDouble_f64_rev(val, buf, pos) {
            f64[0] = val;
            buf[pos    ] = f8b[7];
            buf[pos + 1] = f8b[6];
            buf[pos + 2] = f8b[5];
            buf[pos + 3] = f8b[4];
            buf[pos + 4] = f8b[3];
            buf[pos + 5] = f8b[2];
            buf[pos + 6] = f8b[1];
            buf[pos + 7] = f8b[0];
        }

        /* istanbul ignore next */
        exports.writeDoubleLE = le ? writeDouble_f64_cpy : writeDouble_f64_rev;
        /* istanbul ignore next */
        exports.writeDoubleBE = le ? writeDouble_f64_rev : writeDouble_f64_cpy;

        function readDouble_f64_cpy(buf, pos) {
            f8b[0] = buf[pos    ];
            f8b[1] = buf[pos + 1];
            f8b[2] = buf[pos + 2];
            f8b[3] = buf[pos + 3];
            f8b[4] = buf[pos + 4];
            f8b[5] = buf[pos + 5];
            f8b[6] = buf[pos + 6];
            f8b[7] = buf[pos + 7];
            return f64[0];
        }

        function readDouble_f64_rev(buf, pos) {
            f8b[7] = buf[pos    ];
            f8b[6] = buf[pos + 1];
            f8b[5] = buf[pos + 2];
            f8b[4] = buf[pos + 3];
            f8b[3] = buf[pos + 4];
            f8b[2] = buf[pos + 5];
            f8b[1] = buf[pos + 6];
            f8b[0] = buf[pos + 7];
            return f64[0];
        }

        /* istanbul ignore next */
        exports.readDoubleLE = le ? readDouble_f64_cpy : readDouble_f64_rev;
        /* istanbul ignore next */
        exports.readDoubleBE = le ? readDouble_f64_rev : readDouble_f64_cpy;

    // double: ieee754
    })(); else (function() {

        function writeDouble_ieee754(writeUint, off0, off1, val, buf, pos) {
            var sign = val < 0 ? 1 : 0;
            if (sign)
                val = -val;
            if (val === 0) {
                writeUint(0, buf, pos + off0);
                writeUint(1 / val > 0 ? /* positive */ 0 : /* negative 0 */ 2147483648, buf, pos + off1);
            } else if (isNaN(val)) {
                writeUint(0, buf, pos + off0);
                writeUint(2146959360, buf, pos + off1);
            } else if (val > 1.7976931348623157e+308) { // +-Infinity
                writeUint(0, buf, pos + off0);
                writeUint((sign << 31 | 2146435072) >>> 0, buf, pos + off1);
            } else {
                var mantissa;
                if (val < 2.2250738585072014e-308) { // denormal
                    mantissa = val / 5e-324;
                    writeUint(mantissa >>> 0, buf, pos + off0);
                    writeUint((sign << 31 | mantissa / 4294967296) >>> 0, buf, pos + off1);
                } else {
                    var exponent = Math.floor(Math.log(val) / Math.LN2);
                    if (exponent === 1024)
                        exponent = 1023;
                    mantissa = val * Math.pow(2, -exponent);
                    writeUint(mantissa * 4503599627370496 >>> 0, buf, pos + off0);
                    writeUint((sign << 31 | exponent + 1023 << 20 | mantissa * 1048576 & 1048575) >>> 0, buf, pos + off1);
                }
            }
        }

        exports.writeDoubleLE = writeDouble_ieee754.bind(null, writeUintLE, 0, 4);
        exports.writeDoubleBE = writeDouble_ieee754.bind(null, writeUintBE, 4, 0);

        function readDouble_ieee754(readUint, off0, off1, buf, pos) {
            var lo = readUint(buf, pos + off0),
                hi = readUint(buf, pos + off1);
            var sign = (hi >> 31) * 2 + 1,
                exponent = hi >>> 20 & 2047,
                mantissa = 4294967296 * (hi & 1048575) + lo;
            return exponent === 2047
                ? mantissa
                ? NaN
                : sign * Infinity
                : exponent === 0 // denormal
                ? sign * 5e-324 * mantissa
                : sign * Math.pow(2, exponent - 1075) * (mantissa + 4503599627370496);
        }

        exports.readDoubleLE = readDouble_ieee754.bind(null, readUintLE, 0, 4);
        exports.readDoubleBE = readDouble_ieee754.bind(null, readUintBE, 4, 0);

    })();

    return exports;
}

// uint helpers

function writeUintLE(val, buf, pos) {
    buf[pos    ] =  val        & 255;
    buf[pos + 1] =  val >>> 8  & 255;
    buf[pos + 2] =  val >>> 16 & 255;
    buf[pos + 3] =  val >>> 24;
}

function writeUintBE(val, buf, pos) {
    buf[pos    ] =  val >>> 24;
    buf[pos + 1] =  val >>> 16 & 255;
    buf[pos + 2] =  val >>> 8  & 255;
    buf[pos + 3] =  val        & 255;
}

function readUintLE(buf, pos) {
    return (buf[pos    ]
          | buf[pos + 1] << 8
          | buf[pos + 2] << 16
          | buf[pos + 3] << 24) >>> 0;
}

function readUintBE(buf, pos) {
    return (buf[pos    ] << 24
          | buf[pos + 1] << 16
          | buf[pos + 2] << 8
          | buf[pos + 3]) >>> 0;
}

},{}],7:[function(require,module,exports){
"use strict";
module.exports = inquire;

/**
 * Requires a module only if available.
 * @memberof util
 * @param {string} moduleName Module to require
 * @returns {?Object} Required module if available and not empty, otherwise `null`
 */
function inquire(moduleName) {
    try {
        var mod = eval("quire".replace(/^/,"re"))(moduleName); // eslint-disable-line no-eval
        if (mod && (mod.length || Object.keys(mod).length))
            return mod;
    } catch (e) {} // eslint-disable-line no-empty
    return null;
}

},{}],8:[function(require,module,exports){
"use strict";

/**
 * A minimal path module to resolve Unix, Windows and URL paths alike.
 * @memberof util
 * @namespace
 */
var path = exports;

var isAbsolute =
/**
 * Tests if the specified path is absolute.
 * @param {string} path Path to test
 * @returns {boolean} `true` if path is absolute
 */
path.isAbsolute = function isAbsolute(path) {
    return /^(?:\/|\w+:)/.test(path);
};

var normalize =
/**
 * Normalizes the specified path.
 * @param {string} path Path to normalize
 * @returns {string} Normalized path
 */
path.normalize = function normalize(path) {
    path = path.replace(/\\/g, "/")
               .replace(/\/{2,}/g, "/");
    var parts    = path.split("/"),
        absolute = isAbsolute(path),
        prefix   = "";
    if (absolute)
        prefix = parts.shift() + "/";
    for (var i = 0; i < parts.length;) {
        if (parts[i] === "..") {
            if (i > 0 && parts[i - 1] !== "..")
                parts.splice(--i, 2);
            else if (absolute)
                parts.splice(i, 1);
            else
                ++i;
        } else if (parts[i] === ".")
            parts.splice(i, 1);
        else
            ++i;
    }
    return prefix + parts.join("/");
};

/**
 * Resolves the specified include path against the specified origin path.
 * @param {string} originPath Path to the origin file
 * @param {string} includePath Include path relative to origin path
 * @param {boolean} [alreadyNormalized=false] `true` if both paths are already known to be normalized
 * @returns {string} Path to the include file
 */
path.resolve = function resolve(originPath, includePath, alreadyNormalized) {
    if (!alreadyNormalized)
        includePath = normalize(includePath);
    if (isAbsolute(includePath))
        return includePath;
    if (!alreadyNormalized)
        originPath = normalize(originPath);
    return (originPath = originPath.replace(/(?:\/|^)[^/]+$/, "")).length ? normalize(originPath + "/" + includePath) : includePath;
};

},{}],9:[function(require,module,exports){
"use strict";
module.exports = pool;

/**
 * An allocator as used by {@link util.pool}.
 * @typedef PoolAllocator
 * @type {function}
 * @param {number} size Buffer size
 * @returns {Uint8Array} Buffer
 */

/**
 * A slicer as used by {@link util.pool}.
 * @typedef PoolSlicer
 * @type {function}
 * @param {number} start Start offset
 * @param {number} end End offset
 * @returns {Uint8Array} Buffer slice
 * @this {Uint8Array}
 */

/**
 * A general purpose buffer pool.
 * @memberof util
 * @function
 * @param {PoolAllocator} alloc Allocator
 * @param {PoolSlicer} slice Slicer
 * @param {number} [size=8192] Slab size
 * @returns {PoolAllocator} Pooled allocator
 */
function pool(alloc, slice, size) {
    var SIZE   = size || 8192;
    var MAX    = SIZE >>> 1;
    var slab   = null;
    var offset = SIZE;
    return function pool_alloc(size) {
        if (size < 1 || size > MAX)
            return alloc(size);
        if (offset + size > SIZE) {
            slab = alloc(SIZE);
            offset = 0;
        }
        var buf = slice.call(slab, offset, offset += size);
        if (offset & 7) // align to 32 bit
            offset = (offset | 7) + 1;
        return buf;
    };
}

},{}],10:[function(require,module,exports){
"use strict";

/**
 * A minimal UTF8 implementation for number arrays.
 * @memberof util
 * @namespace
 */
var utf8 = exports;

/**
 * Calculates the UTF8 byte length of a string.
 * @param {string} string String
 * @returns {number} Byte length
 */
utf8.length = function utf8_length(string) {
    var len = 0,
        c = 0;
    for (var i = 0; i < string.length; ++i) {
        c = string.charCodeAt(i);
        if (c < 128)
            len += 1;
        else if (c < 2048)
            len += 2;
        else if ((c & 0xFC00) === 0xD800 && (string.charCodeAt(i + 1) & 0xFC00) === 0xDC00) {
            ++i;
            len += 4;
        } else
            len += 3;
    }
    return len;
};

/**
 * Reads UTF8 bytes as a string.
 * @param {Uint8Array} buffer Source buffer
 * @param {number} start Source start
 * @param {number} end Source end
 * @returns {string} String read
 */
utf8.read = function utf8_read(buffer, start, end) {
    var len = end - start;
    if (len < 1)
        return "";
    var parts = null,
        chunk = [],
        i = 0, // char offset
        t;     // temporary
    while (start < end) {
        t = buffer[start++];
        if (t < 128)
            chunk[i++] = t;
        else if (t > 191 && t < 224)
            chunk[i++] = (t & 31) << 6 | buffer[start++] & 63;
        else if (t > 239 && t < 365) {
            t = ((t & 7) << 18 | (buffer[start++] & 63) << 12 | (buffer[start++] & 63) << 6 | buffer[start++] & 63) - 0x10000;
            chunk[i++] = 0xD800 + (t >> 10);
            chunk[i++] = 0xDC00 + (t & 1023);
        } else
            chunk[i++] = (t & 15) << 12 | (buffer[start++] & 63) << 6 | buffer[start++] & 63;
        if (i > 8191) {
            (parts || (parts = [])).push(String.fromCharCode.apply(String, chunk));
            i = 0;
        }
    }
    if (parts) {
        if (i)
            parts.push(String.fromCharCode.apply(String, chunk.slice(0, i)));
        return parts.join("");
    }
    return String.fromCharCode.apply(String, chunk.slice(0, i));
};

/**
 * Writes a string as UTF8 bytes.
 * @param {string} string Source string
 * @param {Uint8Array} buffer Destination buffer
 * @param {number} offset Destination offset
 * @returns {number} Bytes written
 */
utf8.write = function utf8_write(string, buffer, offset) {
    var start = offset,
        c1, // character 1
        c2; // character 2
    for (var i = 0; i < string.length; ++i) {
        c1 = string.charCodeAt(i);
        if (c1 < 128) {
            buffer[offset++] = c1;
        } else if (c1 < 2048) {
            buffer[offset++] = c1 >> 6       | 192;
            buffer[offset++] = c1       & 63 | 128;
        } else if ((c1 & 0xFC00) === 0xD800 && ((c2 = string.charCodeAt(i + 1)) & 0xFC00) === 0xDC00) {
            c1 = 0x10000 + ((c1 & 0x03FF) << 10) + (c2 & 0x03FF);
            ++i;
            buffer[offset++] = c1 >> 18      | 240;
            buffer[offset++] = c1 >> 12 & 63 | 128;
            buffer[offset++] = c1 >> 6  & 63 | 128;
            buffer[offset++] = c1       & 63 | 128;
        } else {
            buffer[offset++] = c1 >> 12      | 224;
            buffer[offset++] = c1 >> 6  & 63 | 128;
            buffer[offset++] = c1       & 63 | 128;
        }
    }
    return offset - start;
};

},{}],11:[function(require,module,exports){
// light library entry point.

"use strict";
module.exports = require("./src/index-light");
},{"./src/index-light":17}],12:[function(require,module,exports){
"use strict";
/**
 * Runtime message from/to plain object converters.
 * @namespace
 */
var converter = exports;

var Enum = require("./enum"),
    util = require("./util");

/**
 * Generates a partial value fromObject conveter.
 * @param {Codegen} gen Codegen instance
 * @param {Field} field Reflected field
 * @param {number} fieldIndex Field index
 * @param {string} prop Property reference
 * @returns {Codegen} Codegen instance
 * @ignore
 */
function genValuePartial_fromObject(gen, field, fieldIndex, prop) {
    /* eslint-disable no-unexpected-multiline, block-scoped-var, no-redeclare */
    if (field.resolvedType) {
        if (field.resolvedType instanceof Enum) { gen
            ("switch(d%s){", prop);
            for (var values = field.resolvedType.values, keys = Object.keys(values), i = 0; i < keys.length; ++i) {
                if (field.repeated && values[keys[i]] === field.typeDefault) gen
                ("default:");
                gen
                ("case%j:", keys[i])
                ("case %i:", values[keys[i]])
                    ("m%s=%j", prop, values[keys[i]])
                    ("break");
            } gen
            ("}");
        } else gen
            ("if(typeof d%s!==\"object\")", prop)
                ("throw TypeError(%j)", field.fullName + ": object expected")
            ("m%s=types[%i].fromObject(d%s)", prop, fieldIndex, prop);
    } else {
        var isUnsigned = false;
        switch (field.type) {
            case "double":
            case "float": gen
                ("m%s=Number(d%s)", prop, prop); // also catches "NaN", "Infinity"
                break;
            case "uint32":
            case "fixed32": gen
                ("m%s=d%s>>>0", prop, prop);
                break;
            case "int32":
            case "sint32":
            case "sfixed32": gen
                ("m%s=d%s|0", prop, prop);
                break;
            case "uint64":
                isUnsigned = true;
                // eslint-disable-line no-fallthrough
            case "int64":
            case "sint64":
            case "fixed64":
            case "sfixed64": gen
                ("if(util.Long)")
                    ("(m%s=util.Long.fromValue(d%s)).unsigned=%j", prop, prop, isUnsigned)
                ("else if(typeof d%s===\"string\")", prop)
                    ("m%s=parseInt(d%s,10)", prop, prop)
                ("else if(typeof d%s===\"number\")", prop)
                    ("m%s=d%s", prop, prop)
                ("else if(typeof d%s===\"object\")", prop)
                    ("m%s=new util.LongBits(d%s.low>>>0,d%s.high>>>0).toNumber(%s)", prop, prop, prop, isUnsigned ? "true" : "");
                break;
            case "bytes": gen
                ("if(typeof d%s===\"string\")", prop)
                    ("util.base64.decode(d%s,m%s=util.newBuffer(util.base64.length(d%s)),0)", prop, prop, prop)
                ("else if(d%s.length)", prop)
                    ("m%s=d%s", prop, prop);
                break;
            case "string": gen
                ("m%s=String(d%s)", prop, prop);
                break;
            case "bool": gen
                ("m%s=Boolean(d%s)", prop, prop);
                break;
            /* default: gen
                ("m%s=d%s", prop, prop);
                break; */
        }
    }
    return gen;
    /* eslint-enable no-unexpected-multiline, block-scoped-var, no-redeclare */
}

/**
 * Generates a plain object to runtime message converter specific to the specified message type.
 * @param {Type} mtype Message type
 * @returns {Codegen} Codegen instance
 */
converter.fromObject = function fromObject(mtype) {
    /* eslint-disable no-unexpected-multiline, block-scoped-var, no-redeclare */
    var fields = mtype.fieldsArray;
    var gen = util.codegen(["d"], mtype.name + "$fromObject")
    ("if(d instanceof this.ctor)")
        ("return d");
    if (!fields.length) return gen
    ("return new this.ctor");
    gen
    ("var m=new this.ctor");
    for (var i = 0; i < fields.length; ++i) {
        var field  = fields[i].resolve(),
            prop   = util.safeProp(field.name);

        // Map fields
        if (field.map) { gen
    ("if(d%s){", prop)
        ("if(typeof d%s!==\"object\")", prop)
            ("throw TypeError(%j)", field.fullName + ": object expected")
        ("m%s={}", prop)
        ("for(var ks=Object.keys(d%s),i=0;i<ks.length;++i){", prop);
            genValuePartial_fromObject(gen, field, /* not sorted */ i, prop + "[ks[i]]")
        ("}")
    ("}");

        // Repeated fields
        } else if (field.repeated) { gen
    ("if(d%s){", prop)
        ("if(!Array.isArray(d%s))", prop)
            ("throw TypeError(%j)", field.fullName + ": array expected")
        ("m%s=[]", prop)
        ("for(var i=0;i<d%s.length;++i){", prop);
            genValuePartial_fromObject(gen, field, /* not sorted */ i, prop + "[i]")
        ("}")
    ("}");

        // Non-repeated fields
        } else {
            if (!(field.resolvedType instanceof Enum)) gen // no need to test for null/undefined if an enum (uses switch)
    ("if(d%s!=null){", prop); // !== undefined && !== null
        genValuePartial_fromObject(gen, field, /* not sorted */ i, prop);
            if (!(field.resolvedType instanceof Enum)) gen
    ("}");
        }
    } return gen
    ("return m");
    /* eslint-enable no-unexpected-multiline, block-scoped-var, no-redeclare */
};

/**
 * Generates a partial value toObject converter.
 * @param {Codegen} gen Codegen instance
 * @param {Field} field Reflected field
 * @param {number} fieldIndex Field index
 * @param {string} prop Property reference
 * @returns {Codegen} Codegen instance
 * @ignore
 */
function genValuePartial_toObject(gen, field, fieldIndex, prop) {
    /* eslint-disable no-unexpected-multiline, block-scoped-var, no-redeclare */
    if (field.resolvedType) {
        if (field.resolvedType instanceof Enum) gen
            ("d%s=o.enums===String?types[%i].values[m%s]:m%s", prop, fieldIndex, prop, prop);
        else gen
            ("d%s=types[%i].toObject(m%s,o)", prop, fieldIndex, prop);
    } else {
        var isUnsigned = false;
        switch (field.type) {
            case "double":
            case "float": gen
            ("d%s=o.json&&!isFinite(m%s)?String(m%s):m%s", prop, prop, prop, prop);
                break;
            case "uint64":
                isUnsigned = true;
                // eslint-disable-line no-fallthrough
            case "int64":
            case "sint64":
            case "fixed64":
            case "sfixed64": gen
            ("if(typeof m%s===\"number\")", prop)
                ("d%s=o.longs===String?String(m%s):m%s", prop, prop, prop)
            ("else") // Long-like
                ("d%s=o.longs===String?util.Long.prototype.toString.call(m%s):o.longs===Number?new util.LongBits(m%s.low>>>0,m%s.high>>>0).toNumber(%s):m%s", prop, prop, prop, prop, isUnsigned ? "true": "", prop);
                break;
            case "bytes": gen
            ("d%s=o.bytes===String?util.base64.encode(m%s,0,m%s.length):o.bytes===Array?Array.prototype.slice.call(m%s):m%s", prop, prop, prop, prop, prop);
                break;
            default: gen
            ("d%s=m%s", prop, prop);
                break;
        }
    }
    return gen;
    /* eslint-enable no-unexpected-multiline, block-scoped-var, no-redeclare */
}

/**
 * Generates a runtime message to plain object converter specific to the specified message type.
 * @param {Type} mtype Message type
 * @returns {Codegen} Codegen instance
 */
converter.toObject = function toObject(mtype) {
    /* eslint-disable no-unexpected-multiline, block-scoped-var, no-redeclare */
    var fields = mtype.fieldsArray.slice().sort(util.compareFieldsById);
    if (!fields.length)
        return util.codegen()("return {}");
    var gen = util.codegen(["m", "o"], mtype.name + "$toObject")
    ("if(!o)")
        ("o={}")
    ("var d={}");

    var repeatedFields = [],
        mapFields = [],
        normalFields = [],
        i = 0;
    for (; i < fields.length; ++i)
        if (!fields[i].partOf)
            ( fields[i].resolve().repeated ? repeatedFields
            : fields[i].map ? mapFields
            : normalFields).push(fields[i]);

    if (repeatedFields.length) { gen
    ("if(o.arrays||o.defaults){");
        for (i = 0; i < repeatedFields.length; ++i) gen
        ("d%s=[]", util.safeProp(repeatedFields[i].name));
        gen
    ("}");
    }

    if (mapFields.length) { gen
    ("if(o.objects||o.defaults){");
        for (i = 0; i < mapFields.length; ++i) gen
        ("d%s={}", util.safeProp(mapFields[i].name));
        gen
    ("}");
    }

    if (normalFields.length) { gen
    ("if(o.defaults){");
        for (i = 0; i < normalFields.length; ++i) {
            var field = normalFields[i],
                prop  = util.safeProp(field.name);
            if (field.resolvedType instanceof Enum) gen
        ("d%s=o.enums===String?%j:%j", prop, field.resolvedType.valuesById[field.typeDefault], field.typeDefault);
            else if (field.long) gen
        ("if(util.Long){")
            ("var n=new util.Long(%i,%i,%j)", field.typeDefault.low, field.typeDefault.high, field.typeDefault.unsigned)
            ("d%s=o.longs===String?n.toString():o.longs===Number?n.toNumber():n", prop)
        ("}else")
            ("d%s=o.longs===String?%j:%i", prop, field.typeDefault.toString(), field.typeDefault.toNumber());
            else if (field.bytes) {
                var arrayDefault = "[" + Array.prototype.slice.call(field.typeDefault).join(",") + "]";
                gen
        ("if(o.bytes===String)d%s=%j", prop, String.fromCharCode.apply(String, field.typeDefault))
        ("else{")
            ("d%s=%s", prop, arrayDefault)
            ("if(o.bytes!==Array)d%s=util.newBuffer(d%s)", prop, prop)
        ("}");
            } else gen
        ("d%s=%j", prop, field.typeDefault); // also messages (=null)
        } gen
    ("}");
    }
    var hasKs2 = false;
    for (i = 0; i < fields.length; ++i) {
        var field = fields[i],
            index = mtype._fieldsArray.indexOf(field),
            prop  = util.safeProp(field.name);
        if (field.map) {
            if (!hasKs2) { hasKs2 = true; gen
    ("var ks2");
            } gen
    ("if(m%s&&(ks2=Object.keys(m%s)).length){", prop, prop)
        ("d%s={}", prop)
        ("for(var j=0;j<ks2.length;++j){");
            genValuePartial_toObject(gen, field, /* sorted */ index, prop + "[ks2[j]]")
        ("}");
        } else if (field.repeated) { gen
    ("if(m%s&&m%s.length){", prop, prop)
        ("d%s=[]", prop)
        ("for(var j=0;j<m%s.length;++j){", prop);
            genValuePartial_toObject(gen, field, /* sorted */ index, prop + "[j]")
        ("}");
        } else { gen
    ("if(m%s!=null&&m.hasOwnProperty(%j)){", prop, field.name); // !== undefined && !== null
        genValuePartial_toObject(gen, field, /* sorted */ index, prop);
        if (field.partOf) gen
        ("if(o.oneofs)")
            ("d%s=%j", util.safeProp(field.partOf.name), field.name);
        }
        gen
    ("}");
    }
    return gen
    ("return d");
    /* eslint-enable no-unexpected-multiline, block-scoped-var, no-redeclare */
};

},{"./enum":15,"./util":34}],13:[function(require,module,exports){
"use strict";
module.exports = decoder;

var Enum    = require("./enum"),
    types   = require("./types"),
    util    = require("./util");

function missing(field) {
    return "missing required '" + field.name + "'";
}

/**
 * Generates a decoder specific to the specified message type.
 * @param {Type} mtype Message type
 * @returns {Codegen} Codegen instance
 */
function decoder(mtype) {
    /* eslint-disable no-unexpected-multiline */
    var gen = util.codegen(["r", "l"], mtype.name + "$decode")
    ("if(!(r instanceof Reader))")
        ("r=Reader.create(r)")
    ("var c=l===undefined?r.len:r.pos+l,m=new this.ctor" + (mtype.fieldsArray.filter(function(field) { return field.map; }).length ? ",k" : ""))
    ("while(r.pos<c){")
        ("var t=r.uint32()");
    if (mtype.group) gen
        ("if((t&7)===4)")
            ("break");
    gen
        ("switch(t>>>3){");

    var i = 0;
    for (; i < /* initializes */ mtype.fieldsArray.length; ++i) {
        var field = mtype._fieldsArray[i].resolve(),
            type  = field.resolvedType instanceof Enum ? "int32" : field.type,
            ref   = "m" + util.safeProp(field.name); gen
            ("case %i:", field.id);

        // Map fields
        if (field.map) { gen
                ("r.skip().pos++") // assumes id 1 + key wireType
                ("if(%s===util.emptyObject)", ref)
                    ("%s={}", ref)
                ("k=r.%s()", field.keyType)
                ("r.pos++"); // assumes id 2 + value wireType
            if (types.long[field.keyType] !== undefined) {
                if (types.basic[type] === undefined) gen
                ("%s[typeof k===\"object\"?util.longToHash(k):k]=types[%i].decode(r,r.uint32())", ref, i); // can't be groups
                else gen
                ("%s[typeof k===\"object\"?util.longToHash(k):k]=r.%s()", ref, type);
            } else {
                if (types.basic[type] === undefined) gen
                ("%s[k]=types[%i].decode(r,r.uint32())", ref, i); // can't be groups
                else gen
                ("%s[k]=r.%s()", ref, type);
            }

        // Repeated fields
        } else if (field.repeated) { gen

                ("if(!(%s&&%s.length))", ref, ref)
                    ("%s=[]", ref);

            // Packable (always check for forward and backward compatiblity)
            if (types.packed[type] !== undefined) gen
                ("if((t&7)===2){")
                    ("var c2=r.uint32()+r.pos")
                    ("while(r.pos<c2)")
                        ("%s.push(r.%s())", ref, type)
                ("}else");

            // Non-packed
            if (types.basic[type] === undefined) gen(field.resolvedType.group
                    ? "%s.push(types[%i].decode(r))"
                    : "%s.push(types[%i].decode(r,r.uint32()))", ref, i);
            else gen
                    ("%s.push(r.%s())", ref, type);

        // Non-repeated
        } else if (types.basic[type] === undefined) gen(field.resolvedType.group
                ? "%s=types[%i].decode(r)"
                : "%s=types[%i].decode(r,r.uint32())", ref, i);
        else gen
                ("%s=r.%s()", ref, type);
        gen
                ("break");
    // Unknown fields
    } gen
            ("default:")
                ("r.skipType(t&7)")
                ("break")

        ("}")
    ("}");

    // Field presence
    for (i = 0; i < mtype._fieldsArray.length; ++i) {
        var rfield = mtype._fieldsArray[i];
        if (rfield.required) gen
    ("if(!m.hasOwnProperty(%j))", rfield.name)
        ("throw util.ProtocolError(%j,{instance:m})", missing(rfield));
    }

    return gen
    ("return m");
    /* eslint-enable no-unexpected-multiline */
}

},{"./enum":15,"./types":33,"./util":34}],14:[function(require,module,exports){
"use strict";
module.exports = encoder;

var Enum     = require("./enum"),
    types    = require("./types"),
    util     = require("./util");

/**
 * Generates a partial message type encoder.
 * @param {Codegen} gen Codegen instance
 * @param {Field} field Reflected field
 * @param {number} fieldIndex Field index
 * @param {string} ref Variable reference
 * @returns {Codegen} Codegen instance
 * @ignore
 */
function genTypePartial(gen, field, fieldIndex, ref) {
    return field.resolvedType.group
        ? gen("types[%i].encode(%s,w.uint32(%i)).uint32(%i)", fieldIndex, ref, (field.id << 3 | 3) >>> 0, (field.id << 3 | 4) >>> 0)
        : gen("types[%i].encode(%s,w.uint32(%i).fork()).ldelim()", fieldIndex, ref, (field.id << 3 | 2) >>> 0);
}

/**
 * Generates an encoder specific to the specified message type.
 * @param {Type} mtype Message type
 * @returns {Codegen} Codegen instance
 */
function encoder(mtype) {
    /* eslint-disable no-unexpected-multiline, block-scoped-var, no-redeclare */
    var gen = util.codegen(["m", "w"], mtype.name + "$encode")
    ("if(!w)")
        ("w=Writer.create()");

    var i, ref;

    // "when a message is serialized its known fields should be written sequentially by field number"
    var fields = /* initializes */ mtype.fieldsArray.slice().sort(util.compareFieldsById);

    for (var i = 0; i < fields.length; ++i) {
        var field    = fields[i].resolve(),
            index    = mtype._fieldsArray.indexOf(field),
            type     = field.resolvedType instanceof Enum ? "int32" : field.type,
            wireType = types.basic[type];
            ref      = "m" + util.safeProp(field.name);

        // Map fields
        if (field.map) {
            gen
    ("if(%s!=null&&m.hasOwnProperty(%j)){", ref, field.name) // !== undefined && !== null
        ("for(var ks=Object.keys(%s),i=0;i<ks.length;++i){", ref)
            ("w.uint32(%i).fork().uint32(%i).%s(ks[i])", (field.id << 3 | 2) >>> 0, 8 | types.mapKey[field.keyType], field.keyType);
            if (wireType === undefined) gen
            ("types[%i].encode(%s[ks[i]],w.uint32(18).fork()).ldelim().ldelim()", index, ref); // can't be groups
            else gen
            (".uint32(%i).%s(%s[ks[i]]).ldelim()", 16 | wireType, type, ref);
            gen
        ("}")
    ("}");

            // Repeated fields
        } else if (field.repeated) { gen
    ("if(%s!=null&&%s.length){", ref, ref); // !== undefined && !== null

            // Packed repeated
            if (field.packed && types.packed[type] !== undefined) { gen

        ("w.uint32(%i).fork()", (field.id << 3 | 2) >>> 0)
        ("for(var i=0;i<%s.length;++i)", ref)
            ("w.%s(%s[i])", type, ref)
        ("w.ldelim()");

            // Non-packed
            } else { gen

        ("for(var i=0;i<%s.length;++i)", ref);
                if (wireType === undefined)
            genTypePartial(gen, field, index, ref + "[i]");
                else gen
            ("w.uint32(%i).%s(%s[i])", (field.id << 3 | wireType) >>> 0, type, ref);

            } gen
    ("}");

        // Non-repeated
        } else {
            if (field.optional) gen
    ("if(%s!=null&&m.hasOwnProperty(%j))", ref, field.name); // !== undefined && !== null

            if (wireType === undefined)
        genTypePartial(gen, field, index, ref);
            else gen
        ("w.uint32(%i).%s(%s)", (field.id << 3 | wireType) >>> 0, type, ref);

        }
    }

    return gen
    ("return w");
    /* eslint-enable no-unexpected-multiline, block-scoped-var, no-redeclare */
}
},{"./enum":15,"./types":33,"./util":34}],15:[function(require,module,exports){
"use strict";
module.exports = Enum;

// extends ReflectionObject
var ReflectionObject = require("./object");
((Enum.prototype = Object.create(ReflectionObject.prototype)).constructor = Enum).className = "Enum";

var Namespace = require("./namespace"),
    util = require("./util");

/**
 * Constructs a new enum instance.
 * @classdesc Reflected enum.
 * @extends ReflectionObject
 * @constructor
 * @param {string} name Unique name within its namespace
 * @param {Object.<string,number>} [values] Enum values as an object, by name
 * @param {Object.<string,*>} [options] Declared options
 * @param {string} [comment] The comment for this enum
 * @param {Object.<string,string>} [comments] The value comments for this enum
 */
function Enum(name, values, options, comment, comments) {
    ReflectionObject.call(this, name, options);

    if (values && typeof values !== "object")
        throw TypeError("values must be an object");

    /**
     * Enum values by id.
     * @type {Object.<number,string>}
     */
    this.valuesById = {};

    /**
     * Enum values by name.
     * @type {Object.<string,number>}
     */
    this.values = Object.create(this.valuesById); // toJSON, marker

    /**
     * Enum comment text.
     * @type {string|null}
     */
    this.comment = comment;

    /**
     * Value comment texts, if any.
     * @type {Object.<string,string>}
     */
    this.comments = comments || {};

    /**
     * Reserved ranges, if any.
     * @type {Array.<number[]|string>}
     */
    this.reserved = undefined; // toJSON

    // Note that values inherit valuesById on their prototype which makes them a TypeScript-
    // compatible enum. This is used by pbts to write actual enum definitions that work for
    // static and reflection code alike instead of emitting generic object definitions.

    if (values)
        for (var keys = Object.keys(values), i = 0; i < keys.length; ++i)
            if (typeof values[keys[i]] === "number") // use forward entries only
                this.valuesById[ this.values[keys[i]] = values[keys[i]] ] = keys[i];
}

/**
 * Enum descriptor.
 * @interface IEnum
 * @property {Object.<string,number>} values Enum values
 * @property {Object.<string,*>} [options] Enum options
 */

/**
 * Constructs an enum from an enum descriptor.
 * @param {string} name Enum name
 * @param {IEnum} json Enum descriptor
 * @returns {Enum} Created enum
 * @throws {TypeError} If arguments are invalid
 */
Enum.fromJSON = function fromJSON(name, json) {
    var enm = new Enum(name, json.values, json.options, json.comment, json.comments);
    enm.reserved = json.reserved;
    return enm;
};

/**
 * Converts this enum to an enum descriptor.
 * @param {IToJSONOptions} [toJSONOptions] JSON conversion options
 * @returns {IEnum} Enum descriptor
 */
Enum.prototype.toJSON = function toJSON(toJSONOptions) {
    var keepComments = toJSONOptions ? Boolean(toJSONOptions.keepComments) : false;
    return util.toObject([
        "options"  , this.options,
        "values"   , this.values,
        "reserved" , this.reserved && this.reserved.length ? this.reserved : undefined,
        "comment"  , keepComments ? this.comment : undefined,
        "comments" , keepComments ? this.comments : undefined
    ]);
};

/**
 * Adds a value to this enum.
 * @param {string} name Value name
 * @param {number} id Value id
 * @param {string} [comment] Comment, if any
 * @returns {Enum} `this`
 * @throws {TypeError} If arguments are invalid
 * @throws {Error} If there is already a value with this name or id
 */
Enum.prototype.add = function add(name, id, comment) {
    // utilized by the parser but not by .fromJSON

    if (!util.isString(name))
        throw TypeError("name must be a string");

    if (!util.isInteger(id))
        throw TypeError("id must be an integer");

    if (this.values[name] !== undefined)
        throw Error("duplicate name '" + name + "' in " + this);

    if (this.isReservedId(id))
        throw Error("id " + id + " is reserved in " + this);

    if (this.isReservedName(name))
        throw Error("name '" + name + "' is reserved in " + this);

    if (this.valuesById[id] !== undefined) {
        if (!(this.options && this.options.allow_alias))
            throw Error("duplicate id " + id + " in " + this);
        this.values[name] = id;
    } else
        this.valuesById[this.values[name] = id] = name;

    this.comments[name] = comment || null;
    return this;
};

/**
 * Removes a value from this enum
 * @param {string} name Value name
 * @returns {Enum} `this`
 * @throws {TypeError} If arguments are invalid
 * @throws {Error} If `name` is not a name of this enum
 */
Enum.prototype.remove = function remove(name) {

    if (!util.isString(name))
        throw TypeError("name must be a string");

    var val = this.values[name];
    if (val == null)
        throw Error("name '" + name + "' does not exist in " + this);

    delete this.valuesById[val];
    delete this.values[name];
    delete this.comments[name];

    return this;
};

/**
 * Tests if the specified id is reserved.
 * @param {number} id Id to test
 * @returns {boolean} `true` if reserved, otherwise `false`
 */
Enum.prototype.isReservedId = function isReservedId(id) {
    return Namespace.isReservedId(this.reserved, id);
};

/**
 * Tests if the specified name is reserved.
 * @param {string} name Name to test
 * @returns {boolean} `true` if reserved, otherwise `false`
 */
Enum.prototype.isReservedName = function isReservedName(name) {
    return Namespace.isReservedName(this.reserved, name);
};

},{"./namespace":22,"./object":23,"./util":34}],16:[function(require,module,exports){
"use strict";
module.exports = Field;

// extends ReflectionObject
var ReflectionObject = require("./object");
((Field.prototype = Object.create(ReflectionObject.prototype)).constructor = Field).className = "Field";

var Enum  = require("./enum"),
    types = require("./types"),
    util  = require("./util");

var Type; // cyclic

var ruleRe = /^required|optional|repeated$/;

/**
 * Constructs a new message field instance. Note that {@link MapField|map fields} have their own class.
 * @name Field
 * @classdesc Reflected message field.
 * @extends FieldBase
 * @constructor
 * @param {string} name Unique name within its namespace
 * @param {number} id Unique id within its namespace
 * @param {string} type Value type
 * @param {string|Object.<string,*>} [rule="optional"] Field rule
 * @param {string|Object.<string,*>} [extend] Extended type if different from parent
 * @param {Object.<string,*>} [options] Declared options
 */

/**
 * Constructs a field from a field descriptor.
 * @param {string} name Field name
 * @param {IField} json Field descriptor
 * @returns {Field} Created field
 * @throws {TypeError} If arguments are invalid
 */
Field.fromJSON = function fromJSON(name, json) {
    return new Field(name, json.id, json.type, json.rule, json.extend, json.options, json.comment);
};

/**
 * Not an actual constructor. Use {@link Field} instead.
 * @classdesc Base class of all reflected message fields. This is not an actual class but here for the sake of having consistent type definitions.
 * @exports FieldBase
 * @extends ReflectionObject
 * @constructor
 * @param {string} name Unique name within its namespace
 * @param {number} id Unique id within its namespace
 * @param {string} type Value type
 * @param {string|Object.<string,*>} [rule="optional"] Field rule
 * @param {string|Object.<string,*>} [extend] Extended type if different from parent
 * @param {Object.<string,*>} [options] Declared options
 * @param {string} [comment] Comment associated with this field
 */
function Field(name, id, type, rule, extend, options, comment) {

    if (util.isObject(rule)) {
        comment = extend;
        options = rule;
        rule = extend = undefined;
    } else if (util.isObject(extend)) {
        comment = options;
        options = extend;
        extend = undefined;
    }

    ReflectionObject.call(this, name, options);

    if (!util.isInteger(id) || id < 0)
        throw TypeError("id must be a non-negative integer");

    if (!util.isString(type))
        throw TypeError("type must be a string");

    if (rule !== undefined && !ruleRe.test(rule = rule.toString().toLowerCase()))
        throw TypeError("rule must be a string rule");

    if (extend !== undefined && !util.isString(extend))
        throw TypeError("extend must be a string");

    /**
     * Field rule, if any.
     * @type {string|undefined}
     */
    this.rule = rule && rule !== "optional" ? rule : undefined; // toJSON

    /**
     * Field type.
     * @type {string}
     */
    this.type = type; // toJSON

    /**
     * Unique field id.
     * @type {number}
     */
    this.id = id; // toJSON, marker

    /**
     * Extended type if different from parent.
     * @type {string|undefined}
     */
    this.extend = extend || undefined; // toJSON

    /**
     * Whether this field is required.
     * @type {boolean}
     */
    this.required = rule === "required";

    /**
     * Whether this field is optional.
     * @type {boolean}
     */
    this.optional = !this.required;

    /**
     * Whether this field is repeated.
     * @type {boolean}
     */
    this.repeated = rule === "repeated";

    /**
     * Whether this field is a map or not.
     * @type {boolean}
     */
    this.map = false;

    /**
     * Message this field belongs to.
     * @type {Type|null}
     */
    this.message = null;

    /**
     * OneOf this field belongs to, if any,
     * @type {OneOf|null}
     */
    this.partOf = null;

    /**
     * The field type's default value.
     * @type {*}
     */
    this.typeDefault = null;

    /**
     * The field's default value on prototypes.
     * @type {*}
     */
    this.defaultValue = null;

    /**
     * Whether this field's value should be treated as a long.
     * @type {boolean}
     */
    this.long = util.Long ? types.long[type] !== undefined : /* istanbul ignore next */ false;

    /**
     * Whether this field's value is a buffer.
     * @type {boolean}
     */
    this.bytes = type === "bytes";

    /**
     * Resolved type if not a basic type.
     * @type {Type|Enum|null}
     */
    this.resolvedType = null;

    /**
     * Sister-field within the extended type if a declaring extension field.
     * @type {Field|null}
     */
    this.extensionField = null;

    /**
     * Sister-field within the declaring namespace if an extended field.
     * @type {Field|null}
     */
    this.declaringField = null;

    /**
     * Internally remembers whether this field is packed.
     * @type {boolean|null}
     * @private
     */
    this._packed = null;

    /**
     * Comment for this field.
     * @type {string|null}
     */
    this.comment = comment;
}

/**
 * Determines whether this field is packed. Only relevant when repeated and working with proto2.
 * @name Field#packed
 * @type {boolean}
 * @readonly
 */
Object.defineProperty(Field.prototype, "packed", {
    get: function() {
        // defaults to packed=true if not explicity set to false
        if (this._packed === null)
            this._packed = this.getOption("packed") !== false;
        return this._packed;
    }
});

/**
 * @override
 */
Field.prototype.setOption = function setOption(name, value, ifNotSet) {
    if (name === "packed") // clear cached before setting
        this._packed = null;
    return ReflectionObject.prototype.setOption.call(this, name, value, ifNotSet);
};

/**
 * Field descriptor.
 * @interface IField
 * @property {string} [rule="optional"] Field rule
 * @property {string} type Field type
 * @property {number} id Field id
 * @property {Object.<string,*>} [options] Field options
 */

/**
 * Extension field descriptor.
 * @interface IExtensionField
 * @extends IField
 * @property {string} extend Extended type
 */

/**
 * Converts this field to a field descriptor.
 * @param {IToJSONOptions} [toJSONOptions] JSON conversion options
 * @returns {IField} Field descriptor
 */
Field.prototype.toJSON = function toJSON(toJSONOptions) {
    var keepComments = toJSONOptions ? Boolean(toJSONOptions.keepComments) : false;
    return util.toObject([
        "rule"    , this.rule !== "optional" && this.rule || undefined,
        "type"    , this.type,
        "id"      , this.id,
        "extend"  , this.extend,
        "options" , this.options,
        "comment" , keepComments ? this.comment : undefined
    ]);
};

/**
 * Resolves this field's type references.
 * @returns {Field} `this`
 * @throws {Error} If any reference cannot be resolved
 */
Field.prototype.resolve = function resolve() {

    if (this.resolved)
        return this;

    if ((this.typeDefault = types.defaults[this.type]) === undefined) { // if not a basic type, resolve it
        this.resolvedType = (this.declaringField ? this.declaringField.parent : this.parent).lookupTypeOrEnum(this.type);
        if (this.resolvedType instanceof Type)
            this.typeDefault = null;
        else // instanceof Enum
            this.typeDefault = this.resolvedType.values[Object.keys(this.resolvedType.values)[0]]; // first defined
    }

    // use explicitly set default value if present
    if (this.options && this.options["default"] != null) {
        this.typeDefault = this.options["default"];
        if (this.resolvedType instanceof Enum && typeof this.typeDefault === "string")
            this.typeDefault = this.resolvedType.values[this.typeDefault];
    }

    // remove unnecessary options
    if (this.options) {
        if (this.options.packed === true || this.options.packed !== undefined && this.resolvedType && !(this.resolvedType instanceof Enum))
            delete this.options.packed;
        if (!Object.keys(this.options).length)
            this.options = undefined;
    }

    // convert to internal data type if necesssary
    if (this.long) {
        this.typeDefault = util.Long.fromNumber(this.typeDefault, this.type.charAt(0) === "u");

        /* istanbul ignore else */
        if (Object.freeze)
            Object.freeze(this.typeDefault); // long instances are meant to be immutable anyway (i.e. use small int cache that even requires it)

    } else if (this.bytes && typeof this.typeDefault === "string") {
        var buf;
        if (util.base64.test(this.typeDefault))
            util.base64.decode(this.typeDefault, buf = util.newBuffer(util.base64.length(this.typeDefault)), 0);
        else
            util.utf8.write(this.typeDefault, buf = util.newBuffer(util.utf8.length(this.typeDefault)), 0);
        this.typeDefault = buf;
    }

    // take special care of maps and repeated fields
    if (this.map)
        this.defaultValue = util.emptyObject;
    else if (this.repeated)
        this.defaultValue = util.emptyArray;
    else
        this.defaultValue = this.typeDefault;

    // ensure proper value on prototype
    if (this.parent instanceof Type)
        this.parent.ctor.prototype[this.name] = this.defaultValue;

    return ReflectionObject.prototype.resolve.call(this);
};

/**
 * Decorator function as returned by {@link Field.d} and {@link MapField.d} (TypeScript).
 * @typedef FieldDecorator
 * @type {function}
 * @param {Object} prototype Target prototype
 * @param {string} fieldName Field name
 * @returns {undefined}
 */

/**
 * Field decorator (TypeScript).
 * @name Field.d
 * @function
 * @param {number} fieldId Field id
 * @param {"double"|"float"|"int32"|"uint32"|"sint32"|"fixed32"|"sfixed32"|"int64"|"uint64"|"sint64"|"fixed64"|"sfixed64"|"string"|"bool"|"bytes"|Object} fieldType Field type
 * @param {"optional"|"required"|"repeated"} [fieldRule="optional"] Field rule
 * @param {T} [defaultValue] Default value
 * @returns {FieldDecorator} Decorator function
 * @template T extends number | number[] | Long | Long[] | string | string[] | boolean | boolean[] | Uint8Array | Uint8Array[] | Buffer | Buffer[]
 */
Field.d = function decorateField(fieldId, fieldType, fieldRule, defaultValue) {

    // submessage: decorate the submessage and use its name as the type
    if (typeof fieldType === "function")
        fieldType = util.decorateType(fieldType).name;

    // enum reference: create a reflected copy of the enum and keep reuseing it
    else if (fieldType && typeof fieldType === "object")
        fieldType = util.decorateEnum(fieldType).name;

    return function fieldDecorator(prototype, fieldName) {
        util.decorateType(prototype.constructor)
            .add(new Field(fieldName, fieldId, fieldType, fieldRule, { "default": defaultValue }));
    };
};

/**
 * Field decorator (TypeScript).
 * @name Field.d
 * @function
 * @param {number} fieldId Field id
 * @param {Constructor<T>|string} fieldType Field type
 * @param {"optional"|"required"|"repeated"} [fieldRule="optional"] Field rule
 * @returns {FieldDecorator} Decorator function
 * @template T extends Message<T>
 * @variation 2
 */
// like Field.d but without a default value

// Sets up cyclic dependencies (called in index-light)
Field._configure = function configure(Type_) {
    Type = Type_;
};

},{"./enum":15,"./object":23,"./types":33,"./util":34}],17:[function(require,module,exports){
"use strict";
var protobuf = module.exports = require("./index-minimal");

protobuf.build = "light";

/**
 * A node-style callback as used by {@link load} and {@link Root#load}.
 * @typedef LoadCallback
 * @type {function}
 * @param {Error|null} error Error, if any, otherwise `null`
 * @param {Root} [root] Root, if there hasn't been an error
 * @returns {undefined}
 */

/**
 * Loads one or multiple .proto or preprocessed .json files into a common root namespace and calls the callback.
 * @param {string|string[]} filename One or multiple files to load
 * @param {Root} root Root namespace, defaults to create a new one if omitted.
 * @param {LoadCallback} callback Callback function
 * @returns {undefined}
 * @see {@link Root#load}
 */
function load(filename, root, callback) {
    if (typeof root === "function") {
        callback = root;
        root = new protobuf.Root();
    } else if (!root)
        root = new protobuf.Root();
    return root.load(filename, callback);
}

/**
 * Loads one or multiple .proto or preprocessed .json files into a common root namespace and calls the callback.
 * @name load
 * @function
 * @param {string|string[]} filename One or multiple files to load
 * @param {LoadCallback} callback Callback function
 * @returns {undefined}
 * @see {@link Root#load}
 * @variation 2
 */
// function load(filename:string, callback:LoadCallback):undefined

/**
 * Loads one or multiple .proto or preprocessed .json files into a common root namespace and returns a promise.
 * @name load
 * @function
 * @param {string|string[]} filename One or multiple files to load
 * @param {Root} [root] Root namespace, defaults to create a new one if omitted.
 * @returns {Promise<Root>} Promise
 * @see {@link Root#load}
 * @variation 3
 */
// function load(filename:string, [root:Root]):Promise<Root>

protobuf.load = load;

/**
 * Synchronously loads one or multiple .proto or preprocessed .json files into a common root namespace (node only).
 * @param {string|string[]} filename One or multiple files to load
 * @param {Root} [root] Root namespace, defaults to create a new one if omitted.
 * @returns {Root} Root namespace
 * @throws {Error} If synchronous fetching is not supported (i.e. in browsers) or if a file's syntax is invalid
 * @see {@link Root#loadSync}
 */
function loadSync(filename, root) {
    if (!root)
        root = new protobuf.Root();
    return root.loadSync(filename);
}

protobuf.loadSync = loadSync;

// Serialization
protobuf.encoder          = require("./encoder");
protobuf.decoder          = require("./decoder");
protobuf.verifier         = require("./verifier");
protobuf.converter        = require("./converter");

// Reflection
protobuf.ReflectionObject = require("./object");
protobuf.Namespace        = require("./namespace");
protobuf.Root             = require("./root");
protobuf.Enum             = require("./enum");
protobuf.Type             = require("./type");
protobuf.Field            = require("./field");
protobuf.OneOf            = require("./oneof");
protobuf.MapField         = require("./mapfield");
protobuf.Service          = require("./service");
protobuf.Method           = require("./method");

// Runtime
protobuf.Message          = require("./message");
protobuf.wrappers         = require("./wrappers");

// Utility
protobuf.types            = require("./types");
protobuf.util             = require("./util");

// Set up possibly cyclic reflection dependencies
protobuf.ReflectionObject._configure(protobuf.Root);
protobuf.Namespace._configure(protobuf.Type, protobuf.Service, protobuf.Enum);
protobuf.Root._configure(protobuf.Type);
protobuf.Field._configure(protobuf.Type);

},{"./converter":12,"./decoder":13,"./encoder":14,"./enum":15,"./field":16,"./index-minimal":18,"./mapfield":19,"./message":20,"./method":21,"./namespace":22,"./object":23,"./oneof":24,"./root":27,"./service":31,"./type":32,"./types":33,"./util":34,"./verifier":37,"./wrappers":38}],18:[function(require,module,exports){
"use strict";
var protobuf = exports;

/**
 * Build type, one of `"full"`, `"light"` or `"minimal"`.
 * @name build
 * @type {string}
 * @const
 */
protobuf.build = "minimal";

// Serialization
protobuf.Writer       = require("./writer");
protobuf.BufferWriter = require("./writer_buffer");
protobuf.Reader       = require("./reader");
protobuf.BufferReader = require("./reader_buffer");

// Utility
protobuf.util         = require("./util/minimal");
protobuf.rpc          = require("./rpc");
protobuf.roots        = require("./roots");
protobuf.configure    = configure;

/* istanbul ignore next */
/**
 * Reconfigures the library according to the environment.
 * @returns {undefined}
 */
function configure() {
    protobuf.Reader._configure(protobuf.BufferReader);
    protobuf.util._configure();
}

// Set up buffer utility according to the environment
protobuf.Writer._configure(protobuf.BufferWriter);
configure();

},{"./reader":25,"./reader_buffer":26,"./roots":28,"./rpc":29,"./util/minimal":36,"./writer":39,"./writer_buffer":40}],19:[function(require,module,exports){
"use strict";
module.exports = MapField;

// extends Field
var Field = require("./field");
((MapField.prototype = Object.create(Field.prototype)).constructor = MapField).className = "MapField";

var types   = require("./types"),
    util    = require("./util");

/**
 * Constructs a new map field instance.
 * @classdesc Reflected map field.
 * @extends FieldBase
 * @constructor
 * @param {string} name Unique name within its namespace
 * @param {number} id Unique id within its namespace
 * @param {string} keyType Key type
 * @param {string} type Value type
 * @param {Object.<string,*>} [options] Declared options
 * @param {string} [comment] Comment associated with this field
 */
function MapField(name, id, keyType, type, options, comment) {
    Field.call(this, name, id, type, undefined, undefined, options, comment);

    /* istanbul ignore if */
    if (!util.isString(keyType))
        throw TypeError("keyType must be a string");

    /**
     * Key type.
     * @type {string}
     */
    this.keyType = keyType; // toJSON, marker

    /**
     * Resolved key type if not a basic type.
     * @type {ReflectionObject|null}
     */
    this.resolvedKeyType = null;

    // Overrides Field#map
    this.map = true;
}

/**
 * Map field descriptor.
 * @interface IMapField
 * @extends {IField}
 * @property {string} keyType Key type
 */

/**
 * Extension map field descriptor.
 * @interface IExtensionMapField
 * @extends IMapField
 * @property {string} extend Extended type
 */

/**
 * Constructs a map field from a map field descriptor.
 * @param {string} name Field name
 * @param {IMapField} json Map field descriptor
 * @returns {MapField} Created map field
 * @throws {TypeError} If arguments are invalid
 */
MapField.fromJSON = function fromJSON(name, json) {
    return new MapField(name, json.id, json.keyType, json.type, json.options, json.comment);
};

/**
 * Converts this map field to a map field descriptor.
 * @param {IToJSONOptions} [toJSONOptions] JSON conversion options
 * @returns {IMapField} Map field descriptor
 */
MapField.prototype.toJSON = function toJSON(toJSONOptions) {
    var keepComments = toJSONOptions ? Boolean(toJSONOptions.keepComments) : false;
    return util.toObject([
        "keyType" , this.keyType,
        "type"    , this.type,
        "id"      , this.id,
        "extend"  , this.extend,
        "options" , this.options,
        "comment" , keepComments ? this.comment : undefined
    ]);
};

/**
 * @override
 */
MapField.prototype.resolve = function resolve() {
    if (this.resolved)
        return this;

    // Besides a value type, map fields have a key type that may be "any scalar type except for floating point types and bytes"
    if (types.mapKey[this.keyType] === undefined)
        throw Error("invalid key type: " + this.keyType);

    return Field.prototype.resolve.call(this);
};

/**
 * Map field decorator (TypeScript).
 * @name MapField.d
 * @function
 * @param {number} fieldId Field id
 * @param {"int32"|"uint32"|"sint32"|"fixed32"|"sfixed32"|"int64"|"uint64"|"sint64"|"fixed64"|"sfixed64"|"bool"|"string"} fieldKeyType Field key type
 * @param {"double"|"float"|"int32"|"uint32"|"sint32"|"fixed32"|"sfixed32"|"int64"|"uint64"|"sint64"|"fixed64"|"sfixed64"|"bool"|"string"|"bytes"|Object|Constructor<{}>} fieldValueType Field value type
 * @returns {FieldDecorator} Decorator function
 * @template T extends { [key: string]: number | Long | string | boolean | Uint8Array | Buffer | number[] | Message<{}> }
 */
MapField.d = function decorateMapField(fieldId, fieldKeyType, fieldValueType) {

    // submessage value: decorate the submessage and use its name as the type
    if (typeof fieldValueType === "function")
        fieldValueType = util.decorateType(fieldValueType).name;

    // enum reference value: create a reflected copy of the enum and keep reuseing it
    else if (fieldValueType && typeof fieldValueType === "object")
        fieldValueType = util.decorateEnum(fieldValueType).name;

    return function mapFieldDecorator(prototype, fieldName) {
        util.decorateType(prototype.constructor)
            .add(new MapField(fieldName, fieldId, fieldKeyType, fieldValueType));
    };
};

},{"./field":16,"./types":33,"./util":34}],20:[function(require,module,exports){
"use strict";
module.exports = Message;

var util = require("./util/minimal");

/**
 * Constructs a new message instance.
 * @classdesc Abstract runtime message.
 * @constructor
 * @param {Properties<T>} [properties] Properties to set
 * @template T extends object = object
 */
function Message(properties) {
    // not used internally
    if (properties)
        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            this[keys[i]] = properties[keys[i]];
}

/**
 * Reference to the reflected type.
 * @name Message.$type
 * @type {Type}
 * @readonly
 */

/**
 * Reference to the reflected type.
 * @name Message#$type
 * @type {Type}
 * @readonly
 */

/*eslint-disable valid-jsdoc*/

/**
 * Creates a new message of this type using the specified properties.
 * @param {Object.<string,*>} [properties] Properties to set
 * @returns {Message<T>} Message instance
 * @template T extends Message<T>
 * @this Constructor<T>
 */
Message.create = function create(properties) {
    return this.$type.create(properties);
};

/**
 * Encodes a message of this type.
 * @param {T|Object.<string,*>} message Message to encode
 * @param {Writer} [writer] Writer to use
 * @returns {Writer} Writer
 * @template T extends Message<T>
 * @this Constructor<T>
 */
Message.encode = function encode(message, writer) {
    return this.$type.encode(message, writer);
};

/**
 * Encodes a message of this type preceeded by its length as a varint.
 * @param {T|Object.<string,*>} message Message to encode
 * @param {Writer} [writer] Writer to use
 * @returns {Writer} Writer
 * @template T extends Message<T>
 * @this Constructor<T>
 */
Message.encodeDelimited = function encodeDelimited(message, writer) {
    return this.$type.encodeDelimited(message, writer);
};

/**
 * Decodes a message of this type.
 * @name Message.decode
 * @function
 * @param {Reader|Uint8Array} reader Reader or buffer to decode
 * @returns {T} Decoded message
 * @template T extends Message<T>
 * @this Constructor<T>
 */
Message.decode = function decode(reader) {
    return this.$type.decode(reader);
};

/**
 * Decodes a message of this type preceeded by its length as a varint.
 * @name Message.decodeDelimited
 * @function
 * @param {Reader|Uint8Array} reader Reader or buffer to decode
 * @returns {T} Decoded message
 * @template T extends Message<T>
 * @this Constructor<T>
 */
Message.decodeDelimited = function decodeDelimited(reader) {
    return this.$type.decodeDelimited(reader);
};

/**
 * Verifies a message of this type.
 * @name Message.verify
 * @function
 * @param {Object.<string,*>} message Plain object to verify
 * @returns {string|null} `null` if valid, otherwise the reason why it is not
 */
Message.verify = function verify(message) {
    return this.$type.verify(message);
};

/**
 * Creates a new message of this type from a plain object. Also converts values to their respective internal types.
 * @param {Object.<string,*>} object Plain object
 * @returns {T} Message instance
 * @template T extends Message<T>
 * @this Constructor<T>
 */
Message.fromObject = function fromObject(object) {
    return this.$type.fromObject(object);
};

/**
 * Creates a plain object from a message of this type. Also converts values to other types if specified.
 * @param {T} message Message instance
 * @param {IConversionOptions} [options] Conversion options
 * @returns {Object.<string,*>} Plain object
 * @template T extends Message<T>
 * @this Constructor<T>
 */
Message.toObject = function toObject(message, options) {
    return this.$type.toObject(message, options);
};

/**
 * Converts this message to JSON.
 * @returns {Object.<string,*>} JSON object
 */
Message.prototype.toJSON = function toJSON() {
    return this.$type.toObject(this, util.toJSONOptions);
};

/*eslint-enable valid-jsdoc*/
},{"./util/minimal":36}],21:[function(require,module,exports){
"use strict";
module.exports = Method;

// extends ReflectionObject
var ReflectionObject = require("./object");
((Method.prototype = Object.create(ReflectionObject.prototype)).constructor = Method).className = "Method";

var util = require("./util");

/**
 * Constructs a new service method instance.
 * @classdesc Reflected service method.
 * @extends ReflectionObject
 * @constructor
 * @param {string} name Method name
 * @param {string|undefined} type Method type, usually `"rpc"`
 * @param {string} requestType Request message type
 * @param {string} responseType Response message type
 * @param {boolean|Object.<string,*>} [requestStream] Whether the request is streamed
 * @param {boolean|Object.<string,*>} [responseStream] Whether the response is streamed
 * @param {Object.<string,*>} [options] Declared options
 * @param {string} [comment] The comment for this method
 */
function Method(name, type, requestType, responseType, requestStream, responseStream, options, comment) {

    /* istanbul ignore next */
    if (util.isObject(requestStream)) {
        options = requestStream;
        requestStream = responseStream = undefined;
    } else if (util.isObject(responseStream)) {
        options = responseStream;
        responseStream = undefined;
    }

    /* istanbul ignore if */
    if (!(type === undefined || util.isString(type)))
        throw TypeError("type must be a string");

    /* istanbul ignore if */
    if (!util.isString(requestType))
        throw TypeError("requestType must be a string");

    /* istanbul ignore if */
    if (!util.isString(responseType))
        throw TypeError("responseType must be a string");

    ReflectionObject.call(this, name, options);

    /**
     * Method type.
     * @type {string}
     */
    this.type = type || "rpc"; // toJSON

    /**
     * Request type.
     * @type {string}
     */
    this.requestType = requestType; // toJSON, marker

    /**
     * Whether requests are streamed or not.
     * @type {boolean|undefined}
     */
    this.requestStream = requestStream ? true : undefined; // toJSON

    /**
     * Response type.
     * @type {string}
     */
    this.responseType = responseType; // toJSON

    /**
     * Whether responses are streamed or not.
     * @type {boolean|undefined}
     */
    this.responseStream = responseStream ? true : undefined; // toJSON

    /**
     * Resolved request type.
     * @type {Type|null}
     */
    this.resolvedRequestType = null;

    /**
     * Resolved response type.
     * @type {Type|null}
     */
    this.resolvedResponseType = null;

    /**
     * Comment for this method
     * @type {string|null}
     */
    this.comment = comment;
}

/**
 * Method descriptor.
 * @interface IMethod
 * @property {string} [type="rpc"] Method type
 * @property {string} requestType Request type
 * @property {string} responseType Response type
 * @property {boolean} [requestStream=false] Whether requests are streamed
 * @property {boolean} [responseStream=false] Whether responses are streamed
 * @property {Object.<string,*>} [options] Method options
 */

/**
 * Constructs a method from a method descriptor.
 * @param {string} name Method name
 * @param {IMethod} json Method descriptor
 * @returns {Method} Created method
 * @throws {TypeError} If arguments are invalid
 */
Method.fromJSON = function fromJSON(name, json) {
    return new Method(name, json.type, json.requestType, json.responseType, json.requestStream, json.responseStream, json.options, json.comment);
};

/**
 * Converts this method to a method descriptor.
 * @param {IToJSONOptions} [toJSONOptions] JSON conversion options
 * @returns {IMethod} Method descriptor
 */
Method.prototype.toJSON = function toJSON(toJSONOptions) {
    var keepComments = toJSONOptions ? Boolean(toJSONOptions.keepComments) : false;
    return util.toObject([
        "type"           , this.type !== "rpc" && /* istanbul ignore next */ this.type || undefined,
        "requestType"    , this.requestType,
        "requestStream"  , this.requestStream,
        "responseType"   , this.responseType,
        "responseStream" , this.responseStream,
        "options"        , this.options,
        "comment"        , keepComments ? this.comment : undefined
    ]);
};

/**
 * @override
 */
Method.prototype.resolve = function resolve() {

    /* istanbul ignore if */
    if (this.resolved)
        return this;

    this.resolvedRequestType = this.parent.lookupType(this.requestType);
    this.resolvedResponseType = this.parent.lookupType(this.responseType);

    return ReflectionObject.prototype.resolve.call(this);
};

},{"./object":23,"./util":34}],22:[function(require,module,exports){
"use strict";
module.exports = Namespace;

// extends ReflectionObject
var ReflectionObject = require("./object");
((Namespace.prototype = Object.create(ReflectionObject.prototype)).constructor = Namespace).className = "Namespace";

var Field    = require("./field"),
    util     = require("./util");

var Type,    // cyclic
    Service,
    Enum;

/**
 * Constructs a new namespace instance.
 * @name Namespace
 * @classdesc Reflected namespace.
 * @extends NamespaceBase
 * @constructor
 * @param {string} name Namespace name
 * @param {Object.<string,*>} [options] Declared options
 */

/**
 * Constructs a namespace from JSON.
 * @memberof Namespace
 * @function
 * @param {string} name Namespace name
 * @param {Object.<string,*>} json JSON object
 * @returns {Namespace} Created namespace
 * @throws {TypeError} If arguments are invalid
 */
Namespace.fromJSON = function fromJSON(name, json) {
    return new Namespace(name, json.options).addJSON(json.nested);
};

/**
 * Converts an array of reflection objects to JSON.
 * @memberof Namespace
 * @param {ReflectionObject[]} array Object array
 * @param {IToJSONOptions} [toJSONOptions] JSON conversion options
 * @returns {Object.<string,*>|undefined} JSON object or `undefined` when array is empty
 */
function arrayToJSON(array, toJSONOptions) {
    if (!(array && array.length))
        return undefined;
    var obj = {};
    for (var i = 0; i < array.length; ++i)
        obj[array[i].name] = array[i].toJSON(toJSONOptions);
    return obj;
}

Namespace.arrayToJSON = arrayToJSON;

/**
 * Tests if the specified id is reserved.
 * @param {Array.<number[]|string>|undefined} reserved Array of reserved ranges and names
 * @param {number} id Id to test
 * @returns {boolean} `true` if reserved, otherwise `false`
 */
Namespace.isReservedId = function isReservedId(reserved, id) {
    if (reserved)
        for (var i = 0; i < reserved.length; ++i)
            if (typeof reserved[i] !== "string" && reserved[i][0] <= id && reserved[i][1] >= id)
                return true;
    return false;
};

/**
 * Tests if the specified name is reserved.
 * @param {Array.<number[]|string>|undefined} reserved Array of reserved ranges and names
 * @param {string} name Name to test
 * @returns {boolean} `true` if reserved, otherwise `false`
 */
Namespace.isReservedName = function isReservedName(reserved, name) {
    if (reserved)
        for (var i = 0; i < reserved.length; ++i)
            if (reserved[i] === name)
                return true;
    return false;
};

/**
 * Not an actual constructor. Use {@link Namespace} instead.
 * @classdesc Base class of all reflection objects containing nested objects. This is not an actual class but here for the sake of having consistent type definitions.
 * @exports NamespaceBase
 * @extends ReflectionObject
 * @abstract
 * @constructor
 * @param {string} name Namespace name
 * @param {Object.<string,*>} [options] Declared options
 * @see {@link Namespace}
 */
function Namespace(name, options) {
    ReflectionObject.call(this, name, options);

    /**
     * Nested objects by name.
     * @type {Object.<string,ReflectionObject>|undefined}
     */
    this.nested = undefined; // toJSON

    /**
     * Cached nested objects as an array.
     * @type {ReflectionObject[]|null}
     * @private
     */
    this._nestedArray = null;
}

function clearCache(namespace) {
    namespace._nestedArray = null;
    return namespace;
}

/**
 * Nested objects of this namespace as an array for iteration.
 * @name NamespaceBase#nestedArray
 * @type {ReflectionObject[]}
 * @readonly
 */
Object.defineProperty(Namespace.prototype, "nestedArray", {
    get: function() {
        return this._nestedArray || (this._nestedArray = util.toArray(this.nested));
    }
});

/**
 * Namespace descriptor.
 * @interface INamespace
 * @property {Object.<string,*>} [options] Namespace options
 * @property {Object.<string,AnyNestedObject>} [nested] Nested object descriptors
 */

/**
 * Any extension field descriptor.
 * @typedef AnyExtensionField
 * @type {IExtensionField|IExtensionMapField}
 */

/**
 * Any nested object descriptor.
 * @typedef AnyNestedObject
 * @type {IEnum|IType|IService|AnyExtensionField|INamespace}
 */
// ^ BEWARE: VSCode hangs forever when using more than 5 types (that's why AnyExtensionField exists in the first place)

/**
 * Converts this namespace to a namespace descriptor.
 * @param {IToJSONOptions} [toJSONOptions] JSON conversion options
 * @returns {INamespace} Namespace descriptor
 */
Namespace.prototype.toJSON = function toJSON(toJSONOptions) {
    return util.toObject([
        "options" , this.options,
        "nested"  , arrayToJSON(this.nestedArray, toJSONOptions)
    ]);
};

/**
 * Adds nested objects to this namespace from nested object descriptors.
 * @param {Object.<string,AnyNestedObject>} nestedJson Any nested object descriptors
 * @returns {Namespace} `this`
 */
Namespace.prototype.addJSON = function addJSON(nestedJson) {
    var ns = this;
    /* istanbul ignore else */
    if (nestedJson) {
        for (var names = Object.keys(nestedJson), i = 0, nested; i < names.length; ++i) {
            nested = nestedJson[names[i]];
            ns.add( // most to least likely
                ( nested.fields !== undefined
                ? Type.fromJSON
                : nested.values !== undefined
                ? Enum.fromJSON
                : nested.methods !== undefined
                ? Service.fromJSON
                : nested.id !== undefined
                ? Field.fromJSON
                : Namespace.fromJSON )(names[i], nested)
            );
        }
    }
    return this;
};

/**
 * Gets the nested object of the specified name.
 * @param {string} name Nested object name
 * @returns {ReflectionObject|null} The reflection object or `null` if it doesn't exist
 */
Namespace.prototype.get = function get(name) {
    return this.nested && this.nested[name]
        || null;
};

/**
 * Gets the values of the nested {@link Enum|enum} of the specified name.
 * This methods differs from {@link Namespace#get|get} in that it returns an enum's values directly and throws instead of returning `null`.
 * @param {string} name Nested enum name
 * @returns {Object.<string,number>} Enum values
 * @throws {Error} If there is no such enum
 */
Namespace.prototype.getEnum = function getEnum(name) {
    if (this.nested && this.nested[name] instanceof Enum)
        return this.nested[name].values;
    throw Error("no such enum: " + name);
};

/**
 * Adds a nested object to this namespace.
 * @param {ReflectionObject} object Nested object to add
 * @returns {Namespace} `this`
 * @throws {TypeError} If arguments are invalid
 * @throws {Error} If there is already a nested object with this name
 */
Namespace.prototype.add = function add(object) {

    if (!(object instanceof Field && object.extend !== undefined || object instanceof Type || object instanceof Enum || object instanceof Service || object instanceof Namespace))
        throw TypeError("object must be a valid nested object");

    if (!this.nested)
        this.nested = {};
    else {
        var prev = this.get(object.name);
        if (prev) {
            if (prev instanceof Namespace && object instanceof Namespace && !(prev instanceof Type || prev instanceof Service)) {
                // replace plain namespace but keep existing nested elements and options
                var nested = prev.nestedArray;
                for (var i = 0; i < nested.length; ++i)
                    object.add(nested[i]);
                this.remove(prev);
                if (!this.nested)
                    this.nested = {};
                object.setOptions(prev.options, true);

            } else
                throw Error("duplicate name '" + object.name + "' in " + this);
        }
    }
    this.nested[object.name] = object;
    object.onAdd(this);
    return clearCache(this);
};

/**
 * Removes a nested object from this namespace.
 * @param {ReflectionObject} object Nested object to remove
 * @returns {Namespace} `this`
 * @throws {TypeError} If arguments are invalid
 * @throws {Error} If `object` is not a member of this namespace
 */
Namespace.prototype.remove = function remove(object) {

    if (!(object instanceof ReflectionObject))
        throw TypeError("object must be a ReflectionObject");
    if (object.parent !== this)
        throw Error(object + " is not a member of " + this);

    delete this.nested[object.name];
    if (!Object.keys(this.nested).length)
        this.nested = undefined;

    object.onRemove(this);
    return clearCache(this);
};

/**
 * Defines additial namespaces within this one if not yet existing.
 * @param {string|string[]} path Path to create
 * @param {*} [json] Nested types to create from JSON
 * @returns {Namespace} Pointer to the last namespace created or `this` if path is empty
 */
Namespace.prototype.define = function define(path, json) {

    if (util.isString(path))
        path = path.split(".");
    else if (!Array.isArray(path))
        throw TypeError("illegal path");
    if (path && path.length && path[0] === "")
        throw Error("path must be relative");

    var ptr = this;
    while (path.length > 0) {
        var part = path.shift();
        if (ptr.nested && ptr.nested[part]) {
            ptr = ptr.nested[part];
            if (!(ptr instanceof Namespace))
                throw Error("path conflicts with non-namespace objects");
        } else
            ptr.add(ptr = new Namespace(part));
    }
    if (json)
        ptr.addJSON(json);
    return ptr;
};

/**
 * Resolves this namespace's and all its nested objects' type references. Useful to validate a reflection tree, but comes at a cost.
 * @returns {Namespace} `this`
 */
Namespace.prototype.resolveAll = function resolveAll() {
    var nested = this.nestedArray, i = 0;
    while (i < nested.length)
        if (nested[i] instanceof Namespace)
            nested[i++].resolveAll();
        else
            nested[i++].resolve();
    return this.resolve();
};

/**
 * Recursively looks up the reflection object matching the specified path in the scope of this namespace.
 * @param {string|string[]} path Path to look up
 * @param {*|Array.<*>} filterTypes Filter types, any combination of the constructors of `protobuf.Type`, `protobuf.Enum`, `protobuf.Service` etc.
 * @param {boolean} [parentAlreadyChecked=false] If known, whether the parent has already been checked
 * @returns {ReflectionObject|null} Looked up object or `null` if none could be found
 */
Namespace.prototype.lookup = function lookup(path, filterTypes, parentAlreadyChecked) {

    /* istanbul ignore next */
    if (typeof filterTypes === "boolean") {
        parentAlreadyChecked = filterTypes;
        filterTypes = undefined;
    } else if (filterTypes && !Array.isArray(filterTypes))
        filterTypes = [ filterTypes ];

    if (util.isString(path) && path.length) {
        if (path === ".")
            return this.root;
        path = path.split(".");
    } else if (!path.length)
        return this;

    // Start at root if path is absolute
    if (path[0] === "")
        return this.root.lookup(path.slice(1), filterTypes);

    // Test if the first part matches any nested object, and if so, traverse if path contains more
    var found = this.get(path[0]);
    if (found) {
        if (path.length === 1) {
            if (!filterTypes || filterTypes.indexOf(found.constructor) > -1)
                return found;
        } else if (found instanceof Namespace && (found = found.lookup(path.slice(1), filterTypes, true)))
            return found;

    // Otherwise try each nested namespace
    } else
        for (var i = 0; i < this.nestedArray.length; ++i)
            if (this._nestedArray[i] instanceof Namespace && (found = this._nestedArray[i].lookup(path, filterTypes, true)))
                return found;

    // If there hasn't been a match, try again at the parent
    if (this.parent === null || parentAlreadyChecked)
        return null;
    return this.parent.lookup(path, filterTypes);
};

/**
 * Looks up the reflection object at the specified path, relative to this namespace.
 * @name NamespaceBase#lookup
 * @function
 * @param {string|string[]} path Path to look up
 * @param {boolean} [parentAlreadyChecked=false] Whether the parent has already been checked
 * @returns {ReflectionObject|null} Looked up object or `null` if none could be found
 * @variation 2
 */
// lookup(path: string, [parentAlreadyChecked: boolean])

/**
 * Looks up the {@link Type|type} at the specified path, relative to this namespace.
 * Besides its signature, this methods differs from {@link Namespace#lookup|lookup} in that it throws instead of returning `null`.
 * @param {string|string[]} path Path to look up
 * @returns {Type} Looked up type
 * @throws {Error} If `path` does not point to a type
 */
Namespace.prototype.lookupType = function lookupType(path) {
    var found = this.lookup(path, [ Type ]);
    if (!found)
        throw Error("no such type: " + path);
    return found;
};

/**
 * Looks up the values of the {@link Enum|enum} at the specified path, relative to this namespace.
 * Besides its signature, this methods differs from {@link Namespace#lookup|lookup} in that it throws instead of returning `null`.
 * @param {string|string[]} path Path to look up
 * @returns {Enum} Looked up enum
 * @throws {Error} If `path` does not point to an enum
 */
Namespace.prototype.lookupEnum = function lookupEnum(path) {
    var found = this.lookup(path, [ Enum ]);
    if (!found)
        throw Error("no such Enum '" + path + "' in " + this);
    return found;
};

/**
 * Looks up the {@link Type|type} or {@link Enum|enum} at the specified path, relative to this namespace.
 * Besides its signature, this methods differs from {@link Namespace#lookup|lookup} in that it throws instead of returning `null`.
 * @param {string|string[]} path Path to look up
 * @returns {Type} Looked up type or enum
 * @throws {Error} If `path` does not point to a type or enum
 */
Namespace.prototype.lookupTypeOrEnum = function lookupTypeOrEnum(path) {
    var found = this.lookup(path, [ Type, Enum ]);
    if (!found)
        throw Error("no such Type or Enum '" + path + "' in " + this);
    return found;
};

/**
 * Looks up the {@link Service|service} at the specified path, relative to this namespace.
 * Besides its signature, this methods differs from {@link Namespace#lookup|lookup} in that it throws instead of returning `null`.
 * @param {string|string[]} path Path to look up
 * @returns {Service} Looked up service
 * @throws {Error} If `path` does not point to a service
 */
Namespace.prototype.lookupService = function lookupService(path) {
    var found = this.lookup(path, [ Service ]);
    if (!found)
        throw Error("no such Service '" + path + "' in " + this);
    return found;
};

// Sets up cyclic dependencies (called in index-light)
Namespace._configure = function(Type_, Service_, Enum_) {
    Type    = Type_;
    Service = Service_;
    Enum    = Enum_;
};

},{"./field":16,"./object":23,"./util":34}],23:[function(require,module,exports){
"use strict";
module.exports = ReflectionObject;

ReflectionObject.className = "ReflectionObject";

var util = require("./util");

var Root; // cyclic

/**
 * Constructs a new reflection object instance.
 * @classdesc Base class of all reflection objects.
 * @constructor
 * @param {string} name Object name
 * @param {Object.<string,*>} [options] Declared options
 * @abstract
 */
function ReflectionObject(name, options) {

    if (!util.isString(name))
        throw TypeError("name must be a string");

    if (options && !util.isObject(options))
        throw TypeError("options must be an object");

    /**
     * Options.
     * @type {Object.<string,*>|undefined}
     */
    this.options = options; // toJSON

    /**
     * Unique name within its namespace.
     * @type {string}
     */
    this.name = name;

    /**
     * Parent namespace.
     * @type {Namespace|null}
     */
    this.parent = null;

    /**
     * Whether already resolved or not.
     * @type {boolean}
     */
    this.resolved = false;

    /**
     * Comment text, if any.
     * @type {string|null}
     */
    this.comment = null;

    /**
     * Defining file name.
     * @type {string|null}
     */
    this.filename = null;
}

Object.defineProperties(ReflectionObject.prototype, {

    /**
     * Reference to the root namespace.
     * @name ReflectionObject#root
     * @type {Root}
     * @readonly
     */
    root: {
        get: function() {
            var ptr = this;
            while (ptr.parent !== null)
                ptr = ptr.parent;
            return ptr;
        }
    },

    /**
     * Full name including leading dot.
     * @name ReflectionObject#fullName
     * @type {string}
     * @readonly
     */
    fullName: {
        get: function() {
            var path = [ this.name ],
                ptr = this.parent;
            while (ptr) {
                path.unshift(ptr.name);
                ptr = ptr.parent;
            }
            return path.join(".");
        }
    }
});

/**
 * Converts this reflection object to its descriptor representation.
 * @returns {Object.<string,*>} Descriptor
 * @abstract
 */
ReflectionObject.prototype.toJSON = /* istanbul ignore next */ function toJSON() {
    throw Error(); // not implemented, shouldn't happen
};

/**
 * Called when this object is added to a parent.
 * @param {ReflectionObject} parent Parent added to
 * @returns {undefined}
 */
ReflectionObject.prototype.onAdd = function onAdd(parent) {
    if (this.parent && this.parent !== parent)
        this.parent.remove(this);
    this.parent = parent;
    this.resolved = false;
    var root = parent.root;
    if (root instanceof Root)
        root._handleAdd(this);
};

/**
 * Called when this object is removed from a parent.
 * @param {ReflectionObject} parent Parent removed from
 * @returns {undefined}
 */
ReflectionObject.prototype.onRemove = function onRemove(parent) {
    var root = parent.root;
    if (root instanceof Root)
        root._handleRemove(this);
    this.parent = null;
    this.resolved = false;
};

/**
 * Resolves this objects type references.
 * @returns {ReflectionObject} `this`
 */
ReflectionObject.prototype.resolve = function resolve() {
    if (this.resolved)
        return this;
    if (this.root instanceof Root)
        this.resolved = true; // only if part of a root
    return this;
};

/**
 * Gets an option value.
 * @param {string} name Option name
 * @returns {*} Option value or `undefined` if not set
 */
ReflectionObject.prototype.getOption = function getOption(name) {
    if (this.options)
        return this.options[name];
    return undefined;
};

/**
 * Sets an option.
 * @param {string} name Option name
 * @param {*} value Option value
 * @param {boolean} [ifNotSet] Sets the option only if it isn't currently set
 * @returns {ReflectionObject} `this`
 */
ReflectionObject.prototype.setOption = function setOption(name, value, ifNotSet) {
    if (!ifNotSet || !this.options || this.options[name] === undefined)
        (this.options || (this.options = {}))[name] = value;
    return this;
};

/**
 * Sets multiple options.
 * @param {Object.<string,*>} options Options to set
 * @param {boolean} [ifNotSet] Sets an option only if it isn't currently set
 * @returns {ReflectionObject} `this`
 */
ReflectionObject.prototype.setOptions = function setOptions(options, ifNotSet) {
    if (options)
        for (var keys = Object.keys(options), i = 0; i < keys.length; ++i)
            this.setOption(keys[i], options[keys[i]], ifNotSet);
    return this;
};

/**
 * Converts this instance to its string representation.
 * @returns {string} Class name[, space, full name]
 */
ReflectionObject.prototype.toString = function toString() {
    var className = this.constructor.className,
        fullName  = this.fullName;
    if (fullName.length)
        return className + " " + fullName;
    return className;
};

// Sets up cyclic dependencies (called in index-light)
ReflectionObject._configure = function(Root_) {
    Root = Root_;
};

},{"./util":34}],24:[function(require,module,exports){
"use strict";
module.exports = OneOf;

// extends ReflectionObject
var ReflectionObject = require("./object");
((OneOf.prototype = Object.create(ReflectionObject.prototype)).constructor = OneOf).className = "OneOf";

var Field = require("./field"),
    util  = require("./util");

/**
 * Constructs a new oneof instance.
 * @classdesc Reflected oneof.
 * @extends ReflectionObject
 * @constructor
 * @param {string} name Oneof name
 * @param {string[]|Object.<string,*>} [fieldNames] Field names
 * @param {Object.<string,*>} [options] Declared options
 * @param {string} [comment] Comment associated with this field
 */
function OneOf(name, fieldNames, options, comment) {
    if (!Array.isArray(fieldNames)) {
        options = fieldNames;
        fieldNames = undefined;
    }
    ReflectionObject.call(this, name, options);

    /* istanbul ignore if */
    if (!(fieldNames === undefined || Array.isArray(fieldNames)))
        throw TypeError("fieldNames must be an Array");

    /**
     * Field names that belong to this oneof.
     * @type {string[]}
     */
    this.oneof = fieldNames || []; // toJSON, marker

    /**
     * Fields that belong to this oneof as an array for iteration.
     * @type {Field[]}
     * @readonly
     */
    this.fieldsArray = []; // declared readonly for conformance, possibly not yet added to parent

    /**
     * Comment for this field.
     * @type {string|null}
     */
    this.comment = comment;
}

/**
 * Oneof descriptor.
 * @interface IOneOf
 * @property {Array.<string>} oneof Oneof field names
 * @property {Object.<string,*>} [options] Oneof options
 */

/**
 * Constructs a oneof from a oneof descriptor.
 * @param {string} name Oneof name
 * @param {IOneOf} json Oneof descriptor
 * @returns {OneOf} Created oneof
 * @throws {TypeError} If arguments are invalid
 */
OneOf.fromJSON = function fromJSON(name, json) {
    return new OneOf(name, json.oneof, json.options, json.comment);
};

/**
 * Converts this oneof to a oneof descriptor.
 * @param {IToJSONOptions} [toJSONOptions] JSON conversion options
 * @returns {IOneOf} Oneof descriptor
 */
OneOf.prototype.toJSON = function toJSON(toJSONOptions) {
    var keepComments = toJSONOptions ? Boolean(toJSONOptions.keepComments) : false;
    return util.toObject([
        "options" , this.options,
        "oneof"   , this.oneof,
        "comment" , keepComments ? this.comment : undefined
    ]);
};

/**
 * Adds the fields of the specified oneof to the parent if not already done so.
 * @param {OneOf} oneof The oneof
 * @returns {undefined}
 * @inner
 * @ignore
 */
function addFieldsToParent(oneof) {
    if (oneof.parent)
        for (var i = 0; i < oneof.fieldsArray.length; ++i)
            if (!oneof.fieldsArray[i].parent)
                oneof.parent.add(oneof.fieldsArray[i]);
}

/**
 * Adds a field to this oneof and removes it from its current parent, if any.
 * @param {Field} field Field to add
 * @returns {OneOf} `this`
 */
OneOf.prototype.add = function add(field) {

    /* istanbul ignore if */
    if (!(field instanceof Field))
        throw TypeError("field must be a Field");

    if (field.parent && field.parent !== this.parent)
        field.parent.remove(field);
    this.oneof.push(field.name);
    this.fieldsArray.push(field);
    field.partOf = this; // field.parent remains null
    addFieldsToParent(this);
    return this;
};

/**
 * Removes a field from this oneof and puts it back to the oneof's parent.
 * @param {Field} field Field to remove
 * @returns {OneOf} `this`
 */
OneOf.prototype.remove = function remove(field) {

    /* istanbul ignore if */
    if (!(field instanceof Field))
        throw TypeError("field must be a Field");

    var index = this.fieldsArray.indexOf(field);

    /* istanbul ignore if */
    if (index < 0)
        throw Error(field + " is not a member of " + this);

    this.fieldsArray.splice(index, 1);
    index = this.oneof.indexOf(field.name);

    /* istanbul ignore else */
    if (index > -1) // theoretical
        this.oneof.splice(index, 1);

    field.partOf = null;
    return this;
};

/**
 * @override
 */
OneOf.prototype.onAdd = function onAdd(parent) {
    ReflectionObject.prototype.onAdd.call(this, parent);
    var self = this;
    // Collect present fields
    for (var i = 0; i < this.oneof.length; ++i) {
        var field = parent.get(this.oneof[i]);
        if (field && !field.partOf) {
            field.partOf = self;
            self.fieldsArray.push(field);
        }
    }
    // Add not yet present fields
    addFieldsToParent(this);
};

/**
 * @override
 */
OneOf.prototype.onRemove = function onRemove(parent) {
    for (var i = 0, field; i < this.fieldsArray.length; ++i)
        if ((field = this.fieldsArray[i]).parent)
            field.parent.remove(field);
    ReflectionObject.prototype.onRemove.call(this, parent);
};

/**
 * Decorator function as returned by {@link OneOf.d} (TypeScript).
 * @typedef OneOfDecorator
 * @type {function}
 * @param {Object} prototype Target prototype
 * @param {string} oneofName OneOf name
 * @returns {undefined}
 */

/**
 * OneOf decorator (TypeScript).
 * @function
 * @param {...string} fieldNames Field names
 * @returns {OneOfDecorator} Decorator function
 * @template T extends string
 */
OneOf.d = function decorateOneOf() {
    var fieldNames = new Array(arguments.length),
        index = 0;
    while (index < arguments.length)
        fieldNames[index] = arguments[index++];
    return function oneOfDecorator(prototype, oneofName) {
        util.decorateType(prototype.constructor)
            .add(new OneOf(oneofName, fieldNames));
        Object.defineProperty(prototype, oneofName, {
            get: util.oneOfGetter(fieldNames),
            set: util.oneOfSetter(fieldNames)
        });
    };
};

},{"./field":16,"./object":23,"./util":34}],25:[function(require,module,exports){
"use strict";
module.exports = Reader;

var util      = require("./util/minimal");

var BufferReader; // cyclic

var LongBits  = util.LongBits,
    utf8      = util.utf8;

/* istanbul ignore next */
function indexOutOfRange(reader, writeLength) {
    return RangeError("index out of range: " + reader.pos + " + " + (writeLength || 1) + " > " + reader.len);
}

/**
 * Constructs a new reader instance using the specified buffer.
 * @classdesc Wire format reader using `Uint8Array` if available, otherwise `Array`.
 * @constructor
 * @param {Uint8Array} buffer Buffer to read from
 */
function Reader(buffer) {

    /**
     * Read buffer.
     * @type {Uint8Array}
     */
    this.buf = buffer;

    /**
     * Read buffer position.
     * @type {number}
     */
    this.pos = 0;

    /**
     * Read buffer length.
     * @type {number}
     */
    this.len = buffer.length;
}

var create_array = typeof Uint8Array !== "undefined"
    ? function create_typed_array(buffer) {
        if (buffer instanceof Uint8Array || Array.isArray(buffer))
            return new Reader(buffer);
        throw Error("illegal buffer");
    }
    /* istanbul ignore next */
    : function create_array(buffer) {
        if (Array.isArray(buffer))
            return new Reader(buffer);
        throw Error("illegal buffer");
    };

/**
 * Creates a new reader using the specified buffer.
 * @function
 * @param {Uint8Array|Buffer} buffer Buffer to read from
 * @returns {Reader|BufferReader} A {@link BufferReader} if `buffer` is a Buffer, otherwise a {@link Reader}
 * @throws {Error} If `buffer` is not a valid buffer
 */
Reader.create = util.Buffer
    ? function create_buffer_setup(buffer) {
        return (Reader.create = function create_buffer(buffer) {
            return util.Buffer.isBuffer(buffer)
                ? new BufferReader(buffer)
                /* istanbul ignore next */
                : create_array(buffer);
        })(buffer);
    }
    /* istanbul ignore next */
    : create_array;

Reader.prototype._slice = util.Array.prototype.subarray || /* istanbul ignore next */ util.Array.prototype.slice;

/**
 * Reads a varint as an unsigned 32 bit value.
 * @function
 * @returns {number} Value read
 */
Reader.prototype.uint32 = (function read_uint32_setup() {
    var value = 4294967295; // optimizer type-hint, tends to deopt otherwise (?!)
    return function read_uint32() {
        value = (         this.buf[this.pos] & 127       ) >>> 0; if (this.buf[this.pos++] < 128) return value;
        value = (value | (this.buf[this.pos] & 127) <<  7) >>> 0; if (this.buf[this.pos++] < 128) return value;
        value = (value | (this.buf[this.pos] & 127) << 14) >>> 0; if (this.buf[this.pos++] < 128) return value;
        value = (value | (this.buf[this.pos] & 127) << 21) >>> 0; if (this.buf[this.pos++] < 128) return value;
        value = (value | (this.buf[this.pos] &  15) << 28) >>> 0; if (this.buf[this.pos++] < 128) return value;

        /* istanbul ignore if */
        if ((this.pos += 5) > this.len) {
            this.pos = this.len;
            throw indexOutOfRange(this, 10);
        }
        return value;
    };
})();

/**
 * Reads a varint as a signed 32 bit value.
 * @returns {number} Value read
 */
Reader.prototype.int32 = function read_int32() {
    return this.uint32() | 0;
};

/**
 * Reads a zig-zag encoded varint as a signed 32 bit value.
 * @returns {number} Value read
 */
Reader.prototype.sint32 = function read_sint32() {
    var value = this.uint32();
    return value >>> 1 ^ -(value & 1) | 0;
};

/* eslint-disable no-invalid-this */

function readLongVarint() {
    // tends to deopt with local vars for octet etc.
    var bits = new LongBits(0, 0);
    var i = 0;
    if (this.len - this.pos > 4) { // fast route (lo)
        for (; i < 4; ++i) {
            // 1st..4th
            bits.lo = (bits.lo | (this.buf[this.pos] & 127) << i * 7) >>> 0;
            if (this.buf[this.pos++] < 128)
                return bits;
        }
        // 5th
        bits.lo = (bits.lo | (this.buf[this.pos] & 127) << 28) >>> 0;
        bits.hi = (bits.hi | (this.buf[this.pos] & 127) >>  4) >>> 0;
        if (this.buf[this.pos++] < 128)
            return bits;
        i = 0;
    } else {
        for (; i < 3; ++i) {
            /* istanbul ignore if */
            if (this.pos >= this.len)
                throw indexOutOfRange(this);
            // 1st..3th
            bits.lo = (bits.lo | (this.buf[this.pos] & 127) << i * 7) >>> 0;
            if (this.buf[this.pos++] < 128)
                return bits;
        }
        // 4th
        bits.lo = (bits.lo | (this.buf[this.pos++] & 127) << i * 7) >>> 0;
        return bits;
    }
    if (this.len - this.pos > 4) { // fast route (hi)
        for (; i < 5; ++i) {
            // 6th..10th
            bits.hi = (bits.hi | (this.buf[this.pos] & 127) << i * 7 + 3) >>> 0;
            if (this.buf[this.pos++] < 128)
                return bits;
        }
    } else {
        for (; i < 5; ++i) {
            /* istanbul ignore if */
            if (this.pos >= this.len)
                throw indexOutOfRange(this);
            // 6th..10th
            bits.hi = (bits.hi | (this.buf[this.pos] & 127) << i * 7 + 3) >>> 0;
            if (this.buf[this.pos++] < 128)
                return bits;
        }
    }
    /* istanbul ignore next */
    throw Error("invalid varint encoding");
}

/* eslint-enable no-invalid-this */

/**
 * Reads a varint as a signed 64 bit value.
 * @name Reader#int64
 * @function
 * @returns {Long} Value read
 */

/**
 * Reads a varint as an unsigned 64 bit value.
 * @name Reader#uint64
 * @function
 * @returns {Long} Value read
 */

/**
 * Reads a zig-zag encoded varint as a signed 64 bit value.
 * @name Reader#sint64
 * @function
 * @returns {Long} Value read
 */

/**
 * Reads a varint as a boolean.
 * @returns {boolean} Value read
 */
Reader.prototype.bool = function read_bool() {
    return this.uint32() !== 0;
};

function readFixed32_end(buf, end) { // note that this uses `end`, not `pos`
    return (buf[end - 4]
          | buf[end - 3] << 8
          | buf[end - 2] << 16
          | buf[end - 1] << 24) >>> 0;
}

/**
 * Reads fixed 32 bits as an unsigned 32 bit integer.
 * @returns {number} Value read
 */
Reader.prototype.fixed32 = function read_fixed32() {

    /* istanbul ignore if */
    if (this.pos + 4 > this.len)
        throw indexOutOfRange(this, 4);

    return readFixed32_end(this.buf, this.pos += 4);
};

/**
 * Reads fixed 32 bits as a signed 32 bit integer.
 * @returns {number} Value read
 */
Reader.prototype.sfixed32 = function read_sfixed32() {

    /* istanbul ignore if */
    if (this.pos + 4 > this.len)
        throw indexOutOfRange(this, 4);

    return readFixed32_end(this.buf, this.pos += 4) | 0;
};

/* eslint-disable no-invalid-this */

function readFixed64(/* this: Reader */) {

    /* istanbul ignore if */
    if (this.pos + 8 > this.len)
        throw indexOutOfRange(this, 8);

    return new LongBits(readFixed32_end(this.buf, this.pos += 4), readFixed32_end(this.buf, this.pos += 4));
}

/* eslint-enable no-invalid-this */

/**
 * Reads fixed 64 bits.
 * @name Reader#fixed64
 * @function
 * @returns {Long} Value read
 */

/**
 * Reads zig-zag encoded fixed 64 bits.
 * @name Reader#sfixed64
 * @function
 * @returns {Long} Value read
 */

/**
 * Reads a float (32 bit) as a number.
 * @function
 * @returns {number} Value read
 */
Reader.prototype.float = function read_float() {

    /* istanbul ignore if */
    if (this.pos + 4 > this.len)
        throw indexOutOfRange(this, 4);

    var value = util.float.readFloatLE(this.buf, this.pos);
    this.pos += 4;
    return value;
};

/**
 * Reads a double (64 bit float) as a number.
 * @function
 * @returns {number} Value read
 */
Reader.prototype.double = function read_double() {

    /* istanbul ignore if */
    if (this.pos + 8 > this.len)
        throw indexOutOfRange(this, 4);

    var value = util.float.readDoubleLE(this.buf, this.pos);
    this.pos += 8;
    return value;
};

/**
 * Reads a sequence of bytes preceeded by its length as a varint.
 * @returns {Uint8Array} Value read
 */
Reader.prototype.bytes = function read_bytes() {
    var length = this.uint32(),
        start  = this.pos,
        end    = this.pos + length;

    /* istanbul ignore if */
    if (end > this.len)
        throw indexOutOfRange(this, length);

    this.pos += length;
    if (Array.isArray(this.buf)) // plain array
        return this.buf.slice(start, end);
    return start === end // fix for IE 10/Win8 and others' subarray returning array of size 1
        ? new this.buf.constructor(0)
        : this._slice.call(this.buf, start, end);
};

/**
 * Reads a string preceeded by its byte length as a varint.
 * @returns {string} Value read
 */
Reader.prototype.string = function read_string() {
    var bytes = this.bytes();
    return utf8.read(bytes, 0, bytes.length);
};

/**
 * Skips the specified number of bytes if specified, otherwise skips a varint.
 * @param {number} [length] Length if known, otherwise a varint is assumed
 * @returns {Reader} `this`
 */
Reader.prototype.skip = function skip(length) {
    if (typeof length === "number") {
        /* istanbul ignore if */
        if (this.pos + length > this.len)
            throw indexOutOfRange(this, length);
        this.pos += length;
    } else {
        do {
            /* istanbul ignore if */
            if (this.pos >= this.len)
                throw indexOutOfRange(this);
        } while (this.buf[this.pos++] & 128);
    }
    return this;
};

/**
 * Skips the next element of the specified wire type.
 * @param {number} wireType Wire type received
 * @returns {Reader} `this`
 */
Reader.prototype.skipType = function(wireType) {
    switch (wireType) {
        case 0:
            this.skip();
            break;
        case 1:
            this.skip(8);
            break;
        case 2:
            this.skip(this.uint32());
            break;
        case 3:
            while ((wireType = this.uint32() & 7) !== 4) {
                this.skipType(wireType);
            }
            break;
        case 5:
            this.skip(4);
            break;

        /* istanbul ignore next */
        default:
            throw Error("invalid wire type " + wireType + " at offset " + this.pos);
    }
    return this;
};

Reader._configure = function(BufferReader_) {
    BufferReader = BufferReader_;

    var fn = util.Long ? "toLong" : /* istanbul ignore next */ "toNumber";
    util.merge(Reader.prototype, {

        int64: function read_int64() {
            return readLongVarint.call(this)[fn](false);
        },

        uint64: function read_uint64() {
            return readLongVarint.call(this)[fn](true);
        },

        sint64: function read_sint64() {
            return readLongVarint.call(this).zzDecode()[fn](false);
        },

        fixed64: function read_fixed64() {
            return readFixed64.call(this)[fn](true);
        },

        sfixed64: function read_sfixed64() {
            return readFixed64.call(this)[fn](false);
        }

    });
};

},{"./util/minimal":36}],26:[function(require,module,exports){
"use strict";
module.exports = BufferReader;

// extends Reader
var Reader = require("./reader");
(BufferReader.prototype = Object.create(Reader.prototype)).constructor = BufferReader;

var util = require("./util/minimal");

/**
 * Constructs a new buffer reader instance.
 * @classdesc Wire format reader using node buffers.
 * @extends Reader
 * @constructor
 * @param {Buffer} buffer Buffer to read from
 */
function BufferReader(buffer) {
    Reader.call(this, buffer);

    /**
     * Read buffer.
     * @name BufferReader#buf
     * @type {Buffer}
     */
}

/* istanbul ignore else */
if (util.Buffer)
    BufferReader.prototype._slice = util.Buffer.prototype.slice;

/**
 * @override
 */
BufferReader.prototype.string = function read_string_buffer() {
    var len = this.uint32(); // modifies pos
    return this.buf.utf8Slice(this.pos, this.pos = Math.min(this.pos + len, this.len));
};

/**
 * Reads a sequence of bytes preceeded by its length as a varint.
 * @name BufferReader#bytes
 * @function
 * @returns {Buffer} Value read
 */

},{"./reader":25,"./util/minimal":36}],27:[function(require,module,exports){
"use strict";
module.exports = Root;

// extends Namespace
var Namespace = require("./namespace");
((Root.prototype = Object.create(Namespace.prototype)).constructor = Root).className = "Root";

var Field   = require("./field"),
    Enum    = require("./enum"),
    OneOf   = require("./oneof"),
    util    = require("./util");

var Type,   // cyclic
    parse,  // might be excluded
    common; // "

/**
 * Constructs a new root namespace instance.
 * @classdesc Root namespace wrapping all types, enums, services, sub-namespaces etc. that belong together.
 * @extends NamespaceBase
 * @constructor
 * @param {Object.<string,*>} [options] Top level options
 */
function Root(options) {
    Namespace.call(this, "", options);

    /**
     * Deferred extension fields.
     * @type {Field[]}
     */
    this.deferred = [];

    /**
     * Resolved file names of loaded files.
     * @type {string[]}
     */
    this.files = [];
}

/**
 * Loads a namespace descriptor into a root namespace.
 * @param {INamespace} json Nameespace descriptor
 * @param {Root} [root] Root namespace, defaults to create a new one if omitted
 * @returns {Root} Root namespace
 */
Root.fromJSON = function fromJSON(json, root) {
    if (!root)
        root = new Root();
    if (json.options)
        root.setOptions(json.options);
    return root.addJSON(json.nested);
};

/**
 * Resolves the path of an imported file, relative to the importing origin.
 * This method exists so you can override it with your own logic in case your imports are scattered over multiple directories.
 * @function
 * @param {string} origin The file name of the importing file
 * @param {string} target The file name being imported
 * @returns {string|null} Resolved path to `target` or `null` to skip the file
 */
Root.prototype.resolvePath = util.path.resolve;

// A symbol-like function to safely signal synchronous loading
/* istanbul ignore next */
function SYNC() {} // eslint-disable-line no-empty-function

/**
 * Loads one or multiple .proto or preprocessed .json files into this root namespace and calls the callback.
 * @param {string|string[]} filename Names of one or multiple files to load
 * @param {IParseOptions} options Parse options
 * @param {LoadCallback} callback Callback function
 * @returns {undefined}
 */
Root.prototype.load = function load(filename, options, callback) {
    if (typeof options === "function") {
        callback = options;
        options = undefined;
    }
    var self = this;
    if (!callback)
        return util.asPromise(load, self, filename, options);

    var sync = callback === SYNC; // undocumented

    // Finishes loading by calling the callback (exactly once)
    function finish(err, root) {
        /* istanbul ignore if */
        if (!callback)
            return;
        var cb = callback;
        callback = null;
        if (sync)
            throw err;
        cb(err, root);
    }

    // Processes a single file
    function process(filename, source) {
        try {
            if (util.isString(source) && source.charAt(0) === "{")
                source = JSON.parse(source);
            if (!util.isString(source))
                self.setOptions(source.options).addJSON(source.nested);
            else {
                parse.filename = filename;
                var parsed = parse(source, self, options),
                    resolved,
                    i = 0;
                if (parsed.imports)
                    for (; i < parsed.imports.length; ++i)
                        if (resolved = self.resolvePath(filename, parsed.imports[i]))
                            fetch(resolved);
                if (parsed.weakImports)
                    for (i = 0; i < parsed.weakImports.length; ++i)
                        if (resolved = self.resolvePath(filename, parsed.weakImports[i]))
                            fetch(resolved, true);
            }
        } catch (err) {
            finish(err);
        }
        if (!sync && !queued)
            finish(null, self); // only once anyway
    }

    // Fetches a single file
    function fetch(filename, weak) {

        // Strip path if this file references a bundled definition
        var idx = filename.lastIndexOf("google/protobuf/");
        if (idx > -1) {
            var altname = filename.substring(idx);
            if (altname in common)
                filename = altname;
        }

        // Skip if already loaded / attempted
        if (self.files.indexOf(filename) > -1)
            return;
        self.files.push(filename);

        // Shortcut bundled definitions
        if (filename in common) {
            if (sync)
                process(filename, common[filename]);
            else {
                ++queued;
                setTimeout(function() {
                    --queued;
                    process(filename, common[filename]);
                });
            }
            return;
        }

        // Otherwise fetch from disk or network
        if (sync) {
            var source;
            try {
                source = util.fs.readFileSync(filename).toString("utf8");
            } catch (err) {
                if (!weak)
                    finish(err);
                return;
            }
            process(filename, source);
        } else {
            ++queued;
            util.fetch(filename, function(err, source) {
                --queued;
                /* istanbul ignore if */
                if (!callback)
                    return; // terminated meanwhile
                if (err) {
                    /* istanbul ignore else */
                    if (!weak)
                        finish(err);
                    else if (!queued) // can't be covered reliably
                        finish(null, self);
                    return;
                }
                process(filename, source);
            });
        }
    }
    var queued = 0;

    // Assembling the root namespace doesn't require working type
    // references anymore, so we can load everything in parallel
    if (util.isString(filename))
        filename = [ filename ];
    for (var i = 0, resolved; i < filename.length; ++i)
        if (resolved = self.resolvePath("", filename[i]))
            fetch(resolved);

    if (sync)
        return self;
    if (!queued)
        finish(null, self);
    return undefined;
};
// function load(filename:string, options:IParseOptions, callback:LoadCallback):undefined

/**
 * Loads one or multiple .proto or preprocessed .json files into this root namespace and calls the callback.
 * @function Root#load
 * @param {string|string[]} filename Names of one or multiple files to load
 * @param {LoadCallback} callback Callback function
 * @returns {undefined}
 * @variation 2
 */
// function load(filename:string, callback:LoadCallback):undefined

/**
 * Loads one or multiple .proto or preprocessed .json files into this root namespace and returns a promise.
 * @function Root#load
 * @param {string|string[]} filename Names of one or multiple files to load
 * @param {IParseOptions} [options] Parse options. Defaults to {@link parse.defaults} when omitted.
 * @returns {Promise<Root>} Promise
 * @variation 3
 */
// function load(filename:string, [options:IParseOptions]):Promise<Root>

/**
 * Synchronously loads one or multiple .proto or preprocessed .json files into this root namespace (node only).
 * @function Root#loadSync
 * @param {string|string[]} filename Names of one or multiple files to load
 * @param {IParseOptions} [options] Parse options. Defaults to {@link parse.defaults} when omitted.
 * @returns {Root} Root namespace
 * @throws {Error} If synchronous fetching is not supported (i.e. in browsers) or if a file's syntax is invalid
 */
Root.prototype.loadSync = function loadSync(filename, options) {
    if (!util.isNode)
        throw Error("not supported");
    return this.load(filename, options, SYNC);
};

/**
 * @override
 */
Root.prototype.resolveAll = function resolveAll() {
    if (this.deferred.length)
        throw Error("unresolvable extensions: " + this.deferred.map(function(field) {
            return "'extend " + field.extend + "' in " + field.parent.fullName;
        }).join(", "));
    return Namespace.prototype.resolveAll.call(this);
};

// only uppercased (and thus conflict-free) children are exposed, see below
var exposeRe = /^[A-Z]/;

/**
 * Handles a deferred declaring extension field by creating a sister field to represent it within its extended type.
 * @param {Root} root Root instance
 * @param {Field} field Declaring extension field witin the declaring type
 * @returns {boolean} `true` if successfully added to the extended type, `false` otherwise
 * @inner
 * @ignore
 */
function tryHandleExtension(root, field) {
    var extendedType = field.parent.lookup(field.extend);
    if (extendedType) {
        var sisterField = new Field(field.fullName, field.id, field.type, field.rule, undefined, field.options);
        sisterField.declaringField = field;
        field.extensionField = sisterField;
        extendedType.add(sisterField);
        return true;
    }
    return false;
}

/**
 * Called when any object is added to this root or its sub-namespaces.
 * @param {ReflectionObject} object Object added
 * @returns {undefined}
 * @private
 */
Root.prototype._handleAdd = function _handleAdd(object) {
    if (object instanceof Field) {

        if (/* an extension field (implies not part of a oneof) */ object.extend !== undefined && /* not already handled */ !object.extensionField)
            if (!tryHandleExtension(this, object))
                this.deferred.push(object);

    } else if (object instanceof Enum) {

        if (exposeRe.test(object.name))
            object.parent[object.name] = object.values; // expose enum values as property of its parent

    } else if (!(object instanceof OneOf)) /* everything else is a namespace */ {

        if (object instanceof Type) // Try to handle any deferred extensions
            for (var i = 0; i < this.deferred.length;)
                if (tryHandleExtension(this, this.deferred[i]))
                    this.deferred.splice(i, 1);
                else
                    ++i;
        for (var j = 0; j < /* initializes */ object.nestedArray.length; ++j) // recurse into the namespace
            this._handleAdd(object._nestedArray[j]);
        if (exposeRe.test(object.name))
            object.parent[object.name] = object; // expose namespace as property of its parent
    }

    // The above also adds uppercased (and thus conflict-free) nested types, services and enums as
    // properties of namespaces just like static code does. This allows using a .d.ts generated for
    // a static module with reflection-based solutions where the condition is met.
};

/**
 * Called when any object is removed from this root or its sub-namespaces.
 * @param {ReflectionObject} object Object removed
 * @returns {undefined}
 * @private
 */
Root.prototype._handleRemove = function _handleRemove(object) {
    if (object instanceof Field) {

        if (/* an extension field */ object.extend !== undefined) {
            if (/* already handled */ object.extensionField) { // remove its sister field
                object.extensionField.parent.remove(object.extensionField);
                object.extensionField = null;
            } else { // cancel the extension
                var index = this.deferred.indexOf(object);
                /* istanbul ignore else */
                if (index > -1)
                    this.deferred.splice(index, 1);
            }
        }

    } else if (object instanceof Enum) {

        if (exposeRe.test(object.name))
            delete object.parent[object.name]; // unexpose enum values

    } else if (object instanceof Namespace) {

        for (var i = 0; i < /* initializes */ object.nestedArray.length; ++i) // recurse into the namespace
            this._handleRemove(object._nestedArray[i]);

        if (exposeRe.test(object.name))
            delete object.parent[object.name]; // unexpose namespaces

    }
};

// Sets up cyclic dependencies (called in index-light)
Root._configure = function(Type_, parse_, common_) {
    Type   = Type_;
    parse  = parse_;
    common = common_;
};

},{"./enum":15,"./field":16,"./namespace":22,"./oneof":24,"./util":34}],28:[function(require,module,exports){
"use strict";
module.exports = {};

/**
 * Named roots.
 * This is where pbjs stores generated structures (the option `-r, --root` specifies a name).
 * Can also be used manually to make roots available accross modules.
 * @name roots
 * @type {Object.<string,Root>}
 * @example
 * // pbjs -r myroot -o compiled.js ...
 *
 * // in another module:
 * require("./compiled.js");
 *
 * // in any subsequent module:
 * var root = protobuf.roots["myroot"];
 */

},{}],29:[function(require,module,exports){
"use strict";

/**
 * Streaming RPC helpers.
 * @namespace
 */
var rpc = exports;

/**
 * RPC implementation passed to {@link Service#create} performing a service request on network level, i.e. by utilizing http requests or websockets.
 * @typedef RPCImpl
 * @type {function}
 * @param {Method|rpc.ServiceMethod<Message<{}>,Message<{}>>} method Reflected or static method being called
 * @param {Uint8Array} requestData Request data
 * @param {RPCImplCallback} callback Callback function
 * @returns {undefined}
 * @example
 * function rpcImpl(method, requestData, callback) {
 *     if (protobuf.util.lcFirst(method.name) !== "myMethod") // compatible with static code
 *         throw Error("no such method");
 *     asynchronouslyObtainAResponse(requestData, function(err, responseData) {
 *         callback(err, responseData);
 *     });
 * }
 */

/**
 * Node-style callback as used by {@link RPCImpl}.
 * @typedef RPCImplCallback
 * @type {function}
 * @param {Error|null} error Error, if any, otherwise `null`
 * @param {Uint8Array|null} [response] Response data or `null` to signal end of stream, if there hasn't been an error
 * @returns {undefined}
 */

rpc.Service = require("./rpc/service");

},{"./rpc/service":30}],30:[function(require,module,exports){
"use strict";
module.exports = Service;

var util = require("../util/minimal");

// Extends EventEmitter
(Service.prototype = Object.create(util.EventEmitter.prototype)).constructor = Service;

/**
 * A service method callback as used by {@link rpc.ServiceMethod|ServiceMethod}.
 *
 * Differs from {@link RPCImplCallback} in that it is an actual callback of a service method which may not return `response = null`.
 * @typedef rpc.ServiceMethodCallback
 * @template TRes extends Message<TRes>
 * @type {function}
 * @param {Error|null} error Error, if any
 * @param {TRes} [response] Response message
 * @returns {undefined}
 */

/**
 * A service method part of a {@link rpc.Service} as created by {@link Service.create}.
 * @typedef rpc.ServiceMethod
 * @template TReq extends Message<TReq>
 * @template TRes extends Message<TRes>
 * @type {function}
 * @param {TReq|Properties<TReq>} request Request message or plain object
 * @param {rpc.ServiceMethodCallback<TRes>} [callback] Node-style callback called with the error, if any, and the response message
 * @returns {Promise<Message<TRes>>} Promise if `callback` has been omitted, otherwise `undefined`
 */

/**
 * Constructs a new RPC service instance.
 * @classdesc An RPC service as returned by {@link Service#create}.
 * @exports rpc.Service
 * @extends util.EventEmitter
 * @constructor
 * @param {RPCImpl} rpcImpl RPC implementation
 * @param {boolean} [requestDelimited=false] Whether requests are length-delimited
 * @param {boolean} [responseDelimited=false] Whether responses are length-delimited
 */
function Service(rpcImpl, requestDelimited, responseDelimited) {

    if (typeof rpcImpl !== "function")
        throw TypeError("rpcImpl must be a function");

    util.EventEmitter.call(this);

    /**
     * RPC implementation. Becomes `null` once the service is ended.
     * @type {RPCImpl|null}
     */
    this.rpcImpl = rpcImpl;

    /**
     * Whether requests are length-delimited.
     * @type {boolean}
     */
    this.requestDelimited = Boolean(requestDelimited);

    /**
     * Whether responses are length-delimited.
     * @type {boolean}
     */
    this.responseDelimited = Boolean(responseDelimited);
}

/**
 * Calls a service method through {@link rpc.Service#rpcImpl|rpcImpl}.
 * @param {Method|rpc.ServiceMethod<TReq,TRes>} method Reflected or static method
 * @param {Constructor<TReq>} requestCtor Request constructor
 * @param {Constructor<TRes>} responseCtor Response constructor
 * @param {TReq|Properties<TReq>} request Request message or plain object
 * @param {rpc.ServiceMethodCallback<TRes>} callback Service callback
 * @returns {undefined}
 * @template TReq extends Message<TReq>
 * @template TRes extends Message<TRes>
 */
Service.prototype.rpcCall = function rpcCall(method, requestCtor, responseCtor, request, callback) {

    if (!request)
        throw TypeError("request must be specified");

    var self = this;
    if (!callback)
        return util.asPromise(rpcCall, self, method, requestCtor, responseCtor, request);

    if (!self.rpcImpl) {
        setTimeout(function() { callback(Error("already ended")); }, 0);
        return undefined;
    }

    try {
        return self.rpcImpl(
            method,
            requestCtor[self.requestDelimited ? "encodeDelimited" : "encode"](request).finish(),
            function rpcCallback(err, response) {

                if (err) {
                    self.emit("error", err, method);
                    return callback(err);
                }

                if (response === null) {
                    self.end(/* endedByRPC */ true);
                    return undefined;
                }

                if (!(response instanceof responseCtor)) {
                    try {
                        response = responseCtor[self.responseDelimited ? "decodeDelimited" : "decode"](response);
                    } catch (err) {
                        self.emit("error", err, method);
                        return callback(err);
                    }
                }

                self.emit("data", response, method);
                return callback(null, response);
            }
        );
    } catch (err) {
        self.emit("error", err, method);
        setTimeout(function() { callback(err); }, 0);
        return undefined;
    }
};

/**
 * Ends this service and emits the `end` event.
 * @param {boolean} [endedByRPC=false] Whether the service has been ended by the RPC implementation.
 * @returns {rpc.Service} `this`
 */
Service.prototype.end = function end(endedByRPC) {
    if (this.rpcImpl) {
        if (!endedByRPC) // signal end to rpcImpl
            this.rpcImpl(null, null, null);
        this.rpcImpl = null;
        this.emit("end").off();
    }
    return this;
};

},{"../util/minimal":36}],31:[function(require,module,exports){
"use strict";
module.exports = Service;

// extends Namespace
var Namespace = require("./namespace");
((Service.prototype = Object.create(Namespace.prototype)).constructor = Service).className = "Service";

var Method = require("./method"),
    util   = require("./util"),
    rpc    = require("./rpc");

/**
 * Constructs a new service instance.
 * @classdesc Reflected service.
 * @extends NamespaceBase
 * @constructor
 * @param {string} name Service name
 * @param {Object.<string,*>} [options] Service options
 * @throws {TypeError} If arguments are invalid
 */
function Service(name, options) {
    Namespace.call(this, name, options);

    /**
     * Service methods.
     * @type {Object.<string,Method>}
     */
    this.methods = {}; // toJSON, marker

    /**
     * Cached methods as an array.
     * @type {Method[]|null}
     * @private
     */
    this._methodsArray = null;
}

/**
 * Service descriptor.
 * @interface IService
 * @extends INamespace
 * @property {Object.<string,IMethod>} methods Method descriptors
 */

/**
 * Constructs a service from a service descriptor.
 * @param {string} name Service name
 * @param {IService} json Service descriptor
 * @returns {Service} Created service
 * @throws {TypeError} If arguments are invalid
 */
Service.fromJSON = function fromJSON(name, json) {
    var service = new Service(name, json.options);
    /* istanbul ignore else */
    if (json.methods)
        for (var names = Object.keys(json.methods), i = 0; i < names.length; ++i)
            service.add(Method.fromJSON(names[i], json.methods[names[i]]));
    if (json.nested)
        service.addJSON(json.nested);
    service.comment = json.comment;
    return service;
};

/**
 * Converts this service to a service descriptor.
 * @param {IToJSONOptions} [toJSONOptions] JSON conversion options
 * @returns {IService} Service descriptor
 */
Service.prototype.toJSON = function toJSON(toJSONOptions) {
    var inherited = Namespace.prototype.toJSON.call(this, toJSONOptions);
    var keepComments = toJSONOptions ? Boolean(toJSONOptions.keepComments) : false;
    return util.toObject([
        "options" , inherited && inherited.options || undefined,
        "methods" , Namespace.arrayToJSON(this.methodsArray, toJSONOptions) || /* istanbul ignore next */ {},
        "nested"  , inherited && inherited.nested || undefined,
        "comment" , keepComments ? this.comment : undefined
    ]);
};

/**
 * Methods of this service as an array for iteration.
 * @name Service#methodsArray
 * @type {Method[]}
 * @readonly
 */
Object.defineProperty(Service.prototype, "methodsArray", {
    get: function() {
        return this._methodsArray || (this._methodsArray = util.toArray(this.methods));
    }
});

function clearCache(service) {
    service._methodsArray = null;
    return service;
}

/**
 * @override
 */
Service.prototype.get = function get(name) {
    return this.methods[name]
        || Namespace.prototype.get.call(this, name);
};

/**
 * @override
 */
Service.prototype.resolveAll = function resolveAll() {
    var methods = this.methodsArray;
    for (var i = 0; i < methods.length; ++i)
        methods[i].resolve();
    return Namespace.prototype.resolve.call(this);
};

/**
 * @override
 */
Service.prototype.add = function add(object) {

    /* istanbul ignore if */
    if (this.get(object.name))
        throw Error("duplicate name '" + object.name + "' in " + this);

    if (object instanceof Method) {
        this.methods[object.name] = object;
        object.parent = this;
        return clearCache(this);
    }
    return Namespace.prototype.add.call(this, object);
};

/**
 * @override
 */
Service.prototype.remove = function remove(object) {
    if (object instanceof Method) {

        /* istanbul ignore if */
        if (this.methods[object.name] !== object)
            throw Error(object + " is not a member of " + this);

        delete this.methods[object.name];
        object.parent = null;
        return clearCache(this);
    }
    return Namespace.prototype.remove.call(this, object);
};

/**
 * Creates a runtime service using the specified rpc implementation.
 * @param {RPCImpl} rpcImpl RPC implementation
 * @param {boolean} [requestDelimited=false] Whether requests are length-delimited
 * @param {boolean} [responseDelimited=false] Whether responses are length-delimited
 * @returns {rpc.Service} RPC service. Useful where requests and/or responses are streamed.
 */
Service.prototype.create = function create(rpcImpl, requestDelimited, responseDelimited) {
    var rpcService = new rpc.Service(rpcImpl, requestDelimited, responseDelimited);
    for (var i = 0, method; i < /* initializes */ this.methodsArray.length; ++i) {
        var methodName = util.lcFirst((method = this._methodsArray[i]).resolve().name).replace(/[^$\w_]/g, "");
        rpcService[methodName] = util.codegen(["r","c"], util.isReserved(methodName) ? methodName + "_" : methodName)("return this.rpcCall(m,q,s,r,c)")({
            m: method,
            q: method.resolvedRequestType.ctor,
            s: method.resolvedResponseType.ctor
        });
    }
    return rpcService;
};

},{"./method":21,"./namespace":22,"./rpc":29,"./util":34}],32:[function(require,module,exports){
"use strict";
module.exports = Type;

// extends Namespace
var Namespace = require("./namespace");
((Type.prototype = Object.create(Namespace.prototype)).constructor = Type).className = "Type";

var Enum      = require("./enum"),
    OneOf     = require("./oneof"),
    Field     = require("./field"),
    MapField  = require("./mapfield"),
    Service   = require("./service"),
    Message   = require("./message"),
    Reader    = require("./reader"),
    Writer    = require("./writer"),
    util      = require("./util"),
    encoder   = require("./encoder"),
    decoder   = require("./decoder"),
    verifier  = require("./verifier"),
    converter = require("./converter"),
    wrappers  = require("./wrappers");

/**
 * Constructs a new reflected message type instance.
 * @classdesc Reflected message type.
 * @extends NamespaceBase
 * @constructor
 * @param {string} name Message name
 * @param {Object.<string,*>} [options] Declared options
 */
function Type(name, options) {
    Namespace.call(this, name, options);

    /**
     * Message fields.
     * @type {Object.<string,Field>}
     */
    this.fields = {};  // toJSON, marker

    /**
     * Oneofs declared within this namespace, if any.
     * @type {Object.<string,OneOf>}
     */
    this.oneofs = undefined; // toJSON

    /**
     * Extension ranges, if any.
     * @type {number[][]}
     */
    this.extensions = undefined; // toJSON

    /**
     * Reserved ranges, if any.
     * @type {Array.<number[]|string>}
     */
    this.reserved = undefined; // toJSON

    /*?
     * Whether this type is a legacy group.
     * @type {boolean|undefined}
     */
    this.group = undefined; // toJSON

    /**
     * Cached fields by id.
     * @type {Object.<number,Field>|null}
     * @private
     */
    this._fieldsById = null;

    /**
     * Cached fields as an array.
     * @type {Field[]|null}
     * @private
     */
    this._fieldsArray = null;

    /**
     * Cached oneofs as an array.
     * @type {OneOf[]|null}
     * @private
     */
    this._oneofsArray = null;

    /**
     * Cached constructor.
     * @type {Constructor<{}>}
     * @private
     */
    this._ctor = null;
}

Object.defineProperties(Type.prototype, {

    /**
     * Message fields by id.
     * @name Type#fieldsById
     * @type {Object.<number,Field>}
     * @readonly
     */
    fieldsById: {
        get: function() {

            /* istanbul ignore if */
            if (this._fieldsById)
                return this._fieldsById;

            this._fieldsById = {};
            for (var names = Object.keys(this.fields), i = 0; i < names.length; ++i) {
                var field = this.fields[names[i]],
                    id = field.id;

                /* istanbul ignore if */
                if (this._fieldsById[id])
                    throw Error("duplicate id " + id + " in " + this);

                this._fieldsById[id] = field;
            }
            return this._fieldsById;
        }
    },

    /**
     * Fields of this message as an array for iteration.
     * @name Type#fieldsArray
     * @type {Field[]}
     * @readonly
     */
    fieldsArray: {
        get: function() {
            return this._fieldsArray || (this._fieldsArray = util.toArray(this.fields));
        }
    },

    /**
     * Oneofs of this message as an array for iteration.
     * @name Type#oneofsArray
     * @type {OneOf[]}
     * @readonly
     */
    oneofsArray: {
        get: function() {
            return this._oneofsArray || (this._oneofsArray = util.toArray(this.oneofs));
        }
    },

    /**
     * The registered constructor, if any registered, otherwise a generic constructor.
     * Assigning a function replaces the internal constructor. If the function does not extend {@link Message} yet, its prototype will be setup accordingly and static methods will be populated. If it already extends {@link Message}, it will just replace the internal constructor.
     * @name Type#ctor
     * @type {Constructor<{}>}
     */
    ctor: {
        get: function() {
            return this._ctor || (this.ctor = Type.generateConstructor(this)());
        },
        set: function(ctor) {

            // Ensure proper prototype
            var prototype = ctor.prototype;
            if (!(prototype instanceof Message)) {
                (ctor.prototype = new Message()).constructor = ctor;
                util.merge(ctor.prototype, prototype);
            }

            // Classes and messages reference their reflected type
            ctor.$type = ctor.prototype.$type = this;

            // Mix in static methods
            util.merge(ctor, Message, true);

            this._ctor = ctor;

            // Messages have non-enumerable default values on their prototype
            var i = 0;
            for (; i < /* initializes */ this.fieldsArray.length; ++i)
                this._fieldsArray[i].resolve(); // ensures a proper value

            // Messages have non-enumerable getters and setters for each virtual oneof field
            var ctorProperties = {};
            for (i = 0; i < /* initializes */ this.oneofsArray.length; ++i)
                ctorProperties[this._oneofsArray[i].resolve().name] = {
                    get: util.oneOfGetter(this._oneofsArray[i].oneof),
                    set: util.oneOfSetter(this._oneofsArray[i].oneof)
                };
            if (i)
                Object.defineProperties(ctor.prototype, ctorProperties);
        }
    }
});

/**
 * Generates a constructor function for the specified type.
 * @param {Type} mtype Message type
 * @returns {Codegen} Codegen instance
 */
Type.generateConstructor = function generateConstructor(mtype) {
    /* eslint-disable no-unexpected-multiline */
    var gen = util.codegen(["p"], mtype.name);
    // explicitly initialize mutable object/array fields so that these aren't just inherited from the prototype
    for (var i = 0, field; i < mtype.fieldsArray.length; ++i)
        if ((field = mtype._fieldsArray[i]).map) gen
            ("this%s={}", util.safeProp(field.name));
        else if (field.repeated) gen
            ("this%s=[]", util.safeProp(field.name));
    return gen
    ("if(p)for(var ks=Object.keys(p),i=0;i<ks.length;++i)if(p[ks[i]]!=null)") // omit undefined or null
        ("this[ks[i]]=p[ks[i]]");
    /* eslint-enable no-unexpected-multiline */
};

function clearCache(type) {
    type._fieldsById = type._fieldsArray = type._oneofsArray = null;
    delete type.encode;
    delete type.decode;
    delete type.verify;
    return type;
}

/**
 * Message type descriptor.
 * @interface IType
 * @extends INamespace
 * @property {Object.<string,IOneOf>} [oneofs] Oneof descriptors
 * @property {Object.<string,IField>} fields Field descriptors
 * @property {number[][]} [extensions] Extension ranges
 * @property {number[][]} [reserved] Reserved ranges
 * @property {boolean} [group=false] Whether a legacy group or not
 */

/**
 * Creates a message type from a message type descriptor.
 * @param {string} name Message name
 * @param {IType} json Message type descriptor
 * @returns {Type} Created message type
 */
Type.fromJSON = function fromJSON(name, json) {
    var type = new Type(name, json.options);
    type.extensions = json.extensions;
    type.reserved = json.reserved;
    var names = Object.keys(json.fields),
        i = 0;
    for (; i < names.length; ++i)
        type.add(
            ( typeof json.fields[names[i]].keyType !== "undefined"
            ? MapField.fromJSON
            : Field.fromJSON )(names[i], json.fields[names[i]])
        );
    if (json.oneofs)
        for (names = Object.keys(json.oneofs), i = 0; i < names.length; ++i)
            type.add(OneOf.fromJSON(names[i], json.oneofs[names[i]]));
    if (json.nested)
        for (names = Object.keys(json.nested), i = 0; i < names.length; ++i) {
            var nested = json.nested[names[i]];
            type.add( // most to least likely
                ( nested.id !== undefined
                ? Field.fromJSON
                : nested.fields !== undefined
                ? Type.fromJSON
                : nested.values !== undefined
                ? Enum.fromJSON
                : nested.methods !== undefined
                ? Service.fromJSON
                : Namespace.fromJSON )(names[i], nested)
            );
        }
    if (json.extensions && json.extensions.length)
        type.extensions = json.extensions;
    if (json.reserved && json.reserved.length)
        type.reserved = json.reserved;
    if (json.group)
        type.group = true;
    if (json.comment)
        type.comment = json.comment;
    return type;
};

/**
 * Converts this message type to a message type descriptor.
 * @param {IToJSONOptions} [toJSONOptions] JSON conversion options
 * @returns {IType} Message type descriptor
 */
Type.prototype.toJSON = function toJSON(toJSONOptions) {
    var inherited = Namespace.prototype.toJSON.call(this, toJSONOptions);
    var keepComments = toJSONOptions ? Boolean(toJSONOptions.keepComments) : false;
    return util.toObject([
        "options"    , inherited && inherited.options || undefined,
        "oneofs"     , Namespace.arrayToJSON(this.oneofsArray, toJSONOptions),
        "fields"     , Namespace.arrayToJSON(this.fieldsArray.filter(function(obj) { return !obj.declaringField; }), toJSONOptions) || {},
        "extensions" , this.extensions && this.extensions.length ? this.extensions : undefined,
        "reserved"   , this.reserved && this.reserved.length ? this.reserved : undefined,
        "group"      , this.group || undefined,
        "nested"     , inherited && inherited.nested || undefined,
        "comment"    , keepComments ? this.comment : undefined
    ]);
};

/**
 * @override
 */
Type.prototype.resolveAll = function resolveAll() {
    var fields = this.fieldsArray, i = 0;
    while (i < fields.length)
        fields[i++].resolve();
    var oneofs = this.oneofsArray; i = 0;
    while (i < oneofs.length)
        oneofs[i++].resolve();
    return Namespace.prototype.resolveAll.call(this);
};

/**
 * @override
 */
Type.prototype.get = function get(name) {
    return this.fields[name]
        || this.oneofs && this.oneofs[name]
        || this.nested && this.nested[name]
        || null;
};

/**
 * Adds a nested object to this type.
 * @param {ReflectionObject} object Nested object to add
 * @returns {Type} `this`
 * @throws {TypeError} If arguments are invalid
 * @throws {Error} If there is already a nested object with this name or, if a field, when there is already a field with this id
 */
Type.prototype.add = function add(object) {

    if (this.get(object.name))
        throw Error("duplicate name '" + object.name + "' in " + this);

    if (object instanceof Field && object.extend === undefined) {
        // NOTE: Extension fields aren't actual fields on the declaring type, but nested objects.
        // The root object takes care of adding distinct sister-fields to the respective extended
        // type instead.

        // avoids calling the getter if not absolutely necessary because it's called quite frequently
        if (this._fieldsById ? /* istanbul ignore next */ this._fieldsById[object.id] : this.fieldsById[object.id])
            throw Error("duplicate id " + object.id + " in " + this);
        if (this.isReservedId(object.id))
            throw Error("id " + object.id + " is reserved in " + this);
        if (this.isReservedName(object.name))
            throw Error("name '" + object.name + "' is reserved in " + this);

        if (object.parent)
            object.parent.remove(object);
        this.fields[object.name] = object;
        object.message = this;
        object.onAdd(this);
        return clearCache(this);
    }
    if (object instanceof OneOf) {
        if (!this.oneofs)
            this.oneofs = {};
        this.oneofs[object.name] = object;
        object.onAdd(this);
        return clearCache(this);
    }
    return Namespace.prototype.add.call(this, object);
};

/**
 * Removes a nested object from this type.
 * @param {ReflectionObject} object Nested object to remove
 * @returns {Type} `this`
 * @throws {TypeError} If arguments are invalid
 * @throws {Error} If `object` is not a member of this type
 */
Type.prototype.remove = function remove(object) {
    if (object instanceof Field && object.extend === undefined) {
        // See Type#add for the reason why extension fields are excluded here.

        /* istanbul ignore if */
        if (!this.fields || this.fields[object.name] !== object)
            throw Error(object + " is not a member of " + this);

        delete this.fields[object.name];
        object.parent = null;
        object.onRemove(this);
        return clearCache(this);
    }
    if (object instanceof OneOf) {

        /* istanbul ignore if */
        if (!this.oneofs || this.oneofs[object.name] !== object)
            throw Error(object + " is not a member of " + this);

        delete this.oneofs[object.name];
        object.parent = null;
        object.onRemove(this);
        return clearCache(this);
    }
    return Namespace.prototype.remove.call(this, object);
};

/**
 * Tests if the specified id is reserved.
 * @param {number} id Id to test
 * @returns {boolean} `true` if reserved, otherwise `false`
 */
Type.prototype.isReservedId = function isReservedId(id) {
    return Namespace.isReservedId(this.reserved, id);
};

/**
 * Tests if the specified name is reserved.
 * @param {string} name Name to test
 * @returns {boolean} `true` if reserved, otherwise `false`
 */
Type.prototype.isReservedName = function isReservedName(name) {
    return Namespace.isReservedName(this.reserved, name);
};

/**
 * Creates a new message of this type using the specified properties.
 * @param {Object.<string,*>} [properties] Properties to set
 * @returns {Message<{}>} Message instance
 */
Type.prototype.create = function create(properties) {
    return new this.ctor(properties);
};

/**
 * Sets up {@link Type#encode|encode}, {@link Type#decode|decode} and {@link Type#verify|verify}.
 * @returns {Type} `this`
 */
Type.prototype.setup = function setup() {
    // Sets up everything at once so that the prototype chain does not have to be re-evaluated
    // multiple times (V8, soft-deopt prototype-check).

    var fullName = this.fullName,
        types    = [];
    for (var i = 0; i < /* initializes */ this.fieldsArray.length; ++i)
        types.push(this._fieldsArray[i].resolve().resolvedType);

    // Replace setup methods with type-specific generated functions
    this.encode = encoder(this)({
        Writer : Writer,
        types  : types,
        util   : util
    });
    this.decode = decoder(this)({
        Reader : Reader,
        types  : types,
        util   : util
    });
    this.verify = verifier(this)({
        types : types,
        util  : util
    });
    this.fromObject = converter.fromObject(this)({
        types : types,
        util  : util
    });
    this.toObject = converter.toObject(this)({
        types : types,
        util  : util
    });

    // Inject custom wrappers for common types
    var wrapper = wrappers[fullName];
    if (wrapper) {
        var originalThis = Object.create(this);
        // if (wrapper.fromObject) {
            originalThis.fromObject = this.fromObject;
            this.fromObject = wrapper.fromObject.bind(originalThis);
        // }
        // if (wrapper.toObject) {
            originalThis.toObject = this.toObject;
            this.toObject = wrapper.toObject.bind(originalThis);
        // }
    }

    return this;
};

/**
 * Encodes a message of this type. Does not implicitly {@link Type#verify|verify} messages.
 * @param {Message<{}>|Object.<string,*>} message Message instance or plain object
 * @param {Writer} [writer] Writer to encode to
 * @returns {Writer} writer
 */
Type.prototype.encode = function encode_setup(message, writer) {
    return this.setup().encode(message, writer); // overrides this method
};

/**
 * Encodes a message of this type preceeded by its byte length as a varint. Does not implicitly {@link Type#verify|verify} messages.
 * @param {Message<{}>|Object.<string,*>} message Message instance or plain object
 * @param {Writer} [writer] Writer to encode to
 * @returns {Writer} writer
 */
Type.prototype.encodeDelimited = function encodeDelimited(message, writer) {
    return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
};

/**
 * Decodes a message of this type.
 * @param {Reader|Uint8Array} reader Reader or buffer to decode from
 * @param {number} [length] Length of the message, if known beforehand
 * @returns {Message<{}>} Decoded message
 * @throws {Error} If the payload is not a reader or valid buffer
 * @throws {util.ProtocolError<{}>} If required fields are missing
 */
Type.prototype.decode = function decode_setup(reader, length) {
    return this.setup().decode(reader, length); // overrides this method
};

/**
 * Decodes a message of this type preceeded by its byte length as a varint.
 * @param {Reader|Uint8Array} reader Reader or buffer to decode from
 * @returns {Message<{}>} Decoded message
 * @throws {Error} If the payload is not a reader or valid buffer
 * @throws {util.ProtocolError} If required fields are missing
 */
Type.prototype.decodeDelimited = function decodeDelimited(reader) {
    if (!(reader instanceof Reader))
        reader = Reader.create(reader);
    return this.decode(reader, reader.uint32());
};

/**
 * Verifies that field values are valid and that required fields are present.
 * @param {Object.<string,*>} message Plain object to verify
 * @returns {null|string} `null` if valid, otherwise the reason why it is not
 */
Type.prototype.verify = function verify_setup(message) {
    return this.setup().verify(message); // overrides this method
};

/**
 * Creates a new message of this type from a plain object. Also converts values to their respective internal types.
 * @param {Object.<string,*>} object Plain object to convert
 * @returns {Message<{}>} Message instance
 */
Type.prototype.fromObject = function fromObject(object) {
    return this.setup().fromObject(object);
};

/**
 * Conversion options as used by {@link Type#toObject} and {@link Message.toObject}.
 * @interface IConversionOptions
 * @property {Function} [longs] Long conversion type.
 * Valid values are `String` and `Number` (the global types).
 * Defaults to copy the present value, which is a possibly unsafe number without and a {@link Long} with a long library.
 * @property {Function} [enums] Enum value conversion type.
 * Only valid value is `String` (the global type).
 * Defaults to copy the present value, which is the numeric id.
 * @property {Function} [bytes] Bytes value conversion type.
 * Valid values are `Array` and (a base64 encoded) `String` (the global types).
 * Defaults to copy the present value, which usually is a Buffer under node and an Uint8Array in the browser.
 * @property {boolean} [defaults=false] Also sets default values on the resulting object
 * @property {boolean} [arrays=false] Sets empty arrays for missing repeated fields even if `defaults=false`
 * @property {boolean} [objects=false] Sets empty objects for missing map fields even if `defaults=false`
 * @property {boolean} [oneofs=false] Includes virtual oneof properties set to the present field's name, if any
 * @property {boolean} [json=false] Performs additional JSON compatibility conversions, i.e. NaN and Infinity to strings
 */

/**
 * Creates a plain object from a message of this type. Also converts values to other types if specified.
 * @param {Message<{}>} message Message instance
 * @param {IConversionOptions} [options] Conversion options
 * @returns {Object.<string,*>} Plain object
 */
Type.prototype.toObject = function toObject(message, options) {
    return this.setup().toObject(message, options);
};

/**
 * Decorator function as returned by {@link Type.d} (TypeScript).
 * @typedef TypeDecorator
 * @type {function}
 * @param {Constructor<T>} target Target constructor
 * @returns {undefined}
 * @template T extends Message<T>
 */

/**
 * Type decorator (TypeScript).
 * @param {string} [typeName] Type name, defaults to the constructor's name
 * @returns {TypeDecorator<T>} Decorator function
 * @template T extends Message<T>
 */
Type.d = function decorateType(typeName) {
    return function typeDecorator(target) {
        util.decorateType(target, typeName);
    };
};

},{"./converter":12,"./decoder":13,"./encoder":14,"./enum":15,"./field":16,"./mapfield":19,"./message":20,"./namespace":22,"./oneof":24,"./reader":25,"./service":31,"./util":34,"./verifier":37,"./wrappers":38,"./writer":39}],33:[function(require,module,exports){
"use strict";

/**
 * Common type constants.
 * @namespace
 */
var types = exports;

var util = require("./util");

var s = [
    "double",   // 0
    "float",    // 1
    "int32",    // 2
    "uint32",   // 3
    "sint32",   // 4
    "fixed32",  // 5
    "sfixed32", // 6
    "int64",    // 7
    "uint64",   // 8
    "sint64",   // 9
    "fixed64",  // 10
    "sfixed64", // 11
    "bool",     // 12
    "string",   // 13
    "bytes"     // 14
];

function bake(values, offset) {
    var i = 0, o = {};
    offset |= 0;
    while (i < values.length) o[s[i + offset]] = values[i++];
    return o;
}

/**
 * Basic type wire types.
 * @type {Object.<string,number>}
 * @const
 * @property {number} double=1 Fixed64 wire type
 * @property {number} float=5 Fixed32 wire type
 * @property {number} int32=0 Varint wire type
 * @property {number} uint32=0 Varint wire type
 * @property {number} sint32=0 Varint wire type
 * @property {number} fixed32=5 Fixed32 wire type
 * @property {number} sfixed32=5 Fixed32 wire type
 * @property {number} int64=0 Varint wire type
 * @property {number} uint64=0 Varint wire type
 * @property {number} sint64=0 Varint wire type
 * @property {number} fixed64=1 Fixed64 wire type
 * @property {number} sfixed64=1 Fixed64 wire type
 * @property {number} bool=0 Varint wire type
 * @property {number} string=2 Ldelim wire type
 * @property {number} bytes=2 Ldelim wire type
 */
types.basic = bake([
    /* double   */ 1,
    /* float    */ 5,
    /* int32    */ 0,
    /* uint32   */ 0,
    /* sint32   */ 0,
    /* fixed32  */ 5,
    /* sfixed32 */ 5,
    /* int64    */ 0,
    /* uint64   */ 0,
    /* sint64   */ 0,
    /* fixed64  */ 1,
    /* sfixed64 */ 1,
    /* bool     */ 0,
    /* string   */ 2,
    /* bytes    */ 2
]);

/**
 * Basic type defaults.
 * @type {Object.<string,*>}
 * @const
 * @property {number} double=0 Double default
 * @property {number} float=0 Float default
 * @property {number} int32=0 Int32 default
 * @property {number} uint32=0 Uint32 default
 * @property {number} sint32=0 Sint32 default
 * @property {number} fixed32=0 Fixed32 default
 * @property {number} sfixed32=0 Sfixed32 default
 * @property {number} int64=0 Int64 default
 * @property {number} uint64=0 Uint64 default
 * @property {number} sint64=0 Sint32 default
 * @property {number} fixed64=0 Fixed64 default
 * @property {number} sfixed64=0 Sfixed64 default
 * @property {boolean} bool=false Bool default
 * @property {string} string="" String default
 * @property {Array.<number>} bytes=Array(0) Bytes default
 * @property {null} message=null Message default
 */
types.defaults = bake([
    /* double   */ 0,
    /* float    */ 0,
    /* int32    */ 0,
    /* uint32   */ 0,
    /* sint32   */ 0,
    /* fixed32  */ 0,
    /* sfixed32 */ 0,
    /* int64    */ 0,
    /* uint64   */ 0,
    /* sint64   */ 0,
    /* fixed64  */ 0,
    /* sfixed64 */ 0,
    /* bool     */ false,
    /* string   */ "",
    /* bytes    */ util.emptyArray,
    /* message  */ null
]);

/**
 * Basic long type wire types.
 * @type {Object.<string,number>}
 * @const
 * @property {number} int64=0 Varint wire type
 * @property {number} uint64=0 Varint wire type
 * @property {number} sint64=0 Varint wire type
 * @property {number} fixed64=1 Fixed64 wire type
 * @property {number} sfixed64=1 Fixed64 wire type
 */
types.long = bake([
    /* int64    */ 0,
    /* uint64   */ 0,
    /* sint64   */ 0,
    /* fixed64  */ 1,
    /* sfixed64 */ 1
], 7);

/**
 * Allowed types for map keys with their associated wire type.
 * @type {Object.<string,number>}
 * @const
 * @property {number} int32=0 Varint wire type
 * @property {number} uint32=0 Varint wire type
 * @property {number} sint32=0 Varint wire type
 * @property {number} fixed32=5 Fixed32 wire type
 * @property {number} sfixed32=5 Fixed32 wire type
 * @property {number} int64=0 Varint wire type
 * @property {number} uint64=0 Varint wire type
 * @property {number} sint64=0 Varint wire type
 * @property {number} fixed64=1 Fixed64 wire type
 * @property {number} sfixed64=1 Fixed64 wire type
 * @property {number} bool=0 Varint wire type
 * @property {number} string=2 Ldelim wire type
 */
types.mapKey = bake([
    /* int32    */ 0,
    /* uint32   */ 0,
    /* sint32   */ 0,
    /* fixed32  */ 5,
    /* sfixed32 */ 5,
    /* int64    */ 0,
    /* uint64   */ 0,
    /* sint64   */ 0,
    /* fixed64  */ 1,
    /* sfixed64 */ 1,
    /* bool     */ 0,
    /* string   */ 2
], 2);

/**
 * Allowed types for packed repeated fields with their associated wire type.
 * @type {Object.<string,number>}
 * @const
 * @property {number} double=1 Fixed64 wire type
 * @property {number} float=5 Fixed32 wire type
 * @property {number} int32=0 Varint wire type
 * @property {number} uint32=0 Varint wire type
 * @property {number} sint32=0 Varint wire type
 * @property {number} fixed32=5 Fixed32 wire type
 * @property {number} sfixed32=5 Fixed32 wire type
 * @property {number} int64=0 Varint wire type
 * @property {number} uint64=0 Varint wire type
 * @property {number} sint64=0 Varint wire type
 * @property {number} fixed64=1 Fixed64 wire type
 * @property {number} sfixed64=1 Fixed64 wire type
 * @property {number} bool=0 Varint wire type
 */
types.packed = bake([
    /* double   */ 1,
    /* float    */ 5,
    /* int32    */ 0,
    /* uint32   */ 0,
    /* sint32   */ 0,
    /* fixed32  */ 5,
    /* sfixed32 */ 5,
    /* int64    */ 0,
    /* uint64   */ 0,
    /* sint64   */ 0,
    /* fixed64  */ 1,
    /* sfixed64 */ 1,
    /* bool     */ 0
]);

},{"./util":34}],34:[function(require,module,exports){
"use strict";

/**
 * Various utility functions.
 * @namespace
 */
var util = module.exports = require("./util/minimal");

var roots = require("./roots");

var Type, // cyclic
    Enum;

util.codegen = require("@protobufjs/codegen");
util.fetch   = require("@protobufjs/fetch");
util.path    = require("@protobufjs/path");

/**
 * Node's fs module if available.
 * @type {Object.<string,*>}
 */
util.fs = util.inquire("fs");

/**
 * Converts an object's values to an array.
 * @param {Object.<string,*>} object Object to convert
 * @returns {Array.<*>} Converted array
 */
util.toArray = function toArray(object) {
    if (object) {
        var keys  = Object.keys(object),
            array = new Array(keys.length),
            index = 0;
        while (index < keys.length)
            array[index] = object[keys[index++]];
        return array;
    }
    return [];
};

/**
 * Converts an array of keys immediately followed by their respective value to an object, omitting undefined values.
 * @param {Array.<*>} array Array to convert
 * @returns {Object.<string,*>} Converted object
 */
util.toObject = function toObject(array) {
    var object = {},
        index  = 0;
    while (index < array.length) {
        var key = array[index++],
            val = array[index++];
        if (val !== undefined)
            object[key] = val;
    }
    return object;
};

var safePropBackslashRe = /\\/g,
    safePropQuoteRe     = /"/g;

/**
 * Tests whether the specified name is a reserved word in JS.
 * @param {string} name Name to test
 * @returns {boolean} `true` if reserved, otherwise `false`
 */
util.isReserved = function isReserved(name) {
    return /^(?:do|if|in|for|let|new|try|var|case|else|enum|eval|false|null|this|true|void|with|break|catch|class|const|super|throw|while|yield|delete|export|import|public|return|static|switch|typeof|default|extends|finally|package|private|continue|debugger|function|arguments|interface|protected|implements|instanceof)$/.test(name);
};

/**
 * Returns a safe property accessor for the specified property name.
 * @param {string} prop Property name
 * @returns {string} Safe accessor
 */
util.safeProp = function safeProp(prop) {
    if (!/^[$\w_]+$/.test(prop) || util.isReserved(prop))
        return "[\"" + prop.replace(safePropBackslashRe, "\\\\").replace(safePropQuoteRe, "\\\"") + "\"]";
    return "." + prop;
};

/**
 * Converts the first character of a string to upper case.
 * @param {string} str String to convert
 * @returns {string} Converted string
 */
util.ucFirst = function ucFirst(str) {
    return str.charAt(0).toUpperCase() + str.substring(1);
};

var camelCaseRe = /_([a-z])/g;

/**
 * Converts a string to camel case.
 * @param {string} str String to convert
 * @returns {string} Converted string
 */
util.camelCase = function camelCase(str) {
    return str.substring(0, 1)
         + str.substring(1)
               .replace(camelCaseRe, function($0, $1) { return $1.toUpperCase(); });
};

/**
 * Compares reflected fields by id.
 * @param {Field} a First field
 * @param {Field} b Second field
 * @returns {number} Comparison value
 */
util.compareFieldsById = function compareFieldsById(a, b) {
    return a.id - b.id;
};

/**
 * Decorator helper for types (TypeScript).
 * @param {Constructor<T>} ctor Constructor function
 * @param {string} [typeName] Type name, defaults to the constructor's name
 * @returns {Type} Reflected type
 * @template T extends Message<T>
 * @property {Root} root Decorators root
 */
util.decorateType = function decorateType(ctor, typeName) {

    /* istanbul ignore if */
    if (ctor.$type) {
        if (typeName && ctor.$type.name !== typeName) {
            util.decorateRoot.remove(ctor.$type);
            ctor.$type.name = typeName;
            util.decorateRoot.add(ctor.$type);
        }
        return ctor.$type;
    }

    /* istanbul ignore next */
    if (!Type)
        Type = require("./type");

    var type = new Type(typeName || ctor.name);
    util.decorateRoot.add(type);
    type.ctor = ctor; // sets up .encode, .decode etc.
    Object.defineProperty(ctor, "$type", { value: type, enumerable: false });
    Object.defineProperty(ctor.prototype, "$type", { value: type, enumerable: false });
    return type;
};

var decorateEnumIndex = 0;

/**
 * Decorator helper for enums (TypeScript).
 * @param {Object} object Enum object
 * @returns {Enum} Reflected enum
 */
util.decorateEnum = function decorateEnum(object) {

    /* istanbul ignore if */
    if (object.$type)
        return object.$type;

    /* istanbul ignore next */
    if (!Enum)
        Enum = require("./enum");

    var enm = new Enum("Enum" + decorateEnumIndex++, object);
    util.decorateRoot.add(enm);
    Object.defineProperty(object, "$type", { value: enm, enumerable: false });
    return enm;
};

/**
 * Decorator root (TypeScript).
 * @name util.decorateRoot
 * @type {Root}
 * @readonly
 */
Object.defineProperty(util, "decorateRoot", {
    get: function() {
        return roots["decorated"] || (roots["decorated"] = new (require("./root"))());
    }
});

},{"./enum":15,"./root":27,"./roots":28,"./type":32,"./util/minimal":36,"@protobufjs/codegen":3,"@protobufjs/fetch":5,"@protobufjs/path":8}],35:[function(require,module,exports){
"use strict";
module.exports = LongBits;

var util = require("../util/minimal");

/**
 * Constructs new long bits.
 * @classdesc Helper class for working with the low and high bits of a 64 bit value.
 * @memberof util
 * @constructor
 * @param {number} lo Low 32 bits, unsigned
 * @param {number} hi High 32 bits, unsigned
 */
function LongBits(lo, hi) {

    // note that the casts below are theoretically unnecessary as of today, but older statically
    // generated converter code might still call the ctor with signed 32bits. kept for compat.

    /**
     * Low bits.
     * @type {number}
     */
    this.lo = lo >>> 0;

    /**
     * High bits.
     * @type {number}
     */
    this.hi = hi >>> 0;
}

/**
 * Zero bits.
 * @memberof util.LongBits
 * @type {util.LongBits}
 */
var zero = LongBits.zero = new LongBits(0, 0);

zero.toNumber = function() { return 0; };
zero.zzEncode = zero.zzDecode = function() { return this; };
zero.length = function() { return 1; };

/**
 * Zero hash.
 * @memberof util.LongBits
 * @type {string}
 */
var zeroHash = LongBits.zeroHash = "\0\0\0\0\0\0\0\0";

/**
 * Constructs new long bits from the specified number.
 * @param {number} value Value
 * @returns {util.LongBits} Instance
 */
LongBits.fromNumber = function fromNumber(value) {
    if (value === 0)
        return zero;
    var sign = value < 0;
    if (sign)
        value = -value;
    var lo = value >>> 0,
        hi = (value - lo) / 4294967296 >>> 0;
    if (sign) {
        hi = ~hi >>> 0;
        lo = ~lo >>> 0;
        if (++lo > 4294967295) {
            lo = 0;
            if (++hi > 4294967295)
                hi = 0;
        }
    }
    return new LongBits(lo, hi);
};

/**
 * Constructs new long bits from a number, long or string.
 * @param {Long|number|string} value Value
 * @returns {util.LongBits} Instance
 */
LongBits.from = function from(value) {
    if (typeof value === "number")
        return LongBits.fromNumber(value);
    if (util.isString(value)) {
        /* istanbul ignore else */
        if (util.Long)
            value = util.Long.fromString(value);
        else
            return LongBits.fromNumber(parseInt(value, 10));
    }
    return value.low || value.high ? new LongBits(value.low >>> 0, value.high >>> 0) : zero;
};

/**
 * Converts this long bits to a possibly unsafe JavaScript number.
 * @param {boolean} [unsigned=false] Whether unsigned or not
 * @returns {number} Possibly unsafe number
 */
LongBits.prototype.toNumber = function toNumber(unsigned) {
    if (!unsigned && this.hi >>> 31) {
        var lo = ~this.lo + 1 >>> 0,
            hi = ~this.hi     >>> 0;
        if (!lo)
            hi = hi + 1 >>> 0;
        return -(lo + hi * 4294967296);
    }
    return this.lo + this.hi * 4294967296;
};

/**
 * Converts this long bits to a long.
 * @param {boolean} [unsigned=false] Whether unsigned or not
 * @returns {Long} Long
 */
LongBits.prototype.toLong = function toLong(unsigned) {
    return util.Long
        ? new util.Long(this.lo | 0, this.hi | 0, Boolean(unsigned))
        /* istanbul ignore next */
        : { low: this.lo | 0, high: this.hi | 0, unsigned: Boolean(unsigned) };
};

var charCodeAt = String.prototype.charCodeAt;

/**
 * Constructs new long bits from the specified 8 characters long hash.
 * @param {string} hash Hash
 * @returns {util.LongBits} Bits
 */
LongBits.fromHash = function fromHash(hash) {
    if (hash === zeroHash)
        return zero;
    return new LongBits(
        ( charCodeAt.call(hash, 0)
        | charCodeAt.call(hash, 1) << 8
        | charCodeAt.call(hash, 2) << 16
        | charCodeAt.call(hash, 3) << 24) >>> 0
    ,
        ( charCodeAt.call(hash, 4)
        | charCodeAt.call(hash, 5) << 8
        | charCodeAt.call(hash, 6) << 16
        | charCodeAt.call(hash, 7) << 24) >>> 0
    );
};

/**
 * Converts this long bits to a 8 characters long hash.
 * @returns {string} Hash
 */
LongBits.prototype.toHash = function toHash() {
    return String.fromCharCode(
        this.lo        & 255,
        this.lo >>> 8  & 255,
        this.lo >>> 16 & 255,
        this.lo >>> 24      ,
        this.hi        & 255,
        this.hi >>> 8  & 255,
        this.hi >>> 16 & 255,
        this.hi >>> 24
    );
};

/**
 * Zig-zag encodes this long bits.
 * @returns {util.LongBits} `this`
 */
LongBits.prototype.zzEncode = function zzEncode() {
    var mask =   this.hi >> 31;
    this.hi  = ((this.hi << 1 | this.lo >>> 31) ^ mask) >>> 0;
    this.lo  = ( this.lo << 1                   ^ mask) >>> 0;
    return this;
};

/**
 * Zig-zag decodes this long bits.
 * @returns {util.LongBits} `this`
 */
LongBits.prototype.zzDecode = function zzDecode() {
    var mask = -(this.lo & 1);
    this.lo  = ((this.lo >>> 1 | this.hi << 31) ^ mask) >>> 0;
    this.hi  = ( this.hi >>> 1                  ^ mask) >>> 0;
    return this;
};

/**
 * Calculates the length of this longbits when encoded as a varint.
 * @returns {number} Length
 */
LongBits.prototype.length = function length() {
    var part0 =  this.lo,
        part1 = (this.lo >>> 28 | this.hi << 4) >>> 0,
        part2 =  this.hi >>> 24;
    return part2 === 0
         ? part1 === 0
           ? part0 < 16384
             ? part0 < 128 ? 1 : 2
             : part0 < 2097152 ? 3 : 4
           : part1 < 16384
             ? part1 < 128 ? 5 : 6
             : part1 < 2097152 ? 7 : 8
         : part2 < 128 ? 9 : 10;
};

},{"../util/minimal":36}],36:[function(require,module,exports){
(function (global){
"use strict";
var util = exports;

// used to return a Promise where callback is omitted
util.asPromise = require("@protobufjs/aspromise");

// converts to / from base64 encoded strings
util.base64 = require("@protobufjs/base64");

// base class of rpc.Service
util.EventEmitter = require("@protobufjs/eventemitter");

// float handling accross browsers
util.float = require("@protobufjs/float");

// requires modules optionally and hides the call from bundlers
util.inquire = require("@protobufjs/inquire");

// converts to / from utf8 encoded strings
util.utf8 = require("@protobufjs/utf8");

// provides a node-like buffer pool in the browser
util.pool = require("@protobufjs/pool");

// utility to work with the low and high bits of a 64 bit value
util.LongBits = require("./longbits");

// global object reference
util.global = typeof window !== "undefined" && window
           || typeof global !== "undefined" && global
           || typeof self   !== "undefined" && self
           || this; // eslint-disable-line no-invalid-this

/**
 * An immuable empty array.
 * @memberof util
 * @type {Array.<*>}
 * @const
 */
util.emptyArray = Object.freeze ? Object.freeze([]) : /* istanbul ignore next */ []; // used on prototypes

/**
 * An immutable empty object.
 * @type {Object}
 * @const
 */
util.emptyObject = Object.freeze ? Object.freeze({}) : /* istanbul ignore next */ {}; // used on prototypes

/**
 * Whether running within node or not.
 * @memberof util
 * @type {boolean}
 * @const
 */
util.isNode = Boolean(util.global.process && util.global.process.versions && util.global.process.versions.node);

/**
 * Tests if the specified value is an integer.
 * @function
 * @param {*} value Value to test
 * @returns {boolean} `true` if the value is an integer
 */
util.isInteger = Number.isInteger || /* istanbul ignore next */ function isInteger(value) {
    return typeof value === "number" && isFinite(value) && Math.floor(value) === value;
};

/**
 * Tests if the specified value is a string.
 * @param {*} value Value to test
 * @returns {boolean} `true` if the value is a string
 */
util.isString = function isString(value) {
    return typeof value === "string" || value instanceof String;
};

/**
 * Tests if the specified value is a non-null object.
 * @param {*} value Value to test
 * @returns {boolean} `true` if the value is a non-null object
 */
util.isObject = function isObject(value) {
    return value && typeof value === "object";
};

/**
 * Checks if a property on a message is considered to be present.
 * This is an alias of {@link util.isSet}.
 * @function
 * @param {Object} obj Plain object or message instance
 * @param {string} prop Property name
 * @returns {boolean} `true` if considered to be present, otherwise `false`
 */
util.isset =

/**
 * Checks if a property on a message is considered to be present.
 * @param {Object} obj Plain object or message instance
 * @param {string} prop Property name
 * @returns {boolean} `true` if considered to be present, otherwise `false`
 */
util.isSet = function isSet(obj, prop) {
    var value = obj[prop];
    if (value != null && obj.hasOwnProperty(prop)) // eslint-disable-line eqeqeq, no-prototype-builtins
        return typeof value !== "object" || (Array.isArray(value) ? value.length : Object.keys(value).length) > 0;
    return false;
};

/**
 * Any compatible Buffer instance.
 * This is a minimal stand-alone definition of a Buffer instance. The actual type is that exported by node's typings.
 * @interface Buffer
 * @extends Uint8Array
 */

/**
 * Node's Buffer class if available.
 * @type {Constructor<Buffer>}
 */
util.Buffer = (function() {
    try {
        var Buffer = util.inquire("buffer").Buffer;
        // refuse to use non-node buffers if not explicitly assigned (perf reasons):
        return Buffer.prototype.utf8Write ? Buffer : /* istanbul ignore next */ null;
    } catch (e) {
        /* istanbul ignore next */
        return null;
    }
})();

// Internal alias of or polyfull for Buffer.from.
util._Buffer_from = null;

// Internal alias of or polyfill for Buffer.allocUnsafe.
util._Buffer_allocUnsafe = null;

/**
 * Creates a new buffer of whatever type supported by the environment.
 * @param {number|number[]} [sizeOrArray=0] Buffer size or number array
 * @returns {Uint8Array|Buffer} Buffer
 */
util.newBuffer = function newBuffer(sizeOrArray) {
    /* istanbul ignore next */
    return typeof sizeOrArray === "number"
        ? util.Buffer
            ? util._Buffer_allocUnsafe(sizeOrArray)
            : new util.Array(sizeOrArray)
        : util.Buffer
            ? util._Buffer_from(sizeOrArray)
            : typeof Uint8Array === "undefined"
                ? sizeOrArray
                : new Uint8Array(sizeOrArray);
};

/**
 * Array implementation used in the browser. `Uint8Array` if supported, otherwise `Array`.
 * @type {Constructor<Uint8Array>}
 */
util.Array = typeof Uint8Array !== "undefined" ? Uint8Array /* istanbul ignore next */ : Array;

/**
 * Any compatible Long instance.
 * This is a minimal stand-alone definition of a Long instance. The actual type is that exported by long.js.
 * @interface Long
 * @property {number} low Low bits
 * @property {number} high High bits
 * @property {boolean} unsigned Whether unsigned or not
 */

/**
 * Long.js's Long class if available.
 * @type {Constructor<Long>}
 */
util.Long = /* istanbul ignore next */ util.global.dcodeIO && /* istanbul ignore next */ util.global.dcodeIO.Long
         || /* istanbul ignore next */ util.global.Long
         || util.inquire("long");

/**
 * Regular expression used to verify 2 bit (`bool`) map keys.
 * @type {RegExp}
 * @const
 */
util.key2Re = /^true|false|0|1$/;

/**
 * Regular expression used to verify 32 bit (`int32` etc.) map keys.
 * @type {RegExp}
 * @const
 */
util.key32Re = /^-?(?:0|[1-9][0-9]*)$/;

/**
 * Regular expression used to verify 64 bit (`int64` etc.) map keys.
 * @type {RegExp}
 * @const
 */
util.key64Re = /^(?:[\\x00-\\xff]{8}|-?(?:0|[1-9][0-9]*))$/;

/**
 * Converts a number or long to an 8 characters long hash string.
 * @param {Long|number} value Value to convert
 * @returns {string} Hash
 */
util.longToHash = function longToHash(value) {
    return value
        ? util.LongBits.from(value).toHash()
        : util.LongBits.zeroHash;
};

/**
 * Converts an 8 characters long hash string to a long or number.
 * @param {string} hash Hash
 * @param {boolean} [unsigned=false] Whether unsigned or not
 * @returns {Long|number} Original value
 */
util.longFromHash = function longFromHash(hash, unsigned) {
    var bits = util.LongBits.fromHash(hash);
    if (util.Long)
        return util.Long.fromBits(bits.lo, bits.hi, unsigned);
    return bits.toNumber(Boolean(unsigned));
};

/**
 * Merges the properties of the source object into the destination object.
 * @memberof util
 * @param {Object.<string,*>} dst Destination object
 * @param {Object.<string,*>} src Source object
 * @param {boolean} [ifNotSet=false] Merges only if the key is not already set
 * @returns {Object.<string,*>} Destination object
 */
function merge(dst, src, ifNotSet) { // used by converters
    for (var keys = Object.keys(src), i = 0; i < keys.length; ++i)
        if (dst[keys[i]] === undefined || !ifNotSet)
            dst[keys[i]] = src[keys[i]];
    return dst;
}

util.merge = merge;

/**
 * Converts the first character of a string to lower case.
 * @param {string} str String to convert
 * @returns {string} Converted string
 */
util.lcFirst = function lcFirst(str) {
    return str.charAt(0).toLowerCase() + str.substring(1);
};

/**
 * Creates a custom error constructor.
 * @memberof util
 * @param {string} name Error name
 * @returns {Constructor<Error>} Custom error constructor
 */
function newError(name) {

    function CustomError(message, properties) {

        if (!(this instanceof CustomError))
            return new CustomError(message, properties);

        // Error.call(this, message);
        // ^ just returns a new error instance because the ctor can be called as a function

        Object.defineProperty(this, "message", { get: function() { return message; } });

        /* istanbul ignore next */
        if (Error.captureStackTrace) // node
            Error.captureStackTrace(this, CustomError);
        else
            Object.defineProperty(this, "stack", { value: (new Error()).stack || "" });

        if (properties)
            merge(this, properties);
    }

    (CustomError.prototype = Object.create(Error.prototype)).constructor = CustomError;

    Object.defineProperty(CustomError.prototype, "name", { get: function() { return name; } });

    CustomError.prototype.toString = function toString() {
        return this.name + ": " + this.message;
    };

    return CustomError;
}

util.newError = newError;

/**
 * Constructs a new protocol error.
 * @classdesc Error subclass indicating a protocol specifc error.
 * @memberof util
 * @extends Error
 * @template T extends Message<T>
 * @constructor
 * @param {string} message Error message
 * @param {Object.<string,*>} [properties] Additional properties
 * @example
 * try {
 *     MyMessage.decode(someBuffer); // throws if required fields are missing
 * } catch (e) {
 *     if (e instanceof ProtocolError && e.instance)
 *         console.log("decoded so far: " + JSON.stringify(e.instance));
 * }
 */
util.ProtocolError = newError("ProtocolError");

/**
 * So far decoded message instance.
 * @name util.ProtocolError#instance
 * @type {Message<T>}
 */

/**
 * A OneOf getter as returned by {@link util.oneOfGetter}.
 * @typedef OneOfGetter
 * @type {function}
 * @returns {string|undefined} Set field name, if any
 */

/**
 * Builds a getter for a oneof's present field name.
 * @param {string[]} fieldNames Field names
 * @returns {OneOfGetter} Unbound getter
 */
util.oneOfGetter = function getOneOf(fieldNames) {
    var fieldMap = {};
    for (var i = 0; i < fieldNames.length; ++i)
        fieldMap[fieldNames[i]] = 1;

    /**
     * @returns {string|undefined} Set field name, if any
     * @this Object
     * @ignore
     */
    return function() { // eslint-disable-line consistent-return
        for (var keys = Object.keys(this), i = keys.length - 1; i > -1; --i)
            if (fieldMap[keys[i]] === 1 && this[keys[i]] !== undefined && this[keys[i]] !== null)
                return keys[i];
    };
};

/**
 * A OneOf setter as returned by {@link util.oneOfSetter}.
 * @typedef OneOfSetter
 * @type {function}
 * @param {string|undefined} value Field name
 * @returns {undefined}
 */

/**
 * Builds a setter for a oneof's present field name.
 * @param {string[]} fieldNames Field names
 * @returns {OneOfSetter} Unbound setter
 */
util.oneOfSetter = function setOneOf(fieldNames) {

    /**
     * @param {string} name Field name
     * @returns {undefined}
     * @this Object
     * @ignore
     */
    return function(name) {
        for (var i = 0; i < fieldNames.length; ++i)
            if (fieldNames[i] !== name)
                delete this[fieldNames[i]];
    };
};

/**
 * Default conversion options used for {@link Message#toJSON} implementations.
 *
 * These options are close to proto3's JSON mapping with the exception that internal types like Any are handled just like messages. More precisely:
 *
 * - Longs become strings
 * - Enums become string keys
 * - Bytes become base64 encoded strings
 * - (Sub-)Messages become plain objects
 * - Maps become plain objects with all string keys
 * - Repeated fields become arrays
 * - NaN and Infinity for float and double fields become strings
 *
 * @type {IConversionOptions}
 * @see https://developers.google.com/protocol-buffers/docs/proto3?hl=en#json
 */
util.toJSONOptions = {
    longs: String,
    enums: String,
    bytes: String,
    json: true
};

// Sets up buffer utility according to the environment (called in index-minimal)
util._configure = function() {
    var Buffer = util.Buffer;
    /* istanbul ignore if */
    if (!Buffer) {
        util._Buffer_from = util._Buffer_allocUnsafe = null;
        return;
    }
    // because node 4.x buffers are incompatible & immutable
    // see: https://github.com/dcodeIO/protobuf.js/pull/665
    util._Buffer_from = Buffer.from !== Uint8Array.from && Buffer.from ||
        /* istanbul ignore next */
        function Buffer_from(value, encoding) {
            return new Buffer(value, encoding);
        };
    util._Buffer_allocUnsafe = Buffer.allocUnsafe ||
        /* istanbul ignore next */
        function Buffer_allocUnsafe(size) {
            return new Buffer(size);
        };
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./longbits":35,"@protobufjs/aspromise":1,"@protobufjs/base64":2,"@protobufjs/eventemitter":4,"@protobufjs/float":6,"@protobufjs/inquire":7,"@protobufjs/pool":9,"@protobufjs/utf8":10}],37:[function(require,module,exports){
"use strict";
module.exports = verifier;

var Enum      = require("./enum"),
    util      = require("./util");

function invalid(field, expected) {
    return field.name + ": " + expected + (field.repeated && expected !== "array" ? "[]" : field.map && expected !== "object" ? "{k:"+field.keyType+"}" : "") + " expected";
}

/**
 * Generates a partial value verifier.
 * @param {Codegen} gen Codegen instance
 * @param {Field} field Reflected field
 * @param {number} fieldIndex Field index
 * @param {string} ref Variable reference
 * @returns {Codegen} Codegen instance
 * @ignore
 */
function genVerifyValue(gen, field, fieldIndex, ref) {
    /* eslint-disable no-unexpected-multiline */
    if (field.resolvedType) {
        if (field.resolvedType instanceof Enum) { gen
            ("switch(%s){", ref)
                ("default:")
                    ("return%j", invalid(field, "enum value"));
            for (var keys = Object.keys(field.resolvedType.values), j = 0; j < keys.length; ++j) gen
                ("case %i:", field.resolvedType.values[keys[j]]);
            gen
                    ("break")
            ("}");
        } else {
            gen
            ("{")
                ("var e=types[%i].verify(%s);", fieldIndex, ref)
                ("if(e)")
                    ("return%j+e", field.name + ".")
            ("}");
        }
    } else {
        switch (field.type) {
            case "int32":
            case "uint32":
            case "sint32":
            case "fixed32":
            case "sfixed32": gen
                ("if(!util.isInteger(%s))", ref)
                    ("return%j", invalid(field, "integer"));
                break;
            case "int64":
            case "uint64":
            case "sint64":
            case "fixed64":
            case "sfixed64": gen
                ("if(!util.isInteger(%s)&&!(%s&&util.isInteger(%s.low)&&util.isInteger(%s.high)))", ref, ref, ref, ref)
                    ("return%j", invalid(field, "integer|Long"));
                break;
            case "float":
            case "double": gen
                ("if(typeof %s!==\"number\")", ref)
                    ("return%j", invalid(field, "number"));
                break;
            case "bool": gen
                ("if(typeof %s!==\"boolean\")", ref)
                    ("return%j", invalid(field, "boolean"));
                break;
            case "string": gen
                ("if(!util.isString(%s))", ref)
                    ("return%j", invalid(field, "string"));
                break;
            case "bytes": gen
                ("if(!(%s&&typeof %s.length===\"number\"||util.isString(%s)))", ref, ref, ref)
                    ("return%j", invalid(field, "buffer"));
                break;
        }
    }
    return gen;
    /* eslint-enable no-unexpected-multiline */
}

/**
 * Generates a partial key verifier.
 * @param {Codegen} gen Codegen instance
 * @param {Field} field Reflected field
 * @param {string} ref Variable reference
 * @returns {Codegen} Codegen instance
 * @ignore
 */
function genVerifyKey(gen, field, ref) {
    /* eslint-disable no-unexpected-multiline */
    switch (field.keyType) {
        case "int32":
        case "uint32":
        case "sint32":
        case "fixed32":
        case "sfixed32": gen
            ("if(!util.key32Re.test(%s))", ref)
                ("return%j", invalid(field, "integer key"));
            break;
        case "int64":
        case "uint64":
        case "sint64":
        case "fixed64":
        case "sfixed64": gen
            ("if(!util.key64Re.test(%s))", ref) // see comment above: x is ok, d is not
                ("return%j", invalid(field, "integer|Long key"));
            break;
        case "bool": gen
            ("if(!util.key2Re.test(%s))", ref)
                ("return%j", invalid(field, "boolean key"));
            break;
    }
    return gen;
    /* eslint-enable no-unexpected-multiline */
}

/**
 * Generates a verifier specific to the specified message type.
 * @param {Type} mtype Message type
 * @returns {Codegen} Codegen instance
 */
function verifier(mtype) {
    /* eslint-disable no-unexpected-multiline */

    var gen = util.codegen(["m"], mtype.name + "$verify")
    ("if(typeof m!==\"object\"||m===null)")
        ("return%j", "object expected");
    var oneofs = mtype.oneofsArray,
        seenFirstField = {};
    if (oneofs.length) gen
    ("var p={}");

    for (var i = 0; i < /* initializes */ mtype.fieldsArray.length; ++i) {
        var field = mtype._fieldsArray[i].resolve(),
            ref   = "m" + util.safeProp(field.name);

        if (field.optional) gen
        ("if(%s!=null&&m.hasOwnProperty(%j)){", ref, field.name); // !== undefined && !== null

        // map fields
        if (field.map) { gen
            ("if(!util.isObject(%s))", ref)
                ("return%j", invalid(field, "object"))
            ("var k=Object.keys(%s)", ref)
            ("for(var i=0;i<k.length;++i){");
                genVerifyKey(gen, field, "k[i]");
                genVerifyValue(gen, field, i, ref + "[k[i]]")
            ("}");

        // repeated fields
        } else if (field.repeated) { gen
            ("if(!Array.isArray(%s))", ref)
                ("return%j", invalid(field, "array"))
            ("for(var i=0;i<%s.length;++i){", ref);
                genVerifyValue(gen, field, i, ref + "[i]")
            ("}");

        // required or present fields
        } else {
            if (field.partOf) {
                var oneofProp = util.safeProp(field.partOf.name);
                if (seenFirstField[field.partOf.name] === 1) gen
            ("if(p%s===1)", oneofProp)
                ("return%j", field.partOf.name + ": multiple values");
                seenFirstField[field.partOf.name] = 1;
                gen
            ("p%s=1", oneofProp);
            }
            genVerifyValue(gen, field, i, ref);
        }
        if (field.optional) gen
        ("}");
    }
    return gen
    ("return null");
    /* eslint-enable no-unexpected-multiline */
}
},{"./enum":15,"./util":34}],38:[function(require,module,exports){
"use strict";

/**
 * Wrappers for common types.
 * @type {Object.<string,IWrapper>}
 * @const
 */
var wrappers = exports;

var Message = require("./message");

/**
 * From object converter part of an {@link IWrapper}.
 * @typedef WrapperFromObjectConverter
 * @type {function}
 * @param {Object.<string,*>} object Plain object
 * @returns {Message<{}>} Message instance
 * @this Type
 */

/**
 * To object converter part of an {@link IWrapper}.
 * @typedef WrapperToObjectConverter
 * @type {function}
 * @param {Message<{}>} message Message instance
 * @param {IConversionOptions} [options] Conversion options
 * @returns {Object.<string,*>} Plain object
 * @this Type
 */

/**
 * Common type wrapper part of {@link wrappers}.
 * @interface IWrapper
 * @property {WrapperFromObjectConverter} [fromObject] From object converter
 * @property {WrapperToObjectConverter} [toObject] To object converter
 */

// Custom wrapper for Any
wrappers[".google.protobuf.Any"] = {

    fromObject: function(object) {

        // unwrap value type if mapped
        if (object && object["@type"]) {
            var type = this.lookup(object["@type"]);
            /* istanbul ignore else */
            if (type) {
                // type_url does not accept leading "."
                var type_url = object["@type"].charAt(0) === "." ?
                    object["@type"].substr(1) : object["@type"];
                // type_url prefix is optional, but path seperator is required
                return this.create({
                    type_url: "/" + type_url,
                    value: type.encode(type.fromObject(object)).finish()
                });
            }
        }

        return this.fromObject(object);
    },

    toObject: function(message, options) {

        // decode value if requested and unmapped
        if (options && options.json && message.type_url && message.value) {
            // Only use fully qualified type name after the last '/'
            var name = message.type_url.substring(message.type_url.lastIndexOf("/") + 1);
            var type = this.lookup(name);
            /* istanbul ignore else */
            if (type)
                message = type.decode(message.value);
        }

        // wrap value if unmapped
        if (!(message instanceof this.ctor) && message instanceof Message) {
            var object = message.$type.toObject(message, options);
            object["@type"] = message.$type.fullName;
            return object;
        }

        return this.toObject(message, options);
    }
};

},{"./message":20}],39:[function(require,module,exports){
"use strict";
module.exports = Writer;

var util      = require("./util/minimal");

var BufferWriter; // cyclic

var LongBits  = util.LongBits,
    base64    = util.base64,
    utf8      = util.utf8;

/**
 * Constructs a new writer operation instance.
 * @classdesc Scheduled writer operation.
 * @constructor
 * @param {function(*, Uint8Array, number)} fn Function to call
 * @param {number} len Value byte length
 * @param {*} val Value to write
 * @ignore
 */
function Op(fn, len, val) {

    /**
     * Function to call.
     * @type {function(Uint8Array, number, *)}
     */
    this.fn = fn;

    /**
     * Value byte length.
     * @type {number}
     */
    this.len = len;

    /**
     * Next operation.
     * @type {Writer.Op|undefined}
     */
    this.next = undefined;

    /**
     * Value to write.
     * @type {*}
     */
    this.val = val; // type varies
}

/* istanbul ignore next */
function noop() {} // eslint-disable-line no-empty-function

/**
 * Constructs a new writer state instance.
 * @classdesc Copied writer state.
 * @memberof Writer
 * @constructor
 * @param {Writer} writer Writer to copy state from
 * @ignore
 */
function State(writer) {

    /**
     * Current head.
     * @type {Writer.Op}
     */
    this.head = writer.head;

    /**
     * Current tail.
     * @type {Writer.Op}
     */
    this.tail = writer.tail;

    /**
     * Current buffer length.
     * @type {number}
     */
    this.len = writer.len;

    /**
     * Next state.
     * @type {State|null}
     */
    this.next = writer.states;
}

/**
 * Constructs a new writer instance.
 * @classdesc Wire format writer using `Uint8Array` if available, otherwise `Array`.
 * @constructor
 */
function Writer() {

    /**
     * Current length.
     * @type {number}
     */
    this.len = 0;

    /**
     * Operations head.
     * @type {Object}
     */
    this.head = new Op(noop, 0, 0);

    /**
     * Operations tail
     * @type {Object}
     */
    this.tail = this.head;

    /**
     * Linked forked states.
     * @type {Object|null}
     */
    this.states = null;

    // When a value is written, the writer calculates its byte length and puts it into a linked
    // list of operations to perform when finish() is called. This both allows us to allocate
    // buffers of the exact required size and reduces the amount of work we have to do compared
    // to first calculating over objects and then encoding over objects. In our case, the encoding
    // part is just a linked list walk calling operations with already prepared values.
}

/**
 * Creates a new writer.
 * @function
 * @returns {BufferWriter|Writer} A {@link BufferWriter} when Buffers are supported, otherwise a {@link Writer}
 */
Writer.create = util.Buffer
    ? function create_buffer_setup() {
        return (Writer.create = function create_buffer() {
            return new BufferWriter();
        })();
    }
    /* istanbul ignore next */
    : function create_array() {
        return new Writer();
    };

/**
 * Allocates a buffer of the specified size.
 * @param {number} size Buffer size
 * @returns {Uint8Array} Buffer
 */
Writer.alloc = function alloc(size) {
    return new util.Array(size);
};

// Use Uint8Array buffer pool in the browser, just like node does with buffers
/* istanbul ignore else */
if (util.Array !== Array)
    Writer.alloc = util.pool(Writer.alloc, util.Array.prototype.subarray);

/**
 * Pushes a new operation to the queue.
 * @param {function(Uint8Array, number, *)} fn Function to call
 * @param {number} len Value byte length
 * @param {number} val Value to write
 * @returns {Writer} `this`
 * @private
 */
Writer.prototype._push = function push(fn, len, val) {
    this.tail = this.tail.next = new Op(fn, len, val);
    this.len += len;
    return this;
};

function writeByte(val, buf, pos) {
    buf[pos] = val & 255;
}

function writeVarint32(val, buf, pos) {
    while (val > 127) {
        buf[pos++] = val & 127 | 128;
        val >>>= 7;
    }
    buf[pos] = val;
}

/**
 * Constructs a new varint writer operation instance.
 * @classdesc Scheduled varint writer operation.
 * @extends Op
 * @constructor
 * @param {number} len Value byte length
 * @param {number} val Value to write
 * @ignore
 */
function VarintOp(len, val) {
    this.len = len;
    this.next = undefined;
    this.val = val;
}

VarintOp.prototype = Object.create(Op.prototype);
VarintOp.prototype.fn = writeVarint32;

/**
 * Writes an unsigned 32 bit value as a varint.
 * @param {number} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.uint32 = function write_uint32(value) {
    // here, the call to this.push has been inlined and a varint specific Op subclass is used.
    // uint32 is by far the most frequently used operation and benefits significantly from this.
    this.len += (this.tail = this.tail.next = new VarintOp(
        (value = value >>> 0)
                < 128       ? 1
        : value < 16384     ? 2
        : value < 2097152   ? 3
        : value < 268435456 ? 4
        :                     5,
    value)).len;
    return this;
};

/**
 * Writes a signed 32 bit value as a varint.
 * @function
 * @param {number} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.int32 = function write_int32(value) {
    return value < 0
        ? this._push(writeVarint64, 10, LongBits.fromNumber(value)) // 10 bytes per spec
        : this.uint32(value);
};

/**
 * Writes a 32 bit value as a varint, zig-zag encoded.
 * @param {number} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.sint32 = function write_sint32(value) {
    return this.uint32((value << 1 ^ value >> 31) >>> 0);
};

function writeVarint64(val, buf, pos) {
    while (val.hi) {
        buf[pos++] = val.lo & 127 | 128;
        val.lo = (val.lo >>> 7 | val.hi << 25) >>> 0;
        val.hi >>>= 7;
    }
    while (val.lo > 127) {
        buf[pos++] = val.lo & 127 | 128;
        val.lo = val.lo >>> 7;
    }
    buf[pos++] = val.lo;
}

/**
 * Writes an unsigned 64 bit value as a varint.
 * @param {Long|number|string} value Value to write
 * @returns {Writer} `this`
 * @throws {TypeError} If `value` is a string and no long library is present.
 */
Writer.prototype.uint64 = function write_uint64(value) {
    var bits = LongBits.from(value);
    return this._push(writeVarint64, bits.length(), bits);
};

/**
 * Writes a signed 64 bit value as a varint.
 * @function
 * @param {Long|number|string} value Value to write
 * @returns {Writer} `this`
 * @throws {TypeError} If `value` is a string and no long library is present.
 */
Writer.prototype.int64 = Writer.prototype.uint64;

/**
 * Writes a signed 64 bit value as a varint, zig-zag encoded.
 * @param {Long|number|string} value Value to write
 * @returns {Writer} `this`
 * @throws {TypeError} If `value` is a string and no long library is present.
 */
Writer.prototype.sint64 = function write_sint64(value) {
    var bits = LongBits.from(value).zzEncode();
    return this._push(writeVarint64, bits.length(), bits);
};

/**
 * Writes a boolish value as a varint.
 * @param {boolean} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.bool = function write_bool(value) {
    return this._push(writeByte, 1, value ? 1 : 0);
};

function writeFixed32(val, buf, pos) {
    buf[pos    ] =  val         & 255;
    buf[pos + 1] =  val >>> 8   & 255;
    buf[pos + 2] =  val >>> 16  & 255;
    buf[pos + 3] =  val >>> 24;
}

/**
 * Writes an unsigned 32 bit value as fixed 32 bits.
 * @param {number} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.fixed32 = function write_fixed32(value) {
    return this._push(writeFixed32, 4, value >>> 0);
};

/**
 * Writes a signed 32 bit value as fixed 32 bits.
 * @function
 * @param {number} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.sfixed32 = Writer.prototype.fixed32;

/**
 * Writes an unsigned 64 bit value as fixed 64 bits.
 * @param {Long|number|string} value Value to write
 * @returns {Writer} `this`
 * @throws {TypeError} If `value` is a string and no long library is present.
 */
Writer.prototype.fixed64 = function write_fixed64(value) {
    var bits = LongBits.from(value);
    return this._push(writeFixed32, 4, bits.lo)._push(writeFixed32, 4, bits.hi);
};

/**
 * Writes a signed 64 bit value as fixed 64 bits.
 * @function
 * @param {Long|number|string} value Value to write
 * @returns {Writer} `this`
 * @throws {TypeError} If `value` is a string and no long library is present.
 */
Writer.prototype.sfixed64 = Writer.prototype.fixed64;

/**
 * Writes a float (32 bit).
 * @function
 * @param {number} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.float = function write_float(value) {
    return this._push(util.float.writeFloatLE, 4, value);
};

/**
 * Writes a double (64 bit float).
 * @function
 * @param {number} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.double = function write_double(value) {
    return this._push(util.float.writeDoubleLE, 8, value);
};

var writeBytes = util.Array.prototype.set
    ? function writeBytes_set(val, buf, pos) {
        buf.set(val, pos); // also works for plain array values
    }
    /* istanbul ignore next */
    : function writeBytes_for(val, buf, pos) {
        for (var i = 0; i < val.length; ++i)
            buf[pos + i] = val[i];
    };

/**
 * Writes a sequence of bytes.
 * @param {Uint8Array|string} value Buffer or base64 encoded string to write
 * @returns {Writer} `this`
 */
Writer.prototype.bytes = function write_bytes(value) {
    var len = value.length >>> 0;
    if (!len)
        return this._push(writeByte, 1, 0);
    if (util.isString(value)) {
        var buf = Writer.alloc(len = base64.length(value));
        base64.decode(value, buf, 0);
        value = buf;
    }
    return this.uint32(len)._push(writeBytes, len, value);
};

/**
 * Writes a string.
 * @param {string} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.string = function write_string(value) {
    var len = utf8.length(value);
    return len
        ? this.uint32(len)._push(utf8.write, len, value)
        : this._push(writeByte, 1, 0);
};

/**
 * Forks this writer's state by pushing it to a stack.
 * Calling {@link Writer#reset|reset} or {@link Writer#ldelim|ldelim} resets the writer to the previous state.
 * @returns {Writer} `this`
 */
Writer.prototype.fork = function fork() {
    this.states = new State(this);
    this.head = this.tail = new Op(noop, 0, 0);
    this.len = 0;
    return this;
};

/**
 * Resets this instance to the last state.
 * @returns {Writer} `this`
 */
Writer.prototype.reset = function reset() {
    if (this.states) {
        this.head   = this.states.head;
        this.tail   = this.states.tail;
        this.len    = this.states.len;
        this.states = this.states.next;
    } else {
        this.head = this.tail = new Op(noop, 0, 0);
        this.len  = 0;
    }
    return this;
};

/**
 * Resets to the last state and appends the fork state's current write length as a varint followed by its operations.
 * @returns {Writer} `this`
 */
Writer.prototype.ldelim = function ldelim() {
    var head = this.head,
        tail = this.tail,
        len  = this.len;
    this.reset().uint32(len);
    if (len) {
        this.tail.next = head.next; // skip noop
        this.tail = tail;
        this.len += len;
    }
    return this;
};

/**
 * Finishes the write operation.
 * @returns {Uint8Array} Finished buffer
 */
Writer.prototype.finish = function finish() {
    var head = this.head.next, // skip noop
        buf  = this.constructor.alloc(this.len),
        pos  = 0;
    while (head) {
        head.fn(head.val, buf, pos);
        pos += head.len;
        head = head.next;
    }
    // this.head = this.tail = null;
    return buf;
};

Writer._configure = function(BufferWriter_) {
    BufferWriter = BufferWriter_;
};

},{"./util/minimal":36}],40:[function(require,module,exports){
"use strict";
module.exports = BufferWriter;

// extends Writer
var Writer = require("./writer");
(BufferWriter.prototype = Object.create(Writer.prototype)).constructor = BufferWriter;

var util = require("./util/minimal");

var Buffer = util.Buffer;

/**
 * Constructs a new buffer writer instance.
 * @classdesc Wire format writer using node buffers.
 * @extends Writer
 * @constructor
 */
function BufferWriter() {
    Writer.call(this);
}

/**
 * Allocates a buffer of the specified size.
 * @param {number} size Buffer size
 * @returns {Buffer} Buffer
 */
BufferWriter.alloc = function alloc_buffer(size) {
    return (BufferWriter.alloc = util._Buffer_allocUnsafe)(size);
};

var writeBytesBuffer = Buffer && Buffer.prototype instanceof Uint8Array && Buffer.prototype.set.name === "set"
    ? function writeBytesBuffer_set(val, buf, pos) {
        buf.set(val, pos); // faster than copy (requires node >= 4 where Buffers extend Uint8Array and set is properly inherited)
                           // also works for plain array values
    }
    /* istanbul ignore next */
    : function writeBytesBuffer_copy(val, buf, pos) {
        if (val.copy) // Buffer values
            val.copy(buf, pos, 0, val.length);
        else for (var i = 0; i < val.length;) // plain array values
            buf[pos++] = val[i++];
    };

/**
 * @override
 */
BufferWriter.prototype.bytes = function write_bytes_buffer(value) {
    if (util.isString(value))
        value = util._Buffer_from(value, "base64");
    var len = value.length >>> 0;
    this.uint32(len);
    if (len)
        this._push(writeBytesBuffer, len, value);
    return this;
};

function writeStringBuffer(val, buf, pos) {
    if (val.length < 40) // plain js is faster for short strings (probably due to redundant assertions)
        util.utf8.write(val, buf, pos);
    else
        buf.utf8Write(val, pos);
}

/**
 * @override
 */
BufferWriter.prototype.string = function write_string_buffer(value) {
    var len = Buffer.byteLength(value);
    this.uint32(len);
    if (len)
        this._push(writeStringBuffer, len, value);
    return this;
};


/**
 * Finishes the write operation.
 * @name BufferWriter#finish
 * @function
 * @returns {Buffer} Finished buffer
 */

},{"./util/minimal":36,"./writer":39}],41:[function(require,module,exports){
var protobuf = require("protobufjs/light");
// var descriptor = require("test_message.json");
var root = protobuf.Root.fromJSON({
    "nested": {
        "TestMessage" : {
            "fields": {
                "error": {
                    "type": "string",
                    "id": 1
                }
            }
        }
    }
});
var testMessage = root.TestMessage;

// function deserialize(bytes) {
//     var desPerson = messages.Person.deserializeBinary(bytes);
    
//     var name = desPerson.getName();
//     var id = desPerson.getId();
//     var email = desPerson.getEmail();
    
//     document.getElementById('ds_name').innerHTML = name;
//     document.getElementById('ds_id').innerHTML = id;
//     document.getElementById('ds_email').innerHTML = email;
// }

var oReq = new XMLHttpRequest();
oReq.open("POST", "http://localhost:5000/benchmark", true);
oReq.setRequestHeader("Content-Type", "application/json");
oReq.responseType = "arraybuffer";

oReq.onload = function (oEvent) {
    debugger;
    console.log('XHR request success');
    var arrayBuffer = oReq.response; // Note: not oReq.responseText
    if (arrayBuffer) {
    var byteArray = new Uint8Array(arrayBuffer);
    debugger;
    var decoded = testMessage.decode(byteArray);
    var object = testMessage.toObject(decoded);
    console.log(object);
}
};

oReq.send(JSON.stringify({
	"Key": "kR7UctBjE6PtEgfgTeUfY#$tk*w+g3dk@.M8K7E2kkZVqo3T4Bw#>L9xuB6pp=[y",
	"Mode": 1
}));
},{"protobufjs/light":11}]},{},[41])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvQHByb3RvYnVmanMvYXNwcm9taXNlL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL0Bwcm90b2J1ZmpzL2Jhc2U2NC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9AcHJvdG9idWZqcy9jb2RlZ2VuL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL0Bwcm90b2J1ZmpzL2V2ZW50ZW1pdHRlci9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9AcHJvdG9idWZqcy9mZXRjaC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9AcHJvdG9idWZqcy9mbG9hdC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9AcHJvdG9idWZqcy9pbnF1aXJlL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL0Bwcm90b2J1ZmpzL3BhdGgvaW5kZXguanMiLCJub2RlX21vZHVsZXMvQHByb3RvYnVmanMvcG9vbC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9AcHJvdG9idWZqcy91dGY4L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3Byb3RvYnVmanMvbGlnaHQuanMiLCJub2RlX21vZHVsZXMvcHJvdG9idWZqcy9zcmMvY29udmVydGVyLmpzIiwibm9kZV9tb2R1bGVzL3Byb3RvYnVmanMvc3JjL2RlY29kZXIuanMiLCJub2RlX21vZHVsZXMvcHJvdG9idWZqcy9zcmMvZW5jb2Rlci5qcyIsIm5vZGVfbW9kdWxlcy9wcm90b2J1ZmpzL3NyYy9lbnVtLmpzIiwibm9kZV9tb2R1bGVzL3Byb3RvYnVmanMvc3JjL2ZpZWxkLmpzIiwibm9kZV9tb2R1bGVzL3Byb3RvYnVmanMvc3JjL2luZGV4LWxpZ2h0LmpzIiwibm9kZV9tb2R1bGVzL3Byb3RvYnVmanMvc3JjL2luZGV4LW1pbmltYWwuanMiLCJub2RlX21vZHVsZXMvcHJvdG9idWZqcy9zcmMvbWFwZmllbGQuanMiLCJub2RlX21vZHVsZXMvcHJvdG9idWZqcy9zcmMvbWVzc2FnZS5qcyIsIm5vZGVfbW9kdWxlcy9wcm90b2J1ZmpzL3NyYy9tZXRob2QuanMiLCJub2RlX21vZHVsZXMvcHJvdG9idWZqcy9zcmMvbmFtZXNwYWNlLmpzIiwibm9kZV9tb2R1bGVzL3Byb3RvYnVmanMvc3JjL29iamVjdC5qcyIsIm5vZGVfbW9kdWxlcy9wcm90b2J1ZmpzL3NyYy9vbmVvZi5qcyIsIm5vZGVfbW9kdWxlcy9wcm90b2J1ZmpzL3NyYy9yZWFkZXIuanMiLCJub2RlX21vZHVsZXMvcHJvdG9idWZqcy9zcmMvcmVhZGVyX2J1ZmZlci5qcyIsIm5vZGVfbW9kdWxlcy9wcm90b2J1ZmpzL3NyYy9yb290LmpzIiwibm9kZV9tb2R1bGVzL3Byb3RvYnVmanMvc3JjL3Jvb3RzLmpzIiwibm9kZV9tb2R1bGVzL3Byb3RvYnVmanMvc3JjL3JwYy5qcyIsIm5vZGVfbW9kdWxlcy9wcm90b2J1ZmpzL3NyYy9ycGMvc2VydmljZS5qcyIsIm5vZGVfbW9kdWxlcy9wcm90b2J1ZmpzL3NyYy9zZXJ2aWNlLmpzIiwibm9kZV9tb2R1bGVzL3Byb3RvYnVmanMvc3JjL3R5cGUuanMiLCJub2RlX21vZHVsZXMvcHJvdG9idWZqcy9zcmMvdHlwZXMuanMiLCJub2RlX21vZHVsZXMvcHJvdG9idWZqcy9zcmMvdXRpbC5qcyIsIm5vZGVfbW9kdWxlcy9wcm90b2J1ZmpzL3NyYy91dGlsL2xvbmdiaXRzLmpzIiwibm9kZV9tb2R1bGVzL3Byb3RvYnVmanMvc3JjL3V0aWwvbWluaW1hbC5qcyIsIm5vZGVfbW9kdWxlcy9wcm90b2J1ZmpzL3NyYy92ZXJpZmllci5qcyIsIm5vZGVfbW9kdWxlcy9wcm90b2J1ZmpzL3NyYy93cmFwcGVycy5qcyIsIm5vZGVfbW9kdWxlcy9wcm90b2J1ZmpzL3NyYy93cml0ZXIuanMiLCJub2RlX21vZHVsZXMvcHJvdG9idWZqcy9zcmMvd3JpdGVyX2J1ZmZlci5qcyIsInJlcXVlc3RfYmluYXJ5LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvVUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6R0E7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25YQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDamJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN2tCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3hNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzlaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM2NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbm1vZHVsZS5leHBvcnRzID0gYXNQcm9taXNlO1xyXG5cclxuLyoqXHJcbiAqIENhbGxiYWNrIGFzIHVzZWQgYnkge0BsaW5rIHV0aWwuYXNQcm9taXNlfS5cclxuICogQHR5cGVkZWYgYXNQcm9taXNlQ2FsbGJhY2tcclxuICogQHR5cGUge2Z1bmN0aW9ufVxyXG4gKiBAcGFyYW0ge0Vycm9yfG51bGx9IGVycm9yIEVycm9yLCBpZiBhbnlcclxuICogQHBhcmFtIHsuLi4qfSBwYXJhbXMgQWRkaXRpb25hbCBhcmd1bWVudHNcclxuICogQHJldHVybnMge3VuZGVmaW5lZH1cclxuICovXHJcblxyXG4vKipcclxuICogUmV0dXJucyBhIHByb21pc2UgZnJvbSBhIG5vZGUtc3R5bGUgY2FsbGJhY2sgZnVuY3Rpb24uXHJcbiAqIEBtZW1iZXJvZiB1dGlsXHJcbiAqIEBwYXJhbSB7YXNQcm9taXNlQ2FsbGJhY2t9IGZuIEZ1bmN0aW9uIHRvIGNhbGxcclxuICogQHBhcmFtIHsqfSBjdHggRnVuY3Rpb24gY29udGV4dFxyXG4gKiBAcGFyYW0gey4uLip9IHBhcmFtcyBGdW5jdGlvbiBhcmd1bWVudHNcclxuICogQHJldHVybnMge1Byb21pc2U8Kj59IFByb21pc2lmaWVkIGZ1bmN0aW9uXHJcbiAqL1xyXG5mdW5jdGlvbiBhc1Byb21pc2UoZm4sIGN0eC8qLCB2YXJhcmdzICovKSB7XHJcbiAgICB2YXIgcGFyYW1zICA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSksXHJcbiAgICAgICAgb2Zmc2V0ICA9IDAsXHJcbiAgICAgICAgaW5kZXggICA9IDIsXHJcbiAgICAgICAgcGVuZGluZyA9IHRydWU7XHJcbiAgICB3aGlsZSAoaW5kZXggPCBhcmd1bWVudHMubGVuZ3RoKVxyXG4gICAgICAgIHBhcmFtc1tvZmZzZXQrK10gPSBhcmd1bWVudHNbaW5kZXgrK107XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gZXhlY3V0b3IocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAgICAgcGFyYW1zW29mZnNldF0gPSBmdW5jdGlvbiBjYWxsYmFjayhlcnIvKiwgdmFyYXJncyAqLykge1xyXG4gICAgICAgICAgICBpZiAocGVuZGluZykge1xyXG4gICAgICAgICAgICAgICAgcGVuZGluZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgaWYgKGVycilcclxuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBwYXJhbXMgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXQgPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChvZmZzZXQgPCBwYXJhbXMubGVuZ3RoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJhbXNbb2Zmc2V0KytdID0gYXJndW1lbnRzW29mZnNldF07XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZS5hcHBseShudWxsLCBwYXJhbXMpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBmbi5hcHBseShjdHggfHwgbnVsbCwgcGFyYW1zKTtcclxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgaWYgKHBlbmRpbmcpIHtcclxuICAgICAgICAgICAgICAgIHBlbmRpbmcgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4vKipcclxuICogQSBtaW5pbWFsIGJhc2U2NCBpbXBsZW1lbnRhdGlvbiBmb3IgbnVtYmVyIGFycmF5cy5cclxuICogQG1lbWJlcm9mIHV0aWxcclxuICogQG5hbWVzcGFjZVxyXG4gKi9cclxudmFyIGJhc2U2NCA9IGV4cG9ydHM7XHJcblxyXG4vKipcclxuICogQ2FsY3VsYXRlcyB0aGUgYnl0ZSBsZW5ndGggb2YgYSBiYXNlNjQgZW5jb2RlZCBzdHJpbmcuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgQmFzZTY0IGVuY29kZWQgc3RyaW5nXHJcbiAqIEByZXR1cm5zIHtudW1iZXJ9IEJ5dGUgbGVuZ3RoXHJcbiAqL1xyXG5iYXNlNjQubGVuZ3RoID0gZnVuY3Rpb24gbGVuZ3RoKHN0cmluZykge1xyXG4gICAgdmFyIHAgPSBzdHJpbmcubGVuZ3RoO1xyXG4gICAgaWYgKCFwKVxyXG4gICAgICAgIHJldHVybiAwO1xyXG4gICAgdmFyIG4gPSAwO1xyXG4gICAgd2hpbGUgKC0tcCAlIDQgPiAxICYmIHN0cmluZy5jaGFyQXQocCkgPT09IFwiPVwiKVxyXG4gICAgICAgICsrbjtcclxuICAgIHJldHVybiBNYXRoLmNlaWwoc3RyaW5nLmxlbmd0aCAqIDMpIC8gNCAtIG47XHJcbn07XHJcblxyXG4vLyBCYXNlNjQgZW5jb2RpbmcgdGFibGVcclxudmFyIGI2NCA9IG5ldyBBcnJheSg2NCk7XHJcblxyXG4vLyBCYXNlNjQgZGVjb2RpbmcgdGFibGVcclxudmFyIHM2NCA9IG5ldyBBcnJheSgxMjMpO1xyXG5cclxuLy8gNjUuLjkwLCA5Ny4uMTIyLCA0OC4uNTcsIDQzLCA0N1xyXG5mb3IgKHZhciBpID0gMDsgaSA8IDY0OylcclxuICAgIHM2NFtiNjRbaV0gPSBpIDwgMjYgPyBpICsgNjUgOiBpIDwgNTIgPyBpICsgNzEgOiBpIDwgNjIgPyBpIC0gNCA6IGkgLSA1OSB8IDQzXSA9IGkrKztcclxuXHJcbi8qKlxyXG4gKiBFbmNvZGVzIGEgYnVmZmVyIHRvIGEgYmFzZTY0IGVuY29kZWQgc3RyaW5nLlxyXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGJ1ZmZlciBTb3VyY2UgYnVmZmVyXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBzdGFydCBTb3VyY2Ugc3RhcnRcclxuICogQHBhcmFtIHtudW1iZXJ9IGVuZCBTb3VyY2UgZW5kXHJcbiAqIEByZXR1cm5zIHtzdHJpbmd9IEJhc2U2NCBlbmNvZGVkIHN0cmluZ1xyXG4gKi9cclxuYmFzZTY0LmVuY29kZSA9IGZ1bmN0aW9uIGVuY29kZShidWZmZXIsIHN0YXJ0LCBlbmQpIHtcclxuICAgIHZhciBwYXJ0cyA9IG51bGwsXHJcbiAgICAgICAgY2h1bmsgPSBbXTtcclxuICAgIHZhciBpID0gMCwgLy8gb3V0cHV0IGluZGV4XHJcbiAgICAgICAgaiA9IDAsIC8vIGdvdG8gaW5kZXhcclxuICAgICAgICB0OyAgICAgLy8gdGVtcG9yYXJ5XHJcbiAgICB3aGlsZSAoc3RhcnQgPCBlbmQpIHtcclxuICAgICAgICB2YXIgYiA9IGJ1ZmZlcltzdGFydCsrXTtcclxuICAgICAgICBzd2l0Y2ggKGopIHtcclxuICAgICAgICAgICAgY2FzZSAwOlxyXG4gICAgICAgICAgICAgICAgY2h1bmtbaSsrXSA9IGI2NFtiID4+IDJdO1xyXG4gICAgICAgICAgICAgICAgdCA9IChiICYgMykgPDwgNDtcclxuICAgICAgICAgICAgICAgIGogPSAxO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgMTpcclxuICAgICAgICAgICAgICAgIGNodW5rW2krK10gPSBiNjRbdCB8IGIgPj4gNF07XHJcbiAgICAgICAgICAgICAgICB0ID0gKGIgJiAxNSkgPDwgMjtcclxuICAgICAgICAgICAgICAgIGogPSAyO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgMjpcclxuICAgICAgICAgICAgICAgIGNodW5rW2krK10gPSBiNjRbdCB8IGIgPj4gNl07XHJcbiAgICAgICAgICAgICAgICBjaHVua1tpKytdID0gYjY0W2IgJiA2M107XHJcbiAgICAgICAgICAgICAgICBqID0gMDtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoaSA+IDgxOTEpIHtcclxuICAgICAgICAgICAgKHBhcnRzIHx8IChwYXJ0cyA9IFtdKSkucHVzaChTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KFN0cmluZywgY2h1bmspKTtcclxuICAgICAgICAgICAgaSA9IDA7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYgKGopIHtcclxuICAgICAgICBjaHVua1tpKytdID0gYjY0W3RdO1xyXG4gICAgICAgIGNodW5rW2krK10gPSA2MTtcclxuICAgICAgICBpZiAoaiA9PT0gMSlcclxuICAgICAgICAgICAgY2h1bmtbaSsrXSA9IDYxO1xyXG4gICAgfVxyXG4gICAgaWYgKHBhcnRzKSB7XHJcbiAgICAgICAgaWYgKGkpXHJcbiAgICAgICAgICAgIHBhcnRzLnB1c2goU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShTdHJpbmcsIGNodW5rLnNsaWNlKDAsIGkpKSk7XHJcbiAgICAgICAgcmV0dXJuIHBhcnRzLmpvaW4oXCJcIik7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShTdHJpbmcsIGNodW5rLnNsaWNlKDAsIGkpKTtcclxufTtcclxuXHJcbnZhciBpbnZhbGlkRW5jb2RpbmcgPSBcImludmFsaWQgZW5jb2RpbmdcIjtcclxuXHJcbi8qKlxyXG4gKiBEZWNvZGVzIGEgYmFzZTY0IGVuY29kZWQgc3RyaW5nIHRvIGEgYnVmZmVyLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIFNvdXJjZSBzdHJpbmdcclxuICogQHBhcmFtIHtVaW50OEFycmF5fSBidWZmZXIgRGVzdGluYXRpb24gYnVmZmVyXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBvZmZzZXQgRGVzdGluYXRpb24gb2Zmc2V0XHJcbiAqIEByZXR1cm5zIHtudW1iZXJ9IE51bWJlciBvZiBieXRlcyB3cml0dGVuXHJcbiAqIEB0aHJvd3Mge0Vycm9yfSBJZiBlbmNvZGluZyBpcyBpbnZhbGlkXHJcbiAqL1xyXG5iYXNlNjQuZGVjb2RlID0gZnVuY3Rpb24gZGVjb2RlKHN0cmluZywgYnVmZmVyLCBvZmZzZXQpIHtcclxuICAgIHZhciBzdGFydCA9IG9mZnNldDtcclxuICAgIHZhciBqID0gMCwgLy8gZ290byBpbmRleFxyXG4gICAgICAgIHQ7ICAgICAvLyB0ZW1wb3JhcnlcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyaW5nLmxlbmd0aDspIHtcclxuICAgICAgICB2YXIgYyA9IHN0cmluZy5jaGFyQ29kZUF0KGkrKyk7XHJcbiAgICAgICAgaWYgKGMgPT09IDYxICYmIGogPiAxKVxyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBpZiAoKGMgPSBzNjRbY10pID09PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgIHRocm93IEVycm9yKGludmFsaWRFbmNvZGluZyk7XHJcbiAgICAgICAgc3dpdGNoIChqKSB7XHJcbiAgICAgICAgICAgIGNhc2UgMDpcclxuICAgICAgICAgICAgICAgIHQgPSBjO1xyXG4gICAgICAgICAgICAgICAgaiA9IDE7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAxOlxyXG4gICAgICAgICAgICAgICAgYnVmZmVyW29mZnNldCsrXSA9IHQgPDwgMiB8IChjICYgNDgpID4+IDQ7XHJcbiAgICAgICAgICAgICAgICB0ID0gYztcclxuICAgICAgICAgICAgICAgIGogPSAyO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgMjpcclxuICAgICAgICAgICAgICAgIGJ1ZmZlcltvZmZzZXQrK10gPSAodCAmIDE1KSA8PCA0IHwgKGMgJiA2MCkgPj4gMjtcclxuICAgICAgICAgICAgICAgIHQgPSBjO1xyXG4gICAgICAgICAgICAgICAgaiA9IDM7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAzOlxyXG4gICAgICAgICAgICAgICAgYnVmZmVyW29mZnNldCsrXSA9ICh0ICYgMykgPDwgNiB8IGM7XHJcbiAgICAgICAgICAgICAgICBqID0gMDtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmIChqID09PSAxKVxyXG4gICAgICAgIHRocm93IEVycm9yKGludmFsaWRFbmNvZGluZyk7XHJcbiAgICByZXR1cm4gb2Zmc2V0IC0gc3RhcnQ7XHJcbn07XHJcblxyXG4vKipcclxuICogVGVzdHMgaWYgdGhlIHNwZWNpZmllZCBzdHJpbmcgYXBwZWFycyB0byBiZSBiYXNlNjQgZW5jb2RlZC5cclxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyBTdHJpbmcgdG8gdGVzdFxyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gYHRydWVgIGlmIHByb2JhYmx5IGJhc2U2NCBlbmNvZGVkLCBvdGhlcndpc2UgZmFsc2VcclxuICovXHJcbmJhc2U2NC50ZXN0ID0gZnVuY3Rpb24gdGVzdChzdHJpbmcpIHtcclxuICAgIHJldHVybiAvXig/OltBLVphLXowLTkrL117NH0pKig/OltBLVphLXowLTkrL117Mn09PXxbQS1aYS16MC05Ky9dezN9PSk/JC8udGVzdChzdHJpbmcpO1xyXG59O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxubW9kdWxlLmV4cG9ydHMgPSBjb2RlZ2VuO1xyXG5cclxuLyoqXHJcbiAqIEJlZ2lucyBnZW5lcmF0aW5nIGEgZnVuY3Rpb24uXHJcbiAqIEBtZW1iZXJvZiB1dGlsXHJcbiAqIEBwYXJhbSB7c3RyaW5nW119IGZ1bmN0aW9uUGFyYW1zIEZ1bmN0aW9uIHBhcmFtZXRlciBuYW1lc1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gW2Z1bmN0aW9uTmFtZV0gRnVuY3Rpb24gbmFtZSBpZiBub3QgYW5vbnltb3VzXHJcbiAqIEByZXR1cm5zIHtDb2RlZ2VufSBBcHBlbmRlciB0aGF0IGFwcGVuZHMgY29kZSB0byB0aGUgZnVuY3Rpb24ncyBib2R5XHJcbiAqL1xyXG5mdW5jdGlvbiBjb2RlZ2VuKGZ1bmN0aW9uUGFyYW1zLCBmdW5jdGlvbk5hbWUpIHtcclxuXHJcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cclxuICAgIGlmICh0eXBlb2YgZnVuY3Rpb25QYXJhbXMgPT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgICBmdW5jdGlvbk5hbWUgPSBmdW5jdGlvblBhcmFtcztcclxuICAgICAgICBmdW5jdGlvblBhcmFtcyA9IHVuZGVmaW5lZDtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgYm9keSA9IFtdO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQXBwZW5kcyBjb2RlIHRvIHRoZSBmdW5jdGlvbidzIGJvZHkgb3IgZmluaXNoZXMgZ2VuZXJhdGlvbi5cclxuICAgICAqIEB0eXBlZGVmIENvZGVnZW5cclxuICAgICAqIEB0eXBlIHtmdW5jdGlvbn1cclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfE9iamVjdC48c3RyaW5nLCo+fSBbZm9ybWF0U3RyaW5nT3JTY29wZV0gRm9ybWF0IHN0cmluZyBvciwgdG8gZmluaXNoIHRoZSBmdW5jdGlvbiwgYW4gb2JqZWN0IG9mIGFkZGl0aW9uYWwgc2NvcGUgdmFyaWFibGVzLCBpZiBhbnlcclxuICAgICAqIEBwYXJhbSB7Li4uKn0gW2Zvcm1hdFBhcmFtc10gRm9ybWF0IHBhcmFtZXRlcnNcclxuICAgICAqIEByZXR1cm5zIHtDb2RlZ2VufEZ1bmN0aW9ufSBJdHNlbGYgb3IgdGhlIGdlbmVyYXRlZCBmdW5jdGlvbiBpZiBmaW5pc2hlZFxyXG4gICAgICogQHRocm93cyB7RXJyb3J9IElmIGZvcm1hdCBwYXJhbWV0ZXIgY291bnRzIGRvIG5vdCBtYXRjaFxyXG4gICAgICovXHJcblxyXG4gICAgZnVuY3Rpb24gQ29kZWdlbihmb3JtYXRTdHJpbmdPclNjb3BlKSB7XHJcbiAgICAgICAgLy8gbm90ZSB0aGF0IGV4cGxpY2l0IGFycmF5IGhhbmRsaW5nIGJlbG93IG1ha2VzIHRoaXMgfjUwJSBmYXN0ZXJcclxuXHJcbiAgICAgICAgLy8gZmluaXNoIHRoZSBmdW5jdGlvblxyXG4gICAgICAgIGlmICh0eXBlb2YgZm9ybWF0U3RyaW5nT3JTY29wZSAhPT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgICAgICB2YXIgc291cmNlID0gdG9TdHJpbmcoKTtcclxuICAgICAgICAgICAgaWYgKGNvZGVnZW4udmVyYm9zZSlcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiY29kZWdlbjogXCIgKyBzb3VyY2UpOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcclxuICAgICAgICAgICAgc291cmNlID0gXCJyZXR1cm4gXCIgKyBzb3VyY2U7XHJcbiAgICAgICAgICAgIGlmIChmb3JtYXRTdHJpbmdPclNjb3BlKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgc2NvcGVLZXlzICAgPSBPYmplY3Qua2V5cyhmb3JtYXRTdHJpbmdPclNjb3BlKSxcclxuICAgICAgICAgICAgICAgICAgICBzY29wZVBhcmFtcyA9IG5ldyBBcnJheShzY29wZUtleXMubGVuZ3RoICsgMSksXHJcbiAgICAgICAgICAgICAgICAgICAgc2NvcGVWYWx1ZXMgPSBuZXcgQXJyYXkoc2NvcGVLZXlzLmxlbmd0aCksXHJcbiAgICAgICAgICAgICAgICAgICAgc2NvcGVPZmZzZXQgPSAwO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKHNjb3BlT2Zmc2V0IDwgc2NvcGVLZXlzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHNjb3BlUGFyYW1zW3Njb3BlT2Zmc2V0XSA9IHNjb3BlS2V5c1tzY29wZU9mZnNldF07XHJcbiAgICAgICAgICAgICAgICAgICAgc2NvcGVWYWx1ZXNbc2NvcGVPZmZzZXRdID0gZm9ybWF0U3RyaW5nT3JTY29wZVtzY29wZUtleXNbc2NvcGVPZmZzZXQrK11dO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgc2NvcGVQYXJhbXNbc2NvcGVPZmZzZXRdID0gc291cmNlO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIEZ1bmN0aW9uLmFwcGx5KG51bGwsIHNjb3BlUGFyYW1zKS5hcHBseShudWxsLCBzY29wZVZhbHVlcyk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbmV3LWZ1bmNcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gRnVuY3Rpb24oc291cmNlKSgpOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW5ldy1mdW5jXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBvdGhlcndpc2UgYXBwZW5kIHRvIGJvZHlcclxuICAgICAgICB2YXIgZm9ybWF0UGFyYW1zID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKSxcclxuICAgICAgICAgICAgZm9ybWF0T2Zmc2V0ID0gMDtcclxuICAgICAgICB3aGlsZSAoZm9ybWF0T2Zmc2V0IDwgZm9ybWF0UGFyYW1zLmxlbmd0aClcclxuICAgICAgICAgICAgZm9ybWF0UGFyYW1zW2Zvcm1hdE9mZnNldF0gPSBhcmd1bWVudHNbKytmb3JtYXRPZmZzZXRdO1xyXG4gICAgICAgIGZvcm1hdE9mZnNldCA9IDA7XHJcbiAgICAgICAgZm9ybWF0U3RyaW5nT3JTY29wZSA9IGZvcm1hdFN0cmluZ09yU2NvcGUucmVwbGFjZSgvJShbJWRmaWpzXSkvZywgZnVuY3Rpb24gcmVwbGFjZSgkMCwgJDEpIHtcclxuICAgICAgICAgICAgdmFyIHZhbHVlID0gZm9ybWF0UGFyYW1zW2Zvcm1hdE9mZnNldCsrXTtcclxuICAgICAgICAgICAgc3dpdGNoICgkMSkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImRcIjogY2FzZSBcImZcIjogcmV0dXJuIFN0cmluZyhOdW1iZXIodmFsdWUpKTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJpXCI6IHJldHVybiBTdHJpbmcoTWF0aC5mbG9vcih2YWx1ZSkpO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImpcIjogcmV0dXJuIEpTT04uc3RyaW5naWZ5KHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJzXCI6IHJldHVybiBTdHJpbmcodmFsdWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBcIiVcIjtcclxuICAgICAgICB9KTtcclxuICAgICAgICBpZiAoZm9ybWF0T2Zmc2V0ICE9PSBmb3JtYXRQYXJhbXMubGVuZ3RoKVxyXG4gICAgICAgICAgICB0aHJvdyBFcnJvcihcInBhcmFtZXRlciBjb3VudCBtaXNtYXRjaFwiKTtcclxuICAgICAgICBib2R5LnB1c2goZm9ybWF0U3RyaW5nT3JTY29wZSk7XHJcbiAgICAgICAgcmV0dXJuIENvZGVnZW47XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gdG9TdHJpbmcoZnVuY3Rpb25OYW1lT3ZlcnJpZGUpIHtcclxuICAgICAgICByZXR1cm4gXCJmdW5jdGlvbiBcIiArIChmdW5jdGlvbk5hbWVPdmVycmlkZSB8fCBmdW5jdGlvbk5hbWUgfHwgXCJcIikgKyBcIihcIiArIChmdW5jdGlvblBhcmFtcyAmJiBmdW5jdGlvblBhcmFtcy5qb2luKFwiLFwiKSB8fCBcIlwiKSArIFwiKXtcXG4gIFwiICsgYm9keS5qb2luKFwiXFxuICBcIikgKyBcIlxcbn1cIjtcclxuICAgIH1cclxuXHJcbiAgICBDb2RlZ2VuLnRvU3RyaW5nID0gdG9TdHJpbmc7XHJcbiAgICByZXR1cm4gQ29kZWdlbjtcclxufVxyXG5cclxuLyoqXHJcbiAqIEJlZ2lucyBnZW5lcmF0aW5nIGEgZnVuY3Rpb24uXHJcbiAqIEBtZW1iZXJvZiB1dGlsXHJcbiAqIEBmdW5jdGlvbiBjb2RlZ2VuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBbZnVuY3Rpb25OYW1lXSBGdW5jdGlvbiBuYW1lIGlmIG5vdCBhbm9ueW1vdXNcclxuICogQHJldHVybnMge0NvZGVnZW59IEFwcGVuZGVyIHRoYXQgYXBwZW5kcyBjb2RlIHRvIHRoZSBmdW5jdGlvbidzIGJvZHlcclxuICogQHZhcmlhdGlvbiAyXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIFdoZW4gc2V0IHRvIGB0cnVlYCwgY29kZWdlbiB3aWxsIGxvZyBnZW5lcmF0ZWQgY29kZSB0byBjb25zb2xlLiBVc2VmdWwgZm9yIGRlYnVnZ2luZy5cclxuICogQG5hbWUgdXRpbC5jb2RlZ2VuLnZlcmJvc2VcclxuICogQHR5cGUge2Jvb2xlYW59XHJcbiAqL1xyXG5jb2RlZ2VuLnZlcmJvc2UgPSBmYWxzZTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbm1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xyXG5cclxuLyoqXHJcbiAqIENvbnN0cnVjdHMgYSBuZXcgZXZlbnQgZW1pdHRlciBpbnN0YW5jZS5cclxuICogQGNsYXNzZGVzYyBBIG1pbmltYWwgZXZlbnQgZW1pdHRlci5cclxuICogQG1lbWJlcm9mIHV0aWxcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqL1xyXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZWdpc3RlcmVkIGxpc3RlbmVycy5cclxuICAgICAqIEB0eXBlIHtPYmplY3QuPHN0cmluZywqPn1cclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIHRoaXMuX2xpc3RlbmVycyA9IHt9O1xyXG59XHJcblxyXG4vKipcclxuICogUmVnaXN0ZXJzIGFuIGV2ZW50IGxpc3RlbmVyLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gZXZ0IEV2ZW50IG5hbWVcclxuICogQHBhcmFtIHtmdW5jdGlvbn0gZm4gTGlzdGVuZXJcclxuICogQHBhcmFtIHsqfSBbY3R4XSBMaXN0ZW5lciBjb250ZXh0XHJcbiAqIEByZXR1cm5zIHt1dGlsLkV2ZW50RW1pdHRlcn0gYHRoaXNgXHJcbiAqL1xyXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gb24oZXZ0LCBmbiwgY3R4KSB7XHJcbiAgICAodGhpcy5fbGlzdGVuZXJzW2V2dF0gfHwgKHRoaXMuX2xpc3RlbmVyc1tldnRdID0gW10pKS5wdXNoKHtcclxuICAgICAgICBmbiAgOiBmbixcclxuICAgICAgICBjdHggOiBjdHggfHwgdGhpc1xyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZW1vdmVzIGFuIGV2ZW50IGxpc3RlbmVyIG9yIGFueSBtYXRjaGluZyBsaXN0ZW5lcnMgaWYgYXJndW1lbnRzIGFyZSBvbWl0dGVkLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gW2V2dF0gRXZlbnQgbmFtZS4gUmVtb3ZlcyBhbGwgbGlzdGVuZXJzIGlmIG9taXR0ZWQuXHJcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IFtmbl0gTGlzdGVuZXIgdG8gcmVtb3ZlLiBSZW1vdmVzIGFsbCBsaXN0ZW5lcnMgb2YgYGV2dGAgaWYgb21pdHRlZC5cclxuICogQHJldHVybnMge3V0aWwuRXZlbnRFbWl0dGVyfSBgdGhpc2BcclxuICovXHJcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub2ZmID0gZnVuY3Rpb24gb2ZmKGV2dCwgZm4pIHtcclxuICAgIGlmIChldnQgPT09IHVuZGVmaW5lZClcclxuICAgICAgICB0aGlzLl9saXN0ZW5lcnMgPSB7fTtcclxuICAgIGVsc2Uge1xyXG4gICAgICAgIGlmIChmbiA9PT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICB0aGlzLl9saXN0ZW5lcnNbZXZ0XSA9IFtdO1xyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fbGlzdGVuZXJzW2V2dF07XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGlzdGVuZXJzLmxlbmd0aDspXHJcbiAgICAgICAgICAgICAgICBpZiAobGlzdGVuZXJzW2ldLmZuID09PSBmbilcclxuICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICsraTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBFbWl0cyBhbiBldmVudCBieSBjYWxsaW5nIGl0cyBsaXN0ZW5lcnMgd2l0aCB0aGUgc3BlY2lmaWVkIGFyZ3VtZW50cy5cclxuICogQHBhcmFtIHtzdHJpbmd9IGV2dCBFdmVudCBuYW1lXHJcbiAqIEBwYXJhbSB7Li4uKn0gYXJncyBBcmd1bWVudHNcclxuICogQHJldHVybnMge3V0aWwuRXZlbnRFbWl0dGVyfSBgdGhpc2BcclxuICovXHJcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uIGVtaXQoZXZ0KSB7XHJcbiAgICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fbGlzdGVuZXJzW2V2dF07XHJcbiAgICBpZiAobGlzdGVuZXJzKSB7XHJcbiAgICAgICAgdmFyIGFyZ3MgPSBbXSxcclxuICAgICAgICAgICAgaSA9IDE7XHJcbiAgICAgICAgZm9yICg7IGkgPCBhcmd1bWVudHMubGVuZ3RoOylcclxuICAgICAgICAgICAgYXJncy5wdXNoKGFyZ3VtZW50c1tpKytdKTtcclxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGlzdGVuZXJzLmxlbmd0aDspXHJcbiAgICAgICAgICAgIGxpc3RlbmVyc1tpXS5mbi5hcHBseShsaXN0ZW5lcnNbaSsrXS5jdHgsIGFyZ3MpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZldGNoO1xyXG5cclxudmFyIGFzUHJvbWlzZSA9IHJlcXVpcmUoXCJAcHJvdG9idWZqcy9hc3Byb21pc2VcIiksXHJcbiAgICBpbnF1aXJlICAgPSByZXF1aXJlKFwiQHByb3RvYnVmanMvaW5xdWlyZVwiKTtcclxuXHJcbnZhciBmcyA9IGlucXVpcmUoXCJmc1wiKTtcclxuXHJcbi8qKlxyXG4gKiBOb2RlLXN0eWxlIGNhbGxiYWNrIGFzIHVzZWQgYnkge0BsaW5rIHV0aWwuZmV0Y2h9LlxyXG4gKiBAdHlwZWRlZiBGZXRjaENhbGxiYWNrXHJcbiAqIEB0eXBlIHtmdW5jdGlvbn1cclxuICogQHBhcmFtIHs/RXJyb3J9IGVycm9yIEVycm9yLCBpZiBhbnksIG90aGVyd2lzZSBgbnVsbGBcclxuICogQHBhcmFtIHtzdHJpbmd9IFtjb250ZW50c10gRmlsZSBjb250ZW50cywgaWYgdGhlcmUgaGFzbid0IGJlZW4gYW4gZXJyb3JcclxuICogQHJldHVybnMge3VuZGVmaW5lZH1cclxuICovXHJcblxyXG4vKipcclxuICogT3B0aW9ucyBhcyB1c2VkIGJ5IHtAbGluayB1dGlsLmZldGNofS5cclxuICogQHR5cGVkZWYgRmV0Y2hPcHRpb25zXHJcbiAqIEB0eXBlIHtPYmplY3R9XHJcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gW2JpbmFyeT1mYWxzZV0gV2hldGhlciBleHBlY3RpbmcgYSBiaW5hcnkgcmVzcG9uc2VcclxuICogQHByb3BlcnR5IHtib29sZWFufSBbeGhyPWZhbHNlXSBJZiBgdHJ1ZWAsIGZvcmNlcyB0aGUgdXNlIG9mIFhNTEh0dHBSZXF1ZXN0XHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIEZldGNoZXMgdGhlIGNvbnRlbnRzIG9mIGEgZmlsZS5cclxuICogQG1lbWJlcm9mIHV0aWxcclxuICogQHBhcmFtIHtzdHJpbmd9IGZpbGVuYW1lIEZpbGUgcGF0aCBvciB1cmxcclxuICogQHBhcmFtIHtGZXRjaE9wdGlvbnN9IG9wdGlvbnMgRmV0Y2ggb3B0aW9uc1xyXG4gKiBAcGFyYW0ge0ZldGNoQ2FsbGJhY2t9IGNhbGxiYWNrIENhbGxiYWNrIGZ1bmN0aW9uXHJcbiAqIEByZXR1cm5zIHt1bmRlZmluZWR9XHJcbiAqL1xyXG5mdW5jdGlvbiBmZXRjaChmaWxlbmFtZSwgb3B0aW9ucywgY2FsbGJhY2spIHtcclxuICAgIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgICAgY2FsbGJhY2sgPSBvcHRpb25zO1xyXG4gICAgICAgIG9wdGlvbnMgPSB7fTtcclxuICAgIH0gZWxzZSBpZiAoIW9wdGlvbnMpXHJcbiAgICAgICAgb3B0aW9ucyA9IHt9O1xyXG5cclxuICAgIGlmICghY2FsbGJhY2spXHJcbiAgICAgICAgcmV0dXJuIGFzUHJvbWlzZShmZXRjaCwgdGhpcywgZmlsZW5hbWUsIG9wdGlvbnMpOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWludmFsaWQtdGhpc1xyXG5cclxuICAgIC8vIGlmIGEgbm9kZS1saWtlIGZpbGVzeXN0ZW0gaXMgcHJlc2VudCwgdHJ5IGl0IGZpcnN0IGJ1dCBmYWxsIGJhY2sgdG8gWEhSIGlmIG5vdGhpbmcgaXMgZm91bmQuXHJcbiAgICBpZiAoIW9wdGlvbnMueGhyICYmIGZzICYmIGZzLnJlYWRGaWxlKVxyXG4gICAgICAgIHJldHVybiBmcy5yZWFkRmlsZShmaWxlbmFtZSwgZnVuY3Rpb24gZmV0Y2hSZWFkRmlsZUNhbGxiYWNrKGVyciwgY29udGVudHMpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVyciAmJiB0eXBlb2YgWE1MSHR0cFJlcXVlc3QgIT09IFwidW5kZWZpbmVkXCJcclxuICAgICAgICAgICAgICAgID8gZmV0Y2gueGhyKGZpbGVuYW1lLCBvcHRpb25zLCBjYWxsYmFjaylcclxuICAgICAgICAgICAgICAgIDogZXJyXHJcbiAgICAgICAgICAgICAgICA/IGNhbGxiYWNrKGVycilcclxuICAgICAgICAgICAgICAgIDogY2FsbGJhY2sobnVsbCwgb3B0aW9ucy5iaW5hcnkgPyBjb250ZW50cyA6IGNvbnRlbnRzLnRvU3RyaW5nKFwidXRmOFwiKSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgLy8gdXNlIHRoZSBYSFIgdmVyc2lvbiBvdGhlcndpc2UuXHJcbiAgICByZXR1cm4gZmV0Y2gueGhyKGZpbGVuYW1lLCBvcHRpb25zLCBjYWxsYmFjayk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBGZXRjaGVzIHRoZSBjb250ZW50cyBvZiBhIGZpbGUuXHJcbiAqIEBuYW1lIHV0aWwuZmV0Y2hcclxuICogQGZ1bmN0aW9uXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIEZpbGUgcGF0aCBvciB1cmxcclxuICogQHBhcmFtIHtGZXRjaENhbGxiYWNrfSBjYWxsYmFjayBDYWxsYmFjayBmdW5jdGlvblxyXG4gKiBAcmV0dXJucyB7dW5kZWZpbmVkfVxyXG4gKiBAdmFyaWF0aW9uIDJcclxuICovXHJcblxyXG4vKipcclxuICogRmV0Y2hlcyB0aGUgY29udGVudHMgb2YgYSBmaWxlLlxyXG4gKiBAbmFtZSB1dGlsLmZldGNoXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcGF0aCBGaWxlIHBhdGggb3IgdXJsXHJcbiAqIEBwYXJhbSB7RmV0Y2hPcHRpb25zfSBbb3B0aW9uc10gRmV0Y2ggb3B0aW9uc1xyXG4gKiBAcmV0dXJucyB7UHJvbWlzZTxzdHJpbmd8VWludDhBcnJheT59IFByb21pc2VcclxuICogQHZhcmlhdGlvbiAzXHJcbiAqL1xyXG5cclxuLyoqL1xyXG5mZXRjaC54aHIgPSBmdW5jdGlvbiBmZXRjaF94aHIoZmlsZW5hbWUsIG9wdGlvbnMsIGNhbGxiYWNrKSB7XHJcbiAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XHJcbiAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlIC8qIHdvcmtzIGV2ZXJ5d2hlcmUgKi8gPSBmdW5jdGlvbiBmZXRjaE9uUmVhZHlTdGF0ZUNoYW5nZSgpIHtcclxuXHJcbiAgICAgICAgaWYgKHhoci5yZWFkeVN0YXRlICE9PSA0KVxyXG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG5cclxuICAgICAgICAvLyBsb2NhbCBjb3JzIHNlY3VyaXR5IGVycm9ycyByZXR1cm4gc3RhdHVzIDAgLyBlbXB0eSBzdHJpbmcsIHRvby4gYWZhaWsgdGhpcyBjYW5ub3QgYmVcclxuICAgICAgICAvLyByZWxpYWJseSBkaXN0aW5ndWlzaGVkIGZyb20gYW4gYWN0dWFsbHkgZW1wdHkgZmlsZSBmb3Igc2VjdXJpdHkgcmVhc29ucy4gZmVlbCBmcmVlXHJcbiAgICAgICAgLy8gdG8gc2VuZCBhIHB1bGwgcmVxdWVzdCBpZiB5b3UgYXJlIGF3YXJlIG9mIGEgc29sdXRpb24uXHJcbiAgICAgICAgaWYgKHhoci5zdGF0dXMgIT09IDAgJiYgeGhyLnN0YXR1cyAhPT0gMjAwKVxyXG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soRXJyb3IoXCJzdGF0dXMgXCIgKyB4aHIuc3RhdHVzKSk7XHJcblxyXG4gICAgICAgIC8vIGlmIGJpbmFyeSBkYXRhIGlzIGV4cGVjdGVkLCBtYWtlIHN1cmUgdGhhdCBzb21lIHNvcnQgb2YgYXJyYXkgaXMgcmV0dXJuZWQsIGV2ZW4gaWZcclxuICAgICAgICAvLyBBcnJheUJ1ZmZlcnMgYXJlIG5vdCBzdXBwb3J0ZWQuIHRoZSBiaW5hcnkgc3RyaW5nIGZhbGxiYWNrLCBob3dldmVyLCBpcyB1bnNhZmUuXHJcbiAgICAgICAgaWYgKG9wdGlvbnMuYmluYXJ5KSB7XHJcbiAgICAgICAgICAgIHZhciBidWZmZXIgPSB4aHIucmVzcG9uc2U7XHJcbiAgICAgICAgICAgIGlmICghYnVmZmVyKSB7XHJcbiAgICAgICAgICAgICAgICBidWZmZXIgPSBbXTtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgeGhyLnJlc3BvbnNlVGV4dC5sZW5ndGg7ICsraSlcclxuICAgICAgICAgICAgICAgICAgICBidWZmZXIucHVzaCh4aHIucmVzcG9uc2VUZXh0LmNoYXJDb2RlQXQoaSkgJiAyNTUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhudWxsLCB0eXBlb2YgVWludDhBcnJheSAhPT0gXCJ1bmRlZmluZWRcIiA/IG5ldyBVaW50OEFycmF5KGJ1ZmZlcikgOiBidWZmZXIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCwgeGhyLnJlc3BvbnNlVGV4dCk7XHJcbiAgICB9O1xyXG5cclxuICAgIGlmIChvcHRpb25zLmJpbmFyeSkge1xyXG4gICAgICAgIC8vIHJlZjogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1hNTEh0dHBSZXF1ZXN0L1NlbmRpbmdfYW5kX1JlY2VpdmluZ19CaW5hcnlfRGF0YSNSZWNlaXZpbmdfYmluYXJ5X2RhdGFfaW5fb2xkZXJfYnJvd3NlcnNcclxuICAgICAgICBpZiAoXCJvdmVycmlkZU1pbWVUeXBlXCIgaW4geGhyKVxyXG4gICAgICAgICAgICB4aHIub3ZlcnJpZGVNaW1lVHlwZShcInRleHQvcGxhaW47IGNoYXJzZXQ9eC11c2VyLWRlZmluZWRcIik7XHJcbiAgICAgICAgeGhyLnJlc3BvbnNlVHlwZSA9IFwiYXJyYXlidWZmZXJcIjtcclxuICAgIH1cclxuXHJcbiAgICB4aHIub3BlbihcIkdFVFwiLCBmaWxlbmFtZSk7XHJcbiAgICB4aHIuc2VuZCgpO1xyXG59O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShmYWN0b3J5KTtcclxuXHJcbi8qKlxyXG4gKiBSZWFkcyAvIHdyaXRlcyBmbG9hdHMgLyBkb3VibGVzIGZyb20gLyB0byBidWZmZXJzLlxyXG4gKiBAbmFtZSB1dGlsLmZsb2F0XHJcbiAqIEBuYW1lc3BhY2VcclxuICovXHJcblxyXG4vKipcclxuICogV3JpdGVzIGEgMzIgYml0IGZsb2F0IHRvIGEgYnVmZmVyIHVzaW5nIGxpdHRsZSBlbmRpYW4gYnl0ZSBvcmRlci5cclxuICogQG5hbWUgdXRpbC5mbG9hdC53cml0ZUZsb2F0TEVcclxuICogQGZ1bmN0aW9uXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWwgVmFsdWUgdG8gd3JpdGVcclxuICogQHBhcmFtIHtVaW50OEFycmF5fSBidWYgVGFyZ2V0IGJ1ZmZlclxyXG4gKiBAcGFyYW0ge251bWJlcn0gcG9zIFRhcmdldCBidWZmZXIgb2Zmc2V0XHJcbiAqIEByZXR1cm5zIHt1bmRlZmluZWR9XHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIFdyaXRlcyBhIDMyIGJpdCBmbG9hdCB0byBhIGJ1ZmZlciB1c2luZyBiaWcgZW5kaWFuIGJ5dGUgb3JkZXIuXHJcbiAqIEBuYW1lIHV0aWwuZmxvYXQud3JpdGVGbG9hdEJFXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcGFyYW0ge251bWJlcn0gdmFsIFZhbHVlIHRvIHdyaXRlXHJcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYnVmIFRhcmdldCBidWZmZXJcclxuICogQHBhcmFtIHtudW1iZXJ9IHBvcyBUYXJnZXQgYnVmZmVyIG9mZnNldFxyXG4gKiBAcmV0dXJucyB7dW5kZWZpbmVkfVxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBSZWFkcyBhIDMyIGJpdCBmbG9hdCBmcm9tIGEgYnVmZmVyIHVzaW5nIGxpdHRsZSBlbmRpYW4gYnl0ZSBvcmRlci5cclxuICogQG5hbWUgdXRpbC5mbG9hdC5yZWFkRmxvYXRMRVxyXG4gKiBAZnVuY3Rpb25cclxuICogQHBhcmFtIHtVaW50OEFycmF5fSBidWYgU291cmNlIGJ1ZmZlclxyXG4gKiBAcGFyYW0ge251bWJlcn0gcG9zIFNvdXJjZSBidWZmZXIgb2Zmc2V0XHJcbiAqIEByZXR1cm5zIHtudW1iZXJ9IFZhbHVlIHJlYWRcclxuICovXHJcblxyXG4vKipcclxuICogUmVhZHMgYSAzMiBiaXQgZmxvYXQgZnJvbSBhIGJ1ZmZlciB1c2luZyBiaWcgZW5kaWFuIGJ5dGUgb3JkZXIuXHJcbiAqIEBuYW1lIHV0aWwuZmxvYXQucmVhZEZsb2F0QkVcclxuICogQGZ1bmN0aW9uXHJcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYnVmIFNvdXJjZSBidWZmZXJcclxuICogQHBhcmFtIHtudW1iZXJ9IHBvcyBTb3VyY2UgYnVmZmVyIG9mZnNldFxyXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBWYWx1ZSByZWFkXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIFdyaXRlcyBhIDY0IGJpdCBkb3VibGUgdG8gYSBidWZmZXIgdXNpbmcgbGl0dGxlIGVuZGlhbiBieXRlIG9yZGVyLlxyXG4gKiBAbmFtZSB1dGlsLmZsb2F0LndyaXRlRG91YmxlTEVcclxuICogQGZ1bmN0aW9uXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWwgVmFsdWUgdG8gd3JpdGVcclxuICogQHBhcmFtIHtVaW50OEFycmF5fSBidWYgVGFyZ2V0IGJ1ZmZlclxyXG4gKiBAcGFyYW0ge251bWJlcn0gcG9zIFRhcmdldCBidWZmZXIgb2Zmc2V0XHJcbiAqIEByZXR1cm5zIHt1bmRlZmluZWR9XHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIFdyaXRlcyBhIDY0IGJpdCBkb3VibGUgdG8gYSBidWZmZXIgdXNpbmcgYmlnIGVuZGlhbiBieXRlIG9yZGVyLlxyXG4gKiBAbmFtZSB1dGlsLmZsb2F0LndyaXRlRG91YmxlQkVcclxuICogQGZ1bmN0aW9uXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWwgVmFsdWUgdG8gd3JpdGVcclxuICogQHBhcmFtIHtVaW50OEFycmF5fSBidWYgVGFyZ2V0IGJ1ZmZlclxyXG4gKiBAcGFyYW0ge251bWJlcn0gcG9zIFRhcmdldCBidWZmZXIgb2Zmc2V0XHJcbiAqIEByZXR1cm5zIHt1bmRlZmluZWR9XHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIFJlYWRzIGEgNjQgYml0IGRvdWJsZSBmcm9tIGEgYnVmZmVyIHVzaW5nIGxpdHRsZSBlbmRpYW4gYnl0ZSBvcmRlci5cclxuICogQG5hbWUgdXRpbC5mbG9hdC5yZWFkRG91YmxlTEVcclxuICogQGZ1bmN0aW9uXHJcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYnVmIFNvdXJjZSBidWZmZXJcclxuICogQHBhcmFtIHtudW1iZXJ9IHBvcyBTb3VyY2UgYnVmZmVyIG9mZnNldFxyXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBWYWx1ZSByZWFkXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIFJlYWRzIGEgNjQgYml0IGRvdWJsZSBmcm9tIGEgYnVmZmVyIHVzaW5nIGJpZyBlbmRpYW4gYnl0ZSBvcmRlci5cclxuICogQG5hbWUgdXRpbC5mbG9hdC5yZWFkRG91YmxlQkVcclxuICogQGZ1bmN0aW9uXHJcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYnVmIFNvdXJjZSBidWZmZXJcclxuICogQHBhcmFtIHtudW1iZXJ9IHBvcyBTb3VyY2UgYnVmZmVyIG9mZnNldFxyXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBWYWx1ZSByZWFkXHJcbiAqL1xyXG5cclxuLy8gRmFjdG9yeSBmdW5jdGlvbiBmb3IgdGhlIHB1cnBvc2Ugb2Ygbm9kZS1iYXNlZCB0ZXN0aW5nIGluIG1vZGlmaWVkIGdsb2JhbCBlbnZpcm9ubWVudHNcclxuZnVuY3Rpb24gZmFjdG9yeShleHBvcnRzKSB7XHJcblxyXG4gICAgLy8gZmxvYXQ6IHR5cGVkIGFycmF5XHJcbiAgICBpZiAodHlwZW9mIEZsb2F0MzJBcnJheSAhPT0gXCJ1bmRlZmluZWRcIikgKGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgICB2YXIgZjMyID0gbmV3IEZsb2F0MzJBcnJheShbIC0wIF0pLFxyXG4gICAgICAgICAgICBmOGIgPSBuZXcgVWludDhBcnJheShmMzIuYnVmZmVyKSxcclxuICAgICAgICAgICAgbGUgID0gZjhiWzNdID09PSAxMjg7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHdyaXRlRmxvYXRfZjMyX2NweSh2YWwsIGJ1ZiwgcG9zKSB7XHJcbiAgICAgICAgICAgIGYzMlswXSA9IHZhbDtcclxuICAgICAgICAgICAgYnVmW3BvcyAgICBdID0gZjhiWzBdO1xyXG4gICAgICAgICAgICBidWZbcG9zICsgMV0gPSBmOGJbMV07XHJcbiAgICAgICAgICAgIGJ1Zltwb3MgKyAyXSA9IGY4YlsyXTtcclxuICAgICAgICAgICAgYnVmW3BvcyArIDNdID0gZjhiWzNdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gd3JpdGVGbG9hdF9mMzJfcmV2KHZhbCwgYnVmLCBwb3MpIHtcclxuICAgICAgICAgICAgZjMyWzBdID0gdmFsO1xyXG4gICAgICAgICAgICBidWZbcG9zICAgIF0gPSBmOGJbM107XHJcbiAgICAgICAgICAgIGJ1Zltwb3MgKyAxXSA9IGY4YlsyXTtcclxuICAgICAgICAgICAgYnVmW3BvcyArIDJdID0gZjhiWzFdO1xyXG4gICAgICAgICAgICBidWZbcG9zICsgM10gPSBmOGJbMF07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgICAgIGV4cG9ydHMud3JpdGVGbG9hdExFID0gbGUgPyB3cml0ZUZsb2F0X2YzMl9jcHkgOiB3cml0ZUZsb2F0X2YzMl9yZXY7XHJcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgICAgICBleHBvcnRzLndyaXRlRmxvYXRCRSA9IGxlID8gd3JpdGVGbG9hdF9mMzJfcmV2IDogd3JpdGVGbG9hdF9mMzJfY3B5O1xyXG5cclxuICAgICAgICBmdW5jdGlvbiByZWFkRmxvYXRfZjMyX2NweShidWYsIHBvcykge1xyXG4gICAgICAgICAgICBmOGJbMF0gPSBidWZbcG9zICAgIF07XHJcbiAgICAgICAgICAgIGY4YlsxXSA9IGJ1Zltwb3MgKyAxXTtcclxuICAgICAgICAgICAgZjhiWzJdID0gYnVmW3BvcyArIDJdO1xyXG4gICAgICAgICAgICBmOGJbM10gPSBidWZbcG9zICsgM107XHJcbiAgICAgICAgICAgIHJldHVybiBmMzJbMF07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiByZWFkRmxvYXRfZjMyX3JldihidWYsIHBvcykge1xyXG4gICAgICAgICAgICBmOGJbM10gPSBidWZbcG9zICAgIF07XHJcbiAgICAgICAgICAgIGY4YlsyXSA9IGJ1Zltwb3MgKyAxXTtcclxuICAgICAgICAgICAgZjhiWzFdID0gYnVmW3BvcyArIDJdO1xyXG4gICAgICAgICAgICBmOGJbMF0gPSBidWZbcG9zICsgM107XHJcbiAgICAgICAgICAgIHJldHVybiBmMzJbMF07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgICAgIGV4cG9ydHMucmVhZEZsb2F0TEUgPSBsZSA/IHJlYWRGbG9hdF9mMzJfY3B5IDogcmVhZEZsb2F0X2YzMl9yZXY7XHJcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgICAgICBleHBvcnRzLnJlYWRGbG9hdEJFID0gbGUgPyByZWFkRmxvYXRfZjMyX3JldiA6IHJlYWRGbG9hdF9mMzJfY3B5O1xyXG5cclxuICAgIC8vIGZsb2F0OiBpZWVlNzU0XHJcbiAgICB9KSgpOyBlbHNlIChmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gd3JpdGVGbG9hdF9pZWVlNzU0KHdyaXRlVWludCwgdmFsLCBidWYsIHBvcykge1xyXG4gICAgICAgICAgICB2YXIgc2lnbiA9IHZhbCA8IDAgPyAxIDogMDtcclxuICAgICAgICAgICAgaWYgKHNpZ24pXHJcbiAgICAgICAgICAgICAgICB2YWwgPSAtdmFsO1xyXG4gICAgICAgICAgICBpZiAodmFsID09PSAwKVxyXG4gICAgICAgICAgICAgICAgd3JpdGVVaW50KDEgLyB2YWwgPiAwID8gLyogcG9zaXRpdmUgKi8gMCA6IC8qIG5lZ2F0aXZlIDAgKi8gMjE0NzQ4MzY0OCwgYnVmLCBwb3MpO1xyXG4gICAgICAgICAgICBlbHNlIGlmIChpc05hTih2YWwpKVxyXG4gICAgICAgICAgICAgICAgd3JpdGVVaW50KDIxNDMyODkzNDQsIGJ1ZiwgcG9zKTtcclxuICAgICAgICAgICAgZWxzZSBpZiAodmFsID4gMy40MDI4MjM0NjYzODUyODg2ZSszOCkgLy8gKy1JbmZpbml0eVxyXG4gICAgICAgICAgICAgICAgd3JpdGVVaW50KChzaWduIDw8IDMxIHwgMjEzOTA5NTA0MCkgPj4+IDAsIGJ1ZiwgcG9zKTtcclxuICAgICAgICAgICAgZWxzZSBpZiAodmFsIDwgMS4xNzU0OTQzNTA4MjIyODc1ZS0zOCkgLy8gZGVub3JtYWxcclxuICAgICAgICAgICAgICAgIHdyaXRlVWludCgoc2lnbiA8PCAzMSB8IE1hdGgucm91bmQodmFsIC8gMS40MDEyOTg0NjQzMjQ4MTdlLTQ1KSkgPj4+IDAsIGJ1ZiwgcG9zKTtcclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZXhwb25lbnQgPSBNYXRoLmZsb29yKE1hdGgubG9nKHZhbCkgLyBNYXRoLkxOMiksXHJcbiAgICAgICAgICAgICAgICAgICAgbWFudGlzc2EgPSBNYXRoLnJvdW5kKHZhbCAqIE1hdGgucG93KDIsIC1leHBvbmVudCkgKiA4Mzg4NjA4KSAmIDgzODg2MDc7XHJcbiAgICAgICAgICAgICAgICB3cml0ZVVpbnQoKHNpZ24gPDwgMzEgfCBleHBvbmVudCArIDEyNyA8PCAyMyB8IG1hbnRpc3NhKSA+Pj4gMCwgYnVmLCBwb3MpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBleHBvcnRzLndyaXRlRmxvYXRMRSA9IHdyaXRlRmxvYXRfaWVlZTc1NC5iaW5kKG51bGwsIHdyaXRlVWludExFKTtcclxuICAgICAgICBleHBvcnRzLndyaXRlRmxvYXRCRSA9IHdyaXRlRmxvYXRfaWVlZTc1NC5iaW5kKG51bGwsIHdyaXRlVWludEJFKTtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gcmVhZEZsb2F0X2llZWU3NTQocmVhZFVpbnQsIGJ1ZiwgcG9zKSB7XHJcbiAgICAgICAgICAgIHZhciB1aW50ID0gcmVhZFVpbnQoYnVmLCBwb3MpLFxyXG4gICAgICAgICAgICAgICAgc2lnbiA9ICh1aW50ID4+IDMxKSAqIDIgKyAxLFxyXG4gICAgICAgICAgICAgICAgZXhwb25lbnQgPSB1aW50ID4+PiAyMyAmIDI1NSxcclxuICAgICAgICAgICAgICAgIG1hbnRpc3NhID0gdWludCAmIDgzODg2MDc7XHJcbiAgICAgICAgICAgIHJldHVybiBleHBvbmVudCA9PT0gMjU1XHJcbiAgICAgICAgICAgICAgICA/IG1hbnRpc3NhXHJcbiAgICAgICAgICAgICAgICA/IE5hTlxyXG4gICAgICAgICAgICAgICAgOiBzaWduICogSW5maW5pdHlcclxuICAgICAgICAgICAgICAgIDogZXhwb25lbnQgPT09IDAgLy8gZGVub3JtYWxcclxuICAgICAgICAgICAgICAgID8gc2lnbiAqIDEuNDAxMjk4NDY0MzI0ODE3ZS00NSAqIG1hbnRpc3NhXHJcbiAgICAgICAgICAgICAgICA6IHNpZ24gKiBNYXRoLnBvdygyLCBleHBvbmVudCAtIDE1MCkgKiAobWFudGlzc2EgKyA4Mzg4NjA4KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGV4cG9ydHMucmVhZEZsb2F0TEUgPSByZWFkRmxvYXRfaWVlZTc1NC5iaW5kKG51bGwsIHJlYWRVaW50TEUpO1xyXG4gICAgICAgIGV4cG9ydHMucmVhZEZsb2F0QkUgPSByZWFkRmxvYXRfaWVlZTc1NC5iaW5kKG51bGwsIHJlYWRVaW50QkUpO1xyXG5cclxuICAgIH0pKCk7XHJcblxyXG4gICAgLy8gZG91YmxlOiB0eXBlZCBhcnJheVxyXG4gICAgaWYgKHR5cGVvZiBGbG9hdDY0QXJyYXkgIT09IFwidW5kZWZpbmVkXCIpIChmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgICAgdmFyIGY2NCA9IG5ldyBGbG9hdDY0QXJyYXkoWy0wXSksXHJcbiAgICAgICAgICAgIGY4YiA9IG5ldyBVaW50OEFycmF5KGY2NC5idWZmZXIpLFxyXG4gICAgICAgICAgICBsZSAgPSBmOGJbN10gPT09IDEyODtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gd3JpdGVEb3VibGVfZjY0X2NweSh2YWwsIGJ1ZiwgcG9zKSB7XHJcbiAgICAgICAgICAgIGY2NFswXSA9IHZhbDtcclxuICAgICAgICAgICAgYnVmW3BvcyAgICBdID0gZjhiWzBdO1xyXG4gICAgICAgICAgICBidWZbcG9zICsgMV0gPSBmOGJbMV07XHJcbiAgICAgICAgICAgIGJ1Zltwb3MgKyAyXSA9IGY4YlsyXTtcclxuICAgICAgICAgICAgYnVmW3BvcyArIDNdID0gZjhiWzNdO1xyXG4gICAgICAgICAgICBidWZbcG9zICsgNF0gPSBmOGJbNF07XHJcbiAgICAgICAgICAgIGJ1Zltwb3MgKyA1XSA9IGY4Yls1XTtcclxuICAgICAgICAgICAgYnVmW3BvcyArIDZdID0gZjhiWzZdO1xyXG4gICAgICAgICAgICBidWZbcG9zICsgN10gPSBmOGJbN107XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiB3cml0ZURvdWJsZV9mNjRfcmV2KHZhbCwgYnVmLCBwb3MpIHtcclxuICAgICAgICAgICAgZjY0WzBdID0gdmFsO1xyXG4gICAgICAgICAgICBidWZbcG9zICAgIF0gPSBmOGJbN107XHJcbiAgICAgICAgICAgIGJ1Zltwb3MgKyAxXSA9IGY4Yls2XTtcclxuICAgICAgICAgICAgYnVmW3BvcyArIDJdID0gZjhiWzVdO1xyXG4gICAgICAgICAgICBidWZbcG9zICsgM10gPSBmOGJbNF07XHJcbiAgICAgICAgICAgIGJ1Zltwb3MgKyA0XSA9IGY4YlszXTtcclxuICAgICAgICAgICAgYnVmW3BvcyArIDVdID0gZjhiWzJdO1xyXG4gICAgICAgICAgICBidWZbcG9zICsgNl0gPSBmOGJbMV07XHJcbiAgICAgICAgICAgIGJ1Zltwb3MgKyA3XSA9IGY4YlswXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICAgICAgZXhwb3J0cy53cml0ZURvdWJsZUxFID0gbGUgPyB3cml0ZURvdWJsZV9mNjRfY3B5IDogd3JpdGVEb3VibGVfZjY0X3JldjtcclxuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgICAgIGV4cG9ydHMud3JpdGVEb3VibGVCRSA9IGxlID8gd3JpdGVEb3VibGVfZjY0X3JldiA6IHdyaXRlRG91YmxlX2Y2NF9jcHk7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHJlYWREb3VibGVfZjY0X2NweShidWYsIHBvcykge1xyXG4gICAgICAgICAgICBmOGJbMF0gPSBidWZbcG9zICAgIF07XHJcbiAgICAgICAgICAgIGY4YlsxXSA9IGJ1Zltwb3MgKyAxXTtcclxuICAgICAgICAgICAgZjhiWzJdID0gYnVmW3BvcyArIDJdO1xyXG4gICAgICAgICAgICBmOGJbM10gPSBidWZbcG9zICsgM107XHJcbiAgICAgICAgICAgIGY4Yls0XSA9IGJ1Zltwb3MgKyA0XTtcclxuICAgICAgICAgICAgZjhiWzVdID0gYnVmW3BvcyArIDVdO1xyXG4gICAgICAgICAgICBmOGJbNl0gPSBidWZbcG9zICsgNl07XHJcbiAgICAgICAgICAgIGY4Yls3XSA9IGJ1Zltwb3MgKyA3XTtcclxuICAgICAgICAgICAgcmV0dXJuIGY2NFswXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHJlYWREb3VibGVfZjY0X3JldihidWYsIHBvcykge1xyXG4gICAgICAgICAgICBmOGJbN10gPSBidWZbcG9zICAgIF07XHJcbiAgICAgICAgICAgIGY4Yls2XSA9IGJ1Zltwb3MgKyAxXTtcclxuICAgICAgICAgICAgZjhiWzVdID0gYnVmW3BvcyArIDJdO1xyXG4gICAgICAgICAgICBmOGJbNF0gPSBidWZbcG9zICsgM107XHJcbiAgICAgICAgICAgIGY4YlszXSA9IGJ1Zltwb3MgKyA0XTtcclxuICAgICAgICAgICAgZjhiWzJdID0gYnVmW3BvcyArIDVdO1xyXG4gICAgICAgICAgICBmOGJbMV0gPSBidWZbcG9zICsgNl07XHJcbiAgICAgICAgICAgIGY4YlswXSA9IGJ1Zltwb3MgKyA3XTtcclxuICAgICAgICAgICAgcmV0dXJuIGY2NFswXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICAgICAgZXhwb3J0cy5yZWFkRG91YmxlTEUgPSBsZSA/IHJlYWREb3VibGVfZjY0X2NweSA6IHJlYWREb3VibGVfZjY0X3JldjtcclxuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgICAgIGV4cG9ydHMucmVhZERvdWJsZUJFID0gbGUgPyByZWFkRG91YmxlX2Y2NF9yZXYgOiByZWFkRG91YmxlX2Y2NF9jcHk7XHJcblxyXG4gICAgLy8gZG91YmxlOiBpZWVlNzU0XHJcbiAgICB9KSgpOyBlbHNlIChmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gd3JpdGVEb3VibGVfaWVlZTc1NCh3cml0ZVVpbnQsIG9mZjAsIG9mZjEsIHZhbCwgYnVmLCBwb3MpIHtcclxuICAgICAgICAgICAgdmFyIHNpZ24gPSB2YWwgPCAwID8gMSA6IDA7XHJcbiAgICAgICAgICAgIGlmIChzaWduKVxyXG4gICAgICAgICAgICAgICAgdmFsID0gLXZhbDtcclxuICAgICAgICAgICAgaWYgKHZhbCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgd3JpdGVVaW50KDAsIGJ1ZiwgcG9zICsgb2ZmMCk7XHJcbiAgICAgICAgICAgICAgICB3cml0ZVVpbnQoMSAvIHZhbCA+IDAgPyAvKiBwb3NpdGl2ZSAqLyAwIDogLyogbmVnYXRpdmUgMCAqLyAyMTQ3NDgzNjQ4LCBidWYsIHBvcyArIG9mZjEpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGlzTmFOKHZhbCkpIHtcclxuICAgICAgICAgICAgICAgIHdyaXRlVWludCgwLCBidWYsIHBvcyArIG9mZjApO1xyXG4gICAgICAgICAgICAgICAgd3JpdGVVaW50KDIxNDY5NTkzNjAsIGJ1ZiwgcG9zICsgb2ZmMSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsID4gMS43OTc2OTMxMzQ4NjIzMTU3ZSszMDgpIHsgLy8gKy1JbmZpbml0eVxyXG4gICAgICAgICAgICAgICAgd3JpdGVVaW50KDAsIGJ1ZiwgcG9zICsgb2ZmMCk7XHJcbiAgICAgICAgICAgICAgICB3cml0ZVVpbnQoKHNpZ24gPDwgMzEgfCAyMTQ2NDM1MDcyKSA+Pj4gMCwgYnVmLCBwb3MgKyBvZmYxKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHZhciBtYW50aXNzYTtcclxuICAgICAgICAgICAgICAgIGlmICh2YWwgPCAyLjIyNTA3Mzg1ODUwNzIwMTRlLTMwOCkgeyAvLyBkZW5vcm1hbFxyXG4gICAgICAgICAgICAgICAgICAgIG1hbnRpc3NhID0gdmFsIC8gNWUtMzI0O1xyXG4gICAgICAgICAgICAgICAgICAgIHdyaXRlVWludChtYW50aXNzYSA+Pj4gMCwgYnVmLCBwb3MgKyBvZmYwKTtcclxuICAgICAgICAgICAgICAgICAgICB3cml0ZVVpbnQoKHNpZ24gPDwgMzEgfCBtYW50aXNzYSAvIDQyOTQ5NjcyOTYpID4+PiAwLCBidWYsIHBvcyArIG9mZjEpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZXhwb25lbnQgPSBNYXRoLmZsb29yKE1hdGgubG9nKHZhbCkgLyBNYXRoLkxOMik7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGV4cG9uZW50ID09PSAxMDI0KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBleHBvbmVudCA9IDEwMjM7XHJcbiAgICAgICAgICAgICAgICAgICAgbWFudGlzc2EgPSB2YWwgKiBNYXRoLnBvdygyLCAtZXhwb25lbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHdyaXRlVWludChtYW50aXNzYSAqIDQ1MDM1OTk2MjczNzA0OTYgPj4+IDAsIGJ1ZiwgcG9zICsgb2ZmMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVVaW50KChzaWduIDw8IDMxIHwgZXhwb25lbnQgKyAxMDIzIDw8IDIwIHwgbWFudGlzc2EgKiAxMDQ4NTc2ICYgMTA0ODU3NSkgPj4+IDAsIGJ1ZiwgcG9zICsgb2ZmMSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGV4cG9ydHMud3JpdGVEb3VibGVMRSA9IHdyaXRlRG91YmxlX2llZWU3NTQuYmluZChudWxsLCB3cml0ZVVpbnRMRSwgMCwgNCk7XHJcbiAgICAgICAgZXhwb3J0cy53cml0ZURvdWJsZUJFID0gd3JpdGVEb3VibGVfaWVlZTc1NC5iaW5kKG51bGwsIHdyaXRlVWludEJFLCA0LCAwKTtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gcmVhZERvdWJsZV9pZWVlNzU0KHJlYWRVaW50LCBvZmYwLCBvZmYxLCBidWYsIHBvcykge1xyXG4gICAgICAgICAgICB2YXIgbG8gPSByZWFkVWludChidWYsIHBvcyArIG9mZjApLFxyXG4gICAgICAgICAgICAgICAgaGkgPSByZWFkVWludChidWYsIHBvcyArIG9mZjEpO1xyXG4gICAgICAgICAgICB2YXIgc2lnbiA9IChoaSA+PiAzMSkgKiAyICsgMSxcclxuICAgICAgICAgICAgICAgIGV4cG9uZW50ID0gaGkgPj4+IDIwICYgMjA0NyxcclxuICAgICAgICAgICAgICAgIG1hbnRpc3NhID0gNDI5NDk2NzI5NiAqIChoaSAmIDEwNDg1NzUpICsgbG87XHJcbiAgICAgICAgICAgIHJldHVybiBleHBvbmVudCA9PT0gMjA0N1xyXG4gICAgICAgICAgICAgICAgPyBtYW50aXNzYVxyXG4gICAgICAgICAgICAgICAgPyBOYU5cclxuICAgICAgICAgICAgICAgIDogc2lnbiAqIEluZmluaXR5XHJcbiAgICAgICAgICAgICAgICA6IGV4cG9uZW50ID09PSAwIC8vIGRlbm9ybWFsXHJcbiAgICAgICAgICAgICAgICA/IHNpZ24gKiA1ZS0zMjQgKiBtYW50aXNzYVxyXG4gICAgICAgICAgICAgICAgOiBzaWduICogTWF0aC5wb3coMiwgZXhwb25lbnQgLSAxMDc1KSAqIChtYW50aXNzYSArIDQ1MDM1OTk2MjczNzA0OTYpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZXhwb3J0cy5yZWFkRG91YmxlTEUgPSByZWFkRG91YmxlX2llZWU3NTQuYmluZChudWxsLCByZWFkVWludExFLCAwLCA0KTtcclxuICAgICAgICBleHBvcnRzLnJlYWREb3VibGVCRSA9IHJlYWREb3VibGVfaWVlZTc1NC5iaW5kKG51bGwsIHJlYWRVaW50QkUsIDQsIDApO1xyXG5cclxuICAgIH0pKCk7XHJcblxyXG4gICAgcmV0dXJuIGV4cG9ydHM7XHJcbn1cclxuXHJcbi8vIHVpbnQgaGVscGVyc1xyXG5cclxuZnVuY3Rpb24gd3JpdGVVaW50TEUodmFsLCBidWYsIHBvcykge1xyXG4gICAgYnVmW3BvcyAgICBdID0gIHZhbCAgICAgICAgJiAyNTU7XHJcbiAgICBidWZbcG9zICsgMV0gPSAgdmFsID4+PiA4ICAmIDI1NTtcclxuICAgIGJ1Zltwb3MgKyAyXSA9ICB2YWwgPj4+IDE2ICYgMjU1O1xyXG4gICAgYnVmW3BvcyArIDNdID0gIHZhbCA+Pj4gMjQ7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHdyaXRlVWludEJFKHZhbCwgYnVmLCBwb3MpIHtcclxuICAgIGJ1Zltwb3MgICAgXSA9ICB2YWwgPj4+IDI0O1xyXG4gICAgYnVmW3BvcyArIDFdID0gIHZhbCA+Pj4gMTYgJiAyNTU7XHJcbiAgICBidWZbcG9zICsgMl0gPSAgdmFsID4+PiA4ICAmIDI1NTtcclxuICAgIGJ1Zltwb3MgKyAzXSA9ICB2YWwgICAgICAgICYgMjU1O1xyXG59XHJcblxyXG5mdW5jdGlvbiByZWFkVWludExFKGJ1ZiwgcG9zKSB7XHJcbiAgICByZXR1cm4gKGJ1Zltwb3MgICAgXVxyXG4gICAgICAgICAgfCBidWZbcG9zICsgMV0gPDwgOFxyXG4gICAgICAgICAgfCBidWZbcG9zICsgMl0gPDwgMTZcclxuICAgICAgICAgIHwgYnVmW3BvcyArIDNdIDw8IDI0KSA+Pj4gMDtcclxufVxyXG5cclxuZnVuY3Rpb24gcmVhZFVpbnRCRShidWYsIHBvcykge1xyXG4gICAgcmV0dXJuIChidWZbcG9zICAgIF0gPDwgMjRcclxuICAgICAgICAgIHwgYnVmW3BvcyArIDFdIDw8IDE2XHJcbiAgICAgICAgICB8IGJ1Zltwb3MgKyAyXSA8PCA4XHJcbiAgICAgICAgICB8IGJ1Zltwb3MgKyAzXSkgPj4+IDA7XHJcbn1cclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbm1vZHVsZS5leHBvcnRzID0gaW5xdWlyZTtcclxuXHJcbi8qKlxyXG4gKiBSZXF1aXJlcyBhIG1vZHVsZSBvbmx5IGlmIGF2YWlsYWJsZS5cclxuICogQG1lbWJlcm9mIHV0aWxcclxuICogQHBhcmFtIHtzdHJpbmd9IG1vZHVsZU5hbWUgTW9kdWxlIHRvIHJlcXVpcmVcclxuICogQHJldHVybnMgez9PYmplY3R9IFJlcXVpcmVkIG1vZHVsZSBpZiBhdmFpbGFibGUgYW5kIG5vdCBlbXB0eSwgb3RoZXJ3aXNlIGBudWxsYFxyXG4gKi9cclxuZnVuY3Rpb24gaW5xdWlyZShtb2R1bGVOYW1lKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIHZhciBtb2QgPSBldmFsKFwicXVpcmVcIi5yZXBsYWNlKC9eLyxcInJlXCIpKShtb2R1bGVOYW1lKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1ldmFsXHJcbiAgICAgICAgaWYgKG1vZCAmJiAobW9kLmxlbmd0aCB8fCBPYmplY3Qua2V5cyhtb2QpLmxlbmd0aCkpXHJcbiAgICAgICAgICAgIHJldHVybiBtb2Q7XHJcbiAgICB9IGNhdGNoIChlKSB7fSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWVtcHR5XHJcbiAgICByZXR1cm4gbnVsbDtcclxufVxyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbi8qKlxyXG4gKiBBIG1pbmltYWwgcGF0aCBtb2R1bGUgdG8gcmVzb2x2ZSBVbml4LCBXaW5kb3dzIGFuZCBVUkwgcGF0aHMgYWxpa2UuXHJcbiAqIEBtZW1iZXJvZiB1dGlsXHJcbiAqIEBuYW1lc3BhY2VcclxuICovXHJcbnZhciBwYXRoID0gZXhwb3J0cztcclxuXHJcbnZhciBpc0Fic29sdXRlID1cclxuLyoqXHJcbiAqIFRlc3RzIGlmIHRoZSBzcGVjaWZpZWQgcGF0aCBpcyBhYnNvbHV0ZS5cclxuICogQHBhcmFtIHtzdHJpbmd9IHBhdGggUGF0aCB0byB0ZXN0XHJcbiAqIEByZXR1cm5zIHtib29sZWFufSBgdHJ1ZWAgaWYgcGF0aCBpcyBhYnNvbHV0ZVxyXG4gKi9cclxucGF0aC5pc0Fic29sdXRlID0gZnVuY3Rpb24gaXNBYnNvbHV0ZShwYXRoKSB7XHJcbiAgICByZXR1cm4gL14oPzpcXC98XFx3KzopLy50ZXN0KHBhdGgpO1xyXG59O1xyXG5cclxudmFyIG5vcm1hbGl6ZSA9XHJcbi8qKlxyXG4gKiBOb3JtYWxpemVzIHRoZSBzcGVjaWZpZWQgcGF0aC5cclxuICogQHBhcmFtIHtzdHJpbmd9IHBhdGggUGF0aCB0byBub3JtYWxpemVcclxuICogQHJldHVybnMge3N0cmluZ30gTm9ybWFsaXplZCBwYXRoXHJcbiAqL1xyXG5wYXRoLm5vcm1hbGl6ZSA9IGZ1bmN0aW9uIG5vcm1hbGl6ZShwYXRoKSB7XHJcbiAgICBwYXRoID0gcGF0aC5yZXBsYWNlKC9cXFxcL2csIFwiL1wiKVxyXG4gICAgICAgICAgICAgICAucmVwbGFjZSgvXFwvezIsfS9nLCBcIi9cIik7XHJcbiAgICB2YXIgcGFydHMgICAgPSBwYXRoLnNwbGl0KFwiL1wiKSxcclxuICAgICAgICBhYnNvbHV0ZSA9IGlzQWJzb2x1dGUocGF0aCksXHJcbiAgICAgICAgcHJlZml4ICAgPSBcIlwiO1xyXG4gICAgaWYgKGFic29sdXRlKVxyXG4gICAgICAgIHByZWZpeCA9IHBhcnRzLnNoaWZ0KCkgKyBcIi9cIjtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGFydHMubGVuZ3RoOykge1xyXG4gICAgICAgIGlmIChwYXJ0c1tpXSA9PT0gXCIuLlwiKSB7XHJcbiAgICAgICAgICAgIGlmIChpID4gMCAmJiBwYXJ0c1tpIC0gMV0gIT09IFwiLi5cIilcclxuICAgICAgICAgICAgICAgIHBhcnRzLnNwbGljZSgtLWksIDIpO1xyXG4gICAgICAgICAgICBlbHNlIGlmIChhYnNvbHV0ZSlcclxuICAgICAgICAgICAgICAgIHBhcnRzLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgKytpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAocGFydHNbaV0gPT09IFwiLlwiKVxyXG4gICAgICAgICAgICBwYXJ0cy5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICArK2k7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcHJlZml4ICsgcGFydHMuam9pbihcIi9cIik7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVzb2x2ZXMgdGhlIHNwZWNpZmllZCBpbmNsdWRlIHBhdGggYWdhaW5zdCB0aGUgc3BlY2lmaWVkIG9yaWdpbiBwYXRoLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gb3JpZ2luUGF0aCBQYXRoIHRvIHRoZSBvcmlnaW4gZmlsZVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gaW5jbHVkZVBhdGggSW5jbHVkZSBwYXRoIHJlbGF0aXZlIHRvIG9yaWdpbiBwYXRoXHJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2FscmVhZHlOb3JtYWxpemVkPWZhbHNlXSBgdHJ1ZWAgaWYgYm90aCBwYXRocyBhcmUgYWxyZWFkeSBrbm93biB0byBiZSBub3JtYWxpemVkXHJcbiAqIEByZXR1cm5zIHtzdHJpbmd9IFBhdGggdG8gdGhlIGluY2x1ZGUgZmlsZVxyXG4gKi9cclxucGF0aC5yZXNvbHZlID0gZnVuY3Rpb24gcmVzb2x2ZShvcmlnaW5QYXRoLCBpbmNsdWRlUGF0aCwgYWxyZWFkeU5vcm1hbGl6ZWQpIHtcclxuICAgIGlmICghYWxyZWFkeU5vcm1hbGl6ZWQpXHJcbiAgICAgICAgaW5jbHVkZVBhdGggPSBub3JtYWxpemUoaW5jbHVkZVBhdGgpO1xyXG4gICAgaWYgKGlzQWJzb2x1dGUoaW5jbHVkZVBhdGgpKVxyXG4gICAgICAgIHJldHVybiBpbmNsdWRlUGF0aDtcclxuICAgIGlmICghYWxyZWFkeU5vcm1hbGl6ZWQpXHJcbiAgICAgICAgb3JpZ2luUGF0aCA9IG5vcm1hbGl6ZShvcmlnaW5QYXRoKTtcclxuICAgIHJldHVybiAob3JpZ2luUGF0aCA9IG9yaWdpblBhdGgucmVwbGFjZSgvKD86XFwvfF4pW14vXSskLywgXCJcIikpLmxlbmd0aCA/IG5vcm1hbGl6ZShvcmlnaW5QYXRoICsgXCIvXCIgKyBpbmNsdWRlUGF0aCkgOiBpbmNsdWRlUGF0aDtcclxufTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbm1vZHVsZS5leHBvcnRzID0gcG9vbDtcclxuXHJcbi8qKlxyXG4gKiBBbiBhbGxvY2F0b3IgYXMgdXNlZCBieSB7QGxpbmsgdXRpbC5wb29sfS5cclxuICogQHR5cGVkZWYgUG9vbEFsbG9jYXRvclxyXG4gKiBAdHlwZSB7ZnVuY3Rpb259XHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBzaXplIEJ1ZmZlciBzaXplXHJcbiAqIEByZXR1cm5zIHtVaW50OEFycmF5fSBCdWZmZXJcclxuICovXHJcblxyXG4vKipcclxuICogQSBzbGljZXIgYXMgdXNlZCBieSB7QGxpbmsgdXRpbC5wb29sfS5cclxuICogQHR5cGVkZWYgUG9vbFNsaWNlclxyXG4gKiBAdHlwZSB7ZnVuY3Rpb259XHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBzdGFydCBTdGFydCBvZmZzZXRcclxuICogQHBhcmFtIHtudW1iZXJ9IGVuZCBFbmQgb2Zmc2V0XHJcbiAqIEByZXR1cm5zIHtVaW50OEFycmF5fSBCdWZmZXIgc2xpY2VcclxuICogQHRoaXMge1VpbnQ4QXJyYXl9XHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIEEgZ2VuZXJhbCBwdXJwb3NlIGJ1ZmZlciBwb29sLlxyXG4gKiBAbWVtYmVyb2YgdXRpbFxyXG4gKiBAZnVuY3Rpb25cclxuICogQHBhcmFtIHtQb29sQWxsb2NhdG9yfSBhbGxvYyBBbGxvY2F0b3JcclxuICogQHBhcmFtIHtQb29sU2xpY2VyfSBzbGljZSBTbGljZXJcclxuICogQHBhcmFtIHtudW1iZXJ9IFtzaXplPTgxOTJdIFNsYWIgc2l6ZVxyXG4gKiBAcmV0dXJucyB7UG9vbEFsbG9jYXRvcn0gUG9vbGVkIGFsbG9jYXRvclxyXG4gKi9cclxuZnVuY3Rpb24gcG9vbChhbGxvYywgc2xpY2UsIHNpemUpIHtcclxuICAgIHZhciBTSVpFICAgPSBzaXplIHx8IDgxOTI7XHJcbiAgICB2YXIgTUFYICAgID0gU0laRSA+Pj4gMTtcclxuICAgIHZhciBzbGFiICAgPSBudWxsO1xyXG4gICAgdmFyIG9mZnNldCA9IFNJWkU7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24gcG9vbF9hbGxvYyhzaXplKSB7XHJcbiAgICAgICAgaWYgKHNpemUgPCAxIHx8IHNpemUgPiBNQVgpXHJcbiAgICAgICAgICAgIHJldHVybiBhbGxvYyhzaXplKTtcclxuICAgICAgICBpZiAob2Zmc2V0ICsgc2l6ZSA+IFNJWkUpIHtcclxuICAgICAgICAgICAgc2xhYiA9IGFsbG9jKFNJWkUpO1xyXG4gICAgICAgICAgICBvZmZzZXQgPSAwO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgYnVmID0gc2xpY2UuY2FsbChzbGFiLCBvZmZzZXQsIG9mZnNldCArPSBzaXplKTtcclxuICAgICAgICBpZiAob2Zmc2V0ICYgNykgLy8gYWxpZ24gdG8gMzIgYml0XHJcbiAgICAgICAgICAgIG9mZnNldCA9IChvZmZzZXQgfCA3KSArIDE7XHJcbiAgICAgICAgcmV0dXJuIGJ1ZjtcclxuICAgIH07XHJcbn1cclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4vKipcclxuICogQSBtaW5pbWFsIFVURjggaW1wbGVtZW50YXRpb24gZm9yIG51bWJlciBhcnJheXMuXHJcbiAqIEBtZW1iZXJvZiB1dGlsXHJcbiAqIEBuYW1lc3BhY2VcclxuICovXHJcbnZhciB1dGY4ID0gZXhwb3J0cztcclxuXHJcbi8qKlxyXG4gKiBDYWxjdWxhdGVzIHRoZSBVVEY4IGJ5dGUgbGVuZ3RoIG9mIGEgc3RyaW5nLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIFN0cmluZ1xyXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBCeXRlIGxlbmd0aFxyXG4gKi9cclxudXRmOC5sZW5ndGggPSBmdW5jdGlvbiB1dGY4X2xlbmd0aChzdHJpbmcpIHtcclxuICAgIHZhciBsZW4gPSAwLFxyXG4gICAgICAgIGMgPSAwO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHJpbmcubGVuZ3RoOyArK2kpIHtcclxuICAgICAgICBjID0gc3RyaW5nLmNoYXJDb2RlQXQoaSk7XHJcbiAgICAgICAgaWYgKGMgPCAxMjgpXHJcbiAgICAgICAgICAgIGxlbiArPSAxO1xyXG4gICAgICAgIGVsc2UgaWYgKGMgPCAyMDQ4KVxyXG4gICAgICAgICAgICBsZW4gKz0gMjtcclxuICAgICAgICBlbHNlIGlmICgoYyAmIDB4RkMwMCkgPT09IDB4RDgwMCAmJiAoc3RyaW5nLmNoYXJDb2RlQXQoaSArIDEpICYgMHhGQzAwKSA9PT0gMHhEQzAwKSB7XHJcbiAgICAgICAgICAgICsraTtcclxuICAgICAgICAgICAgbGVuICs9IDQ7XHJcbiAgICAgICAgfSBlbHNlXHJcbiAgICAgICAgICAgIGxlbiArPSAzO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGxlbjtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZWFkcyBVVEY4IGJ5dGVzIGFzIGEgc3RyaW5nLlxyXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGJ1ZmZlciBTb3VyY2UgYnVmZmVyXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBzdGFydCBTb3VyY2Ugc3RhcnRcclxuICogQHBhcmFtIHtudW1iZXJ9IGVuZCBTb3VyY2UgZW5kXHJcbiAqIEByZXR1cm5zIHtzdHJpbmd9IFN0cmluZyByZWFkXHJcbiAqL1xyXG51dGY4LnJlYWQgPSBmdW5jdGlvbiB1dGY4X3JlYWQoYnVmZmVyLCBzdGFydCwgZW5kKSB7XHJcbiAgICB2YXIgbGVuID0gZW5kIC0gc3RhcnQ7XHJcbiAgICBpZiAobGVuIDwgMSlcclxuICAgICAgICByZXR1cm4gXCJcIjtcclxuICAgIHZhciBwYXJ0cyA9IG51bGwsXHJcbiAgICAgICAgY2h1bmsgPSBbXSxcclxuICAgICAgICBpID0gMCwgLy8gY2hhciBvZmZzZXRcclxuICAgICAgICB0OyAgICAgLy8gdGVtcG9yYXJ5XHJcbiAgICB3aGlsZSAoc3RhcnQgPCBlbmQpIHtcclxuICAgICAgICB0ID0gYnVmZmVyW3N0YXJ0KytdO1xyXG4gICAgICAgIGlmICh0IDwgMTI4KVxyXG4gICAgICAgICAgICBjaHVua1tpKytdID0gdDtcclxuICAgICAgICBlbHNlIGlmICh0ID4gMTkxICYmIHQgPCAyMjQpXHJcbiAgICAgICAgICAgIGNodW5rW2krK10gPSAodCAmIDMxKSA8PCA2IHwgYnVmZmVyW3N0YXJ0KytdICYgNjM7XHJcbiAgICAgICAgZWxzZSBpZiAodCA+IDIzOSAmJiB0IDwgMzY1KSB7XHJcbiAgICAgICAgICAgIHQgPSAoKHQgJiA3KSA8PCAxOCB8IChidWZmZXJbc3RhcnQrK10gJiA2MykgPDwgMTIgfCAoYnVmZmVyW3N0YXJ0KytdICYgNjMpIDw8IDYgfCBidWZmZXJbc3RhcnQrK10gJiA2MykgLSAweDEwMDAwO1xyXG4gICAgICAgICAgICBjaHVua1tpKytdID0gMHhEODAwICsgKHQgPj4gMTApO1xyXG4gICAgICAgICAgICBjaHVua1tpKytdID0gMHhEQzAwICsgKHQgJiAxMDIzKTtcclxuICAgICAgICB9IGVsc2VcclxuICAgICAgICAgICAgY2h1bmtbaSsrXSA9ICh0ICYgMTUpIDw8IDEyIHwgKGJ1ZmZlcltzdGFydCsrXSAmIDYzKSA8PCA2IHwgYnVmZmVyW3N0YXJ0KytdICYgNjM7XHJcbiAgICAgICAgaWYgKGkgPiA4MTkxKSB7XHJcbiAgICAgICAgICAgIChwYXJ0cyB8fCAocGFydHMgPSBbXSkpLnB1c2goU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShTdHJpbmcsIGNodW5rKSk7XHJcbiAgICAgICAgICAgIGkgPSAwO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmIChwYXJ0cykge1xyXG4gICAgICAgIGlmIChpKVxyXG4gICAgICAgICAgICBwYXJ0cy5wdXNoKFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkoU3RyaW5nLCBjaHVuay5zbGljZSgwLCBpKSkpO1xyXG4gICAgICAgIHJldHVybiBwYXJ0cy5qb2luKFwiXCIpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkoU3RyaW5nLCBjaHVuay5zbGljZSgwLCBpKSk7XHJcbn07XHJcblxyXG4vKipcclxuICogV3JpdGVzIGEgc3RyaW5nIGFzIFVURjggYnl0ZXMuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgU291cmNlIHN0cmluZ1xyXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGJ1ZmZlciBEZXN0aW5hdGlvbiBidWZmZXJcclxuICogQHBhcmFtIHtudW1iZXJ9IG9mZnNldCBEZXN0aW5hdGlvbiBvZmZzZXRcclxuICogQHJldHVybnMge251bWJlcn0gQnl0ZXMgd3JpdHRlblxyXG4gKi9cclxudXRmOC53cml0ZSA9IGZ1bmN0aW9uIHV0Zjhfd3JpdGUoc3RyaW5nLCBidWZmZXIsIG9mZnNldCkge1xyXG4gICAgdmFyIHN0YXJ0ID0gb2Zmc2V0LFxyXG4gICAgICAgIGMxLCAvLyBjaGFyYWN0ZXIgMVxyXG4gICAgICAgIGMyOyAvLyBjaGFyYWN0ZXIgMlxyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHJpbmcubGVuZ3RoOyArK2kpIHtcclxuICAgICAgICBjMSA9IHN0cmluZy5jaGFyQ29kZUF0KGkpO1xyXG4gICAgICAgIGlmIChjMSA8IDEyOCkge1xyXG4gICAgICAgICAgICBidWZmZXJbb2Zmc2V0KytdID0gYzE7XHJcbiAgICAgICAgfSBlbHNlIGlmIChjMSA8IDIwNDgpIHtcclxuICAgICAgICAgICAgYnVmZmVyW29mZnNldCsrXSA9IGMxID4+IDYgICAgICAgfCAxOTI7XHJcbiAgICAgICAgICAgIGJ1ZmZlcltvZmZzZXQrK10gPSBjMSAgICAgICAmIDYzIHwgMTI4O1xyXG4gICAgICAgIH0gZWxzZSBpZiAoKGMxICYgMHhGQzAwKSA9PT0gMHhEODAwICYmICgoYzIgPSBzdHJpbmcuY2hhckNvZGVBdChpICsgMSkpICYgMHhGQzAwKSA9PT0gMHhEQzAwKSB7XHJcbiAgICAgICAgICAgIGMxID0gMHgxMDAwMCArICgoYzEgJiAweDAzRkYpIDw8IDEwKSArIChjMiAmIDB4MDNGRik7XHJcbiAgICAgICAgICAgICsraTtcclxuICAgICAgICAgICAgYnVmZmVyW29mZnNldCsrXSA9IGMxID4+IDE4ICAgICAgfCAyNDA7XHJcbiAgICAgICAgICAgIGJ1ZmZlcltvZmZzZXQrK10gPSBjMSA+PiAxMiAmIDYzIHwgMTI4O1xyXG4gICAgICAgICAgICBidWZmZXJbb2Zmc2V0KytdID0gYzEgPj4gNiAgJiA2MyB8IDEyODtcclxuICAgICAgICAgICAgYnVmZmVyW29mZnNldCsrXSA9IGMxICAgICAgICYgNjMgfCAxMjg7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgYnVmZmVyW29mZnNldCsrXSA9IGMxID4+IDEyICAgICAgfCAyMjQ7XHJcbiAgICAgICAgICAgIGJ1ZmZlcltvZmZzZXQrK10gPSBjMSA+PiA2ICAmIDYzIHwgMTI4O1xyXG4gICAgICAgICAgICBidWZmZXJbb2Zmc2V0KytdID0gYzEgICAgICAgJiA2MyB8IDEyODtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gb2Zmc2V0IC0gc3RhcnQ7XHJcbn07XHJcbiIsIi8vIGxpZ2h0IGxpYnJhcnkgZW50cnkgcG9pbnQuXHJcblxyXG5cInVzZSBzdHJpY3RcIjtcclxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi9zcmMvaW5kZXgtbGlnaHRcIik7IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbi8qKlxyXG4gKiBSdW50aW1lIG1lc3NhZ2UgZnJvbS90byBwbGFpbiBvYmplY3QgY29udmVydGVycy5cclxuICogQG5hbWVzcGFjZVxyXG4gKi9cclxudmFyIGNvbnZlcnRlciA9IGV4cG9ydHM7XHJcblxyXG52YXIgRW51bSA9IHJlcXVpcmUoXCIuL2VudW1cIiksXHJcbiAgICB1dGlsID0gcmVxdWlyZShcIi4vdXRpbFwiKTtcclxuXHJcbi8qKlxyXG4gKiBHZW5lcmF0ZXMgYSBwYXJ0aWFsIHZhbHVlIGZyb21PYmplY3QgY29udmV0ZXIuXHJcbiAqIEBwYXJhbSB7Q29kZWdlbn0gZ2VuIENvZGVnZW4gaW5zdGFuY2VcclxuICogQHBhcmFtIHtGaWVsZH0gZmllbGQgUmVmbGVjdGVkIGZpZWxkXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBmaWVsZEluZGV4IEZpZWxkIGluZGV4XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBwcm9wIFByb3BlcnR5IHJlZmVyZW5jZVxyXG4gKiBAcmV0dXJucyB7Q29kZWdlbn0gQ29kZWdlbiBpbnN0YW5jZVxyXG4gKiBAaWdub3JlXHJcbiAqL1xyXG5mdW5jdGlvbiBnZW5WYWx1ZVBhcnRpYWxfZnJvbU9iamVjdChnZW4sIGZpZWxkLCBmaWVsZEluZGV4LCBwcm9wKSB7XHJcbiAgICAvKiBlc2xpbnQtZGlzYWJsZSBuby11bmV4cGVjdGVkLW11bHRpbGluZSwgYmxvY2stc2NvcGVkLXZhciwgbm8tcmVkZWNsYXJlICovXHJcbiAgICBpZiAoZmllbGQucmVzb2x2ZWRUeXBlKSB7XHJcbiAgICAgICAgaWYgKGZpZWxkLnJlc29sdmVkVHlwZSBpbnN0YW5jZW9mIEVudW0pIHsgZ2VuXHJcbiAgICAgICAgICAgIChcInN3aXRjaChkJXMpe1wiLCBwcm9wKTtcclxuICAgICAgICAgICAgZm9yICh2YXIgdmFsdWVzID0gZmllbGQucmVzb2x2ZWRUeXBlLnZhbHVlcywga2V5cyA9IE9iamVjdC5rZXlzKHZhbHVlcyksIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7ICsraSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGZpZWxkLnJlcGVhdGVkICYmIHZhbHVlc1trZXlzW2ldXSA9PT0gZmllbGQudHlwZURlZmF1bHQpIGdlblxyXG4gICAgICAgICAgICAgICAgKFwiZGVmYXVsdDpcIik7XHJcbiAgICAgICAgICAgICAgICBnZW5cclxuICAgICAgICAgICAgICAgIChcImNhc2UlajpcIiwga2V5c1tpXSlcclxuICAgICAgICAgICAgICAgIChcImNhc2UgJWk6XCIsIHZhbHVlc1trZXlzW2ldXSlcclxuICAgICAgICAgICAgICAgICAgICAoXCJtJXM9JWpcIiwgcHJvcCwgdmFsdWVzW2tleXNbaV1dKVxyXG4gICAgICAgICAgICAgICAgICAgIChcImJyZWFrXCIpO1xyXG4gICAgICAgICAgICB9IGdlblxyXG4gICAgICAgICAgICAoXCJ9XCIpO1xyXG4gICAgICAgIH0gZWxzZSBnZW5cclxuICAgICAgICAgICAgKFwiaWYodHlwZW9mIGQlcyE9PVxcXCJvYmplY3RcXFwiKVwiLCBwcm9wKVxyXG4gICAgICAgICAgICAgICAgKFwidGhyb3cgVHlwZUVycm9yKCVqKVwiLCBmaWVsZC5mdWxsTmFtZSArIFwiOiBvYmplY3QgZXhwZWN0ZWRcIilcclxuICAgICAgICAgICAgKFwibSVzPXR5cGVzWyVpXS5mcm9tT2JqZWN0KGQlcylcIiwgcHJvcCwgZmllbGRJbmRleCwgcHJvcCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHZhciBpc1Vuc2lnbmVkID0gZmFsc2U7XHJcbiAgICAgICAgc3dpdGNoIChmaWVsZC50eXBlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgXCJkb3VibGVcIjpcclxuICAgICAgICAgICAgY2FzZSBcImZsb2F0XCI6IGdlblxyXG4gICAgICAgICAgICAgICAgKFwibSVzPU51bWJlcihkJXMpXCIsIHByb3AsIHByb3ApOyAvLyBhbHNvIGNhdGNoZXMgXCJOYU5cIiwgXCJJbmZpbml0eVwiXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBcInVpbnQzMlwiOlxyXG4gICAgICAgICAgICBjYXNlIFwiZml4ZWQzMlwiOiBnZW5cclxuICAgICAgICAgICAgICAgIChcIm0lcz1kJXM+Pj4wXCIsIHByb3AsIHByb3ApO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgXCJpbnQzMlwiOlxyXG4gICAgICAgICAgICBjYXNlIFwic2ludDMyXCI6XHJcbiAgICAgICAgICAgIGNhc2UgXCJzZml4ZWQzMlwiOiBnZW5cclxuICAgICAgICAgICAgICAgIChcIm0lcz1kJXN8MFwiLCBwcm9wLCBwcm9wKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFwidWludDY0XCI6XHJcbiAgICAgICAgICAgICAgICBpc1Vuc2lnbmVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tZmFsbHRocm91Z2hcclxuICAgICAgICAgICAgY2FzZSBcImludDY0XCI6XHJcbiAgICAgICAgICAgIGNhc2UgXCJzaW50NjRcIjpcclxuICAgICAgICAgICAgY2FzZSBcImZpeGVkNjRcIjpcclxuICAgICAgICAgICAgY2FzZSBcInNmaXhlZDY0XCI6IGdlblxyXG4gICAgICAgICAgICAgICAgKFwiaWYodXRpbC5Mb25nKVwiKVxyXG4gICAgICAgICAgICAgICAgICAgIChcIihtJXM9dXRpbC5Mb25nLmZyb21WYWx1ZShkJXMpKS51bnNpZ25lZD0lalwiLCBwcm9wLCBwcm9wLCBpc1Vuc2lnbmVkKVxyXG4gICAgICAgICAgICAgICAgKFwiZWxzZSBpZih0eXBlb2YgZCVzPT09XFxcInN0cmluZ1xcXCIpXCIsIHByb3ApXHJcbiAgICAgICAgICAgICAgICAgICAgKFwibSVzPXBhcnNlSW50KGQlcywxMClcIiwgcHJvcCwgcHJvcClcclxuICAgICAgICAgICAgICAgIChcImVsc2UgaWYodHlwZW9mIGQlcz09PVxcXCJudW1iZXJcXFwiKVwiLCBwcm9wKVxyXG4gICAgICAgICAgICAgICAgICAgIChcIm0lcz1kJXNcIiwgcHJvcCwgcHJvcClcclxuICAgICAgICAgICAgICAgIChcImVsc2UgaWYodHlwZW9mIGQlcz09PVxcXCJvYmplY3RcXFwiKVwiLCBwcm9wKVxyXG4gICAgICAgICAgICAgICAgICAgIChcIm0lcz1uZXcgdXRpbC5Mb25nQml0cyhkJXMubG93Pj4+MCxkJXMuaGlnaD4+PjApLnRvTnVtYmVyKCVzKVwiLCBwcm9wLCBwcm9wLCBwcm9wLCBpc1Vuc2lnbmVkID8gXCJ0cnVlXCIgOiBcIlwiKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFwiYnl0ZXNcIjogZ2VuXHJcbiAgICAgICAgICAgICAgICAoXCJpZih0eXBlb2YgZCVzPT09XFxcInN0cmluZ1xcXCIpXCIsIHByb3ApXHJcbiAgICAgICAgICAgICAgICAgICAgKFwidXRpbC5iYXNlNjQuZGVjb2RlKGQlcyxtJXM9dXRpbC5uZXdCdWZmZXIodXRpbC5iYXNlNjQubGVuZ3RoKGQlcykpLDApXCIsIHByb3AsIHByb3AsIHByb3ApXHJcbiAgICAgICAgICAgICAgICAoXCJlbHNlIGlmKGQlcy5sZW5ndGgpXCIsIHByb3ApXHJcbiAgICAgICAgICAgICAgICAgICAgKFwibSVzPWQlc1wiLCBwcm9wLCBwcm9wKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFwic3RyaW5nXCI6IGdlblxyXG4gICAgICAgICAgICAgICAgKFwibSVzPVN0cmluZyhkJXMpXCIsIHByb3AsIHByb3ApO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgXCJib29sXCI6IGdlblxyXG4gICAgICAgICAgICAgICAgKFwibSVzPUJvb2xlYW4oZCVzKVwiLCBwcm9wLCBwcm9wKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAvKiBkZWZhdWx0OiBnZW5cclxuICAgICAgICAgICAgICAgIChcIm0lcz1kJXNcIiwgcHJvcCwgcHJvcCk7XHJcbiAgICAgICAgICAgICAgICBicmVhazsgKi9cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZ2VuO1xyXG4gICAgLyogZXNsaW50LWVuYWJsZSBuby11bmV4cGVjdGVkLW11bHRpbGluZSwgYmxvY2stc2NvcGVkLXZhciwgbm8tcmVkZWNsYXJlICovXHJcbn1cclxuXHJcbi8qKlxyXG4gKiBHZW5lcmF0ZXMgYSBwbGFpbiBvYmplY3QgdG8gcnVudGltZSBtZXNzYWdlIGNvbnZlcnRlciBzcGVjaWZpYyB0byB0aGUgc3BlY2lmaWVkIG1lc3NhZ2UgdHlwZS5cclxuICogQHBhcmFtIHtUeXBlfSBtdHlwZSBNZXNzYWdlIHR5cGVcclxuICogQHJldHVybnMge0NvZGVnZW59IENvZGVnZW4gaW5zdGFuY2VcclxuICovXHJcbmNvbnZlcnRlci5mcm9tT2JqZWN0ID0gZnVuY3Rpb24gZnJvbU9iamVjdChtdHlwZSkge1xyXG4gICAgLyogZXNsaW50LWRpc2FibGUgbm8tdW5leHBlY3RlZC1tdWx0aWxpbmUsIGJsb2NrLXNjb3BlZC12YXIsIG5vLXJlZGVjbGFyZSAqL1xyXG4gICAgdmFyIGZpZWxkcyA9IG10eXBlLmZpZWxkc0FycmF5O1xyXG4gICAgdmFyIGdlbiA9IHV0aWwuY29kZWdlbihbXCJkXCJdLCBtdHlwZS5uYW1lICsgXCIkZnJvbU9iamVjdFwiKVxyXG4gICAgKFwiaWYoZCBpbnN0YW5jZW9mIHRoaXMuY3RvcilcIilcclxuICAgICAgICAoXCJyZXR1cm4gZFwiKTtcclxuICAgIGlmICghZmllbGRzLmxlbmd0aCkgcmV0dXJuIGdlblxyXG4gICAgKFwicmV0dXJuIG5ldyB0aGlzLmN0b3JcIik7XHJcbiAgICBnZW5cclxuICAgIChcInZhciBtPW5ldyB0aGlzLmN0b3JcIik7XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGZpZWxkcy5sZW5ndGg7ICsraSkge1xyXG4gICAgICAgIHZhciBmaWVsZCAgPSBmaWVsZHNbaV0ucmVzb2x2ZSgpLFxyXG4gICAgICAgICAgICBwcm9wICAgPSB1dGlsLnNhZmVQcm9wKGZpZWxkLm5hbWUpO1xyXG5cclxuICAgICAgICAvLyBNYXAgZmllbGRzXHJcbiAgICAgICAgaWYgKGZpZWxkLm1hcCkgeyBnZW5cclxuICAgIChcImlmKGQlcyl7XCIsIHByb3ApXHJcbiAgICAgICAgKFwiaWYodHlwZW9mIGQlcyE9PVxcXCJvYmplY3RcXFwiKVwiLCBwcm9wKVxyXG4gICAgICAgICAgICAoXCJ0aHJvdyBUeXBlRXJyb3IoJWopXCIsIGZpZWxkLmZ1bGxOYW1lICsgXCI6IG9iamVjdCBleHBlY3RlZFwiKVxyXG4gICAgICAgIChcIm0lcz17fVwiLCBwcm9wKVxyXG4gICAgICAgIChcImZvcih2YXIga3M9T2JqZWN0LmtleXMoZCVzKSxpPTA7aTxrcy5sZW5ndGg7KytpKXtcIiwgcHJvcCk7XHJcbiAgICAgICAgICAgIGdlblZhbHVlUGFydGlhbF9mcm9tT2JqZWN0KGdlbiwgZmllbGQsIC8qIG5vdCBzb3J0ZWQgKi8gaSwgcHJvcCArIFwiW2tzW2ldXVwiKVxyXG4gICAgICAgIChcIn1cIilcclxuICAgIChcIn1cIik7XHJcblxyXG4gICAgICAgIC8vIFJlcGVhdGVkIGZpZWxkc1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZmllbGQucmVwZWF0ZWQpIHsgZ2VuXHJcbiAgICAoXCJpZihkJXMpe1wiLCBwcm9wKVxyXG4gICAgICAgIChcImlmKCFBcnJheS5pc0FycmF5KGQlcykpXCIsIHByb3ApXHJcbiAgICAgICAgICAgIChcInRocm93IFR5cGVFcnJvciglailcIiwgZmllbGQuZnVsbE5hbWUgKyBcIjogYXJyYXkgZXhwZWN0ZWRcIilcclxuICAgICAgICAoXCJtJXM9W11cIiwgcHJvcClcclxuICAgICAgICAoXCJmb3IodmFyIGk9MDtpPGQlcy5sZW5ndGg7KytpKXtcIiwgcHJvcCk7XHJcbiAgICAgICAgICAgIGdlblZhbHVlUGFydGlhbF9mcm9tT2JqZWN0KGdlbiwgZmllbGQsIC8qIG5vdCBzb3J0ZWQgKi8gaSwgcHJvcCArIFwiW2ldXCIpXHJcbiAgICAgICAgKFwifVwiKVxyXG4gICAgKFwifVwiKTtcclxuXHJcbiAgICAgICAgLy8gTm9uLXJlcGVhdGVkIGZpZWxkc1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGlmICghKGZpZWxkLnJlc29sdmVkVHlwZSBpbnN0YW5jZW9mIEVudW0pKSBnZW4gLy8gbm8gbmVlZCB0byB0ZXN0IGZvciBudWxsL3VuZGVmaW5lZCBpZiBhbiBlbnVtICh1c2VzIHN3aXRjaClcclxuICAgIChcImlmKGQlcyE9bnVsbCl7XCIsIHByb3ApOyAvLyAhPT0gdW5kZWZpbmVkICYmICE9PSBudWxsXHJcbiAgICAgICAgZ2VuVmFsdWVQYXJ0aWFsX2Zyb21PYmplY3QoZ2VuLCBmaWVsZCwgLyogbm90IHNvcnRlZCAqLyBpLCBwcm9wKTtcclxuICAgICAgICAgICAgaWYgKCEoZmllbGQucmVzb2x2ZWRUeXBlIGluc3RhbmNlb2YgRW51bSkpIGdlblxyXG4gICAgKFwifVwiKTtcclxuICAgICAgICB9XHJcbiAgICB9IHJldHVybiBnZW5cclxuICAgIChcInJldHVybiBtXCIpO1xyXG4gICAgLyogZXNsaW50LWVuYWJsZSBuby11bmV4cGVjdGVkLW11bHRpbGluZSwgYmxvY2stc2NvcGVkLXZhciwgbm8tcmVkZWNsYXJlICovXHJcbn07XHJcblxyXG4vKipcclxuICogR2VuZXJhdGVzIGEgcGFydGlhbCB2YWx1ZSB0b09iamVjdCBjb252ZXJ0ZXIuXHJcbiAqIEBwYXJhbSB7Q29kZWdlbn0gZ2VuIENvZGVnZW4gaW5zdGFuY2VcclxuICogQHBhcmFtIHtGaWVsZH0gZmllbGQgUmVmbGVjdGVkIGZpZWxkXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBmaWVsZEluZGV4IEZpZWxkIGluZGV4XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBwcm9wIFByb3BlcnR5IHJlZmVyZW5jZVxyXG4gKiBAcmV0dXJucyB7Q29kZWdlbn0gQ29kZWdlbiBpbnN0YW5jZVxyXG4gKiBAaWdub3JlXHJcbiAqL1xyXG5mdW5jdGlvbiBnZW5WYWx1ZVBhcnRpYWxfdG9PYmplY3QoZ2VuLCBmaWVsZCwgZmllbGRJbmRleCwgcHJvcCkge1xyXG4gICAgLyogZXNsaW50LWRpc2FibGUgbm8tdW5leHBlY3RlZC1tdWx0aWxpbmUsIGJsb2NrLXNjb3BlZC12YXIsIG5vLXJlZGVjbGFyZSAqL1xyXG4gICAgaWYgKGZpZWxkLnJlc29sdmVkVHlwZSkge1xyXG4gICAgICAgIGlmIChmaWVsZC5yZXNvbHZlZFR5cGUgaW5zdGFuY2VvZiBFbnVtKSBnZW5cclxuICAgICAgICAgICAgKFwiZCVzPW8uZW51bXM9PT1TdHJpbmc/dHlwZXNbJWldLnZhbHVlc1ttJXNdOm0lc1wiLCBwcm9wLCBmaWVsZEluZGV4LCBwcm9wLCBwcm9wKTtcclxuICAgICAgICBlbHNlIGdlblxyXG4gICAgICAgICAgICAoXCJkJXM9dHlwZXNbJWldLnRvT2JqZWN0KG0lcyxvKVwiLCBwcm9wLCBmaWVsZEluZGV4LCBwcm9wKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdmFyIGlzVW5zaWduZWQgPSBmYWxzZTtcclxuICAgICAgICBzd2l0Y2ggKGZpZWxkLnR5cGUpIHtcclxuICAgICAgICAgICAgY2FzZSBcImRvdWJsZVwiOlxyXG4gICAgICAgICAgICBjYXNlIFwiZmxvYXRcIjogZ2VuXHJcbiAgICAgICAgICAgIChcImQlcz1vLmpzb24mJiFpc0Zpbml0ZShtJXMpP1N0cmluZyhtJXMpOm0lc1wiLCBwcm9wLCBwcm9wLCBwcm9wLCBwcm9wKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFwidWludDY0XCI6XHJcbiAgICAgICAgICAgICAgICBpc1Vuc2lnbmVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tZmFsbHRocm91Z2hcclxuICAgICAgICAgICAgY2FzZSBcImludDY0XCI6XHJcbiAgICAgICAgICAgIGNhc2UgXCJzaW50NjRcIjpcclxuICAgICAgICAgICAgY2FzZSBcImZpeGVkNjRcIjpcclxuICAgICAgICAgICAgY2FzZSBcInNmaXhlZDY0XCI6IGdlblxyXG4gICAgICAgICAgICAoXCJpZih0eXBlb2YgbSVzPT09XFxcIm51bWJlclxcXCIpXCIsIHByb3ApXHJcbiAgICAgICAgICAgICAgICAoXCJkJXM9by5sb25ncz09PVN0cmluZz9TdHJpbmcobSVzKTptJXNcIiwgcHJvcCwgcHJvcCwgcHJvcClcclxuICAgICAgICAgICAgKFwiZWxzZVwiKSAvLyBMb25nLWxpa2VcclxuICAgICAgICAgICAgICAgIChcImQlcz1vLmxvbmdzPT09U3RyaW5nP3V0aWwuTG9uZy5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChtJXMpOm8ubG9uZ3M9PT1OdW1iZXI/bmV3IHV0aWwuTG9uZ0JpdHMobSVzLmxvdz4+PjAsbSVzLmhpZ2g+Pj4wKS50b051bWJlciglcyk6bSVzXCIsIHByb3AsIHByb3AsIHByb3AsIHByb3AsIGlzVW5zaWduZWQgPyBcInRydWVcIjogXCJcIiwgcHJvcCk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBcImJ5dGVzXCI6IGdlblxyXG4gICAgICAgICAgICAoXCJkJXM9by5ieXRlcz09PVN0cmluZz91dGlsLmJhc2U2NC5lbmNvZGUobSVzLDAsbSVzLmxlbmd0aCk6by5ieXRlcz09PUFycmF5P0FycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKG0lcyk6bSVzXCIsIHByb3AsIHByb3AsIHByb3AsIHByb3AsIHByb3ApO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IGdlblxyXG4gICAgICAgICAgICAoXCJkJXM9bSVzXCIsIHByb3AsIHByb3ApO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGdlbjtcclxuICAgIC8qIGVzbGludC1lbmFibGUgbm8tdW5leHBlY3RlZC1tdWx0aWxpbmUsIGJsb2NrLXNjb3BlZC12YXIsIG5vLXJlZGVjbGFyZSAqL1xyXG59XHJcblxyXG4vKipcclxuICogR2VuZXJhdGVzIGEgcnVudGltZSBtZXNzYWdlIHRvIHBsYWluIG9iamVjdCBjb252ZXJ0ZXIgc3BlY2lmaWMgdG8gdGhlIHNwZWNpZmllZCBtZXNzYWdlIHR5cGUuXHJcbiAqIEBwYXJhbSB7VHlwZX0gbXR5cGUgTWVzc2FnZSB0eXBlXHJcbiAqIEByZXR1cm5zIHtDb2RlZ2VufSBDb2RlZ2VuIGluc3RhbmNlXHJcbiAqL1xyXG5jb252ZXJ0ZXIudG9PYmplY3QgPSBmdW5jdGlvbiB0b09iamVjdChtdHlwZSkge1xyXG4gICAgLyogZXNsaW50LWRpc2FibGUgbm8tdW5leHBlY3RlZC1tdWx0aWxpbmUsIGJsb2NrLXNjb3BlZC12YXIsIG5vLXJlZGVjbGFyZSAqL1xyXG4gICAgdmFyIGZpZWxkcyA9IG10eXBlLmZpZWxkc0FycmF5LnNsaWNlKCkuc29ydCh1dGlsLmNvbXBhcmVGaWVsZHNCeUlkKTtcclxuICAgIGlmICghZmllbGRzLmxlbmd0aClcclxuICAgICAgICByZXR1cm4gdXRpbC5jb2RlZ2VuKCkoXCJyZXR1cm4ge31cIik7XHJcbiAgICB2YXIgZ2VuID0gdXRpbC5jb2RlZ2VuKFtcIm1cIiwgXCJvXCJdLCBtdHlwZS5uYW1lICsgXCIkdG9PYmplY3RcIilcclxuICAgIChcImlmKCFvKVwiKVxyXG4gICAgICAgIChcIm89e31cIilcclxuICAgIChcInZhciBkPXt9XCIpO1xyXG5cclxuICAgIHZhciByZXBlYXRlZEZpZWxkcyA9IFtdLFxyXG4gICAgICAgIG1hcEZpZWxkcyA9IFtdLFxyXG4gICAgICAgIG5vcm1hbEZpZWxkcyA9IFtdLFxyXG4gICAgICAgIGkgPSAwO1xyXG4gICAgZm9yICg7IGkgPCBmaWVsZHMubGVuZ3RoOyArK2kpXHJcbiAgICAgICAgaWYgKCFmaWVsZHNbaV0ucGFydE9mKVxyXG4gICAgICAgICAgICAoIGZpZWxkc1tpXS5yZXNvbHZlKCkucmVwZWF0ZWQgPyByZXBlYXRlZEZpZWxkc1xyXG4gICAgICAgICAgICA6IGZpZWxkc1tpXS5tYXAgPyBtYXBGaWVsZHNcclxuICAgICAgICAgICAgOiBub3JtYWxGaWVsZHMpLnB1c2goZmllbGRzW2ldKTtcclxuXHJcbiAgICBpZiAocmVwZWF0ZWRGaWVsZHMubGVuZ3RoKSB7IGdlblxyXG4gICAgKFwiaWYoby5hcnJheXN8fG8uZGVmYXVsdHMpe1wiKTtcclxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgcmVwZWF0ZWRGaWVsZHMubGVuZ3RoOyArK2kpIGdlblxyXG4gICAgICAgIChcImQlcz1bXVwiLCB1dGlsLnNhZmVQcm9wKHJlcGVhdGVkRmllbGRzW2ldLm5hbWUpKTtcclxuICAgICAgICBnZW5cclxuICAgIChcIn1cIik7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKG1hcEZpZWxkcy5sZW5ndGgpIHsgZ2VuXHJcbiAgICAoXCJpZihvLm9iamVjdHN8fG8uZGVmYXVsdHMpe1wiKTtcclxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbWFwRmllbGRzLmxlbmd0aDsgKytpKSBnZW5cclxuICAgICAgICAoXCJkJXM9e31cIiwgdXRpbC5zYWZlUHJvcChtYXBGaWVsZHNbaV0ubmFtZSkpO1xyXG4gICAgICAgIGdlblxyXG4gICAgKFwifVwiKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAobm9ybWFsRmllbGRzLmxlbmd0aCkgeyBnZW5cclxuICAgIChcImlmKG8uZGVmYXVsdHMpe1wiKTtcclxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbm9ybWFsRmllbGRzLmxlbmd0aDsgKytpKSB7XHJcbiAgICAgICAgICAgIHZhciBmaWVsZCA9IG5vcm1hbEZpZWxkc1tpXSxcclxuICAgICAgICAgICAgICAgIHByb3AgID0gdXRpbC5zYWZlUHJvcChmaWVsZC5uYW1lKTtcclxuICAgICAgICAgICAgaWYgKGZpZWxkLnJlc29sdmVkVHlwZSBpbnN0YW5jZW9mIEVudW0pIGdlblxyXG4gICAgICAgIChcImQlcz1vLmVudW1zPT09U3RyaW5nPyVqOiVqXCIsIHByb3AsIGZpZWxkLnJlc29sdmVkVHlwZS52YWx1ZXNCeUlkW2ZpZWxkLnR5cGVEZWZhdWx0XSwgZmllbGQudHlwZURlZmF1bHQpO1xyXG4gICAgICAgICAgICBlbHNlIGlmIChmaWVsZC5sb25nKSBnZW5cclxuICAgICAgICAoXCJpZih1dGlsLkxvbmcpe1wiKVxyXG4gICAgICAgICAgICAoXCJ2YXIgbj1uZXcgdXRpbC5Mb25nKCVpLCVpLCVqKVwiLCBmaWVsZC50eXBlRGVmYXVsdC5sb3csIGZpZWxkLnR5cGVEZWZhdWx0LmhpZ2gsIGZpZWxkLnR5cGVEZWZhdWx0LnVuc2lnbmVkKVxyXG4gICAgICAgICAgICAoXCJkJXM9by5sb25ncz09PVN0cmluZz9uLnRvU3RyaW5nKCk6by5sb25ncz09PU51bWJlcj9uLnRvTnVtYmVyKCk6blwiLCBwcm9wKVxyXG4gICAgICAgIChcIn1lbHNlXCIpXHJcbiAgICAgICAgICAgIChcImQlcz1vLmxvbmdzPT09U3RyaW5nPyVqOiVpXCIsIHByb3AsIGZpZWxkLnR5cGVEZWZhdWx0LnRvU3RyaW5nKCksIGZpZWxkLnR5cGVEZWZhdWx0LnRvTnVtYmVyKCkpO1xyXG4gICAgICAgICAgICBlbHNlIGlmIChmaWVsZC5ieXRlcykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGFycmF5RGVmYXVsdCA9IFwiW1wiICsgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoZmllbGQudHlwZURlZmF1bHQpLmpvaW4oXCIsXCIpICsgXCJdXCI7XHJcbiAgICAgICAgICAgICAgICBnZW5cclxuICAgICAgICAoXCJpZihvLmJ5dGVzPT09U3RyaW5nKWQlcz0lalwiLCBwcm9wLCBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KFN0cmluZywgZmllbGQudHlwZURlZmF1bHQpKVxyXG4gICAgICAgIChcImVsc2V7XCIpXHJcbiAgICAgICAgICAgIChcImQlcz0lc1wiLCBwcm9wLCBhcnJheURlZmF1bHQpXHJcbiAgICAgICAgICAgIChcImlmKG8uYnl0ZXMhPT1BcnJheSlkJXM9dXRpbC5uZXdCdWZmZXIoZCVzKVwiLCBwcm9wLCBwcm9wKVxyXG4gICAgICAgIChcIn1cIik7XHJcbiAgICAgICAgICAgIH0gZWxzZSBnZW5cclxuICAgICAgICAoXCJkJXM9JWpcIiwgcHJvcCwgZmllbGQudHlwZURlZmF1bHQpOyAvLyBhbHNvIG1lc3NhZ2VzICg9bnVsbClcclxuICAgICAgICB9IGdlblxyXG4gICAgKFwifVwiKTtcclxuICAgIH1cclxuICAgIHZhciBoYXNLczIgPSBmYWxzZTtcclxuICAgIGZvciAoaSA9IDA7IGkgPCBmaWVsZHMubGVuZ3RoOyArK2kpIHtcclxuICAgICAgICB2YXIgZmllbGQgPSBmaWVsZHNbaV0sXHJcbiAgICAgICAgICAgIGluZGV4ID0gbXR5cGUuX2ZpZWxkc0FycmF5LmluZGV4T2YoZmllbGQpLFxyXG4gICAgICAgICAgICBwcm9wICA9IHV0aWwuc2FmZVByb3AoZmllbGQubmFtZSk7XHJcbiAgICAgICAgaWYgKGZpZWxkLm1hcCkge1xyXG4gICAgICAgICAgICBpZiAoIWhhc0tzMikgeyBoYXNLczIgPSB0cnVlOyBnZW5cclxuICAgIChcInZhciBrczJcIik7XHJcbiAgICAgICAgICAgIH0gZ2VuXHJcbiAgICAoXCJpZihtJXMmJihrczI9T2JqZWN0LmtleXMobSVzKSkubGVuZ3RoKXtcIiwgcHJvcCwgcHJvcClcclxuICAgICAgICAoXCJkJXM9e31cIiwgcHJvcClcclxuICAgICAgICAoXCJmb3IodmFyIGo9MDtqPGtzMi5sZW5ndGg7KytqKXtcIik7XHJcbiAgICAgICAgICAgIGdlblZhbHVlUGFydGlhbF90b09iamVjdChnZW4sIGZpZWxkLCAvKiBzb3J0ZWQgKi8gaW5kZXgsIHByb3AgKyBcIltrczJbal1dXCIpXHJcbiAgICAgICAgKFwifVwiKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnJlcGVhdGVkKSB7IGdlblxyXG4gICAgKFwiaWYobSVzJiZtJXMubGVuZ3RoKXtcIiwgcHJvcCwgcHJvcClcclxuICAgICAgICAoXCJkJXM9W11cIiwgcHJvcClcclxuICAgICAgICAoXCJmb3IodmFyIGo9MDtqPG0lcy5sZW5ndGg7KytqKXtcIiwgcHJvcCk7XHJcbiAgICAgICAgICAgIGdlblZhbHVlUGFydGlhbF90b09iamVjdChnZW4sIGZpZWxkLCAvKiBzb3J0ZWQgKi8gaW5kZXgsIHByb3AgKyBcIltqXVwiKVxyXG4gICAgICAgIChcIn1cIik7XHJcbiAgICAgICAgfSBlbHNlIHsgZ2VuXHJcbiAgICAoXCJpZihtJXMhPW51bGwmJm0uaGFzT3duUHJvcGVydHkoJWopKXtcIiwgcHJvcCwgZmllbGQubmFtZSk7IC8vICE9PSB1bmRlZmluZWQgJiYgIT09IG51bGxcclxuICAgICAgICBnZW5WYWx1ZVBhcnRpYWxfdG9PYmplY3QoZ2VuLCBmaWVsZCwgLyogc29ydGVkICovIGluZGV4LCBwcm9wKTtcclxuICAgICAgICBpZiAoZmllbGQucGFydE9mKSBnZW5cclxuICAgICAgICAoXCJpZihvLm9uZW9mcylcIilcclxuICAgICAgICAgICAgKFwiZCVzPSVqXCIsIHV0aWwuc2FmZVByb3AoZmllbGQucGFydE9mLm5hbWUpLCBmaWVsZC5uYW1lKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZ2VuXHJcbiAgICAoXCJ9XCIpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGdlblxyXG4gICAgKFwicmV0dXJuIGRcIik7XHJcbiAgICAvKiBlc2xpbnQtZW5hYmxlIG5vLXVuZXhwZWN0ZWQtbXVsdGlsaW5lLCBibG9jay1zY29wZWQtdmFyLCBuby1yZWRlY2xhcmUgKi9cclxufTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbm1vZHVsZS5leHBvcnRzID0gZGVjb2RlcjtcclxuXHJcbnZhciBFbnVtICAgID0gcmVxdWlyZShcIi4vZW51bVwiKSxcclxuICAgIHR5cGVzICAgPSByZXF1aXJlKFwiLi90eXBlc1wiKSxcclxuICAgIHV0aWwgICAgPSByZXF1aXJlKFwiLi91dGlsXCIpO1xyXG5cclxuZnVuY3Rpb24gbWlzc2luZyhmaWVsZCkge1xyXG4gICAgcmV0dXJuIFwibWlzc2luZyByZXF1aXJlZCAnXCIgKyBmaWVsZC5uYW1lICsgXCInXCI7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBHZW5lcmF0ZXMgYSBkZWNvZGVyIHNwZWNpZmljIHRvIHRoZSBzcGVjaWZpZWQgbWVzc2FnZSB0eXBlLlxyXG4gKiBAcGFyYW0ge1R5cGV9IG10eXBlIE1lc3NhZ2UgdHlwZVxyXG4gKiBAcmV0dXJucyB7Q29kZWdlbn0gQ29kZWdlbiBpbnN0YW5jZVxyXG4gKi9cclxuZnVuY3Rpb24gZGVjb2RlcihtdHlwZSkge1xyXG4gICAgLyogZXNsaW50LWRpc2FibGUgbm8tdW5leHBlY3RlZC1tdWx0aWxpbmUgKi9cclxuICAgIHZhciBnZW4gPSB1dGlsLmNvZGVnZW4oW1wiclwiLCBcImxcIl0sIG10eXBlLm5hbWUgKyBcIiRkZWNvZGVcIilcclxuICAgIChcImlmKCEociBpbnN0YW5jZW9mIFJlYWRlcikpXCIpXHJcbiAgICAgICAgKFwicj1SZWFkZXIuY3JlYXRlKHIpXCIpXHJcbiAgICAoXCJ2YXIgYz1sPT09dW5kZWZpbmVkP3IubGVuOnIucG9zK2wsbT1uZXcgdGhpcy5jdG9yXCIgKyAobXR5cGUuZmllbGRzQXJyYXkuZmlsdGVyKGZ1bmN0aW9uKGZpZWxkKSB7IHJldHVybiBmaWVsZC5tYXA7IH0pLmxlbmd0aCA/IFwiLGtcIiA6IFwiXCIpKVxyXG4gICAgKFwid2hpbGUoci5wb3M8Yyl7XCIpXHJcbiAgICAgICAgKFwidmFyIHQ9ci51aW50MzIoKVwiKTtcclxuICAgIGlmIChtdHlwZS5ncm91cCkgZ2VuXHJcbiAgICAgICAgKFwiaWYoKHQmNyk9PT00KVwiKVxyXG4gICAgICAgICAgICAoXCJicmVha1wiKTtcclxuICAgIGdlblxyXG4gICAgICAgIChcInN3aXRjaCh0Pj4+Myl7XCIpO1xyXG5cclxuICAgIHZhciBpID0gMDtcclxuICAgIGZvciAoOyBpIDwgLyogaW5pdGlhbGl6ZXMgKi8gbXR5cGUuZmllbGRzQXJyYXkubGVuZ3RoOyArK2kpIHtcclxuICAgICAgICB2YXIgZmllbGQgPSBtdHlwZS5fZmllbGRzQXJyYXlbaV0ucmVzb2x2ZSgpLFxyXG4gICAgICAgICAgICB0eXBlICA9IGZpZWxkLnJlc29sdmVkVHlwZSBpbnN0YW5jZW9mIEVudW0gPyBcImludDMyXCIgOiBmaWVsZC50eXBlLFxyXG4gICAgICAgICAgICByZWYgICA9IFwibVwiICsgdXRpbC5zYWZlUHJvcChmaWVsZC5uYW1lKTsgZ2VuXHJcbiAgICAgICAgICAgIChcImNhc2UgJWk6XCIsIGZpZWxkLmlkKTtcclxuXHJcbiAgICAgICAgLy8gTWFwIGZpZWxkc1xyXG4gICAgICAgIGlmIChmaWVsZC5tYXApIHsgZ2VuXHJcbiAgICAgICAgICAgICAgICAoXCJyLnNraXAoKS5wb3MrK1wiKSAvLyBhc3N1bWVzIGlkIDEgKyBrZXkgd2lyZVR5cGVcclxuICAgICAgICAgICAgICAgIChcImlmKCVzPT09dXRpbC5lbXB0eU9iamVjdClcIiwgcmVmKVxyXG4gICAgICAgICAgICAgICAgICAgIChcIiVzPXt9XCIsIHJlZilcclxuICAgICAgICAgICAgICAgIChcIms9ci4lcygpXCIsIGZpZWxkLmtleVR5cGUpXHJcbiAgICAgICAgICAgICAgICAoXCJyLnBvcysrXCIpOyAvLyBhc3N1bWVzIGlkIDIgKyB2YWx1ZSB3aXJlVHlwZVxyXG4gICAgICAgICAgICBpZiAodHlwZXMubG9uZ1tmaWVsZC5rZXlUeXBlXSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZXMuYmFzaWNbdHlwZV0gPT09IHVuZGVmaW5lZCkgZ2VuXHJcbiAgICAgICAgICAgICAgICAoXCIlc1t0eXBlb2Ygaz09PVxcXCJvYmplY3RcXFwiP3V0aWwubG9uZ1RvSGFzaChrKTprXT10eXBlc1slaV0uZGVjb2RlKHIsci51aW50MzIoKSlcIiwgcmVmLCBpKTsgLy8gY2FuJ3QgYmUgZ3JvdXBzXHJcbiAgICAgICAgICAgICAgICBlbHNlIGdlblxyXG4gICAgICAgICAgICAgICAgKFwiJXNbdHlwZW9mIGs9PT1cXFwib2JqZWN0XFxcIj91dGlsLmxvbmdUb0hhc2goayk6a109ci4lcygpXCIsIHJlZiwgdHlwZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZXMuYmFzaWNbdHlwZV0gPT09IHVuZGVmaW5lZCkgZ2VuXHJcbiAgICAgICAgICAgICAgICAoXCIlc1trXT10eXBlc1slaV0uZGVjb2RlKHIsci51aW50MzIoKSlcIiwgcmVmLCBpKTsgLy8gY2FuJ3QgYmUgZ3JvdXBzXHJcbiAgICAgICAgICAgICAgICBlbHNlIGdlblxyXG4gICAgICAgICAgICAgICAgKFwiJXNba109ci4lcygpXCIsIHJlZiwgdHlwZSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gUmVwZWF0ZWQgZmllbGRzXHJcbiAgICAgICAgfSBlbHNlIGlmIChmaWVsZC5yZXBlYXRlZCkgeyBnZW5cclxuXHJcbiAgICAgICAgICAgICAgICAoXCJpZighKCVzJiYlcy5sZW5ndGgpKVwiLCByZWYsIHJlZilcclxuICAgICAgICAgICAgICAgICAgICAoXCIlcz1bXVwiLCByZWYpO1xyXG5cclxuICAgICAgICAgICAgLy8gUGFja2FibGUgKGFsd2F5cyBjaGVjayBmb3IgZm9yd2FyZCBhbmQgYmFja3dhcmQgY29tcGF0aWJsaXR5KVxyXG4gICAgICAgICAgICBpZiAodHlwZXMucGFja2VkW3R5cGVdICE9PSB1bmRlZmluZWQpIGdlblxyXG4gICAgICAgICAgICAgICAgKFwiaWYoKHQmNyk9PT0yKXtcIilcclxuICAgICAgICAgICAgICAgICAgICAoXCJ2YXIgYzI9ci51aW50MzIoKStyLnBvc1wiKVxyXG4gICAgICAgICAgICAgICAgICAgIChcIndoaWxlKHIucG9zPGMyKVwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAoXCIlcy5wdXNoKHIuJXMoKSlcIiwgcmVmLCB0eXBlKVxyXG4gICAgICAgICAgICAgICAgKFwifWVsc2VcIik7XHJcblxyXG4gICAgICAgICAgICAvLyBOb24tcGFja2VkXHJcbiAgICAgICAgICAgIGlmICh0eXBlcy5iYXNpY1t0eXBlXSA9PT0gdW5kZWZpbmVkKSBnZW4oZmllbGQucmVzb2x2ZWRUeXBlLmdyb3VwXHJcbiAgICAgICAgICAgICAgICAgICAgPyBcIiVzLnB1c2godHlwZXNbJWldLmRlY29kZShyKSlcIlxyXG4gICAgICAgICAgICAgICAgICAgIDogXCIlcy5wdXNoKHR5cGVzWyVpXS5kZWNvZGUocixyLnVpbnQzMigpKSlcIiwgcmVmLCBpKTtcclxuICAgICAgICAgICAgZWxzZSBnZW5cclxuICAgICAgICAgICAgICAgICAgICAoXCIlcy5wdXNoKHIuJXMoKSlcIiwgcmVmLCB0eXBlKTtcclxuXHJcbiAgICAgICAgLy8gTm9uLXJlcGVhdGVkXHJcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlcy5iYXNpY1t0eXBlXSA9PT0gdW5kZWZpbmVkKSBnZW4oZmllbGQucmVzb2x2ZWRUeXBlLmdyb3VwXHJcbiAgICAgICAgICAgICAgICA/IFwiJXM9dHlwZXNbJWldLmRlY29kZShyKVwiXHJcbiAgICAgICAgICAgICAgICA6IFwiJXM9dHlwZXNbJWldLmRlY29kZShyLHIudWludDMyKCkpXCIsIHJlZiwgaSk7XHJcbiAgICAgICAgZWxzZSBnZW5cclxuICAgICAgICAgICAgICAgIChcIiVzPXIuJXMoKVwiLCByZWYsIHR5cGUpO1xyXG4gICAgICAgIGdlblxyXG4gICAgICAgICAgICAgICAgKFwiYnJlYWtcIik7XHJcbiAgICAvLyBVbmtub3duIGZpZWxkc1xyXG4gICAgfSBnZW5cclxuICAgICAgICAgICAgKFwiZGVmYXVsdDpcIilcclxuICAgICAgICAgICAgICAgIChcInIuc2tpcFR5cGUodCY3KVwiKVxyXG4gICAgICAgICAgICAgICAgKFwiYnJlYWtcIilcclxuXHJcbiAgICAgICAgKFwifVwiKVxyXG4gICAgKFwifVwiKTtcclxuXHJcbiAgICAvLyBGaWVsZCBwcmVzZW5jZVxyXG4gICAgZm9yIChpID0gMDsgaSA8IG10eXBlLl9maWVsZHNBcnJheS5sZW5ndGg7ICsraSkge1xyXG4gICAgICAgIHZhciByZmllbGQgPSBtdHlwZS5fZmllbGRzQXJyYXlbaV07XHJcbiAgICAgICAgaWYgKHJmaWVsZC5yZXF1aXJlZCkgZ2VuXHJcbiAgICAoXCJpZighbS5oYXNPd25Qcm9wZXJ0eSglaikpXCIsIHJmaWVsZC5uYW1lKVxyXG4gICAgICAgIChcInRocm93IHV0aWwuUHJvdG9jb2xFcnJvciglaix7aW5zdGFuY2U6bX0pXCIsIG1pc3NpbmcocmZpZWxkKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGdlblxyXG4gICAgKFwicmV0dXJuIG1cIik7XHJcbiAgICAvKiBlc2xpbnQtZW5hYmxlIG5vLXVuZXhwZWN0ZWQtbXVsdGlsaW5lICovXHJcbn1cclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbm1vZHVsZS5leHBvcnRzID0gZW5jb2RlcjtcclxuXHJcbnZhciBFbnVtICAgICA9IHJlcXVpcmUoXCIuL2VudW1cIiksXHJcbiAgICB0eXBlcyAgICA9IHJlcXVpcmUoXCIuL3R5cGVzXCIpLFxyXG4gICAgdXRpbCAgICAgPSByZXF1aXJlKFwiLi91dGlsXCIpO1xyXG5cclxuLyoqXHJcbiAqIEdlbmVyYXRlcyBhIHBhcnRpYWwgbWVzc2FnZSB0eXBlIGVuY29kZXIuXHJcbiAqIEBwYXJhbSB7Q29kZWdlbn0gZ2VuIENvZGVnZW4gaW5zdGFuY2VcclxuICogQHBhcmFtIHtGaWVsZH0gZmllbGQgUmVmbGVjdGVkIGZpZWxkXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBmaWVsZEluZGV4IEZpZWxkIGluZGV4XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSByZWYgVmFyaWFibGUgcmVmZXJlbmNlXHJcbiAqIEByZXR1cm5zIHtDb2RlZ2VufSBDb2RlZ2VuIGluc3RhbmNlXHJcbiAqIEBpZ25vcmVcclxuICovXHJcbmZ1bmN0aW9uIGdlblR5cGVQYXJ0aWFsKGdlbiwgZmllbGQsIGZpZWxkSW5kZXgsIHJlZikge1xyXG4gICAgcmV0dXJuIGZpZWxkLnJlc29sdmVkVHlwZS5ncm91cFxyXG4gICAgICAgID8gZ2VuKFwidHlwZXNbJWldLmVuY29kZSglcyx3LnVpbnQzMiglaSkpLnVpbnQzMiglaSlcIiwgZmllbGRJbmRleCwgcmVmLCAoZmllbGQuaWQgPDwgMyB8IDMpID4+PiAwLCAoZmllbGQuaWQgPDwgMyB8IDQpID4+PiAwKVxyXG4gICAgICAgIDogZ2VuKFwidHlwZXNbJWldLmVuY29kZSglcyx3LnVpbnQzMiglaSkuZm9yaygpKS5sZGVsaW0oKVwiLCBmaWVsZEluZGV4LCByZWYsIChmaWVsZC5pZCA8PCAzIHwgMikgPj4+IDApO1xyXG59XHJcblxyXG4vKipcclxuICogR2VuZXJhdGVzIGFuIGVuY29kZXIgc3BlY2lmaWMgdG8gdGhlIHNwZWNpZmllZCBtZXNzYWdlIHR5cGUuXHJcbiAqIEBwYXJhbSB7VHlwZX0gbXR5cGUgTWVzc2FnZSB0eXBlXHJcbiAqIEByZXR1cm5zIHtDb2RlZ2VufSBDb2RlZ2VuIGluc3RhbmNlXHJcbiAqL1xyXG5mdW5jdGlvbiBlbmNvZGVyKG10eXBlKSB7XHJcbiAgICAvKiBlc2xpbnQtZGlzYWJsZSBuby11bmV4cGVjdGVkLW11bHRpbGluZSwgYmxvY2stc2NvcGVkLXZhciwgbm8tcmVkZWNsYXJlICovXHJcbiAgICB2YXIgZ2VuID0gdXRpbC5jb2RlZ2VuKFtcIm1cIiwgXCJ3XCJdLCBtdHlwZS5uYW1lICsgXCIkZW5jb2RlXCIpXHJcbiAgICAoXCJpZighdylcIilcclxuICAgICAgICAoXCJ3PVdyaXRlci5jcmVhdGUoKVwiKTtcclxuXHJcbiAgICB2YXIgaSwgcmVmO1xyXG5cclxuICAgIC8vIFwid2hlbiBhIG1lc3NhZ2UgaXMgc2VyaWFsaXplZCBpdHMga25vd24gZmllbGRzIHNob3VsZCBiZSB3cml0dGVuIHNlcXVlbnRpYWxseSBieSBmaWVsZCBudW1iZXJcIlxyXG4gICAgdmFyIGZpZWxkcyA9IC8qIGluaXRpYWxpemVzICovIG10eXBlLmZpZWxkc0FycmF5LnNsaWNlKCkuc29ydCh1dGlsLmNvbXBhcmVGaWVsZHNCeUlkKTtcclxuXHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGZpZWxkcy5sZW5ndGg7ICsraSkge1xyXG4gICAgICAgIHZhciBmaWVsZCAgICA9IGZpZWxkc1tpXS5yZXNvbHZlKCksXHJcbiAgICAgICAgICAgIGluZGV4ICAgID0gbXR5cGUuX2ZpZWxkc0FycmF5LmluZGV4T2YoZmllbGQpLFxyXG4gICAgICAgICAgICB0eXBlICAgICA9IGZpZWxkLnJlc29sdmVkVHlwZSBpbnN0YW5jZW9mIEVudW0gPyBcImludDMyXCIgOiBmaWVsZC50eXBlLFxyXG4gICAgICAgICAgICB3aXJlVHlwZSA9IHR5cGVzLmJhc2ljW3R5cGVdO1xyXG4gICAgICAgICAgICByZWYgICAgICA9IFwibVwiICsgdXRpbC5zYWZlUHJvcChmaWVsZC5uYW1lKTtcclxuXHJcbiAgICAgICAgLy8gTWFwIGZpZWxkc1xyXG4gICAgICAgIGlmIChmaWVsZC5tYXApIHtcclxuICAgICAgICAgICAgZ2VuXHJcbiAgICAoXCJpZiglcyE9bnVsbCYmbS5oYXNPd25Qcm9wZXJ0eSglaikpe1wiLCByZWYsIGZpZWxkLm5hbWUpIC8vICE9PSB1bmRlZmluZWQgJiYgIT09IG51bGxcclxuICAgICAgICAoXCJmb3IodmFyIGtzPU9iamVjdC5rZXlzKCVzKSxpPTA7aTxrcy5sZW5ndGg7KytpKXtcIiwgcmVmKVxyXG4gICAgICAgICAgICAoXCJ3LnVpbnQzMiglaSkuZm9yaygpLnVpbnQzMiglaSkuJXMoa3NbaV0pXCIsIChmaWVsZC5pZCA8PCAzIHwgMikgPj4+IDAsIDggfCB0eXBlcy5tYXBLZXlbZmllbGQua2V5VHlwZV0sIGZpZWxkLmtleVR5cGUpO1xyXG4gICAgICAgICAgICBpZiAod2lyZVR5cGUgPT09IHVuZGVmaW5lZCkgZ2VuXHJcbiAgICAgICAgICAgIChcInR5cGVzWyVpXS5lbmNvZGUoJXNba3NbaV1dLHcudWludDMyKDE4KS5mb3JrKCkpLmxkZWxpbSgpLmxkZWxpbSgpXCIsIGluZGV4LCByZWYpOyAvLyBjYW4ndCBiZSBncm91cHNcclxuICAgICAgICAgICAgZWxzZSBnZW5cclxuICAgICAgICAgICAgKFwiLnVpbnQzMiglaSkuJXMoJXNba3NbaV1dKS5sZGVsaW0oKVwiLCAxNiB8IHdpcmVUeXBlLCB0eXBlLCByZWYpO1xyXG4gICAgICAgICAgICBnZW5cclxuICAgICAgICAoXCJ9XCIpXHJcbiAgICAoXCJ9XCIpO1xyXG5cclxuICAgICAgICAgICAgLy8gUmVwZWF0ZWQgZmllbGRzXHJcbiAgICAgICAgfSBlbHNlIGlmIChmaWVsZC5yZXBlYXRlZCkgeyBnZW5cclxuICAgIChcImlmKCVzIT1udWxsJiYlcy5sZW5ndGgpe1wiLCByZWYsIHJlZik7IC8vICE9PSB1bmRlZmluZWQgJiYgIT09IG51bGxcclxuXHJcbiAgICAgICAgICAgIC8vIFBhY2tlZCByZXBlYXRlZFxyXG4gICAgICAgICAgICBpZiAoZmllbGQucGFja2VkICYmIHR5cGVzLnBhY2tlZFt0eXBlXSAhPT0gdW5kZWZpbmVkKSB7IGdlblxyXG5cclxuICAgICAgICAoXCJ3LnVpbnQzMiglaSkuZm9yaygpXCIsIChmaWVsZC5pZCA8PCAzIHwgMikgPj4+IDApXHJcbiAgICAgICAgKFwiZm9yKHZhciBpPTA7aTwlcy5sZW5ndGg7KytpKVwiLCByZWYpXHJcbiAgICAgICAgICAgIChcIncuJXMoJXNbaV0pXCIsIHR5cGUsIHJlZilcclxuICAgICAgICAoXCJ3LmxkZWxpbSgpXCIpO1xyXG5cclxuICAgICAgICAgICAgLy8gTm9uLXBhY2tlZFxyXG4gICAgICAgICAgICB9IGVsc2UgeyBnZW5cclxuXHJcbiAgICAgICAgKFwiZm9yKHZhciBpPTA7aTwlcy5sZW5ndGg7KytpKVwiLCByZWYpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHdpcmVUeXBlID09PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgIGdlblR5cGVQYXJ0aWFsKGdlbiwgZmllbGQsIGluZGV4LCByZWYgKyBcIltpXVwiKTtcclxuICAgICAgICAgICAgICAgIGVsc2UgZ2VuXHJcbiAgICAgICAgICAgIChcIncudWludDMyKCVpKS4lcyglc1tpXSlcIiwgKGZpZWxkLmlkIDw8IDMgfCB3aXJlVHlwZSkgPj4+IDAsIHR5cGUsIHJlZik7XHJcblxyXG4gICAgICAgICAgICB9IGdlblxyXG4gICAgKFwifVwiKTtcclxuXHJcbiAgICAgICAgLy8gTm9uLXJlcGVhdGVkXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaWYgKGZpZWxkLm9wdGlvbmFsKSBnZW5cclxuICAgIChcImlmKCVzIT1udWxsJiZtLmhhc093blByb3BlcnR5KCVqKSlcIiwgcmVmLCBmaWVsZC5uYW1lKTsgLy8gIT09IHVuZGVmaW5lZCAmJiAhPT0gbnVsbFxyXG5cclxuICAgICAgICAgICAgaWYgKHdpcmVUeXBlID09PSB1bmRlZmluZWQpXHJcbiAgICAgICAgZ2VuVHlwZVBhcnRpYWwoZ2VuLCBmaWVsZCwgaW5kZXgsIHJlZik7XHJcbiAgICAgICAgICAgIGVsc2UgZ2VuXHJcbiAgICAgICAgKFwidy51aW50MzIoJWkpLiVzKCVzKVwiLCAoZmllbGQuaWQgPDwgMyB8IHdpcmVUeXBlKSA+Pj4gMCwgdHlwZSwgcmVmKTtcclxuXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBnZW5cclxuICAgIChcInJldHVybiB3XCIpO1xyXG4gICAgLyogZXNsaW50LWVuYWJsZSBuby11bmV4cGVjdGVkLW11bHRpbGluZSwgYmxvY2stc2NvcGVkLXZhciwgbm8tcmVkZWNsYXJlICovXHJcbn0iLCJcInVzZSBzdHJpY3RcIjtcclxubW9kdWxlLmV4cG9ydHMgPSBFbnVtO1xyXG5cclxuLy8gZXh0ZW5kcyBSZWZsZWN0aW9uT2JqZWN0XHJcbnZhciBSZWZsZWN0aW9uT2JqZWN0ID0gcmVxdWlyZShcIi4vb2JqZWN0XCIpO1xyXG4oKEVudW0ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShSZWZsZWN0aW9uT2JqZWN0LnByb3RvdHlwZSkpLmNvbnN0cnVjdG9yID0gRW51bSkuY2xhc3NOYW1lID0gXCJFbnVtXCI7XHJcblxyXG52YXIgTmFtZXNwYWNlID0gcmVxdWlyZShcIi4vbmFtZXNwYWNlXCIpLFxyXG4gICAgdXRpbCA9IHJlcXVpcmUoXCIuL3V0aWxcIik7XHJcblxyXG4vKipcclxuICogQ29uc3RydWN0cyBhIG5ldyBlbnVtIGluc3RhbmNlLlxyXG4gKiBAY2xhc3NkZXNjIFJlZmxlY3RlZCBlbnVtLlxyXG4gKiBAZXh0ZW5kcyBSZWZsZWN0aW9uT2JqZWN0XHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBVbmlxdWUgbmFtZSB3aXRoaW4gaXRzIG5hbWVzcGFjZVxyXG4gKiBAcGFyYW0ge09iamVjdC48c3RyaW5nLG51bWJlcj59IFt2YWx1ZXNdIEVudW0gdmFsdWVzIGFzIGFuIG9iamVjdCwgYnkgbmFtZVxyXG4gKiBAcGFyYW0ge09iamVjdC48c3RyaW5nLCo+fSBbb3B0aW9uc10gRGVjbGFyZWQgb3B0aW9uc1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gW2NvbW1lbnRdIFRoZSBjb21tZW50IGZvciB0aGlzIGVudW1cclxuICogQHBhcmFtIHtPYmplY3QuPHN0cmluZyxzdHJpbmc+fSBbY29tbWVudHNdIFRoZSB2YWx1ZSBjb21tZW50cyBmb3IgdGhpcyBlbnVtXHJcbiAqL1xyXG5mdW5jdGlvbiBFbnVtKG5hbWUsIHZhbHVlcywgb3B0aW9ucywgY29tbWVudCwgY29tbWVudHMpIHtcclxuICAgIFJlZmxlY3Rpb25PYmplY3QuY2FsbCh0aGlzLCBuYW1lLCBvcHRpb25zKTtcclxuXHJcbiAgICBpZiAodmFsdWVzICYmIHR5cGVvZiB2YWx1ZXMgIT09IFwib2JqZWN0XCIpXHJcbiAgICAgICAgdGhyb3cgVHlwZUVycm9yKFwidmFsdWVzIG11c3QgYmUgYW4gb2JqZWN0XCIpO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRW51bSB2YWx1ZXMgYnkgaWQuXHJcbiAgICAgKiBAdHlwZSB7T2JqZWN0LjxudW1iZXIsc3RyaW5nPn1cclxuICAgICAqL1xyXG4gICAgdGhpcy52YWx1ZXNCeUlkID0ge307XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBFbnVtIHZhbHVlcyBieSBuYW1lLlxyXG4gICAgICogQHR5cGUge09iamVjdC48c3RyaW5nLG51bWJlcj59XHJcbiAgICAgKi9cclxuICAgIHRoaXMudmFsdWVzID0gT2JqZWN0LmNyZWF0ZSh0aGlzLnZhbHVlc0J5SWQpOyAvLyB0b0pTT04sIG1hcmtlclxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRW51bSBjb21tZW50IHRleHQuXHJcbiAgICAgKiBAdHlwZSB7c3RyaW5nfG51bGx9XHJcbiAgICAgKi9cclxuICAgIHRoaXMuY29tbWVudCA9IGNvbW1lbnQ7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBWYWx1ZSBjb21tZW50IHRleHRzLCBpZiBhbnkuXHJcbiAgICAgKiBAdHlwZSB7T2JqZWN0LjxzdHJpbmcsc3RyaW5nPn1cclxuICAgICAqL1xyXG4gICAgdGhpcy5jb21tZW50cyA9IGNvbW1lbnRzIHx8IHt9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVzZXJ2ZWQgcmFuZ2VzLCBpZiBhbnkuXHJcbiAgICAgKiBAdHlwZSB7QXJyYXkuPG51bWJlcltdfHN0cmluZz59XHJcbiAgICAgKi9cclxuICAgIHRoaXMucmVzZXJ2ZWQgPSB1bmRlZmluZWQ7IC8vIHRvSlNPTlxyXG5cclxuICAgIC8vIE5vdGUgdGhhdCB2YWx1ZXMgaW5oZXJpdCB2YWx1ZXNCeUlkIG9uIHRoZWlyIHByb3RvdHlwZSB3aGljaCBtYWtlcyB0aGVtIGEgVHlwZVNjcmlwdC1cclxuICAgIC8vIGNvbXBhdGlibGUgZW51bS4gVGhpcyBpcyB1c2VkIGJ5IHBidHMgdG8gd3JpdGUgYWN0dWFsIGVudW0gZGVmaW5pdGlvbnMgdGhhdCB3b3JrIGZvclxyXG4gICAgLy8gc3RhdGljIGFuZCByZWZsZWN0aW9uIGNvZGUgYWxpa2UgaW5zdGVhZCBvZiBlbWl0dGluZyBnZW5lcmljIG9iamVjdCBkZWZpbml0aW9ucy5cclxuXHJcbiAgICBpZiAodmFsdWVzKVxyXG4gICAgICAgIGZvciAodmFyIGtleXMgPSBPYmplY3Qua2V5cyh2YWx1ZXMpLCBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyArK2kpXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWVzW2tleXNbaV1dID09PSBcIm51bWJlclwiKSAvLyB1c2UgZm9yd2FyZCBlbnRyaWVzIG9ubHlcclxuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzQnlJZFsgdGhpcy52YWx1ZXNba2V5c1tpXV0gPSB2YWx1ZXNba2V5c1tpXV0gXSA9IGtleXNbaV07XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBFbnVtIGRlc2NyaXB0b3IuXHJcbiAqIEBpbnRlcmZhY2UgSUVudW1cclxuICogQHByb3BlcnR5IHtPYmplY3QuPHN0cmluZyxudW1iZXI+fSB2YWx1ZXMgRW51bSB2YWx1ZXNcclxuICogQHByb3BlcnR5IHtPYmplY3QuPHN0cmluZywqPn0gW29wdGlvbnNdIEVudW0gb3B0aW9uc1xyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBDb25zdHJ1Y3RzIGFuIGVudW0gZnJvbSBhbiBlbnVtIGRlc2NyaXB0b3IuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIEVudW0gbmFtZVxyXG4gKiBAcGFyYW0ge0lFbnVtfSBqc29uIEVudW0gZGVzY3JpcHRvclxyXG4gKiBAcmV0dXJucyB7RW51bX0gQ3JlYXRlZCBlbnVtXHJcbiAqIEB0aHJvd3Mge1R5cGVFcnJvcn0gSWYgYXJndW1lbnRzIGFyZSBpbnZhbGlkXHJcbiAqL1xyXG5FbnVtLmZyb21KU09OID0gZnVuY3Rpb24gZnJvbUpTT04obmFtZSwganNvbikge1xyXG4gICAgdmFyIGVubSA9IG5ldyBFbnVtKG5hbWUsIGpzb24udmFsdWVzLCBqc29uLm9wdGlvbnMsIGpzb24uY29tbWVudCwganNvbi5jb21tZW50cyk7XHJcbiAgICBlbm0ucmVzZXJ2ZWQgPSBqc29uLnJlc2VydmVkO1xyXG4gICAgcmV0dXJuIGVubTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDb252ZXJ0cyB0aGlzIGVudW0gdG8gYW4gZW51bSBkZXNjcmlwdG9yLlxyXG4gKiBAcGFyYW0ge0lUb0pTT05PcHRpb25zfSBbdG9KU09OT3B0aW9uc10gSlNPTiBjb252ZXJzaW9uIG9wdGlvbnNcclxuICogQHJldHVybnMge0lFbnVtfSBFbnVtIGRlc2NyaXB0b3JcclxuICovXHJcbkVudW0ucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uIHRvSlNPTih0b0pTT05PcHRpb25zKSB7XHJcbiAgICB2YXIga2VlcENvbW1lbnRzID0gdG9KU09OT3B0aW9ucyA/IEJvb2xlYW4odG9KU09OT3B0aW9ucy5rZWVwQ29tbWVudHMpIDogZmFsc2U7XHJcbiAgICByZXR1cm4gdXRpbC50b09iamVjdChbXHJcbiAgICAgICAgXCJvcHRpb25zXCIgICwgdGhpcy5vcHRpb25zLFxyXG4gICAgICAgIFwidmFsdWVzXCIgICAsIHRoaXMudmFsdWVzLFxyXG4gICAgICAgIFwicmVzZXJ2ZWRcIiAsIHRoaXMucmVzZXJ2ZWQgJiYgdGhpcy5yZXNlcnZlZC5sZW5ndGggPyB0aGlzLnJlc2VydmVkIDogdW5kZWZpbmVkLFxyXG4gICAgICAgIFwiY29tbWVudFwiICAsIGtlZXBDb21tZW50cyA/IHRoaXMuY29tbWVudCA6IHVuZGVmaW5lZCxcclxuICAgICAgICBcImNvbW1lbnRzXCIgLCBrZWVwQ29tbWVudHMgPyB0aGlzLmNvbW1lbnRzIDogdW5kZWZpbmVkXHJcbiAgICBdKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBBZGRzIGEgdmFsdWUgdG8gdGhpcyBlbnVtLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBWYWx1ZSBuYW1lXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBpZCBWYWx1ZSBpZFxyXG4gKiBAcGFyYW0ge3N0cmluZ30gW2NvbW1lbnRdIENvbW1lbnQsIGlmIGFueVxyXG4gKiBAcmV0dXJucyB7RW51bX0gYHRoaXNgXHJcbiAqIEB0aHJvd3Mge1R5cGVFcnJvcn0gSWYgYXJndW1lbnRzIGFyZSBpbnZhbGlkXHJcbiAqIEB0aHJvd3Mge0Vycm9yfSBJZiB0aGVyZSBpcyBhbHJlYWR5IGEgdmFsdWUgd2l0aCB0aGlzIG5hbWUgb3IgaWRcclxuICovXHJcbkVudW0ucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uIGFkZChuYW1lLCBpZCwgY29tbWVudCkge1xyXG4gICAgLy8gdXRpbGl6ZWQgYnkgdGhlIHBhcnNlciBidXQgbm90IGJ5IC5mcm9tSlNPTlxyXG5cclxuICAgIGlmICghdXRpbC5pc1N0cmluZyhuYW1lKSlcclxuICAgICAgICB0aHJvdyBUeXBlRXJyb3IoXCJuYW1lIG11c3QgYmUgYSBzdHJpbmdcIik7XHJcblxyXG4gICAgaWYgKCF1dGlsLmlzSW50ZWdlcihpZCkpXHJcbiAgICAgICAgdGhyb3cgVHlwZUVycm9yKFwiaWQgbXVzdCBiZSBhbiBpbnRlZ2VyXCIpO1xyXG5cclxuICAgIGlmICh0aGlzLnZhbHVlc1tuYW1lXSAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgIHRocm93IEVycm9yKFwiZHVwbGljYXRlIG5hbWUgJ1wiICsgbmFtZSArIFwiJyBpbiBcIiArIHRoaXMpO1xyXG5cclxuICAgIGlmICh0aGlzLmlzUmVzZXJ2ZWRJZChpZCkpXHJcbiAgICAgICAgdGhyb3cgRXJyb3IoXCJpZCBcIiArIGlkICsgXCIgaXMgcmVzZXJ2ZWQgaW4gXCIgKyB0aGlzKTtcclxuXHJcbiAgICBpZiAodGhpcy5pc1Jlc2VydmVkTmFtZShuYW1lKSlcclxuICAgICAgICB0aHJvdyBFcnJvcihcIm5hbWUgJ1wiICsgbmFtZSArIFwiJyBpcyByZXNlcnZlZCBpbiBcIiArIHRoaXMpO1xyXG5cclxuICAgIGlmICh0aGlzLnZhbHVlc0J5SWRbaWRdICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBpZiAoISh0aGlzLm9wdGlvbnMgJiYgdGhpcy5vcHRpb25zLmFsbG93X2FsaWFzKSlcclxuICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJkdXBsaWNhdGUgaWQgXCIgKyBpZCArIFwiIGluIFwiICsgdGhpcyk7XHJcbiAgICAgICAgdGhpcy52YWx1ZXNbbmFtZV0gPSBpZDtcclxuICAgIH0gZWxzZVxyXG4gICAgICAgIHRoaXMudmFsdWVzQnlJZFt0aGlzLnZhbHVlc1tuYW1lXSA9IGlkXSA9IG5hbWU7XHJcblxyXG4gICAgdGhpcy5jb21tZW50c1tuYW1lXSA9IGNvbW1lbnQgfHwgbnVsbDtcclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlbW92ZXMgYSB2YWx1ZSBmcm9tIHRoaXMgZW51bVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBWYWx1ZSBuYW1lXHJcbiAqIEByZXR1cm5zIHtFbnVtfSBgdGhpc2BcclxuICogQHRocm93cyB7VHlwZUVycm9yfSBJZiBhcmd1bWVudHMgYXJlIGludmFsaWRcclxuICogQHRocm93cyB7RXJyb3J9IElmIGBuYW1lYCBpcyBub3QgYSBuYW1lIG9mIHRoaXMgZW51bVxyXG4gKi9cclxuRW51bS5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24gcmVtb3ZlKG5hbWUpIHtcclxuXHJcbiAgICBpZiAoIXV0aWwuaXNTdHJpbmcobmFtZSkpXHJcbiAgICAgICAgdGhyb3cgVHlwZUVycm9yKFwibmFtZSBtdXN0IGJlIGEgc3RyaW5nXCIpO1xyXG5cclxuICAgIHZhciB2YWwgPSB0aGlzLnZhbHVlc1tuYW1lXTtcclxuICAgIGlmICh2YWwgPT0gbnVsbClcclxuICAgICAgICB0aHJvdyBFcnJvcihcIm5hbWUgJ1wiICsgbmFtZSArIFwiJyBkb2VzIG5vdCBleGlzdCBpbiBcIiArIHRoaXMpO1xyXG5cclxuICAgIGRlbGV0ZSB0aGlzLnZhbHVlc0J5SWRbdmFsXTtcclxuICAgIGRlbGV0ZSB0aGlzLnZhbHVlc1tuYW1lXTtcclxuICAgIGRlbGV0ZSB0aGlzLmNvbW1lbnRzW25hbWVdO1xyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFRlc3RzIGlmIHRoZSBzcGVjaWZpZWQgaWQgaXMgcmVzZXJ2ZWQuXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBpZCBJZCB0byB0ZXN0XHJcbiAqIEByZXR1cm5zIHtib29sZWFufSBgdHJ1ZWAgaWYgcmVzZXJ2ZWQsIG90aGVyd2lzZSBgZmFsc2VgXHJcbiAqL1xyXG5FbnVtLnByb3RvdHlwZS5pc1Jlc2VydmVkSWQgPSBmdW5jdGlvbiBpc1Jlc2VydmVkSWQoaWQpIHtcclxuICAgIHJldHVybiBOYW1lc3BhY2UuaXNSZXNlcnZlZElkKHRoaXMucmVzZXJ2ZWQsIGlkKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBUZXN0cyBpZiB0aGUgc3BlY2lmaWVkIG5hbWUgaXMgcmVzZXJ2ZWQuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIE5hbWUgdG8gdGVzdFxyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gYHRydWVgIGlmIHJlc2VydmVkLCBvdGhlcndpc2UgYGZhbHNlYFxyXG4gKi9cclxuRW51bS5wcm90b3R5cGUuaXNSZXNlcnZlZE5hbWUgPSBmdW5jdGlvbiBpc1Jlc2VydmVkTmFtZShuYW1lKSB7XHJcbiAgICByZXR1cm4gTmFtZXNwYWNlLmlzUmVzZXJ2ZWROYW1lKHRoaXMucmVzZXJ2ZWQsIG5hbWUpO1xyXG59O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxubW9kdWxlLmV4cG9ydHMgPSBGaWVsZDtcclxuXHJcbi8vIGV4dGVuZHMgUmVmbGVjdGlvbk9iamVjdFxyXG52YXIgUmVmbGVjdGlvbk9iamVjdCA9IHJlcXVpcmUoXCIuL29iamVjdFwiKTtcclxuKChGaWVsZC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFJlZmxlY3Rpb25PYmplY3QucHJvdG90eXBlKSkuY29uc3RydWN0b3IgPSBGaWVsZCkuY2xhc3NOYW1lID0gXCJGaWVsZFwiO1xyXG5cclxudmFyIEVudW0gID0gcmVxdWlyZShcIi4vZW51bVwiKSxcclxuICAgIHR5cGVzID0gcmVxdWlyZShcIi4vdHlwZXNcIiksXHJcbiAgICB1dGlsICA9IHJlcXVpcmUoXCIuL3V0aWxcIik7XHJcblxyXG52YXIgVHlwZTsgLy8gY3ljbGljXHJcblxyXG52YXIgcnVsZVJlID0gL15yZXF1aXJlZHxvcHRpb25hbHxyZXBlYXRlZCQvO1xyXG5cclxuLyoqXHJcbiAqIENvbnN0cnVjdHMgYSBuZXcgbWVzc2FnZSBmaWVsZCBpbnN0YW5jZS4gTm90ZSB0aGF0IHtAbGluayBNYXBGaWVsZHxtYXAgZmllbGRzfSBoYXZlIHRoZWlyIG93biBjbGFzcy5cclxuICogQG5hbWUgRmllbGRcclxuICogQGNsYXNzZGVzYyBSZWZsZWN0ZWQgbWVzc2FnZSBmaWVsZC5cclxuICogQGV4dGVuZHMgRmllbGRCYXNlXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBVbmlxdWUgbmFtZSB3aXRoaW4gaXRzIG5hbWVzcGFjZVxyXG4gKiBAcGFyYW0ge251bWJlcn0gaWQgVW5pcXVlIGlkIHdpdGhpbiBpdHMgbmFtZXNwYWNlXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIFZhbHVlIHR5cGVcclxuICogQHBhcmFtIHtzdHJpbmd8T2JqZWN0LjxzdHJpbmcsKj59IFtydWxlPVwib3B0aW9uYWxcIl0gRmllbGQgcnVsZVxyXG4gKiBAcGFyYW0ge3N0cmluZ3xPYmplY3QuPHN0cmluZywqPn0gW2V4dGVuZF0gRXh0ZW5kZWQgdHlwZSBpZiBkaWZmZXJlbnQgZnJvbSBwYXJlbnRcclxuICogQHBhcmFtIHtPYmplY3QuPHN0cmluZywqPn0gW29wdGlvbnNdIERlY2xhcmVkIG9wdGlvbnNcclxuICovXHJcblxyXG4vKipcclxuICogQ29uc3RydWN0cyBhIGZpZWxkIGZyb20gYSBmaWVsZCBkZXNjcmlwdG9yLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBGaWVsZCBuYW1lXHJcbiAqIEBwYXJhbSB7SUZpZWxkfSBqc29uIEZpZWxkIGRlc2NyaXB0b3JcclxuICogQHJldHVybnMge0ZpZWxkfSBDcmVhdGVkIGZpZWxkXHJcbiAqIEB0aHJvd3Mge1R5cGVFcnJvcn0gSWYgYXJndW1lbnRzIGFyZSBpbnZhbGlkXHJcbiAqL1xyXG5GaWVsZC5mcm9tSlNPTiA9IGZ1bmN0aW9uIGZyb21KU09OKG5hbWUsIGpzb24pIHtcclxuICAgIHJldHVybiBuZXcgRmllbGQobmFtZSwganNvbi5pZCwganNvbi50eXBlLCBqc29uLnJ1bGUsIGpzb24uZXh0ZW5kLCBqc29uLm9wdGlvbnMsIGpzb24uY29tbWVudCk7XHJcbn07XHJcblxyXG4vKipcclxuICogTm90IGFuIGFjdHVhbCBjb25zdHJ1Y3Rvci4gVXNlIHtAbGluayBGaWVsZH0gaW5zdGVhZC5cclxuICogQGNsYXNzZGVzYyBCYXNlIGNsYXNzIG9mIGFsbCByZWZsZWN0ZWQgbWVzc2FnZSBmaWVsZHMuIFRoaXMgaXMgbm90IGFuIGFjdHVhbCBjbGFzcyBidXQgaGVyZSBmb3IgdGhlIHNha2Ugb2YgaGF2aW5nIGNvbnNpc3RlbnQgdHlwZSBkZWZpbml0aW9ucy5cclxuICogQGV4cG9ydHMgRmllbGRCYXNlXHJcbiAqIEBleHRlbmRzIFJlZmxlY3Rpb25PYmplY3RcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFVuaXF1ZSBuYW1lIHdpdGhpbiBpdHMgbmFtZXNwYWNlXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBpZCBVbmlxdWUgaWQgd2l0aGluIGl0cyBuYW1lc3BhY2VcclxuICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgVmFsdWUgdHlwZVxyXG4gKiBAcGFyYW0ge3N0cmluZ3xPYmplY3QuPHN0cmluZywqPn0gW3J1bGU9XCJvcHRpb25hbFwiXSBGaWVsZCBydWxlXHJcbiAqIEBwYXJhbSB7c3RyaW5nfE9iamVjdC48c3RyaW5nLCo+fSBbZXh0ZW5kXSBFeHRlbmRlZCB0eXBlIGlmIGRpZmZlcmVudCBmcm9tIHBhcmVudFxyXG4gKiBAcGFyYW0ge09iamVjdC48c3RyaW5nLCo+fSBbb3B0aW9uc10gRGVjbGFyZWQgb3B0aW9uc1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gW2NvbW1lbnRdIENvbW1lbnQgYXNzb2NpYXRlZCB3aXRoIHRoaXMgZmllbGRcclxuICovXHJcbmZ1bmN0aW9uIEZpZWxkKG5hbWUsIGlkLCB0eXBlLCBydWxlLCBleHRlbmQsIG9wdGlvbnMsIGNvbW1lbnQpIHtcclxuXHJcbiAgICBpZiAodXRpbC5pc09iamVjdChydWxlKSkge1xyXG4gICAgICAgIGNvbW1lbnQgPSBleHRlbmQ7XHJcbiAgICAgICAgb3B0aW9ucyA9IHJ1bGU7XHJcbiAgICAgICAgcnVsZSA9IGV4dGVuZCA9IHVuZGVmaW5lZDtcclxuICAgIH0gZWxzZSBpZiAodXRpbC5pc09iamVjdChleHRlbmQpKSB7XHJcbiAgICAgICAgY29tbWVudCA9IG9wdGlvbnM7XHJcbiAgICAgICAgb3B0aW9ucyA9IGV4dGVuZDtcclxuICAgICAgICBleHRlbmQgPSB1bmRlZmluZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgUmVmbGVjdGlvbk9iamVjdC5jYWxsKHRoaXMsIG5hbWUsIG9wdGlvbnMpO1xyXG5cclxuICAgIGlmICghdXRpbC5pc0ludGVnZXIoaWQpIHx8IGlkIDwgMClcclxuICAgICAgICB0aHJvdyBUeXBlRXJyb3IoXCJpZCBtdXN0IGJlIGEgbm9uLW5lZ2F0aXZlIGludGVnZXJcIik7XHJcblxyXG4gICAgaWYgKCF1dGlsLmlzU3RyaW5nKHR5cGUpKVxyXG4gICAgICAgIHRocm93IFR5cGVFcnJvcihcInR5cGUgbXVzdCBiZSBhIHN0cmluZ1wiKTtcclxuXHJcbiAgICBpZiAocnVsZSAhPT0gdW5kZWZpbmVkICYmICFydWxlUmUudGVzdChydWxlID0gcnVsZS50b1N0cmluZygpLnRvTG93ZXJDYXNlKCkpKVxyXG4gICAgICAgIHRocm93IFR5cGVFcnJvcihcInJ1bGUgbXVzdCBiZSBhIHN0cmluZyBydWxlXCIpO1xyXG5cclxuICAgIGlmIChleHRlbmQgIT09IHVuZGVmaW5lZCAmJiAhdXRpbC5pc1N0cmluZyhleHRlbmQpKVxyXG4gICAgICAgIHRocm93IFR5cGVFcnJvcihcImV4dGVuZCBtdXN0IGJlIGEgc3RyaW5nXCIpO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmllbGQgcnVsZSwgaWYgYW55LlxyXG4gICAgICogQHR5cGUge3N0cmluZ3x1bmRlZmluZWR9XHJcbiAgICAgKi9cclxuICAgIHRoaXMucnVsZSA9IHJ1bGUgJiYgcnVsZSAhPT0gXCJvcHRpb25hbFwiID8gcnVsZSA6IHVuZGVmaW5lZDsgLy8gdG9KU09OXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaWVsZCB0eXBlLlxyXG4gICAgICogQHR5cGUge3N0cmluZ31cclxuICAgICAqL1xyXG4gICAgdGhpcy50eXBlID0gdHlwZTsgLy8gdG9KU09OXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBVbmlxdWUgZmllbGQgaWQuXHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICB0aGlzLmlkID0gaWQ7IC8vIHRvSlNPTiwgbWFya2VyXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBFeHRlbmRlZCB0eXBlIGlmIGRpZmZlcmVudCBmcm9tIHBhcmVudC5cclxuICAgICAqIEB0eXBlIHtzdHJpbmd8dW5kZWZpbmVkfVxyXG4gICAgICovXHJcbiAgICB0aGlzLmV4dGVuZCA9IGV4dGVuZCB8fCB1bmRlZmluZWQ7IC8vIHRvSlNPTlxyXG5cclxuICAgIC8qKlxyXG4gICAgICogV2hldGhlciB0aGlzIGZpZWxkIGlzIHJlcXVpcmVkLlxyXG4gICAgICogQHR5cGUge2Jvb2xlYW59XHJcbiAgICAgKi9cclxuICAgIHRoaXMucmVxdWlyZWQgPSBydWxlID09PSBcInJlcXVpcmVkXCI7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBXaGV0aGVyIHRoaXMgZmllbGQgaXMgb3B0aW9uYWwuXHJcbiAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cclxuICAgICAqL1xyXG4gICAgdGhpcy5vcHRpb25hbCA9ICF0aGlzLnJlcXVpcmVkO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogV2hldGhlciB0aGlzIGZpZWxkIGlzIHJlcGVhdGVkLlxyXG4gICAgICogQHR5cGUge2Jvb2xlYW59XHJcbiAgICAgKi9cclxuICAgIHRoaXMucmVwZWF0ZWQgPSBydWxlID09PSBcInJlcGVhdGVkXCI7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBXaGV0aGVyIHRoaXMgZmllbGQgaXMgYSBtYXAgb3Igbm90LlxyXG4gICAgICogQHR5cGUge2Jvb2xlYW59XHJcbiAgICAgKi9cclxuICAgIHRoaXMubWFwID0gZmFsc2U7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBNZXNzYWdlIHRoaXMgZmllbGQgYmVsb25ncyB0by5cclxuICAgICAqIEB0eXBlIHtUeXBlfG51bGx9XHJcbiAgICAgKi9cclxuICAgIHRoaXMubWVzc2FnZSA9IG51bGw7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBPbmVPZiB0aGlzIGZpZWxkIGJlbG9uZ3MgdG8sIGlmIGFueSxcclxuICAgICAqIEB0eXBlIHtPbmVPZnxudWxsfVxyXG4gICAgICovXHJcbiAgICB0aGlzLnBhcnRPZiA9IG51bGw7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgZmllbGQgdHlwZSdzIGRlZmF1bHQgdmFsdWUuXHJcbiAgICAgKiBAdHlwZSB7Kn1cclxuICAgICAqL1xyXG4gICAgdGhpcy50eXBlRGVmYXVsdCA9IG51bGw7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgZmllbGQncyBkZWZhdWx0IHZhbHVlIG9uIHByb3RvdHlwZXMuXHJcbiAgICAgKiBAdHlwZSB7Kn1cclxuICAgICAqL1xyXG4gICAgdGhpcy5kZWZhdWx0VmFsdWUgPSBudWxsO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogV2hldGhlciB0aGlzIGZpZWxkJ3MgdmFsdWUgc2hvdWxkIGJlIHRyZWF0ZWQgYXMgYSBsb25nLlxyXG4gICAgICogQHR5cGUge2Jvb2xlYW59XHJcbiAgICAgKi9cclxuICAgIHRoaXMubG9uZyA9IHV0aWwuTG9uZyA/IHR5cGVzLmxvbmdbdHlwZV0gIT09IHVuZGVmaW5lZCA6IC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovIGZhbHNlO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogV2hldGhlciB0aGlzIGZpZWxkJ3MgdmFsdWUgaXMgYSBidWZmZXIuXHJcbiAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cclxuICAgICAqL1xyXG4gICAgdGhpcy5ieXRlcyA9IHR5cGUgPT09IFwiYnl0ZXNcIjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlc29sdmVkIHR5cGUgaWYgbm90IGEgYmFzaWMgdHlwZS5cclxuICAgICAqIEB0eXBlIHtUeXBlfEVudW18bnVsbH1cclxuICAgICAqL1xyXG4gICAgdGhpcy5yZXNvbHZlZFR5cGUgPSBudWxsO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2lzdGVyLWZpZWxkIHdpdGhpbiB0aGUgZXh0ZW5kZWQgdHlwZSBpZiBhIGRlY2xhcmluZyBleHRlbnNpb24gZmllbGQuXHJcbiAgICAgKiBAdHlwZSB7RmllbGR8bnVsbH1cclxuICAgICAqL1xyXG4gICAgdGhpcy5leHRlbnNpb25GaWVsZCA9IG51bGw7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTaXN0ZXItZmllbGQgd2l0aGluIHRoZSBkZWNsYXJpbmcgbmFtZXNwYWNlIGlmIGFuIGV4dGVuZGVkIGZpZWxkLlxyXG4gICAgICogQHR5cGUge0ZpZWxkfG51bGx9XHJcbiAgICAgKi9cclxuICAgIHRoaXMuZGVjbGFyaW5nRmllbGQgPSBudWxsO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogSW50ZXJuYWxseSByZW1lbWJlcnMgd2hldGhlciB0aGlzIGZpZWxkIGlzIHBhY2tlZC5cclxuICAgICAqIEB0eXBlIHtib29sZWFufG51bGx9XHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICB0aGlzLl9wYWNrZWQgPSBudWxsO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ29tbWVudCBmb3IgdGhpcyBmaWVsZC5cclxuICAgICAqIEB0eXBlIHtzdHJpbmd8bnVsbH1cclxuICAgICAqL1xyXG4gICAgdGhpcy5jb21tZW50ID0gY29tbWVudDtcclxufVxyXG5cclxuLyoqXHJcbiAqIERldGVybWluZXMgd2hldGhlciB0aGlzIGZpZWxkIGlzIHBhY2tlZC4gT25seSByZWxldmFudCB3aGVuIHJlcGVhdGVkIGFuZCB3b3JraW5nIHdpdGggcHJvdG8yLlxyXG4gKiBAbmFtZSBGaWVsZCNwYWNrZWRcclxuICogQHR5cGUge2Jvb2xlYW59XHJcbiAqIEByZWFkb25seVxyXG4gKi9cclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KEZpZWxkLnByb3RvdHlwZSwgXCJwYWNrZWRcIiwge1xyXG4gICAgZ2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAvLyBkZWZhdWx0cyB0byBwYWNrZWQ9dHJ1ZSBpZiBub3QgZXhwbGljaXR5IHNldCB0byBmYWxzZVxyXG4gICAgICAgIGlmICh0aGlzLl9wYWNrZWQgPT09IG51bGwpXHJcbiAgICAgICAgICAgIHRoaXMuX3BhY2tlZCA9IHRoaXMuZ2V0T3B0aW9uKFwicGFja2VkXCIpICE9PSBmYWxzZTtcclxuICAgICAgICByZXR1cm4gdGhpcy5fcGFja2VkO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbi8qKlxyXG4gKiBAb3ZlcnJpZGVcclxuICovXHJcbkZpZWxkLnByb3RvdHlwZS5zZXRPcHRpb24gPSBmdW5jdGlvbiBzZXRPcHRpb24obmFtZSwgdmFsdWUsIGlmTm90U2V0KSB7XHJcbiAgICBpZiAobmFtZSA9PT0gXCJwYWNrZWRcIikgLy8gY2xlYXIgY2FjaGVkIGJlZm9yZSBzZXR0aW5nXHJcbiAgICAgICAgdGhpcy5fcGFja2VkID0gbnVsbDtcclxuICAgIHJldHVybiBSZWZsZWN0aW9uT2JqZWN0LnByb3RvdHlwZS5zZXRPcHRpb24uY2FsbCh0aGlzLCBuYW1lLCB2YWx1ZSwgaWZOb3RTZXQpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEZpZWxkIGRlc2NyaXB0b3IuXHJcbiAqIEBpbnRlcmZhY2UgSUZpZWxkXHJcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbcnVsZT1cIm9wdGlvbmFsXCJdIEZpZWxkIHJ1bGVcclxuICogQHByb3BlcnR5IHtzdHJpbmd9IHR5cGUgRmllbGQgdHlwZVxyXG4gKiBAcHJvcGVydHkge251bWJlcn0gaWQgRmllbGQgaWRcclxuICogQHByb3BlcnR5IHtPYmplY3QuPHN0cmluZywqPn0gW29wdGlvbnNdIEZpZWxkIG9wdGlvbnNcclxuICovXHJcblxyXG4vKipcclxuICogRXh0ZW5zaW9uIGZpZWxkIGRlc2NyaXB0b3IuXHJcbiAqIEBpbnRlcmZhY2UgSUV4dGVuc2lvbkZpZWxkXHJcbiAqIEBleHRlbmRzIElGaWVsZFxyXG4gKiBAcHJvcGVydHkge3N0cmluZ30gZXh0ZW5kIEV4dGVuZGVkIHR5cGVcclxuICovXHJcblxyXG4vKipcclxuICogQ29udmVydHMgdGhpcyBmaWVsZCB0byBhIGZpZWxkIGRlc2NyaXB0b3IuXHJcbiAqIEBwYXJhbSB7SVRvSlNPTk9wdGlvbnN9IFt0b0pTT05PcHRpb25zXSBKU09OIGNvbnZlcnNpb24gb3B0aW9uc1xyXG4gKiBAcmV0dXJucyB7SUZpZWxkfSBGaWVsZCBkZXNjcmlwdG9yXHJcbiAqL1xyXG5GaWVsZC5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24gdG9KU09OKHRvSlNPTk9wdGlvbnMpIHtcclxuICAgIHZhciBrZWVwQ29tbWVudHMgPSB0b0pTT05PcHRpb25zID8gQm9vbGVhbih0b0pTT05PcHRpb25zLmtlZXBDb21tZW50cykgOiBmYWxzZTtcclxuICAgIHJldHVybiB1dGlsLnRvT2JqZWN0KFtcclxuICAgICAgICBcInJ1bGVcIiAgICAsIHRoaXMucnVsZSAhPT0gXCJvcHRpb25hbFwiICYmIHRoaXMucnVsZSB8fCB1bmRlZmluZWQsXHJcbiAgICAgICAgXCJ0eXBlXCIgICAgLCB0aGlzLnR5cGUsXHJcbiAgICAgICAgXCJpZFwiICAgICAgLCB0aGlzLmlkLFxyXG4gICAgICAgIFwiZXh0ZW5kXCIgICwgdGhpcy5leHRlbmQsXHJcbiAgICAgICAgXCJvcHRpb25zXCIgLCB0aGlzLm9wdGlvbnMsXHJcbiAgICAgICAgXCJjb21tZW50XCIgLCBrZWVwQ29tbWVudHMgPyB0aGlzLmNvbW1lbnQgOiB1bmRlZmluZWRcclxuICAgIF0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlc29sdmVzIHRoaXMgZmllbGQncyB0eXBlIHJlZmVyZW5jZXMuXHJcbiAqIEByZXR1cm5zIHtGaWVsZH0gYHRoaXNgXHJcbiAqIEB0aHJvd3Mge0Vycm9yfSBJZiBhbnkgcmVmZXJlbmNlIGNhbm5vdCBiZSByZXNvbHZlZFxyXG4gKi9cclxuRmllbGQucHJvdG90eXBlLnJlc29sdmUgPSBmdW5jdGlvbiByZXNvbHZlKCkge1xyXG5cclxuICAgIGlmICh0aGlzLnJlc29sdmVkKVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIGlmICgodGhpcy50eXBlRGVmYXVsdCA9IHR5cGVzLmRlZmF1bHRzW3RoaXMudHlwZV0pID09PSB1bmRlZmluZWQpIHsgLy8gaWYgbm90IGEgYmFzaWMgdHlwZSwgcmVzb2x2ZSBpdFxyXG4gICAgICAgIHRoaXMucmVzb2x2ZWRUeXBlID0gKHRoaXMuZGVjbGFyaW5nRmllbGQgPyB0aGlzLmRlY2xhcmluZ0ZpZWxkLnBhcmVudCA6IHRoaXMucGFyZW50KS5sb29rdXBUeXBlT3JFbnVtKHRoaXMudHlwZSk7XHJcbiAgICAgICAgaWYgKHRoaXMucmVzb2x2ZWRUeXBlIGluc3RhbmNlb2YgVHlwZSlcclxuICAgICAgICAgICAgdGhpcy50eXBlRGVmYXVsdCA9IG51bGw7XHJcbiAgICAgICAgZWxzZSAvLyBpbnN0YW5jZW9mIEVudW1cclxuICAgICAgICAgICAgdGhpcy50eXBlRGVmYXVsdCA9IHRoaXMucmVzb2x2ZWRUeXBlLnZhbHVlc1tPYmplY3Qua2V5cyh0aGlzLnJlc29sdmVkVHlwZS52YWx1ZXMpWzBdXTsgLy8gZmlyc3QgZGVmaW5lZFxyXG4gICAgfVxyXG5cclxuICAgIC8vIHVzZSBleHBsaWNpdGx5IHNldCBkZWZhdWx0IHZhbHVlIGlmIHByZXNlbnRcclxuICAgIGlmICh0aGlzLm9wdGlvbnMgJiYgdGhpcy5vcHRpb25zW1wiZGVmYXVsdFwiXSAhPSBudWxsKSB7XHJcbiAgICAgICAgdGhpcy50eXBlRGVmYXVsdCA9IHRoaXMub3B0aW9uc1tcImRlZmF1bHRcIl07XHJcbiAgICAgICAgaWYgKHRoaXMucmVzb2x2ZWRUeXBlIGluc3RhbmNlb2YgRW51bSAmJiB0eXBlb2YgdGhpcy50eXBlRGVmYXVsdCA9PT0gXCJzdHJpbmdcIilcclxuICAgICAgICAgICAgdGhpcy50eXBlRGVmYXVsdCA9IHRoaXMucmVzb2x2ZWRUeXBlLnZhbHVlc1t0aGlzLnR5cGVEZWZhdWx0XTtcclxuICAgIH1cclxuXHJcbiAgICAvLyByZW1vdmUgdW5uZWNlc3Nhcnkgb3B0aW9uc1xyXG4gICAgaWYgKHRoaXMub3B0aW9ucykge1xyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMucGFja2VkID09PSB0cnVlIHx8IHRoaXMub3B0aW9ucy5wYWNrZWQgIT09IHVuZGVmaW5lZCAmJiB0aGlzLnJlc29sdmVkVHlwZSAmJiAhKHRoaXMucmVzb2x2ZWRUeXBlIGluc3RhbmNlb2YgRW51bSkpXHJcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLm9wdGlvbnMucGFja2VkO1xyXG4gICAgICAgIGlmICghT2JqZWN0LmtleXModGhpcy5vcHRpb25zKS5sZW5ndGgpXHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucyA9IHVuZGVmaW5lZDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBjb252ZXJ0IHRvIGludGVybmFsIGRhdGEgdHlwZSBpZiBuZWNlc3NzYXJ5XHJcbiAgICBpZiAodGhpcy5sb25nKSB7XHJcbiAgICAgICAgdGhpcy50eXBlRGVmYXVsdCA9IHV0aWwuTG9uZy5mcm9tTnVtYmVyKHRoaXMudHlwZURlZmF1bHQsIHRoaXMudHlwZS5jaGFyQXQoMCkgPT09IFwidVwiKTtcclxuXHJcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIGVsc2UgKi9cclxuICAgICAgICBpZiAoT2JqZWN0LmZyZWV6ZSlcclxuICAgICAgICAgICAgT2JqZWN0LmZyZWV6ZSh0aGlzLnR5cGVEZWZhdWx0KTsgLy8gbG9uZyBpbnN0YW5jZXMgYXJlIG1lYW50IHRvIGJlIGltbXV0YWJsZSBhbnl3YXkgKGkuZS4gdXNlIHNtYWxsIGludCBjYWNoZSB0aGF0IGV2ZW4gcmVxdWlyZXMgaXQpXHJcblxyXG4gICAgfSBlbHNlIGlmICh0aGlzLmJ5dGVzICYmIHR5cGVvZiB0aGlzLnR5cGVEZWZhdWx0ID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgICAgdmFyIGJ1ZjtcclxuICAgICAgICBpZiAodXRpbC5iYXNlNjQudGVzdCh0aGlzLnR5cGVEZWZhdWx0KSlcclxuICAgICAgICAgICAgdXRpbC5iYXNlNjQuZGVjb2RlKHRoaXMudHlwZURlZmF1bHQsIGJ1ZiA9IHV0aWwubmV3QnVmZmVyKHV0aWwuYmFzZTY0Lmxlbmd0aCh0aGlzLnR5cGVEZWZhdWx0KSksIDApO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgdXRpbC51dGY4LndyaXRlKHRoaXMudHlwZURlZmF1bHQsIGJ1ZiA9IHV0aWwubmV3QnVmZmVyKHV0aWwudXRmOC5sZW5ndGgodGhpcy50eXBlRGVmYXVsdCkpLCAwKTtcclxuICAgICAgICB0aGlzLnR5cGVEZWZhdWx0ID0gYnVmO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHRha2Ugc3BlY2lhbCBjYXJlIG9mIG1hcHMgYW5kIHJlcGVhdGVkIGZpZWxkc1xyXG4gICAgaWYgKHRoaXMubWFwKVxyXG4gICAgICAgIHRoaXMuZGVmYXVsdFZhbHVlID0gdXRpbC5lbXB0eU9iamVjdDtcclxuICAgIGVsc2UgaWYgKHRoaXMucmVwZWF0ZWQpXHJcbiAgICAgICAgdGhpcy5kZWZhdWx0VmFsdWUgPSB1dGlsLmVtcHR5QXJyYXk7XHJcbiAgICBlbHNlXHJcbiAgICAgICAgdGhpcy5kZWZhdWx0VmFsdWUgPSB0aGlzLnR5cGVEZWZhdWx0O1xyXG5cclxuICAgIC8vIGVuc3VyZSBwcm9wZXIgdmFsdWUgb24gcHJvdG90eXBlXHJcbiAgICBpZiAodGhpcy5wYXJlbnQgaW5zdGFuY2VvZiBUeXBlKVxyXG4gICAgICAgIHRoaXMucGFyZW50LmN0b3IucHJvdG90eXBlW3RoaXMubmFtZV0gPSB0aGlzLmRlZmF1bHRWYWx1ZTtcclxuXHJcbiAgICByZXR1cm4gUmVmbGVjdGlvbk9iamVjdC5wcm90b3R5cGUucmVzb2x2ZS5jYWxsKHRoaXMpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIERlY29yYXRvciBmdW5jdGlvbiBhcyByZXR1cm5lZCBieSB7QGxpbmsgRmllbGQuZH0gYW5kIHtAbGluayBNYXBGaWVsZC5kfSAoVHlwZVNjcmlwdCkuXHJcbiAqIEB0eXBlZGVmIEZpZWxkRGVjb3JhdG9yXHJcbiAqIEB0eXBlIHtmdW5jdGlvbn1cclxuICogQHBhcmFtIHtPYmplY3R9IHByb3RvdHlwZSBUYXJnZXQgcHJvdG90eXBlXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBmaWVsZE5hbWUgRmllbGQgbmFtZVxyXG4gKiBAcmV0dXJucyB7dW5kZWZpbmVkfVxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBGaWVsZCBkZWNvcmF0b3IgKFR5cGVTY3JpcHQpLlxyXG4gKiBAbmFtZSBGaWVsZC5kXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcGFyYW0ge251bWJlcn0gZmllbGRJZCBGaWVsZCBpZFxyXG4gKiBAcGFyYW0ge1wiZG91YmxlXCJ8XCJmbG9hdFwifFwiaW50MzJcInxcInVpbnQzMlwifFwic2ludDMyXCJ8XCJmaXhlZDMyXCJ8XCJzZml4ZWQzMlwifFwiaW50NjRcInxcInVpbnQ2NFwifFwic2ludDY0XCJ8XCJmaXhlZDY0XCJ8XCJzZml4ZWQ2NFwifFwic3RyaW5nXCJ8XCJib29sXCJ8XCJieXRlc1wifE9iamVjdH0gZmllbGRUeXBlIEZpZWxkIHR5cGVcclxuICogQHBhcmFtIHtcIm9wdGlvbmFsXCJ8XCJyZXF1aXJlZFwifFwicmVwZWF0ZWRcIn0gW2ZpZWxkUnVsZT1cIm9wdGlvbmFsXCJdIEZpZWxkIHJ1bGVcclxuICogQHBhcmFtIHtUfSBbZGVmYXVsdFZhbHVlXSBEZWZhdWx0IHZhbHVlXHJcbiAqIEByZXR1cm5zIHtGaWVsZERlY29yYXRvcn0gRGVjb3JhdG9yIGZ1bmN0aW9uXHJcbiAqIEB0ZW1wbGF0ZSBUIGV4dGVuZHMgbnVtYmVyIHwgbnVtYmVyW10gfCBMb25nIHwgTG9uZ1tdIHwgc3RyaW5nIHwgc3RyaW5nW10gfCBib29sZWFuIHwgYm9vbGVhbltdIHwgVWludDhBcnJheSB8IFVpbnQ4QXJyYXlbXSB8IEJ1ZmZlciB8IEJ1ZmZlcltdXHJcbiAqL1xyXG5GaWVsZC5kID0gZnVuY3Rpb24gZGVjb3JhdGVGaWVsZChmaWVsZElkLCBmaWVsZFR5cGUsIGZpZWxkUnVsZSwgZGVmYXVsdFZhbHVlKSB7XHJcblxyXG4gICAgLy8gc3VibWVzc2FnZTogZGVjb3JhdGUgdGhlIHN1Ym1lc3NhZ2UgYW5kIHVzZSBpdHMgbmFtZSBhcyB0aGUgdHlwZVxyXG4gICAgaWYgKHR5cGVvZiBmaWVsZFR5cGUgPT09IFwiZnVuY3Rpb25cIilcclxuICAgICAgICBmaWVsZFR5cGUgPSB1dGlsLmRlY29yYXRlVHlwZShmaWVsZFR5cGUpLm5hbWU7XHJcblxyXG4gICAgLy8gZW51bSByZWZlcmVuY2U6IGNyZWF0ZSBhIHJlZmxlY3RlZCBjb3B5IG9mIHRoZSBlbnVtIGFuZCBrZWVwIHJldXNlaW5nIGl0XHJcbiAgICBlbHNlIGlmIChmaWVsZFR5cGUgJiYgdHlwZW9mIGZpZWxkVHlwZSA9PT0gXCJvYmplY3RcIilcclxuICAgICAgICBmaWVsZFR5cGUgPSB1dGlsLmRlY29yYXRlRW51bShmaWVsZFR5cGUpLm5hbWU7XHJcblxyXG4gICAgcmV0dXJuIGZ1bmN0aW9uIGZpZWxkRGVjb3JhdG9yKHByb3RvdHlwZSwgZmllbGROYW1lKSB7XHJcbiAgICAgICAgdXRpbC5kZWNvcmF0ZVR5cGUocHJvdG90eXBlLmNvbnN0cnVjdG9yKVxyXG4gICAgICAgICAgICAuYWRkKG5ldyBGaWVsZChmaWVsZE5hbWUsIGZpZWxkSWQsIGZpZWxkVHlwZSwgZmllbGRSdWxlLCB7IFwiZGVmYXVsdFwiOiBkZWZhdWx0VmFsdWUgfSkpO1xyXG4gICAgfTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBGaWVsZCBkZWNvcmF0b3IgKFR5cGVTY3JpcHQpLlxyXG4gKiBAbmFtZSBGaWVsZC5kXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcGFyYW0ge251bWJlcn0gZmllbGRJZCBGaWVsZCBpZFxyXG4gKiBAcGFyYW0ge0NvbnN0cnVjdG9yPFQ+fHN0cmluZ30gZmllbGRUeXBlIEZpZWxkIHR5cGVcclxuICogQHBhcmFtIHtcIm9wdGlvbmFsXCJ8XCJyZXF1aXJlZFwifFwicmVwZWF0ZWRcIn0gW2ZpZWxkUnVsZT1cIm9wdGlvbmFsXCJdIEZpZWxkIHJ1bGVcclxuICogQHJldHVybnMge0ZpZWxkRGVjb3JhdG9yfSBEZWNvcmF0b3IgZnVuY3Rpb25cclxuICogQHRlbXBsYXRlIFQgZXh0ZW5kcyBNZXNzYWdlPFQ+XHJcbiAqIEB2YXJpYXRpb24gMlxyXG4gKi9cclxuLy8gbGlrZSBGaWVsZC5kIGJ1dCB3aXRob3V0IGEgZGVmYXVsdCB2YWx1ZVxyXG5cclxuLy8gU2V0cyB1cCBjeWNsaWMgZGVwZW5kZW5jaWVzIChjYWxsZWQgaW4gaW5kZXgtbGlnaHQpXHJcbkZpZWxkLl9jb25maWd1cmUgPSBmdW5jdGlvbiBjb25maWd1cmUoVHlwZV8pIHtcclxuICAgIFR5cGUgPSBUeXBlXztcclxufTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBwcm90b2J1ZiA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vaW5kZXgtbWluaW1hbFwiKTtcclxuXHJcbnByb3RvYnVmLmJ1aWxkID0gXCJsaWdodFwiO1xyXG5cclxuLyoqXHJcbiAqIEEgbm9kZS1zdHlsZSBjYWxsYmFjayBhcyB1c2VkIGJ5IHtAbGluayBsb2FkfSBhbmQge0BsaW5rIFJvb3QjbG9hZH0uXHJcbiAqIEB0eXBlZGVmIExvYWRDYWxsYmFja1xyXG4gKiBAdHlwZSB7ZnVuY3Rpb259XHJcbiAqIEBwYXJhbSB7RXJyb3J8bnVsbH0gZXJyb3IgRXJyb3IsIGlmIGFueSwgb3RoZXJ3aXNlIGBudWxsYFxyXG4gKiBAcGFyYW0ge1Jvb3R9IFtyb290XSBSb290LCBpZiB0aGVyZSBoYXNuJ3QgYmVlbiBhbiBlcnJvclxyXG4gKiBAcmV0dXJucyB7dW5kZWZpbmVkfVxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBMb2FkcyBvbmUgb3IgbXVsdGlwbGUgLnByb3RvIG9yIHByZXByb2Nlc3NlZCAuanNvbiBmaWxlcyBpbnRvIGEgY29tbW9uIHJvb3QgbmFtZXNwYWNlIGFuZCBjYWxscyB0aGUgY2FsbGJhY2suXHJcbiAqIEBwYXJhbSB7c3RyaW5nfHN0cmluZ1tdfSBmaWxlbmFtZSBPbmUgb3IgbXVsdGlwbGUgZmlsZXMgdG8gbG9hZFxyXG4gKiBAcGFyYW0ge1Jvb3R9IHJvb3QgUm9vdCBuYW1lc3BhY2UsIGRlZmF1bHRzIHRvIGNyZWF0ZSBhIG5ldyBvbmUgaWYgb21pdHRlZC5cclxuICogQHBhcmFtIHtMb2FkQ2FsbGJhY2t9IGNhbGxiYWNrIENhbGxiYWNrIGZ1bmN0aW9uXHJcbiAqIEByZXR1cm5zIHt1bmRlZmluZWR9XHJcbiAqIEBzZWUge0BsaW5rIFJvb3QjbG9hZH1cclxuICovXHJcbmZ1bmN0aW9uIGxvYWQoZmlsZW5hbWUsIHJvb3QsIGNhbGxiYWNrKSB7XHJcbiAgICBpZiAodHlwZW9mIHJvb3QgPT09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICAgIGNhbGxiYWNrID0gcm9vdDtcclxuICAgICAgICByb290ID0gbmV3IHByb3RvYnVmLlJvb3QoKTtcclxuICAgIH0gZWxzZSBpZiAoIXJvb3QpXHJcbiAgICAgICAgcm9vdCA9IG5ldyBwcm90b2J1Zi5Sb290KCk7XHJcbiAgICByZXR1cm4gcm9vdC5sb2FkKGZpbGVuYW1lLCBjYWxsYmFjayk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBMb2FkcyBvbmUgb3IgbXVsdGlwbGUgLnByb3RvIG9yIHByZXByb2Nlc3NlZCAuanNvbiBmaWxlcyBpbnRvIGEgY29tbW9uIHJvb3QgbmFtZXNwYWNlIGFuZCBjYWxscyB0aGUgY2FsbGJhY2suXHJcbiAqIEBuYW1lIGxvYWRcclxuICogQGZ1bmN0aW9uXHJcbiAqIEBwYXJhbSB7c3RyaW5nfHN0cmluZ1tdfSBmaWxlbmFtZSBPbmUgb3IgbXVsdGlwbGUgZmlsZXMgdG8gbG9hZFxyXG4gKiBAcGFyYW0ge0xvYWRDYWxsYmFja30gY2FsbGJhY2sgQ2FsbGJhY2sgZnVuY3Rpb25cclxuICogQHJldHVybnMge3VuZGVmaW5lZH1cclxuICogQHNlZSB7QGxpbmsgUm9vdCNsb2FkfVxyXG4gKiBAdmFyaWF0aW9uIDJcclxuICovXHJcbi8vIGZ1bmN0aW9uIGxvYWQoZmlsZW5hbWU6c3RyaW5nLCBjYWxsYmFjazpMb2FkQ2FsbGJhY2spOnVuZGVmaW5lZFxyXG5cclxuLyoqXHJcbiAqIExvYWRzIG9uZSBvciBtdWx0aXBsZSAucHJvdG8gb3IgcHJlcHJvY2Vzc2VkIC5qc29uIGZpbGVzIGludG8gYSBjb21tb24gcm9vdCBuYW1lc3BhY2UgYW5kIHJldHVybnMgYSBwcm9taXNlLlxyXG4gKiBAbmFtZSBsb2FkXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcGFyYW0ge3N0cmluZ3xzdHJpbmdbXX0gZmlsZW5hbWUgT25lIG9yIG11bHRpcGxlIGZpbGVzIHRvIGxvYWRcclxuICogQHBhcmFtIHtSb290fSBbcm9vdF0gUm9vdCBuYW1lc3BhY2UsIGRlZmF1bHRzIHRvIGNyZWF0ZSBhIG5ldyBvbmUgaWYgb21pdHRlZC5cclxuICogQHJldHVybnMge1Byb21pc2U8Um9vdD59IFByb21pc2VcclxuICogQHNlZSB7QGxpbmsgUm9vdCNsb2FkfVxyXG4gKiBAdmFyaWF0aW9uIDNcclxuICovXHJcbi8vIGZ1bmN0aW9uIGxvYWQoZmlsZW5hbWU6c3RyaW5nLCBbcm9vdDpSb290XSk6UHJvbWlzZTxSb290PlxyXG5cclxucHJvdG9idWYubG9hZCA9IGxvYWQ7XHJcblxyXG4vKipcclxuICogU3luY2hyb25vdXNseSBsb2FkcyBvbmUgb3IgbXVsdGlwbGUgLnByb3RvIG9yIHByZXByb2Nlc3NlZCAuanNvbiBmaWxlcyBpbnRvIGEgY29tbW9uIHJvb3QgbmFtZXNwYWNlIChub2RlIG9ubHkpLlxyXG4gKiBAcGFyYW0ge3N0cmluZ3xzdHJpbmdbXX0gZmlsZW5hbWUgT25lIG9yIG11bHRpcGxlIGZpbGVzIHRvIGxvYWRcclxuICogQHBhcmFtIHtSb290fSBbcm9vdF0gUm9vdCBuYW1lc3BhY2UsIGRlZmF1bHRzIHRvIGNyZWF0ZSBhIG5ldyBvbmUgaWYgb21pdHRlZC5cclxuICogQHJldHVybnMge1Jvb3R9IFJvb3QgbmFtZXNwYWNlXHJcbiAqIEB0aHJvd3Mge0Vycm9yfSBJZiBzeW5jaHJvbm91cyBmZXRjaGluZyBpcyBub3Qgc3VwcG9ydGVkIChpLmUuIGluIGJyb3dzZXJzKSBvciBpZiBhIGZpbGUncyBzeW50YXggaXMgaW52YWxpZFxyXG4gKiBAc2VlIHtAbGluayBSb290I2xvYWRTeW5jfVxyXG4gKi9cclxuZnVuY3Rpb24gbG9hZFN5bmMoZmlsZW5hbWUsIHJvb3QpIHtcclxuICAgIGlmICghcm9vdClcclxuICAgICAgICByb290ID0gbmV3IHByb3RvYnVmLlJvb3QoKTtcclxuICAgIHJldHVybiByb290LmxvYWRTeW5jKGZpbGVuYW1lKTtcclxufVxyXG5cclxucHJvdG9idWYubG9hZFN5bmMgPSBsb2FkU3luYztcclxuXHJcbi8vIFNlcmlhbGl6YXRpb25cclxucHJvdG9idWYuZW5jb2RlciAgICAgICAgICA9IHJlcXVpcmUoXCIuL2VuY29kZXJcIik7XHJcbnByb3RvYnVmLmRlY29kZXIgICAgICAgICAgPSByZXF1aXJlKFwiLi9kZWNvZGVyXCIpO1xyXG5wcm90b2J1Zi52ZXJpZmllciAgICAgICAgID0gcmVxdWlyZShcIi4vdmVyaWZpZXJcIik7XHJcbnByb3RvYnVmLmNvbnZlcnRlciAgICAgICAgPSByZXF1aXJlKFwiLi9jb252ZXJ0ZXJcIik7XHJcblxyXG4vLyBSZWZsZWN0aW9uXHJcbnByb3RvYnVmLlJlZmxlY3Rpb25PYmplY3QgPSByZXF1aXJlKFwiLi9vYmplY3RcIik7XHJcbnByb3RvYnVmLk5hbWVzcGFjZSAgICAgICAgPSByZXF1aXJlKFwiLi9uYW1lc3BhY2VcIik7XHJcbnByb3RvYnVmLlJvb3QgICAgICAgICAgICAgPSByZXF1aXJlKFwiLi9yb290XCIpO1xyXG5wcm90b2J1Zi5FbnVtICAgICAgICAgICAgID0gcmVxdWlyZShcIi4vZW51bVwiKTtcclxucHJvdG9idWYuVHlwZSAgICAgICAgICAgICA9IHJlcXVpcmUoXCIuL3R5cGVcIik7XHJcbnByb3RvYnVmLkZpZWxkICAgICAgICAgICAgPSByZXF1aXJlKFwiLi9maWVsZFwiKTtcclxucHJvdG9idWYuT25lT2YgICAgICAgICAgICA9IHJlcXVpcmUoXCIuL29uZW9mXCIpO1xyXG5wcm90b2J1Zi5NYXBGaWVsZCAgICAgICAgID0gcmVxdWlyZShcIi4vbWFwZmllbGRcIik7XHJcbnByb3RvYnVmLlNlcnZpY2UgICAgICAgICAgPSByZXF1aXJlKFwiLi9zZXJ2aWNlXCIpO1xyXG5wcm90b2J1Zi5NZXRob2QgICAgICAgICAgID0gcmVxdWlyZShcIi4vbWV0aG9kXCIpO1xyXG5cclxuLy8gUnVudGltZVxyXG5wcm90b2J1Zi5NZXNzYWdlICAgICAgICAgID0gcmVxdWlyZShcIi4vbWVzc2FnZVwiKTtcclxucHJvdG9idWYud3JhcHBlcnMgICAgICAgICA9IHJlcXVpcmUoXCIuL3dyYXBwZXJzXCIpO1xyXG5cclxuLy8gVXRpbGl0eVxyXG5wcm90b2J1Zi50eXBlcyAgICAgICAgICAgID0gcmVxdWlyZShcIi4vdHlwZXNcIik7XHJcbnByb3RvYnVmLnV0aWwgICAgICAgICAgICAgPSByZXF1aXJlKFwiLi91dGlsXCIpO1xyXG5cclxuLy8gU2V0IHVwIHBvc3NpYmx5IGN5Y2xpYyByZWZsZWN0aW9uIGRlcGVuZGVuY2llc1xyXG5wcm90b2J1Zi5SZWZsZWN0aW9uT2JqZWN0Ll9jb25maWd1cmUocHJvdG9idWYuUm9vdCk7XHJcbnByb3RvYnVmLk5hbWVzcGFjZS5fY29uZmlndXJlKHByb3RvYnVmLlR5cGUsIHByb3RvYnVmLlNlcnZpY2UsIHByb3RvYnVmLkVudW0pO1xyXG5wcm90b2J1Zi5Sb290Ll9jb25maWd1cmUocHJvdG9idWYuVHlwZSk7XHJcbnByb3RvYnVmLkZpZWxkLl9jb25maWd1cmUocHJvdG9idWYuVHlwZSk7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgcHJvdG9idWYgPSBleHBvcnRzO1xyXG5cclxuLyoqXHJcbiAqIEJ1aWxkIHR5cGUsIG9uZSBvZiBgXCJmdWxsXCJgLCBgXCJsaWdodFwiYCBvciBgXCJtaW5pbWFsXCJgLlxyXG4gKiBAbmFtZSBidWlsZFxyXG4gKiBAdHlwZSB7c3RyaW5nfVxyXG4gKiBAY29uc3RcclxuICovXHJcbnByb3RvYnVmLmJ1aWxkID0gXCJtaW5pbWFsXCI7XHJcblxyXG4vLyBTZXJpYWxpemF0aW9uXHJcbnByb3RvYnVmLldyaXRlciAgICAgICA9IHJlcXVpcmUoXCIuL3dyaXRlclwiKTtcclxucHJvdG9idWYuQnVmZmVyV3JpdGVyID0gcmVxdWlyZShcIi4vd3JpdGVyX2J1ZmZlclwiKTtcclxucHJvdG9idWYuUmVhZGVyICAgICAgID0gcmVxdWlyZShcIi4vcmVhZGVyXCIpO1xyXG5wcm90b2J1Zi5CdWZmZXJSZWFkZXIgPSByZXF1aXJlKFwiLi9yZWFkZXJfYnVmZmVyXCIpO1xyXG5cclxuLy8gVXRpbGl0eVxyXG5wcm90b2J1Zi51dGlsICAgICAgICAgPSByZXF1aXJlKFwiLi91dGlsL21pbmltYWxcIik7XHJcbnByb3RvYnVmLnJwYyAgICAgICAgICA9IHJlcXVpcmUoXCIuL3JwY1wiKTtcclxucHJvdG9idWYucm9vdHMgICAgICAgID0gcmVxdWlyZShcIi4vcm9vdHNcIik7XHJcbnByb3RvYnVmLmNvbmZpZ3VyZSAgICA9IGNvbmZpZ3VyZTtcclxuXHJcbi8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbi8qKlxyXG4gKiBSZWNvbmZpZ3VyZXMgdGhlIGxpYnJhcnkgYWNjb3JkaW5nIHRvIHRoZSBlbnZpcm9ubWVudC5cclxuICogQHJldHVybnMge3VuZGVmaW5lZH1cclxuICovXHJcbmZ1bmN0aW9uIGNvbmZpZ3VyZSgpIHtcclxuICAgIHByb3RvYnVmLlJlYWRlci5fY29uZmlndXJlKHByb3RvYnVmLkJ1ZmZlclJlYWRlcik7XHJcbiAgICBwcm90b2J1Zi51dGlsLl9jb25maWd1cmUoKTtcclxufVxyXG5cclxuLy8gU2V0IHVwIGJ1ZmZlciB1dGlsaXR5IGFjY29yZGluZyB0byB0aGUgZW52aXJvbm1lbnRcclxucHJvdG9idWYuV3JpdGVyLl9jb25maWd1cmUocHJvdG9idWYuQnVmZmVyV3JpdGVyKTtcclxuY29uZmlndXJlKCk7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5tb2R1bGUuZXhwb3J0cyA9IE1hcEZpZWxkO1xyXG5cclxuLy8gZXh0ZW5kcyBGaWVsZFxyXG52YXIgRmllbGQgPSByZXF1aXJlKFwiLi9maWVsZFwiKTtcclxuKChNYXBGaWVsZC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEZpZWxkLnByb3RvdHlwZSkpLmNvbnN0cnVjdG9yID0gTWFwRmllbGQpLmNsYXNzTmFtZSA9IFwiTWFwRmllbGRcIjtcclxuXHJcbnZhciB0eXBlcyAgID0gcmVxdWlyZShcIi4vdHlwZXNcIiksXHJcbiAgICB1dGlsICAgID0gcmVxdWlyZShcIi4vdXRpbFwiKTtcclxuXHJcbi8qKlxyXG4gKiBDb25zdHJ1Y3RzIGEgbmV3IG1hcCBmaWVsZCBpbnN0YW5jZS5cclxuICogQGNsYXNzZGVzYyBSZWZsZWN0ZWQgbWFwIGZpZWxkLlxyXG4gKiBAZXh0ZW5kcyBGaWVsZEJhc2VcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFVuaXF1ZSBuYW1lIHdpdGhpbiBpdHMgbmFtZXNwYWNlXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBpZCBVbmlxdWUgaWQgd2l0aGluIGl0cyBuYW1lc3BhY2VcclxuICogQHBhcmFtIHtzdHJpbmd9IGtleVR5cGUgS2V5IHR5cGVcclxuICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgVmFsdWUgdHlwZVxyXG4gKiBAcGFyYW0ge09iamVjdC48c3RyaW5nLCo+fSBbb3B0aW9uc10gRGVjbGFyZWQgb3B0aW9uc1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gW2NvbW1lbnRdIENvbW1lbnQgYXNzb2NpYXRlZCB3aXRoIHRoaXMgZmllbGRcclxuICovXHJcbmZ1bmN0aW9uIE1hcEZpZWxkKG5hbWUsIGlkLCBrZXlUeXBlLCB0eXBlLCBvcHRpb25zLCBjb21tZW50KSB7XHJcbiAgICBGaWVsZC5jYWxsKHRoaXMsIG5hbWUsIGlkLCB0eXBlLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgb3B0aW9ucywgY29tbWVudCk7XHJcblxyXG4gICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXHJcbiAgICBpZiAoIXV0aWwuaXNTdHJpbmcoa2V5VHlwZSkpXHJcbiAgICAgICAgdGhyb3cgVHlwZUVycm9yKFwia2V5VHlwZSBtdXN0IGJlIGEgc3RyaW5nXCIpO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogS2V5IHR5cGUuXHJcbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxyXG4gICAgICovXHJcbiAgICB0aGlzLmtleVR5cGUgPSBrZXlUeXBlOyAvLyB0b0pTT04sIG1hcmtlclxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVzb2x2ZWQga2V5IHR5cGUgaWYgbm90IGEgYmFzaWMgdHlwZS5cclxuICAgICAqIEB0eXBlIHtSZWZsZWN0aW9uT2JqZWN0fG51bGx9XHJcbiAgICAgKi9cclxuICAgIHRoaXMucmVzb2x2ZWRLZXlUeXBlID0gbnVsbDtcclxuXHJcbiAgICAvLyBPdmVycmlkZXMgRmllbGQjbWFwXHJcbiAgICB0aGlzLm1hcCA9IHRydWU7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBNYXAgZmllbGQgZGVzY3JpcHRvci5cclxuICogQGludGVyZmFjZSBJTWFwRmllbGRcclxuICogQGV4dGVuZHMge0lGaWVsZH1cclxuICogQHByb3BlcnR5IHtzdHJpbmd9IGtleVR5cGUgS2V5IHR5cGVcclxuICovXHJcblxyXG4vKipcclxuICogRXh0ZW5zaW9uIG1hcCBmaWVsZCBkZXNjcmlwdG9yLlxyXG4gKiBAaW50ZXJmYWNlIElFeHRlbnNpb25NYXBGaWVsZFxyXG4gKiBAZXh0ZW5kcyBJTWFwRmllbGRcclxuICogQHByb3BlcnR5IHtzdHJpbmd9IGV4dGVuZCBFeHRlbmRlZCB0eXBlXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIENvbnN0cnVjdHMgYSBtYXAgZmllbGQgZnJvbSBhIG1hcCBmaWVsZCBkZXNjcmlwdG9yLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBGaWVsZCBuYW1lXHJcbiAqIEBwYXJhbSB7SU1hcEZpZWxkfSBqc29uIE1hcCBmaWVsZCBkZXNjcmlwdG9yXHJcbiAqIEByZXR1cm5zIHtNYXBGaWVsZH0gQ3JlYXRlZCBtYXAgZmllbGRcclxuICogQHRocm93cyB7VHlwZUVycm9yfSBJZiBhcmd1bWVudHMgYXJlIGludmFsaWRcclxuICovXHJcbk1hcEZpZWxkLmZyb21KU09OID0gZnVuY3Rpb24gZnJvbUpTT04obmFtZSwganNvbikge1xyXG4gICAgcmV0dXJuIG5ldyBNYXBGaWVsZChuYW1lLCBqc29uLmlkLCBqc29uLmtleVR5cGUsIGpzb24udHlwZSwganNvbi5vcHRpb25zLCBqc29uLmNvbW1lbnQpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENvbnZlcnRzIHRoaXMgbWFwIGZpZWxkIHRvIGEgbWFwIGZpZWxkIGRlc2NyaXB0b3IuXHJcbiAqIEBwYXJhbSB7SVRvSlNPTk9wdGlvbnN9IFt0b0pTT05PcHRpb25zXSBKU09OIGNvbnZlcnNpb24gb3B0aW9uc1xyXG4gKiBAcmV0dXJucyB7SU1hcEZpZWxkfSBNYXAgZmllbGQgZGVzY3JpcHRvclxyXG4gKi9cclxuTWFwRmllbGQucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uIHRvSlNPTih0b0pTT05PcHRpb25zKSB7XHJcbiAgICB2YXIga2VlcENvbW1lbnRzID0gdG9KU09OT3B0aW9ucyA/IEJvb2xlYW4odG9KU09OT3B0aW9ucy5rZWVwQ29tbWVudHMpIDogZmFsc2U7XHJcbiAgICByZXR1cm4gdXRpbC50b09iamVjdChbXHJcbiAgICAgICAgXCJrZXlUeXBlXCIgLCB0aGlzLmtleVR5cGUsXHJcbiAgICAgICAgXCJ0eXBlXCIgICAgLCB0aGlzLnR5cGUsXHJcbiAgICAgICAgXCJpZFwiICAgICAgLCB0aGlzLmlkLFxyXG4gICAgICAgIFwiZXh0ZW5kXCIgICwgdGhpcy5leHRlbmQsXHJcbiAgICAgICAgXCJvcHRpb25zXCIgLCB0aGlzLm9wdGlvbnMsXHJcbiAgICAgICAgXCJjb21tZW50XCIgLCBrZWVwQ29tbWVudHMgPyB0aGlzLmNvbW1lbnQgOiB1bmRlZmluZWRcclxuICAgIF0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEBvdmVycmlkZVxyXG4gKi9cclxuTWFwRmllbGQucHJvdG90eXBlLnJlc29sdmUgPSBmdW5jdGlvbiByZXNvbHZlKCkge1xyXG4gICAgaWYgKHRoaXMucmVzb2x2ZWQpXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgLy8gQmVzaWRlcyBhIHZhbHVlIHR5cGUsIG1hcCBmaWVsZHMgaGF2ZSBhIGtleSB0eXBlIHRoYXQgbWF5IGJlIFwiYW55IHNjYWxhciB0eXBlIGV4Y2VwdCBmb3IgZmxvYXRpbmcgcG9pbnQgdHlwZXMgYW5kIGJ5dGVzXCJcclxuICAgIGlmICh0eXBlcy5tYXBLZXlbdGhpcy5rZXlUeXBlXSA9PT0gdW5kZWZpbmVkKVxyXG4gICAgICAgIHRocm93IEVycm9yKFwiaW52YWxpZCBrZXkgdHlwZTogXCIgKyB0aGlzLmtleVR5cGUpO1xyXG5cclxuICAgIHJldHVybiBGaWVsZC5wcm90b3R5cGUucmVzb2x2ZS5jYWxsKHRoaXMpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIE1hcCBmaWVsZCBkZWNvcmF0b3IgKFR5cGVTY3JpcHQpLlxyXG4gKiBAbmFtZSBNYXBGaWVsZC5kXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcGFyYW0ge251bWJlcn0gZmllbGRJZCBGaWVsZCBpZFxyXG4gKiBAcGFyYW0ge1wiaW50MzJcInxcInVpbnQzMlwifFwic2ludDMyXCJ8XCJmaXhlZDMyXCJ8XCJzZml4ZWQzMlwifFwiaW50NjRcInxcInVpbnQ2NFwifFwic2ludDY0XCJ8XCJmaXhlZDY0XCJ8XCJzZml4ZWQ2NFwifFwiYm9vbFwifFwic3RyaW5nXCJ9IGZpZWxkS2V5VHlwZSBGaWVsZCBrZXkgdHlwZVxyXG4gKiBAcGFyYW0ge1wiZG91YmxlXCJ8XCJmbG9hdFwifFwiaW50MzJcInxcInVpbnQzMlwifFwic2ludDMyXCJ8XCJmaXhlZDMyXCJ8XCJzZml4ZWQzMlwifFwiaW50NjRcInxcInVpbnQ2NFwifFwic2ludDY0XCJ8XCJmaXhlZDY0XCJ8XCJzZml4ZWQ2NFwifFwiYm9vbFwifFwic3RyaW5nXCJ8XCJieXRlc1wifE9iamVjdHxDb25zdHJ1Y3Rvcjx7fT59IGZpZWxkVmFsdWVUeXBlIEZpZWxkIHZhbHVlIHR5cGVcclxuICogQHJldHVybnMge0ZpZWxkRGVjb3JhdG9yfSBEZWNvcmF0b3IgZnVuY3Rpb25cclxuICogQHRlbXBsYXRlIFQgZXh0ZW5kcyB7IFtrZXk6IHN0cmluZ106IG51bWJlciB8IExvbmcgfCBzdHJpbmcgfCBib29sZWFuIHwgVWludDhBcnJheSB8IEJ1ZmZlciB8IG51bWJlcltdIHwgTWVzc2FnZTx7fT4gfVxyXG4gKi9cclxuTWFwRmllbGQuZCA9IGZ1bmN0aW9uIGRlY29yYXRlTWFwRmllbGQoZmllbGRJZCwgZmllbGRLZXlUeXBlLCBmaWVsZFZhbHVlVHlwZSkge1xyXG5cclxuICAgIC8vIHN1Ym1lc3NhZ2UgdmFsdWU6IGRlY29yYXRlIHRoZSBzdWJtZXNzYWdlIGFuZCB1c2UgaXRzIG5hbWUgYXMgdGhlIHR5cGVcclxuICAgIGlmICh0eXBlb2YgZmllbGRWYWx1ZVR5cGUgPT09IFwiZnVuY3Rpb25cIilcclxuICAgICAgICBmaWVsZFZhbHVlVHlwZSA9IHV0aWwuZGVjb3JhdGVUeXBlKGZpZWxkVmFsdWVUeXBlKS5uYW1lO1xyXG5cclxuICAgIC8vIGVudW0gcmVmZXJlbmNlIHZhbHVlOiBjcmVhdGUgYSByZWZsZWN0ZWQgY29weSBvZiB0aGUgZW51bSBhbmQga2VlcCByZXVzZWluZyBpdFxyXG4gICAgZWxzZSBpZiAoZmllbGRWYWx1ZVR5cGUgJiYgdHlwZW9mIGZpZWxkVmFsdWVUeXBlID09PSBcIm9iamVjdFwiKVxyXG4gICAgICAgIGZpZWxkVmFsdWVUeXBlID0gdXRpbC5kZWNvcmF0ZUVudW0oZmllbGRWYWx1ZVR5cGUpLm5hbWU7XHJcblxyXG4gICAgcmV0dXJuIGZ1bmN0aW9uIG1hcEZpZWxkRGVjb3JhdG9yKHByb3RvdHlwZSwgZmllbGROYW1lKSB7XHJcbiAgICAgICAgdXRpbC5kZWNvcmF0ZVR5cGUocHJvdG90eXBlLmNvbnN0cnVjdG9yKVxyXG4gICAgICAgICAgICAuYWRkKG5ldyBNYXBGaWVsZChmaWVsZE5hbWUsIGZpZWxkSWQsIGZpZWxkS2V5VHlwZSwgZmllbGRWYWx1ZVR5cGUpKTtcclxuICAgIH07XHJcbn07XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5tb2R1bGUuZXhwb3J0cyA9IE1lc3NhZ2U7XHJcblxyXG52YXIgdXRpbCA9IHJlcXVpcmUoXCIuL3V0aWwvbWluaW1hbFwiKTtcclxuXHJcbi8qKlxyXG4gKiBDb25zdHJ1Y3RzIGEgbmV3IG1lc3NhZ2UgaW5zdGFuY2UuXHJcbiAqIEBjbGFzc2Rlc2MgQWJzdHJhY3QgcnVudGltZSBtZXNzYWdlLlxyXG4gKiBAY29uc3RydWN0b3JcclxuICogQHBhcmFtIHtQcm9wZXJ0aWVzPFQ+fSBbcHJvcGVydGllc10gUHJvcGVydGllcyB0byBzZXRcclxuICogQHRlbXBsYXRlIFQgZXh0ZW5kcyBvYmplY3QgPSBvYmplY3RcclxuICovXHJcbmZ1bmN0aW9uIE1lc3NhZ2UocHJvcGVydGllcykge1xyXG4gICAgLy8gbm90IHVzZWQgaW50ZXJuYWxseVxyXG4gICAgaWYgKHByb3BlcnRpZXMpXHJcbiAgICAgICAgZm9yICh2YXIga2V5cyA9IE9iamVjdC5rZXlzKHByb3BlcnRpZXMpLCBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyArK2kpXHJcbiAgICAgICAgICAgIHRoaXNba2V5c1tpXV0gPSBwcm9wZXJ0aWVzW2tleXNbaV1dO1xyXG59XHJcblxyXG4vKipcclxuICogUmVmZXJlbmNlIHRvIHRoZSByZWZsZWN0ZWQgdHlwZS5cclxuICogQG5hbWUgTWVzc2FnZS4kdHlwZVxyXG4gKiBAdHlwZSB7VHlwZX1cclxuICogQHJlYWRvbmx5XHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIFJlZmVyZW5jZSB0byB0aGUgcmVmbGVjdGVkIHR5cGUuXHJcbiAqIEBuYW1lIE1lc3NhZ2UjJHR5cGVcclxuICogQHR5cGUge1R5cGV9XHJcbiAqIEByZWFkb25seVxyXG4gKi9cclxuXHJcbi8qZXNsaW50LWRpc2FibGUgdmFsaWQtanNkb2MqL1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBuZXcgbWVzc2FnZSBvZiB0aGlzIHR5cGUgdXNpbmcgdGhlIHNwZWNpZmllZCBwcm9wZXJ0aWVzLlxyXG4gKiBAcGFyYW0ge09iamVjdC48c3RyaW5nLCo+fSBbcHJvcGVydGllc10gUHJvcGVydGllcyB0byBzZXRcclxuICogQHJldHVybnMge01lc3NhZ2U8VD59IE1lc3NhZ2UgaW5zdGFuY2VcclxuICogQHRlbXBsYXRlIFQgZXh0ZW5kcyBNZXNzYWdlPFQ+XHJcbiAqIEB0aGlzIENvbnN0cnVjdG9yPFQ+XHJcbiAqL1xyXG5NZXNzYWdlLmNyZWF0ZSA9IGZ1bmN0aW9uIGNyZWF0ZShwcm9wZXJ0aWVzKSB7XHJcbiAgICByZXR1cm4gdGhpcy4kdHlwZS5jcmVhdGUocHJvcGVydGllcyk7XHJcbn07XHJcblxyXG4vKipcclxuICogRW5jb2RlcyBhIG1lc3NhZ2Ugb2YgdGhpcyB0eXBlLlxyXG4gKiBAcGFyYW0ge1R8T2JqZWN0LjxzdHJpbmcsKj59IG1lc3NhZ2UgTWVzc2FnZSB0byBlbmNvZGVcclxuICogQHBhcmFtIHtXcml0ZXJ9IFt3cml0ZXJdIFdyaXRlciB0byB1c2VcclxuICogQHJldHVybnMge1dyaXRlcn0gV3JpdGVyXHJcbiAqIEB0ZW1wbGF0ZSBUIGV4dGVuZHMgTWVzc2FnZTxUPlxyXG4gKiBAdGhpcyBDb25zdHJ1Y3RvcjxUPlxyXG4gKi9cclxuTWVzc2FnZS5lbmNvZGUgPSBmdW5jdGlvbiBlbmNvZGUobWVzc2FnZSwgd3JpdGVyKSB7XHJcbiAgICByZXR1cm4gdGhpcy4kdHlwZS5lbmNvZGUobWVzc2FnZSwgd3JpdGVyKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBFbmNvZGVzIGEgbWVzc2FnZSBvZiB0aGlzIHR5cGUgcHJlY2VlZGVkIGJ5IGl0cyBsZW5ndGggYXMgYSB2YXJpbnQuXHJcbiAqIEBwYXJhbSB7VHxPYmplY3QuPHN0cmluZywqPn0gbWVzc2FnZSBNZXNzYWdlIHRvIGVuY29kZVxyXG4gKiBAcGFyYW0ge1dyaXRlcn0gW3dyaXRlcl0gV3JpdGVyIHRvIHVzZVxyXG4gKiBAcmV0dXJucyB7V3JpdGVyfSBXcml0ZXJcclxuICogQHRlbXBsYXRlIFQgZXh0ZW5kcyBNZXNzYWdlPFQ+XHJcbiAqIEB0aGlzIENvbnN0cnVjdG9yPFQ+XHJcbiAqL1xyXG5NZXNzYWdlLmVuY29kZURlbGltaXRlZCA9IGZ1bmN0aW9uIGVuY29kZURlbGltaXRlZChtZXNzYWdlLCB3cml0ZXIpIHtcclxuICAgIHJldHVybiB0aGlzLiR0eXBlLmVuY29kZURlbGltaXRlZChtZXNzYWdlLCB3cml0ZXIpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIERlY29kZXMgYSBtZXNzYWdlIG9mIHRoaXMgdHlwZS5cclxuICogQG5hbWUgTWVzc2FnZS5kZWNvZGVcclxuICogQGZ1bmN0aW9uXHJcbiAqIEBwYXJhbSB7UmVhZGVyfFVpbnQ4QXJyYXl9IHJlYWRlciBSZWFkZXIgb3IgYnVmZmVyIHRvIGRlY29kZVxyXG4gKiBAcmV0dXJucyB7VH0gRGVjb2RlZCBtZXNzYWdlXHJcbiAqIEB0ZW1wbGF0ZSBUIGV4dGVuZHMgTWVzc2FnZTxUPlxyXG4gKiBAdGhpcyBDb25zdHJ1Y3RvcjxUPlxyXG4gKi9cclxuTWVzc2FnZS5kZWNvZGUgPSBmdW5jdGlvbiBkZWNvZGUocmVhZGVyKSB7XHJcbiAgICByZXR1cm4gdGhpcy4kdHlwZS5kZWNvZGUocmVhZGVyKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBEZWNvZGVzIGEgbWVzc2FnZSBvZiB0aGlzIHR5cGUgcHJlY2VlZGVkIGJ5IGl0cyBsZW5ndGggYXMgYSB2YXJpbnQuXHJcbiAqIEBuYW1lIE1lc3NhZ2UuZGVjb2RlRGVsaW1pdGVkXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcGFyYW0ge1JlYWRlcnxVaW50OEFycmF5fSByZWFkZXIgUmVhZGVyIG9yIGJ1ZmZlciB0byBkZWNvZGVcclxuICogQHJldHVybnMge1R9IERlY29kZWQgbWVzc2FnZVxyXG4gKiBAdGVtcGxhdGUgVCBleHRlbmRzIE1lc3NhZ2U8VD5cclxuICogQHRoaXMgQ29uc3RydWN0b3I8VD5cclxuICovXHJcbk1lc3NhZ2UuZGVjb2RlRGVsaW1pdGVkID0gZnVuY3Rpb24gZGVjb2RlRGVsaW1pdGVkKHJlYWRlcikge1xyXG4gICAgcmV0dXJuIHRoaXMuJHR5cGUuZGVjb2RlRGVsaW1pdGVkKHJlYWRlcik7XHJcbn07XHJcblxyXG4vKipcclxuICogVmVyaWZpZXMgYSBtZXNzYWdlIG9mIHRoaXMgdHlwZS5cclxuICogQG5hbWUgTWVzc2FnZS52ZXJpZnlcclxuICogQGZ1bmN0aW9uXHJcbiAqIEBwYXJhbSB7T2JqZWN0LjxzdHJpbmcsKj59IG1lc3NhZ2UgUGxhaW4gb2JqZWN0IHRvIHZlcmlmeVxyXG4gKiBAcmV0dXJucyB7c3RyaW5nfG51bGx9IGBudWxsYCBpZiB2YWxpZCwgb3RoZXJ3aXNlIHRoZSByZWFzb24gd2h5IGl0IGlzIG5vdFxyXG4gKi9cclxuTWVzc2FnZS52ZXJpZnkgPSBmdW5jdGlvbiB2ZXJpZnkobWVzc2FnZSkge1xyXG4gICAgcmV0dXJuIHRoaXMuJHR5cGUudmVyaWZ5KG1lc3NhZ2UpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBuZXcgbWVzc2FnZSBvZiB0aGlzIHR5cGUgZnJvbSBhIHBsYWluIG9iamVjdC4gQWxzbyBjb252ZXJ0cyB2YWx1ZXMgdG8gdGhlaXIgcmVzcGVjdGl2ZSBpbnRlcm5hbCB0eXBlcy5cclxuICogQHBhcmFtIHtPYmplY3QuPHN0cmluZywqPn0gb2JqZWN0IFBsYWluIG9iamVjdFxyXG4gKiBAcmV0dXJucyB7VH0gTWVzc2FnZSBpbnN0YW5jZVxyXG4gKiBAdGVtcGxhdGUgVCBleHRlbmRzIE1lc3NhZ2U8VD5cclxuICogQHRoaXMgQ29uc3RydWN0b3I8VD5cclxuICovXHJcbk1lc3NhZ2UuZnJvbU9iamVjdCA9IGZ1bmN0aW9uIGZyb21PYmplY3Qob2JqZWN0KSB7XHJcbiAgICByZXR1cm4gdGhpcy4kdHlwZS5mcm9tT2JqZWN0KG9iamVjdCk7XHJcbn07XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIHBsYWluIG9iamVjdCBmcm9tIGEgbWVzc2FnZSBvZiB0aGlzIHR5cGUuIEFsc28gY29udmVydHMgdmFsdWVzIHRvIG90aGVyIHR5cGVzIGlmIHNwZWNpZmllZC5cclxuICogQHBhcmFtIHtUfSBtZXNzYWdlIE1lc3NhZ2UgaW5zdGFuY2VcclxuICogQHBhcmFtIHtJQ29udmVyc2lvbk9wdGlvbnN9IFtvcHRpb25zXSBDb252ZXJzaW9uIG9wdGlvbnNcclxuICogQHJldHVybnMge09iamVjdC48c3RyaW5nLCo+fSBQbGFpbiBvYmplY3RcclxuICogQHRlbXBsYXRlIFQgZXh0ZW5kcyBNZXNzYWdlPFQ+XHJcbiAqIEB0aGlzIENvbnN0cnVjdG9yPFQ+XHJcbiAqL1xyXG5NZXNzYWdlLnRvT2JqZWN0ID0gZnVuY3Rpb24gdG9PYmplY3QobWVzc2FnZSwgb3B0aW9ucykge1xyXG4gICAgcmV0dXJuIHRoaXMuJHR5cGUudG9PYmplY3QobWVzc2FnZSwgb3B0aW9ucyk7XHJcbn07XHJcblxyXG4vKipcclxuICogQ29udmVydHMgdGhpcyBtZXNzYWdlIHRvIEpTT04uXHJcbiAqIEByZXR1cm5zIHtPYmplY3QuPHN0cmluZywqPn0gSlNPTiBvYmplY3RcclxuICovXHJcbk1lc3NhZ2UucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uIHRvSlNPTigpIHtcclxuICAgIHJldHVybiB0aGlzLiR0eXBlLnRvT2JqZWN0KHRoaXMsIHV0aWwudG9KU09OT3B0aW9ucyk7XHJcbn07XHJcblxyXG4vKmVzbGludC1lbmFibGUgdmFsaWQtanNkb2MqLyIsIlwidXNlIHN0cmljdFwiO1xyXG5tb2R1bGUuZXhwb3J0cyA9IE1ldGhvZDtcclxuXHJcbi8vIGV4dGVuZHMgUmVmbGVjdGlvbk9iamVjdFxyXG52YXIgUmVmbGVjdGlvbk9iamVjdCA9IHJlcXVpcmUoXCIuL29iamVjdFwiKTtcclxuKChNZXRob2QucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShSZWZsZWN0aW9uT2JqZWN0LnByb3RvdHlwZSkpLmNvbnN0cnVjdG9yID0gTWV0aG9kKS5jbGFzc05hbWUgPSBcIk1ldGhvZFwiO1xyXG5cclxudmFyIHV0aWwgPSByZXF1aXJlKFwiLi91dGlsXCIpO1xyXG5cclxuLyoqXHJcbiAqIENvbnN0cnVjdHMgYSBuZXcgc2VydmljZSBtZXRob2QgaW5zdGFuY2UuXHJcbiAqIEBjbGFzc2Rlc2MgUmVmbGVjdGVkIHNlcnZpY2UgbWV0aG9kLlxyXG4gKiBAZXh0ZW5kcyBSZWZsZWN0aW9uT2JqZWN0XHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBNZXRob2QgbmFtZVxyXG4gKiBAcGFyYW0ge3N0cmluZ3x1bmRlZmluZWR9IHR5cGUgTWV0aG9kIHR5cGUsIHVzdWFsbHkgYFwicnBjXCJgXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSByZXF1ZXN0VHlwZSBSZXF1ZXN0IG1lc3NhZ2UgdHlwZVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVzcG9uc2VUeXBlIFJlc3BvbnNlIG1lc3NhZ2UgdHlwZVxyXG4gKiBAcGFyYW0ge2Jvb2xlYW58T2JqZWN0LjxzdHJpbmcsKj59IFtyZXF1ZXN0U3RyZWFtXSBXaGV0aGVyIHRoZSByZXF1ZXN0IGlzIHN0cmVhbWVkXHJcbiAqIEBwYXJhbSB7Ym9vbGVhbnxPYmplY3QuPHN0cmluZywqPn0gW3Jlc3BvbnNlU3RyZWFtXSBXaGV0aGVyIHRoZSByZXNwb25zZSBpcyBzdHJlYW1lZFxyXG4gKiBAcGFyYW0ge09iamVjdC48c3RyaW5nLCo+fSBbb3B0aW9uc10gRGVjbGFyZWQgb3B0aW9uc1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gW2NvbW1lbnRdIFRoZSBjb21tZW50IGZvciB0aGlzIG1ldGhvZFxyXG4gKi9cclxuZnVuY3Rpb24gTWV0aG9kKG5hbWUsIHR5cGUsIHJlcXVlc3RUeXBlLCByZXNwb25zZVR5cGUsIHJlcXVlc3RTdHJlYW0sIHJlc3BvbnNlU3RyZWFtLCBvcHRpb25zLCBjb21tZW50KSB7XHJcblxyXG4gICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgIGlmICh1dGlsLmlzT2JqZWN0KHJlcXVlc3RTdHJlYW0pKSB7XHJcbiAgICAgICAgb3B0aW9ucyA9IHJlcXVlc3RTdHJlYW07XHJcbiAgICAgICAgcmVxdWVzdFN0cmVhbSA9IHJlc3BvbnNlU3RyZWFtID0gdW5kZWZpbmVkO1xyXG4gICAgfSBlbHNlIGlmICh1dGlsLmlzT2JqZWN0KHJlc3BvbnNlU3RyZWFtKSkge1xyXG4gICAgICAgIG9wdGlvbnMgPSByZXNwb25zZVN0cmVhbTtcclxuICAgICAgICByZXNwb25zZVN0cmVhbSA9IHVuZGVmaW5lZDtcclxuICAgIH1cclxuXHJcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cclxuICAgIGlmICghKHR5cGUgPT09IHVuZGVmaW5lZCB8fCB1dGlsLmlzU3RyaW5nKHR5cGUpKSlcclxuICAgICAgICB0aHJvdyBUeXBlRXJyb3IoXCJ0eXBlIG11c3QgYmUgYSBzdHJpbmdcIik7XHJcblxyXG4gICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXHJcbiAgICBpZiAoIXV0aWwuaXNTdHJpbmcocmVxdWVzdFR5cGUpKVxyXG4gICAgICAgIHRocm93IFR5cGVFcnJvcihcInJlcXVlc3RUeXBlIG11c3QgYmUgYSBzdHJpbmdcIik7XHJcblxyXG4gICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXHJcbiAgICBpZiAoIXV0aWwuaXNTdHJpbmcocmVzcG9uc2VUeXBlKSlcclxuICAgICAgICB0aHJvdyBUeXBlRXJyb3IoXCJyZXNwb25zZVR5cGUgbXVzdCBiZSBhIHN0cmluZ1wiKTtcclxuXHJcbiAgICBSZWZsZWN0aW9uT2JqZWN0LmNhbGwodGhpcywgbmFtZSwgb3B0aW9ucyk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBNZXRob2QgdHlwZS5cclxuICAgICAqIEB0eXBlIHtzdHJpbmd9XHJcbiAgICAgKi9cclxuICAgIHRoaXMudHlwZSA9IHR5cGUgfHwgXCJycGNcIjsgLy8gdG9KU09OXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXF1ZXN0IHR5cGUuXHJcbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxyXG4gICAgICovXHJcbiAgICB0aGlzLnJlcXVlc3RUeXBlID0gcmVxdWVzdFR5cGU7IC8vIHRvSlNPTiwgbWFya2VyXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBXaGV0aGVyIHJlcXVlc3RzIGFyZSBzdHJlYW1lZCBvciBub3QuXHJcbiAgICAgKiBAdHlwZSB7Ym9vbGVhbnx1bmRlZmluZWR9XHJcbiAgICAgKi9cclxuICAgIHRoaXMucmVxdWVzdFN0cmVhbSA9IHJlcXVlc3RTdHJlYW0gPyB0cnVlIDogdW5kZWZpbmVkOyAvLyB0b0pTT05cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlc3BvbnNlIHR5cGUuXHJcbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxyXG4gICAgICovXHJcbiAgICB0aGlzLnJlc3BvbnNlVHlwZSA9IHJlc3BvbnNlVHlwZTsgLy8gdG9KU09OXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBXaGV0aGVyIHJlc3BvbnNlcyBhcmUgc3RyZWFtZWQgb3Igbm90LlxyXG4gICAgICogQHR5cGUge2Jvb2xlYW58dW5kZWZpbmVkfVxyXG4gICAgICovXHJcbiAgICB0aGlzLnJlc3BvbnNlU3RyZWFtID0gcmVzcG9uc2VTdHJlYW0gPyB0cnVlIDogdW5kZWZpbmVkOyAvLyB0b0pTT05cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlc29sdmVkIHJlcXVlc3QgdHlwZS5cclxuICAgICAqIEB0eXBlIHtUeXBlfG51bGx9XHJcbiAgICAgKi9cclxuICAgIHRoaXMucmVzb2x2ZWRSZXF1ZXN0VHlwZSA9IG51bGw7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXNvbHZlZCByZXNwb25zZSB0eXBlLlxyXG4gICAgICogQHR5cGUge1R5cGV8bnVsbH1cclxuICAgICAqL1xyXG4gICAgdGhpcy5yZXNvbHZlZFJlc3BvbnNlVHlwZSA9IG51bGw7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDb21tZW50IGZvciB0aGlzIG1ldGhvZFxyXG4gICAgICogQHR5cGUge3N0cmluZ3xudWxsfVxyXG4gICAgICovXHJcbiAgICB0aGlzLmNvbW1lbnQgPSBjb21tZW50O1xyXG59XHJcblxyXG4vKipcclxuICogTWV0aG9kIGRlc2NyaXB0b3IuXHJcbiAqIEBpbnRlcmZhY2UgSU1ldGhvZFxyXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3R5cGU9XCJycGNcIl0gTWV0aG9kIHR5cGVcclxuICogQHByb3BlcnR5IHtzdHJpbmd9IHJlcXVlc3RUeXBlIFJlcXVlc3QgdHlwZVxyXG4gKiBAcHJvcGVydHkge3N0cmluZ30gcmVzcG9uc2VUeXBlIFJlc3BvbnNlIHR5cGVcclxuICogQHByb3BlcnR5IHtib29sZWFufSBbcmVxdWVzdFN0cmVhbT1mYWxzZV0gV2hldGhlciByZXF1ZXN0cyBhcmUgc3RyZWFtZWRcclxuICogQHByb3BlcnR5IHtib29sZWFufSBbcmVzcG9uc2VTdHJlYW09ZmFsc2VdIFdoZXRoZXIgcmVzcG9uc2VzIGFyZSBzdHJlYW1lZFxyXG4gKiBAcHJvcGVydHkge09iamVjdC48c3RyaW5nLCo+fSBbb3B0aW9uc10gTWV0aG9kIG9wdGlvbnNcclxuICovXHJcblxyXG4vKipcclxuICogQ29uc3RydWN0cyBhIG1ldGhvZCBmcm9tIGEgbWV0aG9kIGRlc2NyaXB0b3IuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIE1ldGhvZCBuYW1lXHJcbiAqIEBwYXJhbSB7SU1ldGhvZH0ganNvbiBNZXRob2QgZGVzY3JpcHRvclxyXG4gKiBAcmV0dXJucyB7TWV0aG9kfSBDcmVhdGVkIG1ldGhvZFxyXG4gKiBAdGhyb3dzIHtUeXBlRXJyb3J9IElmIGFyZ3VtZW50cyBhcmUgaW52YWxpZFxyXG4gKi9cclxuTWV0aG9kLmZyb21KU09OID0gZnVuY3Rpb24gZnJvbUpTT04obmFtZSwganNvbikge1xyXG4gICAgcmV0dXJuIG5ldyBNZXRob2QobmFtZSwganNvbi50eXBlLCBqc29uLnJlcXVlc3RUeXBlLCBqc29uLnJlc3BvbnNlVHlwZSwganNvbi5yZXF1ZXN0U3RyZWFtLCBqc29uLnJlc3BvbnNlU3RyZWFtLCBqc29uLm9wdGlvbnMsIGpzb24uY29tbWVudCk7XHJcbn07XHJcblxyXG4vKipcclxuICogQ29udmVydHMgdGhpcyBtZXRob2QgdG8gYSBtZXRob2QgZGVzY3JpcHRvci5cclxuICogQHBhcmFtIHtJVG9KU09OT3B0aW9uc30gW3RvSlNPTk9wdGlvbnNdIEpTT04gY29udmVyc2lvbiBvcHRpb25zXHJcbiAqIEByZXR1cm5zIHtJTWV0aG9kfSBNZXRob2QgZGVzY3JpcHRvclxyXG4gKi9cclxuTWV0aG9kLnByb3RvdHlwZS50b0pTT04gPSBmdW5jdGlvbiB0b0pTT04odG9KU09OT3B0aW9ucykge1xyXG4gICAgdmFyIGtlZXBDb21tZW50cyA9IHRvSlNPTk9wdGlvbnMgPyBCb29sZWFuKHRvSlNPTk9wdGlvbnMua2VlcENvbW1lbnRzKSA6IGZhbHNlO1xyXG4gICAgcmV0dXJuIHV0aWwudG9PYmplY3QoW1xyXG4gICAgICAgIFwidHlwZVwiICAgICAgICAgICAsIHRoaXMudHlwZSAhPT0gXCJycGNcIiAmJiAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqLyB0aGlzLnR5cGUgfHwgdW5kZWZpbmVkLFxyXG4gICAgICAgIFwicmVxdWVzdFR5cGVcIiAgICAsIHRoaXMucmVxdWVzdFR5cGUsXHJcbiAgICAgICAgXCJyZXF1ZXN0U3RyZWFtXCIgICwgdGhpcy5yZXF1ZXN0U3RyZWFtLFxyXG4gICAgICAgIFwicmVzcG9uc2VUeXBlXCIgICAsIHRoaXMucmVzcG9uc2VUeXBlLFxyXG4gICAgICAgIFwicmVzcG9uc2VTdHJlYW1cIiAsIHRoaXMucmVzcG9uc2VTdHJlYW0sXHJcbiAgICAgICAgXCJvcHRpb25zXCIgICAgICAgICwgdGhpcy5vcHRpb25zLFxyXG4gICAgICAgIFwiY29tbWVudFwiICAgICAgICAsIGtlZXBDb21tZW50cyA/IHRoaXMuY29tbWVudCA6IHVuZGVmaW5lZFxyXG4gICAgXSk7XHJcbn07XHJcblxyXG4vKipcclxuICogQG92ZXJyaWRlXHJcbiAqL1xyXG5NZXRob2QucHJvdG90eXBlLnJlc29sdmUgPSBmdW5jdGlvbiByZXNvbHZlKCkge1xyXG5cclxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xyXG4gICAgaWYgKHRoaXMucmVzb2x2ZWQpXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgdGhpcy5yZXNvbHZlZFJlcXVlc3RUeXBlID0gdGhpcy5wYXJlbnQubG9va3VwVHlwZSh0aGlzLnJlcXVlc3RUeXBlKTtcclxuICAgIHRoaXMucmVzb2x2ZWRSZXNwb25zZVR5cGUgPSB0aGlzLnBhcmVudC5sb29rdXBUeXBlKHRoaXMucmVzcG9uc2VUeXBlKTtcclxuXHJcbiAgICByZXR1cm4gUmVmbGVjdGlvbk9iamVjdC5wcm90b3R5cGUucmVzb2x2ZS5jYWxsKHRoaXMpO1xyXG59O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxubW9kdWxlLmV4cG9ydHMgPSBOYW1lc3BhY2U7XHJcblxyXG4vLyBleHRlbmRzIFJlZmxlY3Rpb25PYmplY3RcclxudmFyIFJlZmxlY3Rpb25PYmplY3QgPSByZXF1aXJlKFwiLi9vYmplY3RcIik7XHJcbigoTmFtZXNwYWNlLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoUmVmbGVjdGlvbk9iamVjdC5wcm90b3R5cGUpKS5jb25zdHJ1Y3RvciA9IE5hbWVzcGFjZSkuY2xhc3NOYW1lID0gXCJOYW1lc3BhY2VcIjtcclxuXHJcbnZhciBGaWVsZCAgICA9IHJlcXVpcmUoXCIuL2ZpZWxkXCIpLFxyXG4gICAgdXRpbCAgICAgPSByZXF1aXJlKFwiLi91dGlsXCIpO1xyXG5cclxudmFyIFR5cGUsICAgIC8vIGN5Y2xpY1xyXG4gICAgU2VydmljZSxcclxuICAgIEVudW07XHJcblxyXG4vKipcclxuICogQ29uc3RydWN0cyBhIG5ldyBuYW1lc3BhY2UgaW5zdGFuY2UuXHJcbiAqIEBuYW1lIE5hbWVzcGFjZVxyXG4gKiBAY2xhc3NkZXNjIFJlZmxlY3RlZCBuYW1lc3BhY2UuXHJcbiAqIEBleHRlbmRzIE5hbWVzcGFjZUJhc2VcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIE5hbWVzcGFjZSBuYW1lXHJcbiAqIEBwYXJhbSB7T2JqZWN0LjxzdHJpbmcsKj59IFtvcHRpb25zXSBEZWNsYXJlZCBvcHRpb25zXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIENvbnN0cnVjdHMgYSBuYW1lc3BhY2UgZnJvbSBKU09OLlxyXG4gKiBAbWVtYmVyb2YgTmFtZXNwYWNlXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBOYW1lc3BhY2UgbmFtZVxyXG4gKiBAcGFyYW0ge09iamVjdC48c3RyaW5nLCo+fSBqc29uIEpTT04gb2JqZWN0XHJcbiAqIEByZXR1cm5zIHtOYW1lc3BhY2V9IENyZWF0ZWQgbmFtZXNwYWNlXHJcbiAqIEB0aHJvd3Mge1R5cGVFcnJvcn0gSWYgYXJndW1lbnRzIGFyZSBpbnZhbGlkXHJcbiAqL1xyXG5OYW1lc3BhY2UuZnJvbUpTT04gPSBmdW5jdGlvbiBmcm9tSlNPTihuYW1lLCBqc29uKSB7XHJcbiAgICByZXR1cm4gbmV3IE5hbWVzcGFjZShuYW1lLCBqc29uLm9wdGlvbnMpLmFkZEpTT04oanNvbi5uZXN0ZWQpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENvbnZlcnRzIGFuIGFycmF5IG9mIHJlZmxlY3Rpb24gb2JqZWN0cyB0byBKU09OLlxyXG4gKiBAbWVtYmVyb2YgTmFtZXNwYWNlXHJcbiAqIEBwYXJhbSB7UmVmbGVjdGlvbk9iamVjdFtdfSBhcnJheSBPYmplY3QgYXJyYXlcclxuICogQHBhcmFtIHtJVG9KU09OT3B0aW9uc30gW3RvSlNPTk9wdGlvbnNdIEpTT04gY29udmVyc2lvbiBvcHRpb25zXHJcbiAqIEByZXR1cm5zIHtPYmplY3QuPHN0cmluZywqPnx1bmRlZmluZWR9IEpTT04gb2JqZWN0IG9yIGB1bmRlZmluZWRgIHdoZW4gYXJyYXkgaXMgZW1wdHlcclxuICovXHJcbmZ1bmN0aW9uIGFycmF5VG9KU09OKGFycmF5LCB0b0pTT05PcHRpb25zKSB7XHJcbiAgICBpZiAoIShhcnJheSAmJiBhcnJheS5sZW5ndGgpKVxyXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICB2YXIgb2JqID0ge307XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgKytpKVxyXG4gICAgICAgIG9ialthcnJheVtpXS5uYW1lXSA9IGFycmF5W2ldLnRvSlNPTih0b0pTT05PcHRpb25zKTtcclxuICAgIHJldHVybiBvYmo7XHJcbn1cclxuXHJcbk5hbWVzcGFjZS5hcnJheVRvSlNPTiA9IGFycmF5VG9KU09OO1xyXG5cclxuLyoqXHJcbiAqIFRlc3RzIGlmIHRoZSBzcGVjaWZpZWQgaWQgaXMgcmVzZXJ2ZWQuXHJcbiAqIEBwYXJhbSB7QXJyYXkuPG51bWJlcltdfHN0cmluZz58dW5kZWZpbmVkfSByZXNlcnZlZCBBcnJheSBvZiByZXNlcnZlZCByYW5nZXMgYW5kIG5hbWVzXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBpZCBJZCB0byB0ZXN0XHJcbiAqIEByZXR1cm5zIHtib29sZWFufSBgdHJ1ZWAgaWYgcmVzZXJ2ZWQsIG90aGVyd2lzZSBgZmFsc2VgXHJcbiAqL1xyXG5OYW1lc3BhY2UuaXNSZXNlcnZlZElkID0gZnVuY3Rpb24gaXNSZXNlcnZlZElkKHJlc2VydmVkLCBpZCkge1xyXG4gICAgaWYgKHJlc2VydmVkKVxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVzZXJ2ZWQubGVuZ3RoOyArK2kpXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcmVzZXJ2ZWRbaV0gIT09IFwic3RyaW5nXCIgJiYgcmVzZXJ2ZWRbaV1bMF0gPD0gaWQgJiYgcmVzZXJ2ZWRbaV1bMV0gPj0gaWQpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIHJldHVybiBmYWxzZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBUZXN0cyBpZiB0aGUgc3BlY2lmaWVkIG5hbWUgaXMgcmVzZXJ2ZWQuXHJcbiAqIEBwYXJhbSB7QXJyYXkuPG51bWJlcltdfHN0cmluZz58dW5kZWZpbmVkfSByZXNlcnZlZCBBcnJheSBvZiByZXNlcnZlZCByYW5nZXMgYW5kIG5hbWVzXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIE5hbWUgdG8gdGVzdFxyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gYHRydWVgIGlmIHJlc2VydmVkLCBvdGhlcndpc2UgYGZhbHNlYFxyXG4gKi9cclxuTmFtZXNwYWNlLmlzUmVzZXJ2ZWROYW1lID0gZnVuY3Rpb24gaXNSZXNlcnZlZE5hbWUocmVzZXJ2ZWQsIG5hbWUpIHtcclxuICAgIGlmIChyZXNlcnZlZClcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlc2VydmVkLmxlbmd0aDsgKytpKVxyXG4gICAgICAgICAgICBpZiAocmVzZXJ2ZWRbaV0gPT09IG5hbWUpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIHJldHVybiBmYWxzZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBOb3QgYW4gYWN0dWFsIGNvbnN0cnVjdG9yLiBVc2Uge0BsaW5rIE5hbWVzcGFjZX0gaW5zdGVhZC5cclxuICogQGNsYXNzZGVzYyBCYXNlIGNsYXNzIG9mIGFsbCByZWZsZWN0aW9uIG9iamVjdHMgY29udGFpbmluZyBuZXN0ZWQgb2JqZWN0cy4gVGhpcyBpcyBub3QgYW4gYWN0dWFsIGNsYXNzIGJ1dCBoZXJlIGZvciB0aGUgc2FrZSBvZiBoYXZpbmcgY29uc2lzdGVudCB0eXBlIGRlZmluaXRpb25zLlxyXG4gKiBAZXhwb3J0cyBOYW1lc3BhY2VCYXNlXHJcbiAqIEBleHRlbmRzIFJlZmxlY3Rpb25PYmplY3RcclxuICogQGFic3RyYWN0XHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBOYW1lc3BhY2UgbmFtZVxyXG4gKiBAcGFyYW0ge09iamVjdC48c3RyaW5nLCo+fSBbb3B0aW9uc10gRGVjbGFyZWQgb3B0aW9uc1xyXG4gKiBAc2VlIHtAbGluayBOYW1lc3BhY2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBOYW1lc3BhY2UobmFtZSwgb3B0aW9ucykge1xyXG4gICAgUmVmbGVjdGlvbk9iamVjdC5jYWxsKHRoaXMsIG5hbWUsIG9wdGlvbnMpO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogTmVzdGVkIG9iamVjdHMgYnkgbmFtZS5cclxuICAgICAqIEB0eXBlIHtPYmplY3QuPHN0cmluZyxSZWZsZWN0aW9uT2JqZWN0Pnx1bmRlZmluZWR9XHJcbiAgICAgKi9cclxuICAgIHRoaXMubmVzdGVkID0gdW5kZWZpbmVkOyAvLyB0b0pTT05cclxuXHJcbiAgICAvKipcclxuICAgICAqIENhY2hlZCBuZXN0ZWQgb2JqZWN0cyBhcyBhbiBhcnJheS5cclxuICAgICAqIEB0eXBlIHtSZWZsZWN0aW9uT2JqZWN0W118bnVsbH1cclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIHRoaXMuX25lc3RlZEFycmF5ID0gbnVsbDtcclxufVxyXG5cclxuZnVuY3Rpb24gY2xlYXJDYWNoZShuYW1lc3BhY2UpIHtcclxuICAgIG5hbWVzcGFjZS5fbmVzdGVkQXJyYXkgPSBudWxsO1xyXG4gICAgcmV0dXJuIG5hbWVzcGFjZTtcclxufVxyXG5cclxuLyoqXHJcbiAqIE5lc3RlZCBvYmplY3RzIG9mIHRoaXMgbmFtZXNwYWNlIGFzIGFuIGFycmF5IGZvciBpdGVyYXRpb24uXHJcbiAqIEBuYW1lIE5hbWVzcGFjZUJhc2UjbmVzdGVkQXJyYXlcclxuICogQHR5cGUge1JlZmxlY3Rpb25PYmplY3RbXX1cclxuICogQHJlYWRvbmx5XHJcbiAqL1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoTmFtZXNwYWNlLnByb3RvdHlwZSwgXCJuZXN0ZWRBcnJheVwiLCB7XHJcbiAgICBnZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9uZXN0ZWRBcnJheSB8fCAodGhpcy5fbmVzdGVkQXJyYXkgPSB1dGlsLnRvQXJyYXkodGhpcy5uZXN0ZWQpKTtcclxuICAgIH1cclxufSk7XHJcblxyXG4vKipcclxuICogTmFtZXNwYWNlIGRlc2NyaXB0b3IuXHJcbiAqIEBpbnRlcmZhY2UgSU5hbWVzcGFjZVxyXG4gKiBAcHJvcGVydHkge09iamVjdC48c3RyaW5nLCo+fSBbb3B0aW9uc10gTmFtZXNwYWNlIG9wdGlvbnNcclxuICogQHByb3BlcnR5IHtPYmplY3QuPHN0cmluZyxBbnlOZXN0ZWRPYmplY3Q+fSBbbmVzdGVkXSBOZXN0ZWQgb2JqZWN0IGRlc2NyaXB0b3JzXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIEFueSBleHRlbnNpb24gZmllbGQgZGVzY3JpcHRvci5cclxuICogQHR5cGVkZWYgQW55RXh0ZW5zaW9uRmllbGRcclxuICogQHR5cGUge0lFeHRlbnNpb25GaWVsZHxJRXh0ZW5zaW9uTWFwRmllbGR9XHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIEFueSBuZXN0ZWQgb2JqZWN0IGRlc2NyaXB0b3IuXHJcbiAqIEB0eXBlZGVmIEFueU5lc3RlZE9iamVjdFxyXG4gKiBAdHlwZSB7SUVudW18SVR5cGV8SVNlcnZpY2V8QW55RXh0ZW5zaW9uRmllbGR8SU5hbWVzcGFjZX1cclxuICovXHJcbi8vIF4gQkVXQVJFOiBWU0NvZGUgaGFuZ3MgZm9yZXZlciB3aGVuIHVzaW5nIG1vcmUgdGhhbiA1IHR5cGVzICh0aGF0J3Mgd2h5IEFueUV4dGVuc2lvbkZpZWxkIGV4aXN0cyBpbiB0aGUgZmlyc3QgcGxhY2UpXHJcblxyXG4vKipcclxuICogQ29udmVydHMgdGhpcyBuYW1lc3BhY2UgdG8gYSBuYW1lc3BhY2UgZGVzY3JpcHRvci5cclxuICogQHBhcmFtIHtJVG9KU09OT3B0aW9uc30gW3RvSlNPTk9wdGlvbnNdIEpTT04gY29udmVyc2lvbiBvcHRpb25zXHJcbiAqIEByZXR1cm5zIHtJTmFtZXNwYWNlfSBOYW1lc3BhY2UgZGVzY3JpcHRvclxyXG4gKi9cclxuTmFtZXNwYWNlLnByb3RvdHlwZS50b0pTT04gPSBmdW5jdGlvbiB0b0pTT04odG9KU09OT3B0aW9ucykge1xyXG4gICAgcmV0dXJuIHV0aWwudG9PYmplY3QoW1xyXG4gICAgICAgIFwib3B0aW9uc1wiICwgdGhpcy5vcHRpb25zLFxyXG4gICAgICAgIFwibmVzdGVkXCIgICwgYXJyYXlUb0pTT04odGhpcy5uZXN0ZWRBcnJheSwgdG9KU09OT3B0aW9ucylcclxuICAgIF0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEFkZHMgbmVzdGVkIG9iamVjdHMgdG8gdGhpcyBuYW1lc3BhY2UgZnJvbSBuZXN0ZWQgb2JqZWN0IGRlc2NyaXB0b3JzLlxyXG4gKiBAcGFyYW0ge09iamVjdC48c3RyaW5nLEFueU5lc3RlZE9iamVjdD59IG5lc3RlZEpzb24gQW55IG5lc3RlZCBvYmplY3QgZGVzY3JpcHRvcnNcclxuICogQHJldHVybnMge05hbWVzcGFjZX0gYHRoaXNgXHJcbiAqL1xyXG5OYW1lc3BhY2UucHJvdG90eXBlLmFkZEpTT04gPSBmdW5jdGlvbiBhZGRKU09OKG5lc3RlZEpzb24pIHtcclxuICAgIHZhciBucyA9IHRoaXM7XHJcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgZWxzZSAqL1xyXG4gICAgaWYgKG5lc3RlZEpzb24pIHtcclxuICAgICAgICBmb3IgKHZhciBuYW1lcyA9IE9iamVjdC5rZXlzKG5lc3RlZEpzb24pLCBpID0gMCwgbmVzdGVkOyBpIDwgbmFtZXMubGVuZ3RoOyArK2kpIHtcclxuICAgICAgICAgICAgbmVzdGVkID0gbmVzdGVkSnNvbltuYW1lc1tpXV07XHJcbiAgICAgICAgICAgIG5zLmFkZCggLy8gbW9zdCB0byBsZWFzdCBsaWtlbHlcclxuICAgICAgICAgICAgICAgICggbmVzdGVkLmZpZWxkcyAhPT0gdW5kZWZpbmVkXHJcbiAgICAgICAgICAgICAgICA/IFR5cGUuZnJvbUpTT05cclxuICAgICAgICAgICAgICAgIDogbmVzdGVkLnZhbHVlcyAhPT0gdW5kZWZpbmVkXHJcbiAgICAgICAgICAgICAgICA/IEVudW0uZnJvbUpTT05cclxuICAgICAgICAgICAgICAgIDogbmVzdGVkLm1ldGhvZHMgIT09IHVuZGVmaW5lZFxyXG4gICAgICAgICAgICAgICAgPyBTZXJ2aWNlLmZyb21KU09OXHJcbiAgICAgICAgICAgICAgICA6IG5lc3RlZC5pZCAhPT0gdW5kZWZpbmVkXHJcbiAgICAgICAgICAgICAgICA/IEZpZWxkLmZyb21KU09OXHJcbiAgICAgICAgICAgICAgICA6IE5hbWVzcGFjZS5mcm9tSlNPTiApKG5hbWVzW2ldLCBuZXN0ZWQpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0cyB0aGUgbmVzdGVkIG9iamVjdCBvZiB0aGUgc3BlY2lmaWVkIG5hbWUuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIE5lc3RlZCBvYmplY3QgbmFtZVxyXG4gKiBAcmV0dXJucyB7UmVmbGVjdGlvbk9iamVjdHxudWxsfSBUaGUgcmVmbGVjdGlvbiBvYmplY3Qgb3IgYG51bGxgIGlmIGl0IGRvZXNuJ3QgZXhpc3RcclxuICovXHJcbk5hbWVzcGFjZS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gZ2V0KG5hbWUpIHtcclxuICAgIHJldHVybiB0aGlzLm5lc3RlZCAmJiB0aGlzLm5lc3RlZFtuYW1lXVxyXG4gICAgICAgIHx8IG51bGw7XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0cyB0aGUgdmFsdWVzIG9mIHRoZSBuZXN0ZWQge0BsaW5rIEVudW18ZW51bX0gb2YgdGhlIHNwZWNpZmllZCBuYW1lLlxyXG4gKiBUaGlzIG1ldGhvZHMgZGlmZmVycyBmcm9tIHtAbGluayBOYW1lc3BhY2UjZ2V0fGdldH0gaW4gdGhhdCBpdCByZXR1cm5zIGFuIGVudW0ncyB2YWx1ZXMgZGlyZWN0bHkgYW5kIHRocm93cyBpbnN0ZWFkIG9mIHJldHVybmluZyBgbnVsbGAuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIE5lc3RlZCBlbnVtIG5hbWVcclxuICogQHJldHVybnMge09iamVjdC48c3RyaW5nLG51bWJlcj59IEVudW0gdmFsdWVzXHJcbiAqIEB0aHJvd3Mge0Vycm9yfSBJZiB0aGVyZSBpcyBubyBzdWNoIGVudW1cclxuICovXHJcbk5hbWVzcGFjZS5wcm90b3R5cGUuZ2V0RW51bSA9IGZ1bmN0aW9uIGdldEVudW0obmFtZSkge1xyXG4gICAgaWYgKHRoaXMubmVzdGVkICYmIHRoaXMubmVzdGVkW25hbWVdIGluc3RhbmNlb2YgRW51bSlcclxuICAgICAgICByZXR1cm4gdGhpcy5uZXN0ZWRbbmFtZV0udmFsdWVzO1xyXG4gICAgdGhyb3cgRXJyb3IoXCJubyBzdWNoIGVudW06IFwiICsgbmFtZSk7XHJcbn07XHJcblxyXG4vKipcclxuICogQWRkcyBhIG5lc3RlZCBvYmplY3QgdG8gdGhpcyBuYW1lc3BhY2UuXHJcbiAqIEBwYXJhbSB7UmVmbGVjdGlvbk9iamVjdH0gb2JqZWN0IE5lc3RlZCBvYmplY3QgdG8gYWRkXHJcbiAqIEByZXR1cm5zIHtOYW1lc3BhY2V9IGB0aGlzYFxyXG4gKiBAdGhyb3dzIHtUeXBlRXJyb3J9IElmIGFyZ3VtZW50cyBhcmUgaW52YWxpZFxyXG4gKiBAdGhyb3dzIHtFcnJvcn0gSWYgdGhlcmUgaXMgYWxyZWFkeSBhIG5lc3RlZCBvYmplY3Qgd2l0aCB0aGlzIG5hbWVcclxuICovXHJcbk5hbWVzcGFjZS5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gYWRkKG9iamVjdCkge1xyXG5cclxuICAgIGlmICghKG9iamVjdCBpbnN0YW5jZW9mIEZpZWxkICYmIG9iamVjdC5leHRlbmQgIT09IHVuZGVmaW5lZCB8fCBvYmplY3QgaW5zdGFuY2VvZiBUeXBlIHx8IG9iamVjdCBpbnN0YW5jZW9mIEVudW0gfHwgb2JqZWN0IGluc3RhbmNlb2YgU2VydmljZSB8fCBvYmplY3QgaW5zdGFuY2VvZiBOYW1lc3BhY2UpKVxyXG4gICAgICAgIHRocm93IFR5cGVFcnJvcihcIm9iamVjdCBtdXN0IGJlIGEgdmFsaWQgbmVzdGVkIG9iamVjdFwiKTtcclxuXHJcbiAgICBpZiAoIXRoaXMubmVzdGVkKVxyXG4gICAgICAgIHRoaXMubmVzdGVkID0ge307XHJcbiAgICBlbHNlIHtcclxuICAgICAgICB2YXIgcHJldiA9IHRoaXMuZ2V0KG9iamVjdC5uYW1lKTtcclxuICAgICAgICBpZiAocHJldikge1xyXG4gICAgICAgICAgICBpZiAocHJldiBpbnN0YW5jZW9mIE5hbWVzcGFjZSAmJiBvYmplY3QgaW5zdGFuY2VvZiBOYW1lc3BhY2UgJiYgIShwcmV2IGluc3RhbmNlb2YgVHlwZSB8fCBwcmV2IGluc3RhbmNlb2YgU2VydmljZSkpIHtcclxuICAgICAgICAgICAgICAgIC8vIHJlcGxhY2UgcGxhaW4gbmFtZXNwYWNlIGJ1dCBrZWVwIGV4aXN0aW5nIG5lc3RlZCBlbGVtZW50cyBhbmQgb3B0aW9uc1xyXG4gICAgICAgICAgICAgICAgdmFyIG5lc3RlZCA9IHByZXYubmVzdGVkQXJyYXk7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5lc3RlZC5sZW5ndGg7ICsraSlcclxuICAgICAgICAgICAgICAgICAgICBvYmplY3QuYWRkKG5lc3RlZFtpXSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZShwcmV2KTtcclxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5uZXN0ZWQpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXN0ZWQgPSB7fTtcclxuICAgICAgICAgICAgICAgIG9iamVjdC5zZXRPcHRpb25zKHByZXYub3B0aW9ucywgdHJ1ZSk7XHJcblxyXG4gICAgICAgICAgICB9IGVsc2VcclxuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKFwiZHVwbGljYXRlIG5hbWUgJ1wiICsgb2JqZWN0Lm5hbWUgKyBcIicgaW4gXCIgKyB0aGlzKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLm5lc3RlZFtvYmplY3QubmFtZV0gPSBvYmplY3Q7XHJcbiAgICBvYmplY3Qub25BZGQodGhpcyk7XHJcbiAgICByZXR1cm4gY2xlYXJDYWNoZSh0aGlzKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZW1vdmVzIGEgbmVzdGVkIG9iamVjdCBmcm9tIHRoaXMgbmFtZXNwYWNlLlxyXG4gKiBAcGFyYW0ge1JlZmxlY3Rpb25PYmplY3R9IG9iamVjdCBOZXN0ZWQgb2JqZWN0IHRvIHJlbW92ZVxyXG4gKiBAcmV0dXJucyB7TmFtZXNwYWNlfSBgdGhpc2BcclxuICogQHRocm93cyB7VHlwZUVycm9yfSBJZiBhcmd1bWVudHMgYXJlIGludmFsaWRcclxuICogQHRocm93cyB7RXJyb3J9IElmIGBvYmplY3RgIGlzIG5vdCBhIG1lbWJlciBvZiB0aGlzIG5hbWVzcGFjZVxyXG4gKi9cclxuTmFtZXNwYWNlLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbiByZW1vdmUob2JqZWN0KSB7XHJcblxyXG4gICAgaWYgKCEob2JqZWN0IGluc3RhbmNlb2YgUmVmbGVjdGlvbk9iamVjdCkpXHJcbiAgICAgICAgdGhyb3cgVHlwZUVycm9yKFwib2JqZWN0IG11c3QgYmUgYSBSZWZsZWN0aW9uT2JqZWN0XCIpO1xyXG4gICAgaWYgKG9iamVjdC5wYXJlbnQgIT09IHRoaXMpXHJcbiAgICAgICAgdGhyb3cgRXJyb3Iob2JqZWN0ICsgXCIgaXMgbm90IGEgbWVtYmVyIG9mIFwiICsgdGhpcyk7XHJcblxyXG4gICAgZGVsZXRlIHRoaXMubmVzdGVkW29iamVjdC5uYW1lXTtcclxuICAgIGlmICghT2JqZWN0LmtleXModGhpcy5uZXN0ZWQpLmxlbmd0aClcclxuICAgICAgICB0aGlzLm5lc3RlZCA9IHVuZGVmaW5lZDtcclxuXHJcbiAgICBvYmplY3Qub25SZW1vdmUodGhpcyk7XHJcbiAgICByZXR1cm4gY2xlYXJDYWNoZSh0aGlzKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBEZWZpbmVzIGFkZGl0aWFsIG5hbWVzcGFjZXMgd2l0aGluIHRoaXMgb25lIGlmIG5vdCB5ZXQgZXhpc3RpbmcuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfHN0cmluZ1tdfSBwYXRoIFBhdGggdG8gY3JlYXRlXHJcbiAqIEBwYXJhbSB7Kn0gW2pzb25dIE5lc3RlZCB0eXBlcyB0byBjcmVhdGUgZnJvbSBKU09OXHJcbiAqIEByZXR1cm5zIHtOYW1lc3BhY2V9IFBvaW50ZXIgdG8gdGhlIGxhc3QgbmFtZXNwYWNlIGNyZWF0ZWQgb3IgYHRoaXNgIGlmIHBhdGggaXMgZW1wdHlcclxuICovXHJcbk5hbWVzcGFjZS5wcm90b3R5cGUuZGVmaW5lID0gZnVuY3Rpb24gZGVmaW5lKHBhdGgsIGpzb24pIHtcclxuXHJcbiAgICBpZiAodXRpbC5pc1N0cmluZyhwYXRoKSlcclxuICAgICAgICBwYXRoID0gcGF0aC5zcGxpdChcIi5cIik7XHJcbiAgICBlbHNlIGlmICghQXJyYXkuaXNBcnJheShwYXRoKSlcclxuICAgICAgICB0aHJvdyBUeXBlRXJyb3IoXCJpbGxlZ2FsIHBhdGhcIik7XHJcbiAgICBpZiAocGF0aCAmJiBwYXRoLmxlbmd0aCAmJiBwYXRoWzBdID09PSBcIlwiKVxyXG4gICAgICAgIHRocm93IEVycm9yKFwicGF0aCBtdXN0IGJlIHJlbGF0aXZlXCIpO1xyXG5cclxuICAgIHZhciBwdHIgPSB0aGlzO1xyXG4gICAgd2hpbGUgKHBhdGgubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIHZhciBwYXJ0ID0gcGF0aC5zaGlmdCgpO1xyXG4gICAgICAgIGlmIChwdHIubmVzdGVkICYmIHB0ci5uZXN0ZWRbcGFydF0pIHtcclxuICAgICAgICAgICAgcHRyID0gcHRyLm5lc3RlZFtwYXJ0XTtcclxuICAgICAgICAgICAgaWYgKCEocHRyIGluc3RhbmNlb2YgTmFtZXNwYWNlKSlcclxuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKFwicGF0aCBjb25mbGljdHMgd2l0aCBub24tbmFtZXNwYWNlIG9iamVjdHNcIik7XHJcbiAgICAgICAgfSBlbHNlXHJcbiAgICAgICAgICAgIHB0ci5hZGQocHRyID0gbmV3IE5hbWVzcGFjZShwYXJ0KSk7XHJcbiAgICB9XHJcbiAgICBpZiAoanNvbilcclxuICAgICAgICBwdHIuYWRkSlNPTihqc29uKTtcclxuICAgIHJldHVybiBwdHI7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVzb2x2ZXMgdGhpcyBuYW1lc3BhY2UncyBhbmQgYWxsIGl0cyBuZXN0ZWQgb2JqZWN0cycgdHlwZSByZWZlcmVuY2VzLiBVc2VmdWwgdG8gdmFsaWRhdGUgYSByZWZsZWN0aW9uIHRyZWUsIGJ1dCBjb21lcyBhdCBhIGNvc3QuXHJcbiAqIEByZXR1cm5zIHtOYW1lc3BhY2V9IGB0aGlzYFxyXG4gKi9cclxuTmFtZXNwYWNlLnByb3RvdHlwZS5yZXNvbHZlQWxsID0gZnVuY3Rpb24gcmVzb2x2ZUFsbCgpIHtcclxuICAgIHZhciBuZXN0ZWQgPSB0aGlzLm5lc3RlZEFycmF5LCBpID0gMDtcclxuICAgIHdoaWxlIChpIDwgbmVzdGVkLmxlbmd0aClcclxuICAgICAgICBpZiAobmVzdGVkW2ldIGluc3RhbmNlb2YgTmFtZXNwYWNlKVxyXG4gICAgICAgICAgICBuZXN0ZWRbaSsrXS5yZXNvbHZlQWxsKCk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBuZXN0ZWRbaSsrXS5yZXNvbHZlKCk7XHJcbiAgICByZXR1cm4gdGhpcy5yZXNvbHZlKCk7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVjdXJzaXZlbHkgbG9va3MgdXAgdGhlIHJlZmxlY3Rpb24gb2JqZWN0IG1hdGNoaW5nIHRoZSBzcGVjaWZpZWQgcGF0aCBpbiB0aGUgc2NvcGUgb2YgdGhpcyBuYW1lc3BhY2UuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfHN0cmluZ1tdfSBwYXRoIFBhdGggdG8gbG9vayB1cFxyXG4gKiBAcGFyYW0geyp8QXJyYXkuPCo+fSBmaWx0ZXJUeXBlcyBGaWx0ZXIgdHlwZXMsIGFueSBjb21iaW5hdGlvbiBvZiB0aGUgY29uc3RydWN0b3JzIG9mIGBwcm90b2J1Zi5UeXBlYCwgYHByb3RvYnVmLkVudW1gLCBgcHJvdG9idWYuU2VydmljZWAgZXRjLlxyXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtwYXJlbnRBbHJlYWR5Q2hlY2tlZD1mYWxzZV0gSWYga25vd24sIHdoZXRoZXIgdGhlIHBhcmVudCBoYXMgYWxyZWFkeSBiZWVuIGNoZWNrZWRcclxuICogQHJldHVybnMge1JlZmxlY3Rpb25PYmplY3R8bnVsbH0gTG9va2VkIHVwIG9iamVjdCBvciBgbnVsbGAgaWYgbm9uZSBjb3VsZCBiZSBmb3VuZFxyXG4gKi9cclxuTmFtZXNwYWNlLnByb3RvdHlwZS5sb29rdXAgPSBmdW5jdGlvbiBsb29rdXAocGF0aCwgZmlsdGVyVHlwZXMsIHBhcmVudEFscmVhZHlDaGVja2VkKSB7XHJcblxyXG4gICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgIGlmICh0eXBlb2YgZmlsdGVyVHlwZXMgPT09IFwiYm9vbGVhblwiKSB7XHJcbiAgICAgICAgcGFyZW50QWxyZWFkeUNoZWNrZWQgPSBmaWx0ZXJUeXBlcztcclxuICAgICAgICBmaWx0ZXJUeXBlcyA9IHVuZGVmaW5lZDtcclxuICAgIH0gZWxzZSBpZiAoZmlsdGVyVHlwZXMgJiYgIUFycmF5LmlzQXJyYXkoZmlsdGVyVHlwZXMpKVxyXG4gICAgICAgIGZpbHRlclR5cGVzID0gWyBmaWx0ZXJUeXBlcyBdO1xyXG5cclxuICAgIGlmICh1dGlsLmlzU3RyaW5nKHBhdGgpICYmIHBhdGgubGVuZ3RoKSB7XHJcbiAgICAgICAgaWYgKHBhdGggPT09IFwiLlwiKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yb290O1xyXG4gICAgICAgIHBhdGggPSBwYXRoLnNwbGl0KFwiLlwiKTtcclxuICAgIH0gZWxzZSBpZiAoIXBhdGgubGVuZ3RoKVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIC8vIFN0YXJ0IGF0IHJvb3QgaWYgcGF0aCBpcyBhYnNvbHV0ZVxyXG4gICAgaWYgKHBhdGhbMF0gPT09IFwiXCIpXHJcbiAgICAgICAgcmV0dXJuIHRoaXMucm9vdC5sb29rdXAocGF0aC5zbGljZSgxKSwgZmlsdGVyVHlwZXMpO1xyXG5cclxuICAgIC8vIFRlc3QgaWYgdGhlIGZpcnN0IHBhcnQgbWF0Y2hlcyBhbnkgbmVzdGVkIG9iamVjdCwgYW5kIGlmIHNvLCB0cmF2ZXJzZSBpZiBwYXRoIGNvbnRhaW5zIG1vcmVcclxuICAgIHZhciBmb3VuZCA9IHRoaXMuZ2V0KHBhdGhbMF0pO1xyXG4gICAgaWYgKGZvdW5kKSB7XHJcbiAgICAgICAgaWYgKHBhdGgubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgICAgIGlmICghZmlsdGVyVHlwZXMgfHwgZmlsdGVyVHlwZXMuaW5kZXhPZihmb3VuZC5jb25zdHJ1Y3RvcikgPiAtMSlcclxuICAgICAgICAgICAgICAgIHJldHVybiBmb3VuZDtcclxuICAgICAgICB9IGVsc2UgaWYgKGZvdW5kIGluc3RhbmNlb2YgTmFtZXNwYWNlICYmIChmb3VuZCA9IGZvdW5kLmxvb2t1cChwYXRoLnNsaWNlKDEpLCBmaWx0ZXJUeXBlcywgdHJ1ZSkpKVxyXG4gICAgICAgICAgICByZXR1cm4gZm91bmQ7XHJcblxyXG4gICAgLy8gT3RoZXJ3aXNlIHRyeSBlYWNoIG5lc3RlZCBuYW1lc3BhY2VcclxuICAgIH0gZWxzZVxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5uZXN0ZWRBcnJheS5sZW5ndGg7ICsraSlcclxuICAgICAgICAgICAgaWYgKHRoaXMuX25lc3RlZEFycmF5W2ldIGluc3RhbmNlb2YgTmFtZXNwYWNlICYmIChmb3VuZCA9IHRoaXMuX25lc3RlZEFycmF5W2ldLmxvb2t1cChwYXRoLCBmaWx0ZXJUeXBlcywgdHJ1ZSkpKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZvdW5kO1xyXG5cclxuICAgIC8vIElmIHRoZXJlIGhhc24ndCBiZWVuIGEgbWF0Y2gsIHRyeSBhZ2FpbiBhdCB0aGUgcGFyZW50XHJcbiAgICBpZiAodGhpcy5wYXJlbnQgPT09IG51bGwgfHwgcGFyZW50QWxyZWFkeUNoZWNrZWQpXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICByZXR1cm4gdGhpcy5wYXJlbnQubG9va3VwKHBhdGgsIGZpbHRlclR5cGVzKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBMb29rcyB1cCB0aGUgcmVmbGVjdGlvbiBvYmplY3QgYXQgdGhlIHNwZWNpZmllZCBwYXRoLCByZWxhdGl2ZSB0byB0aGlzIG5hbWVzcGFjZS5cclxuICogQG5hbWUgTmFtZXNwYWNlQmFzZSNsb29rdXBcclxuICogQGZ1bmN0aW9uXHJcbiAqIEBwYXJhbSB7c3RyaW5nfHN0cmluZ1tdfSBwYXRoIFBhdGggdG8gbG9vayB1cFxyXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtwYXJlbnRBbHJlYWR5Q2hlY2tlZD1mYWxzZV0gV2hldGhlciB0aGUgcGFyZW50IGhhcyBhbHJlYWR5IGJlZW4gY2hlY2tlZFxyXG4gKiBAcmV0dXJucyB7UmVmbGVjdGlvbk9iamVjdHxudWxsfSBMb29rZWQgdXAgb2JqZWN0IG9yIGBudWxsYCBpZiBub25lIGNvdWxkIGJlIGZvdW5kXHJcbiAqIEB2YXJpYXRpb24gMlxyXG4gKi9cclxuLy8gbG9va3VwKHBhdGg6IHN0cmluZywgW3BhcmVudEFscmVhZHlDaGVja2VkOiBib29sZWFuXSlcclxuXHJcbi8qKlxyXG4gKiBMb29rcyB1cCB0aGUge0BsaW5rIFR5cGV8dHlwZX0gYXQgdGhlIHNwZWNpZmllZCBwYXRoLCByZWxhdGl2ZSB0byB0aGlzIG5hbWVzcGFjZS5cclxuICogQmVzaWRlcyBpdHMgc2lnbmF0dXJlLCB0aGlzIG1ldGhvZHMgZGlmZmVycyBmcm9tIHtAbGluayBOYW1lc3BhY2UjbG9va3VwfGxvb2t1cH0gaW4gdGhhdCBpdCB0aHJvd3MgaW5zdGVhZCBvZiByZXR1cm5pbmcgYG51bGxgLlxyXG4gKiBAcGFyYW0ge3N0cmluZ3xzdHJpbmdbXX0gcGF0aCBQYXRoIHRvIGxvb2sgdXBcclxuICogQHJldHVybnMge1R5cGV9IExvb2tlZCB1cCB0eXBlXHJcbiAqIEB0aHJvd3Mge0Vycm9yfSBJZiBgcGF0aGAgZG9lcyBub3QgcG9pbnQgdG8gYSB0eXBlXHJcbiAqL1xyXG5OYW1lc3BhY2UucHJvdG90eXBlLmxvb2t1cFR5cGUgPSBmdW5jdGlvbiBsb29rdXBUeXBlKHBhdGgpIHtcclxuICAgIHZhciBmb3VuZCA9IHRoaXMubG9va3VwKHBhdGgsIFsgVHlwZSBdKTtcclxuICAgIGlmICghZm91bmQpXHJcbiAgICAgICAgdGhyb3cgRXJyb3IoXCJubyBzdWNoIHR5cGU6IFwiICsgcGF0aCk7XHJcbiAgICByZXR1cm4gZm91bmQ7XHJcbn07XHJcblxyXG4vKipcclxuICogTG9va3MgdXAgdGhlIHZhbHVlcyBvZiB0aGUge0BsaW5rIEVudW18ZW51bX0gYXQgdGhlIHNwZWNpZmllZCBwYXRoLCByZWxhdGl2ZSB0byB0aGlzIG5hbWVzcGFjZS5cclxuICogQmVzaWRlcyBpdHMgc2lnbmF0dXJlLCB0aGlzIG1ldGhvZHMgZGlmZmVycyBmcm9tIHtAbGluayBOYW1lc3BhY2UjbG9va3VwfGxvb2t1cH0gaW4gdGhhdCBpdCB0aHJvd3MgaW5zdGVhZCBvZiByZXR1cm5pbmcgYG51bGxgLlxyXG4gKiBAcGFyYW0ge3N0cmluZ3xzdHJpbmdbXX0gcGF0aCBQYXRoIHRvIGxvb2sgdXBcclxuICogQHJldHVybnMge0VudW19IExvb2tlZCB1cCBlbnVtXHJcbiAqIEB0aHJvd3Mge0Vycm9yfSBJZiBgcGF0aGAgZG9lcyBub3QgcG9pbnQgdG8gYW4gZW51bVxyXG4gKi9cclxuTmFtZXNwYWNlLnByb3RvdHlwZS5sb29rdXBFbnVtID0gZnVuY3Rpb24gbG9va3VwRW51bShwYXRoKSB7XHJcbiAgICB2YXIgZm91bmQgPSB0aGlzLmxvb2t1cChwYXRoLCBbIEVudW0gXSk7XHJcbiAgICBpZiAoIWZvdW5kKVxyXG4gICAgICAgIHRocm93IEVycm9yKFwibm8gc3VjaCBFbnVtICdcIiArIHBhdGggKyBcIicgaW4gXCIgKyB0aGlzKTtcclxuICAgIHJldHVybiBmb3VuZDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBMb29rcyB1cCB0aGUge0BsaW5rIFR5cGV8dHlwZX0gb3Ige0BsaW5rIEVudW18ZW51bX0gYXQgdGhlIHNwZWNpZmllZCBwYXRoLCByZWxhdGl2ZSB0byB0aGlzIG5hbWVzcGFjZS5cclxuICogQmVzaWRlcyBpdHMgc2lnbmF0dXJlLCB0aGlzIG1ldGhvZHMgZGlmZmVycyBmcm9tIHtAbGluayBOYW1lc3BhY2UjbG9va3VwfGxvb2t1cH0gaW4gdGhhdCBpdCB0aHJvd3MgaW5zdGVhZCBvZiByZXR1cm5pbmcgYG51bGxgLlxyXG4gKiBAcGFyYW0ge3N0cmluZ3xzdHJpbmdbXX0gcGF0aCBQYXRoIHRvIGxvb2sgdXBcclxuICogQHJldHVybnMge1R5cGV9IExvb2tlZCB1cCB0eXBlIG9yIGVudW1cclxuICogQHRocm93cyB7RXJyb3J9IElmIGBwYXRoYCBkb2VzIG5vdCBwb2ludCB0byBhIHR5cGUgb3IgZW51bVxyXG4gKi9cclxuTmFtZXNwYWNlLnByb3RvdHlwZS5sb29rdXBUeXBlT3JFbnVtID0gZnVuY3Rpb24gbG9va3VwVHlwZU9yRW51bShwYXRoKSB7XHJcbiAgICB2YXIgZm91bmQgPSB0aGlzLmxvb2t1cChwYXRoLCBbIFR5cGUsIEVudW0gXSk7XHJcbiAgICBpZiAoIWZvdW5kKVxyXG4gICAgICAgIHRocm93IEVycm9yKFwibm8gc3VjaCBUeXBlIG9yIEVudW0gJ1wiICsgcGF0aCArIFwiJyBpbiBcIiArIHRoaXMpO1xyXG4gICAgcmV0dXJuIGZvdW5kO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIExvb2tzIHVwIHRoZSB7QGxpbmsgU2VydmljZXxzZXJ2aWNlfSBhdCB0aGUgc3BlY2lmaWVkIHBhdGgsIHJlbGF0aXZlIHRvIHRoaXMgbmFtZXNwYWNlLlxyXG4gKiBCZXNpZGVzIGl0cyBzaWduYXR1cmUsIHRoaXMgbWV0aG9kcyBkaWZmZXJzIGZyb20ge0BsaW5rIE5hbWVzcGFjZSNsb29rdXB8bG9va3VwfSBpbiB0aGF0IGl0IHRocm93cyBpbnN0ZWFkIG9mIHJldHVybmluZyBgbnVsbGAuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfHN0cmluZ1tdfSBwYXRoIFBhdGggdG8gbG9vayB1cFxyXG4gKiBAcmV0dXJucyB7U2VydmljZX0gTG9va2VkIHVwIHNlcnZpY2VcclxuICogQHRocm93cyB7RXJyb3J9IElmIGBwYXRoYCBkb2VzIG5vdCBwb2ludCB0byBhIHNlcnZpY2VcclxuICovXHJcbk5hbWVzcGFjZS5wcm90b3R5cGUubG9va3VwU2VydmljZSA9IGZ1bmN0aW9uIGxvb2t1cFNlcnZpY2UocGF0aCkge1xyXG4gICAgdmFyIGZvdW5kID0gdGhpcy5sb29rdXAocGF0aCwgWyBTZXJ2aWNlIF0pO1xyXG4gICAgaWYgKCFmb3VuZClcclxuICAgICAgICB0aHJvdyBFcnJvcihcIm5vIHN1Y2ggU2VydmljZSAnXCIgKyBwYXRoICsgXCInIGluIFwiICsgdGhpcyk7XHJcbiAgICByZXR1cm4gZm91bmQ7XHJcbn07XHJcblxyXG4vLyBTZXRzIHVwIGN5Y2xpYyBkZXBlbmRlbmNpZXMgKGNhbGxlZCBpbiBpbmRleC1saWdodClcclxuTmFtZXNwYWNlLl9jb25maWd1cmUgPSBmdW5jdGlvbihUeXBlXywgU2VydmljZV8sIEVudW1fKSB7XHJcbiAgICBUeXBlICAgID0gVHlwZV87XHJcbiAgICBTZXJ2aWNlID0gU2VydmljZV87XHJcbiAgICBFbnVtICAgID0gRW51bV87XHJcbn07XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5tb2R1bGUuZXhwb3J0cyA9IFJlZmxlY3Rpb25PYmplY3Q7XHJcblxyXG5SZWZsZWN0aW9uT2JqZWN0LmNsYXNzTmFtZSA9IFwiUmVmbGVjdGlvbk9iamVjdFwiO1xyXG5cclxudmFyIHV0aWwgPSByZXF1aXJlKFwiLi91dGlsXCIpO1xyXG5cclxudmFyIFJvb3Q7IC8vIGN5Y2xpY1xyXG5cclxuLyoqXHJcbiAqIENvbnN0cnVjdHMgYSBuZXcgcmVmbGVjdGlvbiBvYmplY3QgaW5zdGFuY2UuXHJcbiAqIEBjbGFzc2Rlc2MgQmFzZSBjbGFzcyBvZiBhbGwgcmVmbGVjdGlvbiBvYmplY3RzLlxyXG4gKiBAY29uc3RydWN0b3JcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgT2JqZWN0IG5hbWVcclxuICogQHBhcmFtIHtPYmplY3QuPHN0cmluZywqPn0gW29wdGlvbnNdIERlY2xhcmVkIG9wdGlvbnNcclxuICogQGFic3RyYWN0XHJcbiAqL1xyXG5mdW5jdGlvbiBSZWZsZWN0aW9uT2JqZWN0KG5hbWUsIG9wdGlvbnMpIHtcclxuXHJcbiAgICBpZiAoIXV0aWwuaXNTdHJpbmcobmFtZSkpXHJcbiAgICAgICAgdGhyb3cgVHlwZUVycm9yKFwibmFtZSBtdXN0IGJlIGEgc3RyaW5nXCIpO1xyXG5cclxuICAgIGlmIChvcHRpb25zICYmICF1dGlsLmlzT2JqZWN0KG9wdGlvbnMpKVxyXG4gICAgICAgIHRocm93IFR5cGVFcnJvcihcIm9wdGlvbnMgbXVzdCBiZSBhbiBvYmplY3RcIik7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBPcHRpb25zLlxyXG4gICAgICogQHR5cGUge09iamVjdC48c3RyaW5nLCo+fHVuZGVmaW5lZH1cclxuICAgICAqL1xyXG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9uczsgLy8gdG9KU09OXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBVbmlxdWUgbmFtZSB3aXRoaW4gaXRzIG5hbWVzcGFjZS5cclxuICAgICAqIEB0eXBlIHtzdHJpbmd9XHJcbiAgICAgKi9cclxuICAgIHRoaXMubmFtZSA9IG5hbWU7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBQYXJlbnQgbmFtZXNwYWNlLlxyXG4gICAgICogQHR5cGUge05hbWVzcGFjZXxudWxsfVxyXG4gICAgICovXHJcbiAgICB0aGlzLnBhcmVudCA9IG51bGw7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBXaGV0aGVyIGFscmVhZHkgcmVzb2x2ZWQgb3Igbm90LlxyXG4gICAgICogQHR5cGUge2Jvb2xlYW59XHJcbiAgICAgKi9cclxuICAgIHRoaXMucmVzb2x2ZWQgPSBmYWxzZTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIENvbW1lbnQgdGV4dCwgaWYgYW55LlxyXG4gICAgICogQHR5cGUge3N0cmluZ3xudWxsfVxyXG4gICAgICovXHJcbiAgICB0aGlzLmNvbW1lbnQgPSBudWxsO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRGVmaW5pbmcgZmlsZSBuYW1lLlxyXG4gICAgICogQHR5cGUge3N0cmluZ3xudWxsfVxyXG4gICAgICovXHJcbiAgICB0aGlzLmZpbGVuYW1lID0gbnVsbDtcclxufVxyXG5cclxuT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoUmVmbGVjdGlvbk9iamVjdC5wcm90b3R5cGUsIHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlZmVyZW5jZSB0byB0aGUgcm9vdCBuYW1lc3BhY2UuXHJcbiAgICAgKiBAbmFtZSBSZWZsZWN0aW9uT2JqZWN0I3Jvb3RcclxuICAgICAqIEB0eXBlIHtSb290fVxyXG4gICAgICogQHJlYWRvbmx5XHJcbiAgICAgKi9cclxuICAgIHJvb3Q6IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB2YXIgcHRyID0gdGhpcztcclxuICAgICAgICAgICAgd2hpbGUgKHB0ci5wYXJlbnQgIT09IG51bGwpXHJcbiAgICAgICAgICAgICAgICBwdHIgPSBwdHIucGFyZW50O1xyXG4gICAgICAgICAgICByZXR1cm4gcHRyO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGdWxsIG5hbWUgaW5jbHVkaW5nIGxlYWRpbmcgZG90LlxyXG4gICAgICogQG5hbWUgUmVmbGVjdGlvbk9iamVjdCNmdWxsTmFtZVxyXG4gICAgICogQHR5cGUge3N0cmluZ31cclxuICAgICAqIEByZWFkb25seVxyXG4gICAgICovXHJcbiAgICBmdWxsTmFtZToge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHZhciBwYXRoID0gWyB0aGlzLm5hbWUgXSxcclxuICAgICAgICAgICAgICAgIHB0ciA9IHRoaXMucGFyZW50O1xyXG4gICAgICAgICAgICB3aGlsZSAocHRyKSB7XHJcbiAgICAgICAgICAgICAgICBwYXRoLnVuc2hpZnQocHRyLm5hbWUpO1xyXG4gICAgICAgICAgICAgICAgcHRyID0gcHRyLnBhcmVudDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcGF0aC5qb2luKFwiLlwiKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuLyoqXHJcbiAqIENvbnZlcnRzIHRoaXMgcmVmbGVjdGlvbiBvYmplY3QgdG8gaXRzIGRlc2NyaXB0b3IgcmVwcmVzZW50YXRpb24uXHJcbiAqIEByZXR1cm5zIHtPYmplY3QuPHN0cmluZywqPn0gRGVzY3JpcHRvclxyXG4gKiBAYWJzdHJhY3RcclxuICovXHJcblJlZmxlY3Rpb25PYmplY3QucHJvdG90eXBlLnRvSlNPTiA9IC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovIGZ1bmN0aW9uIHRvSlNPTigpIHtcclxuICAgIHRocm93IEVycm9yKCk7IC8vIG5vdCBpbXBsZW1lbnRlZCwgc2hvdWxkbid0IGhhcHBlblxyXG59O1xyXG5cclxuLyoqXHJcbiAqIENhbGxlZCB3aGVuIHRoaXMgb2JqZWN0IGlzIGFkZGVkIHRvIGEgcGFyZW50LlxyXG4gKiBAcGFyYW0ge1JlZmxlY3Rpb25PYmplY3R9IHBhcmVudCBQYXJlbnQgYWRkZWQgdG9cclxuICogQHJldHVybnMge3VuZGVmaW5lZH1cclxuICovXHJcblJlZmxlY3Rpb25PYmplY3QucHJvdG90eXBlLm9uQWRkID0gZnVuY3Rpb24gb25BZGQocGFyZW50KSB7XHJcbiAgICBpZiAodGhpcy5wYXJlbnQgJiYgdGhpcy5wYXJlbnQgIT09IHBhcmVudClcclxuICAgICAgICB0aGlzLnBhcmVudC5yZW1vdmUodGhpcyk7XHJcbiAgICB0aGlzLnBhcmVudCA9IHBhcmVudDtcclxuICAgIHRoaXMucmVzb2x2ZWQgPSBmYWxzZTtcclxuICAgIHZhciByb290ID0gcGFyZW50LnJvb3Q7XHJcbiAgICBpZiAocm9vdCBpbnN0YW5jZW9mIFJvb3QpXHJcbiAgICAgICAgcm9vdC5faGFuZGxlQWRkKHRoaXMpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENhbGxlZCB3aGVuIHRoaXMgb2JqZWN0IGlzIHJlbW92ZWQgZnJvbSBhIHBhcmVudC5cclxuICogQHBhcmFtIHtSZWZsZWN0aW9uT2JqZWN0fSBwYXJlbnQgUGFyZW50IHJlbW92ZWQgZnJvbVxyXG4gKiBAcmV0dXJucyB7dW5kZWZpbmVkfVxyXG4gKi9cclxuUmVmbGVjdGlvbk9iamVjdC5wcm90b3R5cGUub25SZW1vdmUgPSBmdW5jdGlvbiBvblJlbW92ZShwYXJlbnQpIHtcclxuICAgIHZhciByb290ID0gcGFyZW50LnJvb3Q7XHJcbiAgICBpZiAocm9vdCBpbnN0YW5jZW9mIFJvb3QpXHJcbiAgICAgICAgcm9vdC5faGFuZGxlUmVtb3ZlKHRoaXMpO1xyXG4gICAgdGhpcy5wYXJlbnQgPSBudWxsO1xyXG4gICAgdGhpcy5yZXNvbHZlZCA9IGZhbHNlO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlc29sdmVzIHRoaXMgb2JqZWN0cyB0eXBlIHJlZmVyZW5jZXMuXHJcbiAqIEByZXR1cm5zIHtSZWZsZWN0aW9uT2JqZWN0fSBgdGhpc2BcclxuICovXHJcblJlZmxlY3Rpb25PYmplY3QucHJvdG90eXBlLnJlc29sdmUgPSBmdW5jdGlvbiByZXNvbHZlKCkge1xyXG4gICAgaWYgKHRoaXMucmVzb2x2ZWQpXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICBpZiAodGhpcy5yb290IGluc3RhbmNlb2YgUm9vdClcclxuICAgICAgICB0aGlzLnJlc29sdmVkID0gdHJ1ZTsgLy8gb25seSBpZiBwYXJ0IG9mIGEgcm9vdFxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0cyBhbiBvcHRpb24gdmFsdWUuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIE9wdGlvbiBuYW1lXHJcbiAqIEByZXR1cm5zIHsqfSBPcHRpb24gdmFsdWUgb3IgYHVuZGVmaW5lZGAgaWYgbm90IHNldFxyXG4gKi9cclxuUmVmbGVjdGlvbk9iamVjdC5wcm90b3R5cGUuZ2V0T3B0aW9uID0gZnVuY3Rpb24gZ2V0T3B0aW9uKG5hbWUpIHtcclxuICAgIGlmICh0aGlzLm9wdGlvbnMpXHJcbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9uc1tuYW1lXTtcclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbn07XHJcblxyXG4vKipcclxuICogU2V0cyBhbiBvcHRpb24uXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIE9wdGlvbiBuYW1lXHJcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgT3B0aW9uIHZhbHVlXHJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lmTm90U2V0XSBTZXRzIHRoZSBvcHRpb24gb25seSBpZiBpdCBpc24ndCBjdXJyZW50bHkgc2V0XHJcbiAqIEByZXR1cm5zIHtSZWZsZWN0aW9uT2JqZWN0fSBgdGhpc2BcclxuICovXHJcblJlZmxlY3Rpb25PYmplY3QucHJvdG90eXBlLnNldE9wdGlvbiA9IGZ1bmN0aW9uIHNldE9wdGlvbihuYW1lLCB2YWx1ZSwgaWZOb3RTZXQpIHtcclxuICAgIGlmICghaWZOb3RTZXQgfHwgIXRoaXMub3B0aW9ucyB8fCB0aGlzLm9wdGlvbnNbbmFtZV0gPT09IHVuZGVmaW5lZClcclxuICAgICAgICAodGhpcy5vcHRpb25zIHx8ICh0aGlzLm9wdGlvbnMgPSB7fSkpW25hbWVdID0gdmFsdWU7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXRzIG11bHRpcGxlIG9wdGlvbnMuXHJcbiAqIEBwYXJhbSB7T2JqZWN0LjxzdHJpbmcsKj59IG9wdGlvbnMgT3B0aW9ucyB0byBzZXRcclxuICogQHBhcmFtIHtib29sZWFufSBbaWZOb3RTZXRdIFNldHMgYW4gb3B0aW9uIG9ubHkgaWYgaXQgaXNuJ3QgY3VycmVudGx5IHNldFxyXG4gKiBAcmV0dXJucyB7UmVmbGVjdGlvbk9iamVjdH0gYHRoaXNgXHJcbiAqL1xyXG5SZWZsZWN0aW9uT2JqZWN0LnByb3RvdHlwZS5zZXRPcHRpb25zID0gZnVuY3Rpb24gc2V0T3B0aW9ucyhvcHRpb25zLCBpZk5vdFNldCkge1xyXG4gICAgaWYgKG9wdGlvbnMpXHJcbiAgICAgICAgZm9yICh2YXIga2V5cyA9IE9iamVjdC5rZXlzKG9wdGlvbnMpLCBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyArK2kpXHJcbiAgICAgICAgICAgIHRoaXMuc2V0T3B0aW9uKGtleXNbaV0sIG9wdGlvbnNba2V5c1tpXV0sIGlmTm90U2V0KTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENvbnZlcnRzIHRoaXMgaW5zdGFuY2UgdG8gaXRzIHN0cmluZyByZXByZXNlbnRhdGlvbi5cclxuICogQHJldHVybnMge3N0cmluZ30gQ2xhc3MgbmFtZVssIHNwYWNlLCBmdWxsIG5hbWVdXHJcbiAqL1xyXG5SZWZsZWN0aW9uT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nKCkge1xyXG4gICAgdmFyIGNsYXNzTmFtZSA9IHRoaXMuY29uc3RydWN0b3IuY2xhc3NOYW1lLFxyXG4gICAgICAgIGZ1bGxOYW1lICA9IHRoaXMuZnVsbE5hbWU7XHJcbiAgICBpZiAoZnVsbE5hbWUubGVuZ3RoKVxyXG4gICAgICAgIHJldHVybiBjbGFzc05hbWUgKyBcIiBcIiArIGZ1bGxOYW1lO1xyXG4gICAgcmV0dXJuIGNsYXNzTmFtZTtcclxufTtcclxuXHJcbi8vIFNldHMgdXAgY3ljbGljIGRlcGVuZGVuY2llcyAoY2FsbGVkIGluIGluZGV4LWxpZ2h0KVxyXG5SZWZsZWN0aW9uT2JqZWN0Ll9jb25maWd1cmUgPSBmdW5jdGlvbihSb290Xykge1xyXG4gICAgUm9vdCA9IFJvb3RfO1xyXG59O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxubW9kdWxlLmV4cG9ydHMgPSBPbmVPZjtcclxuXHJcbi8vIGV4dGVuZHMgUmVmbGVjdGlvbk9iamVjdFxyXG52YXIgUmVmbGVjdGlvbk9iamVjdCA9IHJlcXVpcmUoXCIuL29iamVjdFwiKTtcclxuKChPbmVPZi5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFJlZmxlY3Rpb25PYmplY3QucHJvdG90eXBlKSkuY29uc3RydWN0b3IgPSBPbmVPZikuY2xhc3NOYW1lID0gXCJPbmVPZlwiO1xyXG5cclxudmFyIEZpZWxkID0gcmVxdWlyZShcIi4vZmllbGRcIiksXHJcbiAgICB1dGlsICA9IHJlcXVpcmUoXCIuL3V0aWxcIik7XHJcblxyXG4vKipcclxuICogQ29uc3RydWN0cyBhIG5ldyBvbmVvZiBpbnN0YW5jZS5cclxuICogQGNsYXNzZGVzYyBSZWZsZWN0ZWQgb25lb2YuXHJcbiAqIEBleHRlbmRzIFJlZmxlY3Rpb25PYmplY3RcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIE9uZW9mIG5hbWVcclxuICogQHBhcmFtIHtzdHJpbmdbXXxPYmplY3QuPHN0cmluZywqPn0gW2ZpZWxkTmFtZXNdIEZpZWxkIG5hbWVzXHJcbiAqIEBwYXJhbSB7T2JqZWN0LjxzdHJpbmcsKj59IFtvcHRpb25zXSBEZWNsYXJlZCBvcHRpb25zXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBbY29tbWVudF0gQ29tbWVudCBhc3NvY2lhdGVkIHdpdGggdGhpcyBmaWVsZFxyXG4gKi9cclxuZnVuY3Rpb24gT25lT2YobmFtZSwgZmllbGROYW1lcywgb3B0aW9ucywgY29tbWVudCkge1xyXG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGZpZWxkTmFtZXMpKSB7XHJcbiAgICAgICAgb3B0aW9ucyA9IGZpZWxkTmFtZXM7XHJcbiAgICAgICAgZmllbGROYW1lcyA9IHVuZGVmaW5lZDtcclxuICAgIH1cclxuICAgIFJlZmxlY3Rpb25PYmplY3QuY2FsbCh0aGlzLCBuYW1lLCBvcHRpb25zKTtcclxuXHJcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cclxuICAgIGlmICghKGZpZWxkTmFtZXMgPT09IHVuZGVmaW5lZCB8fCBBcnJheS5pc0FycmF5KGZpZWxkTmFtZXMpKSlcclxuICAgICAgICB0aHJvdyBUeXBlRXJyb3IoXCJmaWVsZE5hbWVzIG11c3QgYmUgYW4gQXJyYXlcIik7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaWVsZCBuYW1lcyB0aGF0IGJlbG9uZyB0byB0aGlzIG9uZW9mLlxyXG4gICAgICogQHR5cGUge3N0cmluZ1tdfVxyXG4gICAgICovXHJcbiAgICB0aGlzLm9uZW9mID0gZmllbGROYW1lcyB8fCBbXTsgLy8gdG9KU09OLCBtYXJrZXJcclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpZWxkcyB0aGF0IGJlbG9uZyB0byB0aGlzIG9uZW9mIGFzIGFuIGFycmF5IGZvciBpdGVyYXRpb24uXHJcbiAgICAgKiBAdHlwZSB7RmllbGRbXX1cclxuICAgICAqIEByZWFkb25seVxyXG4gICAgICovXHJcbiAgICB0aGlzLmZpZWxkc0FycmF5ID0gW107IC8vIGRlY2xhcmVkIHJlYWRvbmx5IGZvciBjb25mb3JtYW5jZSwgcG9zc2libHkgbm90IHlldCBhZGRlZCB0byBwYXJlbnRcclxuXHJcbiAgICAvKipcclxuICAgICAqIENvbW1lbnQgZm9yIHRoaXMgZmllbGQuXHJcbiAgICAgKiBAdHlwZSB7c3RyaW5nfG51bGx9XHJcbiAgICAgKi9cclxuICAgIHRoaXMuY29tbWVudCA9IGNvbW1lbnQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBPbmVvZiBkZXNjcmlwdG9yLlxyXG4gKiBAaW50ZXJmYWNlIElPbmVPZlxyXG4gKiBAcHJvcGVydHkge0FycmF5LjxzdHJpbmc+fSBvbmVvZiBPbmVvZiBmaWVsZCBuYW1lc1xyXG4gKiBAcHJvcGVydHkge09iamVjdC48c3RyaW5nLCo+fSBbb3B0aW9uc10gT25lb2Ygb3B0aW9uc1xyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBDb25zdHJ1Y3RzIGEgb25lb2YgZnJvbSBhIG9uZW9mIGRlc2NyaXB0b3IuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIE9uZW9mIG5hbWVcclxuICogQHBhcmFtIHtJT25lT2Z9IGpzb24gT25lb2YgZGVzY3JpcHRvclxyXG4gKiBAcmV0dXJucyB7T25lT2Z9IENyZWF0ZWQgb25lb2ZcclxuICogQHRocm93cyB7VHlwZUVycm9yfSBJZiBhcmd1bWVudHMgYXJlIGludmFsaWRcclxuICovXHJcbk9uZU9mLmZyb21KU09OID0gZnVuY3Rpb24gZnJvbUpTT04obmFtZSwganNvbikge1xyXG4gICAgcmV0dXJuIG5ldyBPbmVPZihuYW1lLCBqc29uLm9uZW9mLCBqc29uLm9wdGlvbnMsIGpzb24uY29tbWVudCk7XHJcbn07XHJcblxyXG4vKipcclxuICogQ29udmVydHMgdGhpcyBvbmVvZiB0byBhIG9uZW9mIGRlc2NyaXB0b3IuXHJcbiAqIEBwYXJhbSB7SVRvSlNPTk9wdGlvbnN9IFt0b0pTT05PcHRpb25zXSBKU09OIGNvbnZlcnNpb24gb3B0aW9uc1xyXG4gKiBAcmV0dXJucyB7SU9uZU9mfSBPbmVvZiBkZXNjcmlwdG9yXHJcbiAqL1xyXG5PbmVPZi5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24gdG9KU09OKHRvSlNPTk9wdGlvbnMpIHtcclxuICAgIHZhciBrZWVwQ29tbWVudHMgPSB0b0pTT05PcHRpb25zID8gQm9vbGVhbih0b0pTT05PcHRpb25zLmtlZXBDb21tZW50cykgOiBmYWxzZTtcclxuICAgIHJldHVybiB1dGlsLnRvT2JqZWN0KFtcclxuICAgICAgICBcIm9wdGlvbnNcIiAsIHRoaXMub3B0aW9ucyxcclxuICAgICAgICBcIm9uZW9mXCIgICAsIHRoaXMub25lb2YsXHJcbiAgICAgICAgXCJjb21tZW50XCIgLCBrZWVwQ29tbWVudHMgPyB0aGlzLmNvbW1lbnQgOiB1bmRlZmluZWRcclxuICAgIF0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEFkZHMgdGhlIGZpZWxkcyBvZiB0aGUgc3BlY2lmaWVkIG9uZW9mIHRvIHRoZSBwYXJlbnQgaWYgbm90IGFscmVhZHkgZG9uZSBzby5cclxuICogQHBhcmFtIHtPbmVPZn0gb25lb2YgVGhlIG9uZW9mXHJcbiAqIEByZXR1cm5zIHt1bmRlZmluZWR9XHJcbiAqIEBpbm5lclxyXG4gKiBAaWdub3JlXHJcbiAqL1xyXG5mdW5jdGlvbiBhZGRGaWVsZHNUb1BhcmVudChvbmVvZikge1xyXG4gICAgaWYgKG9uZW9mLnBhcmVudClcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9uZW9mLmZpZWxkc0FycmF5Lmxlbmd0aDsgKytpKVxyXG4gICAgICAgICAgICBpZiAoIW9uZW9mLmZpZWxkc0FycmF5W2ldLnBhcmVudClcclxuICAgICAgICAgICAgICAgIG9uZW9mLnBhcmVudC5hZGQob25lb2YuZmllbGRzQXJyYXlbaV0pO1xyXG59XHJcblxyXG4vKipcclxuICogQWRkcyBhIGZpZWxkIHRvIHRoaXMgb25lb2YgYW5kIHJlbW92ZXMgaXQgZnJvbSBpdHMgY3VycmVudCBwYXJlbnQsIGlmIGFueS5cclxuICogQHBhcmFtIHtGaWVsZH0gZmllbGQgRmllbGQgdG8gYWRkXHJcbiAqIEByZXR1cm5zIHtPbmVPZn0gYHRoaXNgXHJcbiAqL1xyXG5PbmVPZi5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gYWRkKGZpZWxkKSB7XHJcblxyXG4gICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXHJcbiAgICBpZiAoIShmaWVsZCBpbnN0YW5jZW9mIEZpZWxkKSlcclxuICAgICAgICB0aHJvdyBUeXBlRXJyb3IoXCJmaWVsZCBtdXN0IGJlIGEgRmllbGRcIik7XHJcblxyXG4gICAgaWYgKGZpZWxkLnBhcmVudCAmJiBmaWVsZC5wYXJlbnQgIT09IHRoaXMucGFyZW50KVxyXG4gICAgICAgIGZpZWxkLnBhcmVudC5yZW1vdmUoZmllbGQpO1xyXG4gICAgdGhpcy5vbmVvZi5wdXNoKGZpZWxkLm5hbWUpO1xyXG4gICAgdGhpcy5maWVsZHNBcnJheS5wdXNoKGZpZWxkKTtcclxuICAgIGZpZWxkLnBhcnRPZiA9IHRoaXM7IC8vIGZpZWxkLnBhcmVudCByZW1haW5zIG51bGxcclxuICAgIGFkZEZpZWxkc1RvUGFyZW50KHRoaXMpO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVtb3ZlcyBhIGZpZWxkIGZyb20gdGhpcyBvbmVvZiBhbmQgcHV0cyBpdCBiYWNrIHRvIHRoZSBvbmVvZidzIHBhcmVudC5cclxuICogQHBhcmFtIHtGaWVsZH0gZmllbGQgRmllbGQgdG8gcmVtb3ZlXHJcbiAqIEByZXR1cm5zIHtPbmVPZn0gYHRoaXNgXHJcbiAqL1xyXG5PbmVPZi5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24gcmVtb3ZlKGZpZWxkKSB7XHJcblxyXG4gICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXHJcbiAgICBpZiAoIShmaWVsZCBpbnN0YW5jZW9mIEZpZWxkKSlcclxuICAgICAgICB0aHJvdyBUeXBlRXJyb3IoXCJmaWVsZCBtdXN0IGJlIGEgRmllbGRcIik7XHJcblxyXG4gICAgdmFyIGluZGV4ID0gdGhpcy5maWVsZHNBcnJheS5pbmRleE9mKGZpZWxkKTtcclxuXHJcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cclxuICAgIGlmIChpbmRleCA8IDApXHJcbiAgICAgICAgdGhyb3cgRXJyb3IoZmllbGQgKyBcIiBpcyBub3QgYSBtZW1iZXIgb2YgXCIgKyB0aGlzKTtcclxuXHJcbiAgICB0aGlzLmZpZWxkc0FycmF5LnNwbGljZShpbmRleCwgMSk7XHJcbiAgICBpbmRleCA9IHRoaXMub25lb2YuaW5kZXhPZihmaWVsZC5uYW1lKTtcclxuXHJcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgZWxzZSAqL1xyXG4gICAgaWYgKGluZGV4ID4gLTEpIC8vIHRoZW9yZXRpY2FsXHJcbiAgICAgICAgdGhpcy5vbmVvZi5zcGxpY2UoaW5kZXgsIDEpO1xyXG5cclxuICAgIGZpZWxkLnBhcnRPZiA9IG51bGw7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBAb3ZlcnJpZGVcclxuICovXHJcbk9uZU9mLnByb3RvdHlwZS5vbkFkZCA9IGZ1bmN0aW9uIG9uQWRkKHBhcmVudCkge1xyXG4gICAgUmVmbGVjdGlvbk9iamVjdC5wcm90b3R5cGUub25BZGQuY2FsbCh0aGlzLCBwYXJlbnQpO1xyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgLy8gQ29sbGVjdCBwcmVzZW50IGZpZWxkc1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm9uZW9mLmxlbmd0aDsgKytpKSB7XHJcbiAgICAgICAgdmFyIGZpZWxkID0gcGFyZW50LmdldCh0aGlzLm9uZW9mW2ldKTtcclxuICAgICAgICBpZiAoZmllbGQgJiYgIWZpZWxkLnBhcnRPZikge1xyXG4gICAgICAgICAgICBmaWVsZC5wYXJ0T2YgPSBzZWxmO1xyXG4gICAgICAgICAgICBzZWxmLmZpZWxkc0FycmF5LnB1c2goZmllbGQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIEFkZCBub3QgeWV0IHByZXNlbnQgZmllbGRzXHJcbiAgICBhZGRGaWVsZHNUb1BhcmVudCh0aGlzKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBAb3ZlcnJpZGVcclxuICovXHJcbk9uZU9mLnByb3RvdHlwZS5vblJlbW92ZSA9IGZ1bmN0aW9uIG9uUmVtb3ZlKHBhcmVudCkge1xyXG4gICAgZm9yICh2YXIgaSA9IDAsIGZpZWxkOyBpIDwgdGhpcy5maWVsZHNBcnJheS5sZW5ndGg7ICsraSlcclxuICAgICAgICBpZiAoKGZpZWxkID0gdGhpcy5maWVsZHNBcnJheVtpXSkucGFyZW50KVxyXG4gICAgICAgICAgICBmaWVsZC5wYXJlbnQucmVtb3ZlKGZpZWxkKTtcclxuICAgIFJlZmxlY3Rpb25PYmplY3QucHJvdG90eXBlLm9uUmVtb3ZlLmNhbGwodGhpcywgcGFyZW50KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBEZWNvcmF0b3IgZnVuY3Rpb24gYXMgcmV0dXJuZWQgYnkge0BsaW5rIE9uZU9mLmR9IChUeXBlU2NyaXB0KS5cclxuICogQHR5cGVkZWYgT25lT2ZEZWNvcmF0b3JcclxuICogQHR5cGUge2Z1bmN0aW9ufVxyXG4gKiBAcGFyYW0ge09iamVjdH0gcHJvdG90eXBlIFRhcmdldCBwcm90b3R5cGVcclxuICogQHBhcmFtIHtzdHJpbmd9IG9uZW9mTmFtZSBPbmVPZiBuYW1lXHJcbiAqIEByZXR1cm5zIHt1bmRlZmluZWR9XHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIE9uZU9mIGRlY29yYXRvciAoVHlwZVNjcmlwdCkuXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcGFyYW0gey4uLnN0cmluZ30gZmllbGROYW1lcyBGaWVsZCBuYW1lc1xyXG4gKiBAcmV0dXJucyB7T25lT2ZEZWNvcmF0b3J9IERlY29yYXRvciBmdW5jdGlvblxyXG4gKiBAdGVtcGxhdGUgVCBleHRlbmRzIHN0cmluZ1xyXG4gKi9cclxuT25lT2YuZCA9IGZ1bmN0aW9uIGRlY29yYXRlT25lT2YoKSB7XHJcbiAgICB2YXIgZmllbGROYW1lcyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoKSxcclxuICAgICAgICBpbmRleCA9IDA7XHJcbiAgICB3aGlsZSAoaW5kZXggPCBhcmd1bWVudHMubGVuZ3RoKVxyXG4gICAgICAgIGZpZWxkTmFtZXNbaW5kZXhdID0gYXJndW1lbnRzW2luZGV4KytdO1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uIG9uZU9mRGVjb3JhdG9yKHByb3RvdHlwZSwgb25lb2ZOYW1lKSB7XHJcbiAgICAgICAgdXRpbC5kZWNvcmF0ZVR5cGUocHJvdG90eXBlLmNvbnN0cnVjdG9yKVxyXG4gICAgICAgICAgICAuYWRkKG5ldyBPbmVPZihvbmVvZk5hbWUsIGZpZWxkTmFtZXMpKTtcclxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG90eXBlLCBvbmVvZk5hbWUsIHtcclxuICAgICAgICAgICAgZ2V0OiB1dGlsLm9uZU9mR2V0dGVyKGZpZWxkTmFtZXMpLFxyXG4gICAgICAgICAgICBzZXQ6IHV0aWwub25lT2ZTZXR0ZXIoZmllbGROYW1lcylcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbn07XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWRlcjtcclxuXHJcbnZhciB1dGlsICAgICAgPSByZXF1aXJlKFwiLi91dGlsL21pbmltYWxcIik7XHJcblxyXG52YXIgQnVmZmVyUmVhZGVyOyAvLyBjeWNsaWNcclxuXHJcbnZhciBMb25nQml0cyAgPSB1dGlsLkxvbmdCaXRzLFxyXG4gICAgdXRmOCAgICAgID0gdXRpbC51dGY4O1xyXG5cclxuLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuZnVuY3Rpb24gaW5kZXhPdXRPZlJhbmdlKHJlYWRlciwgd3JpdGVMZW5ndGgpIHtcclxuICAgIHJldHVybiBSYW5nZUVycm9yKFwiaW5kZXggb3V0IG9mIHJhbmdlOiBcIiArIHJlYWRlci5wb3MgKyBcIiArIFwiICsgKHdyaXRlTGVuZ3RoIHx8IDEpICsgXCIgPiBcIiArIHJlYWRlci5sZW4pO1xyXG59XHJcblxyXG4vKipcclxuICogQ29uc3RydWN0cyBhIG5ldyByZWFkZXIgaW5zdGFuY2UgdXNpbmcgdGhlIHNwZWNpZmllZCBidWZmZXIuXHJcbiAqIEBjbGFzc2Rlc2MgV2lyZSBmb3JtYXQgcmVhZGVyIHVzaW5nIGBVaW50OEFycmF5YCBpZiBhdmFpbGFibGUsIG90aGVyd2lzZSBgQXJyYXlgLlxyXG4gKiBAY29uc3RydWN0b3JcclxuICogQHBhcmFtIHtVaW50OEFycmF5fSBidWZmZXIgQnVmZmVyIHRvIHJlYWQgZnJvbVxyXG4gKi9cclxuZnVuY3Rpb24gUmVhZGVyKGJ1ZmZlcikge1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVhZCBidWZmZXIuXHJcbiAgICAgKiBAdHlwZSB7VWludDhBcnJheX1cclxuICAgICAqL1xyXG4gICAgdGhpcy5idWYgPSBidWZmZXI7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZWFkIGJ1ZmZlciBwb3NpdGlvbi5cclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIHRoaXMucG9zID0gMDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlYWQgYnVmZmVyIGxlbmd0aC5cclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIHRoaXMubGVuID0gYnVmZmVyLmxlbmd0aDtcclxufVxyXG5cclxudmFyIGNyZWF0ZV9hcnJheSA9IHR5cGVvZiBVaW50OEFycmF5ICE9PSBcInVuZGVmaW5lZFwiXHJcbiAgICA/IGZ1bmN0aW9uIGNyZWF0ZV90eXBlZF9hcnJheShidWZmZXIpIHtcclxuICAgICAgICBpZiAoYnVmZmVyIGluc3RhbmNlb2YgVWludDhBcnJheSB8fCBBcnJheS5pc0FycmF5KGJ1ZmZlcikpXHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgUmVhZGVyKGJ1ZmZlcik7XHJcbiAgICAgICAgdGhyb3cgRXJyb3IoXCJpbGxlZ2FsIGJ1ZmZlclwiKTtcclxuICAgIH1cclxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICA6IGZ1bmN0aW9uIGNyZWF0ZV9hcnJheShidWZmZXIpIHtcclxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShidWZmZXIpKVxyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFJlYWRlcihidWZmZXIpO1xyXG4gICAgICAgIHRocm93IEVycm9yKFwiaWxsZWdhbCBidWZmZXJcIik7XHJcbiAgICB9O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBuZXcgcmVhZGVyIHVzaW5nIHRoZSBzcGVjaWZpZWQgYnVmZmVyLlxyXG4gKiBAZnVuY3Rpb25cclxuICogQHBhcmFtIHtVaW50OEFycmF5fEJ1ZmZlcn0gYnVmZmVyIEJ1ZmZlciB0byByZWFkIGZyb21cclxuICogQHJldHVybnMge1JlYWRlcnxCdWZmZXJSZWFkZXJ9IEEge0BsaW5rIEJ1ZmZlclJlYWRlcn0gaWYgYGJ1ZmZlcmAgaXMgYSBCdWZmZXIsIG90aGVyd2lzZSBhIHtAbGluayBSZWFkZXJ9XHJcbiAqIEB0aHJvd3Mge0Vycm9yfSBJZiBgYnVmZmVyYCBpcyBub3QgYSB2YWxpZCBidWZmZXJcclxuICovXHJcblJlYWRlci5jcmVhdGUgPSB1dGlsLkJ1ZmZlclxyXG4gICAgPyBmdW5jdGlvbiBjcmVhdGVfYnVmZmVyX3NldHVwKGJ1ZmZlcikge1xyXG4gICAgICAgIHJldHVybiAoUmVhZGVyLmNyZWF0ZSA9IGZ1bmN0aW9uIGNyZWF0ZV9idWZmZXIoYnVmZmVyKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB1dGlsLkJ1ZmZlci5pc0J1ZmZlcihidWZmZXIpXHJcbiAgICAgICAgICAgICAgICA/IG5ldyBCdWZmZXJSZWFkZXIoYnVmZmVyKVxyXG4gICAgICAgICAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgICAgICAgICAgICAgIDogY3JlYXRlX2FycmF5KGJ1ZmZlcik7XHJcbiAgICAgICAgfSkoYnVmZmVyKTtcclxuICAgIH1cclxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICA6IGNyZWF0ZV9hcnJheTtcclxuXHJcblJlYWRlci5wcm90b3R5cGUuX3NsaWNlID0gdXRpbC5BcnJheS5wcm90b3R5cGUuc3ViYXJyYXkgfHwgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi8gdXRpbC5BcnJheS5wcm90b3R5cGUuc2xpY2U7XHJcblxyXG4vKipcclxuICogUmVhZHMgYSB2YXJpbnQgYXMgYW4gdW5zaWduZWQgMzIgYml0IHZhbHVlLlxyXG4gKiBAZnVuY3Rpb25cclxuICogQHJldHVybnMge251bWJlcn0gVmFsdWUgcmVhZFxyXG4gKi9cclxuUmVhZGVyLnByb3RvdHlwZS51aW50MzIgPSAoZnVuY3Rpb24gcmVhZF91aW50MzJfc2V0dXAoKSB7XHJcbiAgICB2YXIgdmFsdWUgPSA0Mjk0OTY3Mjk1OyAvLyBvcHRpbWl6ZXIgdHlwZS1oaW50LCB0ZW5kcyB0byBkZW9wdCBvdGhlcndpc2UgKD8hKVxyXG4gICAgcmV0dXJuIGZ1bmN0aW9uIHJlYWRfdWludDMyKCkge1xyXG4gICAgICAgIHZhbHVlID0gKCAgICAgICAgIHRoaXMuYnVmW3RoaXMucG9zXSAmIDEyNyAgICAgICApID4+PiAwOyBpZiAodGhpcy5idWZbdGhpcy5wb3MrK10gPCAxMjgpIHJldHVybiB2YWx1ZTtcclxuICAgICAgICB2YWx1ZSA9ICh2YWx1ZSB8ICh0aGlzLmJ1Zlt0aGlzLnBvc10gJiAxMjcpIDw8ICA3KSA+Pj4gMDsgaWYgKHRoaXMuYnVmW3RoaXMucG9zKytdIDwgMTI4KSByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgdmFsdWUgPSAodmFsdWUgfCAodGhpcy5idWZbdGhpcy5wb3NdICYgMTI3KSA8PCAxNCkgPj4+IDA7IGlmICh0aGlzLmJ1Zlt0aGlzLnBvcysrXSA8IDEyOCkgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIHZhbHVlID0gKHZhbHVlIHwgKHRoaXMuYnVmW3RoaXMucG9zXSAmIDEyNykgPDwgMjEpID4+PiAwOyBpZiAodGhpcy5idWZbdGhpcy5wb3MrK10gPCAxMjgpIHJldHVybiB2YWx1ZTtcclxuICAgICAgICB2YWx1ZSA9ICh2YWx1ZSB8ICh0aGlzLmJ1Zlt0aGlzLnBvc10gJiAgMTUpIDw8IDI4KSA+Pj4gMDsgaWYgKHRoaXMuYnVmW3RoaXMucG9zKytdIDwgMTI4KSByZXR1cm4gdmFsdWU7XHJcblxyXG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xyXG4gICAgICAgIGlmICgodGhpcy5wb3MgKz0gNSkgPiB0aGlzLmxlbikge1xyXG4gICAgICAgICAgICB0aGlzLnBvcyA9IHRoaXMubGVuO1xyXG4gICAgICAgICAgICB0aHJvdyBpbmRleE91dE9mUmFuZ2UodGhpcywgMTApO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICB9O1xyXG59KSgpO1xyXG5cclxuLyoqXHJcbiAqIFJlYWRzIGEgdmFyaW50IGFzIGEgc2lnbmVkIDMyIGJpdCB2YWx1ZS5cclxuICogQHJldHVybnMge251bWJlcn0gVmFsdWUgcmVhZFxyXG4gKi9cclxuUmVhZGVyLnByb3RvdHlwZS5pbnQzMiA9IGZ1bmN0aW9uIHJlYWRfaW50MzIoKSB7XHJcbiAgICByZXR1cm4gdGhpcy51aW50MzIoKSB8IDA7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVhZHMgYSB6aWctemFnIGVuY29kZWQgdmFyaW50IGFzIGEgc2lnbmVkIDMyIGJpdCB2YWx1ZS5cclxuICogQHJldHVybnMge251bWJlcn0gVmFsdWUgcmVhZFxyXG4gKi9cclxuUmVhZGVyLnByb3RvdHlwZS5zaW50MzIgPSBmdW5jdGlvbiByZWFkX3NpbnQzMigpIHtcclxuICAgIHZhciB2YWx1ZSA9IHRoaXMudWludDMyKCk7XHJcbiAgICByZXR1cm4gdmFsdWUgPj4+IDEgXiAtKHZhbHVlICYgMSkgfCAwO1xyXG59O1xyXG5cclxuLyogZXNsaW50LWRpc2FibGUgbm8taW52YWxpZC10aGlzICovXHJcblxyXG5mdW5jdGlvbiByZWFkTG9uZ1ZhcmludCgpIHtcclxuICAgIC8vIHRlbmRzIHRvIGRlb3B0IHdpdGggbG9jYWwgdmFycyBmb3Igb2N0ZXQgZXRjLlxyXG4gICAgdmFyIGJpdHMgPSBuZXcgTG9uZ0JpdHMoMCwgMCk7XHJcbiAgICB2YXIgaSA9IDA7XHJcbiAgICBpZiAodGhpcy5sZW4gLSB0aGlzLnBvcyA+IDQpIHsgLy8gZmFzdCByb3V0ZSAobG8pXHJcbiAgICAgICAgZm9yICg7IGkgPCA0OyArK2kpIHtcclxuICAgICAgICAgICAgLy8gMXN0Li40dGhcclxuICAgICAgICAgICAgYml0cy5sbyA9IChiaXRzLmxvIHwgKHRoaXMuYnVmW3RoaXMucG9zXSAmIDEyNykgPDwgaSAqIDcpID4+PiAwO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5idWZbdGhpcy5wb3MrK10gPCAxMjgpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYml0cztcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gNXRoXHJcbiAgICAgICAgYml0cy5sbyA9IChiaXRzLmxvIHwgKHRoaXMuYnVmW3RoaXMucG9zXSAmIDEyNykgPDwgMjgpID4+PiAwO1xyXG4gICAgICAgIGJpdHMuaGkgPSAoYml0cy5oaSB8ICh0aGlzLmJ1Zlt0aGlzLnBvc10gJiAxMjcpID4+ICA0KSA+Pj4gMDtcclxuICAgICAgICBpZiAodGhpcy5idWZbdGhpcy5wb3MrK10gPCAxMjgpXHJcbiAgICAgICAgICAgIHJldHVybiBiaXRzO1xyXG4gICAgICAgIGkgPSAwO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBmb3IgKDsgaSA8IDM7ICsraSkge1xyXG4gICAgICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cclxuICAgICAgICAgICAgaWYgKHRoaXMucG9zID49IHRoaXMubGVuKVxyXG4gICAgICAgICAgICAgICAgdGhyb3cgaW5kZXhPdXRPZlJhbmdlKHRoaXMpO1xyXG4gICAgICAgICAgICAvLyAxc3QuLjN0aFxyXG4gICAgICAgICAgICBiaXRzLmxvID0gKGJpdHMubG8gfCAodGhpcy5idWZbdGhpcy5wb3NdICYgMTI3KSA8PCBpICogNykgPj4+IDA7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmJ1Zlt0aGlzLnBvcysrXSA8IDEyOClcclxuICAgICAgICAgICAgICAgIHJldHVybiBiaXRzO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyA0dGhcclxuICAgICAgICBiaXRzLmxvID0gKGJpdHMubG8gfCAodGhpcy5idWZbdGhpcy5wb3MrK10gJiAxMjcpIDw8IGkgKiA3KSA+Pj4gMDtcclxuICAgICAgICByZXR1cm4gYml0cztcclxuICAgIH1cclxuICAgIGlmICh0aGlzLmxlbiAtIHRoaXMucG9zID4gNCkgeyAvLyBmYXN0IHJvdXRlIChoaSlcclxuICAgICAgICBmb3IgKDsgaSA8IDU7ICsraSkge1xyXG4gICAgICAgICAgICAvLyA2dGguLjEwdGhcclxuICAgICAgICAgICAgYml0cy5oaSA9IChiaXRzLmhpIHwgKHRoaXMuYnVmW3RoaXMucG9zXSAmIDEyNykgPDwgaSAqIDcgKyAzKSA+Pj4gMDtcclxuICAgICAgICAgICAgaWYgKHRoaXMuYnVmW3RoaXMucG9zKytdIDwgMTI4KVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGJpdHM7XHJcbiAgICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBmb3IgKDsgaSA8IDU7ICsraSkge1xyXG4gICAgICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cclxuICAgICAgICAgICAgaWYgKHRoaXMucG9zID49IHRoaXMubGVuKVxyXG4gICAgICAgICAgICAgICAgdGhyb3cgaW5kZXhPdXRPZlJhbmdlKHRoaXMpO1xyXG4gICAgICAgICAgICAvLyA2dGguLjEwdGhcclxuICAgICAgICAgICAgYml0cy5oaSA9IChiaXRzLmhpIHwgKHRoaXMuYnVmW3RoaXMucG9zXSAmIDEyNykgPDwgaSAqIDcgKyAzKSA+Pj4gMDtcclxuICAgICAgICAgICAgaWYgKHRoaXMuYnVmW3RoaXMucG9zKytdIDwgMTI4KVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGJpdHM7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgIHRocm93IEVycm9yKFwiaW52YWxpZCB2YXJpbnQgZW5jb2RpbmdcIik7XHJcbn1cclxuXHJcbi8qIGVzbGludC1lbmFibGUgbm8taW52YWxpZC10aGlzICovXHJcblxyXG4vKipcclxuICogUmVhZHMgYSB2YXJpbnQgYXMgYSBzaWduZWQgNjQgYml0IHZhbHVlLlxyXG4gKiBAbmFtZSBSZWFkZXIjaW50NjRcclxuICogQGZ1bmN0aW9uXHJcbiAqIEByZXR1cm5zIHtMb25nfSBWYWx1ZSByZWFkXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIFJlYWRzIGEgdmFyaW50IGFzIGFuIHVuc2lnbmVkIDY0IGJpdCB2YWx1ZS5cclxuICogQG5hbWUgUmVhZGVyI3VpbnQ2NFxyXG4gKiBAZnVuY3Rpb25cclxuICogQHJldHVybnMge0xvbmd9IFZhbHVlIHJlYWRcclxuICovXHJcblxyXG4vKipcclxuICogUmVhZHMgYSB6aWctemFnIGVuY29kZWQgdmFyaW50IGFzIGEgc2lnbmVkIDY0IGJpdCB2YWx1ZS5cclxuICogQG5hbWUgUmVhZGVyI3NpbnQ2NFxyXG4gKiBAZnVuY3Rpb25cclxuICogQHJldHVybnMge0xvbmd9IFZhbHVlIHJlYWRcclxuICovXHJcblxyXG4vKipcclxuICogUmVhZHMgYSB2YXJpbnQgYXMgYSBib29sZWFuLlxyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gVmFsdWUgcmVhZFxyXG4gKi9cclxuUmVhZGVyLnByb3RvdHlwZS5ib29sID0gZnVuY3Rpb24gcmVhZF9ib29sKCkge1xyXG4gICAgcmV0dXJuIHRoaXMudWludDMyKCkgIT09IDA7XHJcbn07XHJcblxyXG5mdW5jdGlvbiByZWFkRml4ZWQzMl9lbmQoYnVmLCBlbmQpIHsgLy8gbm90ZSB0aGF0IHRoaXMgdXNlcyBgZW5kYCwgbm90IGBwb3NgXHJcbiAgICByZXR1cm4gKGJ1ZltlbmQgLSA0XVxyXG4gICAgICAgICAgfCBidWZbZW5kIC0gM10gPDwgOFxyXG4gICAgICAgICAgfCBidWZbZW5kIC0gMl0gPDwgMTZcclxuICAgICAgICAgIHwgYnVmW2VuZCAtIDFdIDw8IDI0KSA+Pj4gMDtcclxufVxyXG5cclxuLyoqXHJcbiAqIFJlYWRzIGZpeGVkIDMyIGJpdHMgYXMgYW4gdW5zaWduZWQgMzIgYml0IGludGVnZXIuXHJcbiAqIEByZXR1cm5zIHtudW1iZXJ9IFZhbHVlIHJlYWRcclxuICovXHJcblJlYWRlci5wcm90b3R5cGUuZml4ZWQzMiA9IGZ1bmN0aW9uIHJlYWRfZml4ZWQzMigpIHtcclxuXHJcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cclxuICAgIGlmICh0aGlzLnBvcyArIDQgPiB0aGlzLmxlbilcclxuICAgICAgICB0aHJvdyBpbmRleE91dE9mUmFuZ2UodGhpcywgNCk7XHJcblxyXG4gICAgcmV0dXJuIHJlYWRGaXhlZDMyX2VuZCh0aGlzLmJ1ZiwgdGhpcy5wb3MgKz0gNCk7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVhZHMgZml4ZWQgMzIgYml0cyBhcyBhIHNpZ25lZCAzMiBiaXQgaW50ZWdlci5cclxuICogQHJldHVybnMge251bWJlcn0gVmFsdWUgcmVhZFxyXG4gKi9cclxuUmVhZGVyLnByb3RvdHlwZS5zZml4ZWQzMiA9IGZ1bmN0aW9uIHJlYWRfc2ZpeGVkMzIoKSB7XHJcblxyXG4gICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXHJcbiAgICBpZiAodGhpcy5wb3MgKyA0ID4gdGhpcy5sZW4pXHJcbiAgICAgICAgdGhyb3cgaW5kZXhPdXRPZlJhbmdlKHRoaXMsIDQpO1xyXG5cclxuICAgIHJldHVybiByZWFkRml4ZWQzMl9lbmQodGhpcy5idWYsIHRoaXMucG9zICs9IDQpIHwgMDtcclxufTtcclxuXHJcbi8qIGVzbGludC1kaXNhYmxlIG5vLWludmFsaWQtdGhpcyAqL1xyXG5cclxuZnVuY3Rpb24gcmVhZEZpeGVkNjQoLyogdGhpczogUmVhZGVyICovKSB7XHJcblxyXG4gICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXHJcbiAgICBpZiAodGhpcy5wb3MgKyA4ID4gdGhpcy5sZW4pXHJcbiAgICAgICAgdGhyb3cgaW5kZXhPdXRPZlJhbmdlKHRoaXMsIDgpO1xyXG5cclxuICAgIHJldHVybiBuZXcgTG9uZ0JpdHMocmVhZEZpeGVkMzJfZW5kKHRoaXMuYnVmLCB0aGlzLnBvcyArPSA0KSwgcmVhZEZpeGVkMzJfZW5kKHRoaXMuYnVmLCB0aGlzLnBvcyArPSA0KSk7XHJcbn1cclxuXHJcbi8qIGVzbGludC1lbmFibGUgbm8taW52YWxpZC10aGlzICovXHJcblxyXG4vKipcclxuICogUmVhZHMgZml4ZWQgNjQgYml0cy5cclxuICogQG5hbWUgUmVhZGVyI2ZpeGVkNjRcclxuICogQGZ1bmN0aW9uXHJcbiAqIEByZXR1cm5zIHtMb25nfSBWYWx1ZSByZWFkXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIFJlYWRzIHppZy16YWcgZW5jb2RlZCBmaXhlZCA2NCBiaXRzLlxyXG4gKiBAbmFtZSBSZWFkZXIjc2ZpeGVkNjRcclxuICogQGZ1bmN0aW9uXHJcbiAqIEByZXR1cm5zIHtMb25nfSBWYWx1ZSByZWFkXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIFJlYWRzIGEgZmxvYXQgKDMyIGJpdCkgYXMgYSBudW1iZXIuXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBWYWx1ZSByZWFkXHJcbiAqL1xyXG5SZWFkZXIucHJvdG90eXBlLmZsb2F0ID0gZnVuY3Rpb24gcmVhZF9mbG9hdCgpIHtcclxuXHJcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cclxuICAgIGlmICh0aGlzLnBvcyArIDQgPiB0aGlzLmxlbilcclxuICAgICAgICB0aHJvdyBpbmRleE91dE9mUmFuZ2UodGhpcywgNCk7XHJcblxyXG4gICAgdmFyIHZhbHVlID0gdXRpbC5mbG9hdC5yZWFkRmxvYXRMRSh0aGlzLmJ1ZiwgdGhpcy5wb3MpO1xyXG4gICAgdGhpcy5wb3MgKz0gNDtcclxuICAgIHJldHVybiB2YWx1ZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZWFkcyBhIGRvdWJsZSAoNjQgYml0IGZsb2F0KSBhcyBhIG51bWJlci5cclxuICogQGZ1bmN0aW9uXHJcbiAqIEByZXR1cm5zIHtudW1iZXJ9IFZhbHVlIHJlYWRcclxuICovXHJcblJlYWRlci5wcm90b3R5cGUuZG91YmxlID0gZnVuY3Rpb24gcmVhZF9kb3VibGUoKSB7XHJcblxyXG4gICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXHJcbiAgICBpZiAodGhpcy5wb3MgKyA4ID4gdGhpcy5sZW4pXHJcbiAgICAgICAgdGhyb3cgaW5kZXhPdXRPZlJhbmdlKHRoaXMsIDQpO1xyXG5cclxuICAgIHZhciB2YWx1ZSA9IHV0aWwuZmxvYXQucmVhZERvdWJsZUxFKHRoaXMuYnVmLCB0aGlzLnBvcyk7XHJcbiAgICB0aGlzLnBvcyArPSA4O1xyXG4gICAgcmV0dXJuIHZhbHVlO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlYWRzIGEgc2VxdWVuY2Ugb2YgYnl0ZXMgcHJlY2VlZGVkIGJ5IGl0cyBsZW5ndGggYXMgYSB2YXJpbnQuXHJcbiAqIEByZXR1cm5zIHtVaW50OEFycmF5fSBWYWx1ZSByZWFkXHJcbiAqL1xyXG5SZWFkZXIucHJvdG90eXBlLmJ5dGVzID0gZnVuY3Rpb24gcmVhZF9ieXRlcygpIHtcclxuICAgIHZhciBsZW5ndGggPSB0aGlzLnVpbnQzMigpLFxyXG4gICAgICAgIHN0YXJ0ICA9IHRoaXMucG9zLFxyXG4gICAgICAgIGVuZCAgICA9IHRoaXMucG9zICsgbGVuZ3RoO1xyXG5cclxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xyXG4gICAgaWYgKGVuZCA+IHRoaXMubGVuKVxyXG4gICAgICAgIHRocm93IGluZGV4T3V0T2ZSYW5nZSh0aGlzLCBsZW5ndGgpO1xyXG5cclxuICAgIHRoaXMucG9zICs9IGxlbmd0aDtcclxuICAgIGlmIChBcnJheS5pc0FycmF5KHRoaXMuYnVmKSkgLy8gcGxhaW4gYXJyYXlcclxuICAgICAgICByZXR1cm4gdGhpcy5idWYuc2xpY2Uoc3RhcnQsIGVuZCk7XHJcbiAgICByZXR1cm4gc3RhcnQgPT09IGVuZCAvLyBmaXggZm9yIElFIDEwL1dpbjggYW5kIG90aGVycycgc3ViYXJyYXkgcmV0dXJuaW5nIGFycmF5IG9mIHNpemUgMVxyXG4gICAgICAgID8gbmV3IHRoaXMuYnVmLmNvbnN0cnVjdG9yKDApXHJcbiAgICAgICAgOiB0aGlzLl9zbGljZS5jYWxsKHRoaXMuYnVmLCBzdGFydCwgZW5kKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZWFkcyBhIHN0cmluZyBwcmVjZWVkZWQgYnkgaXRzIGJ5dGUgbGVuZ3RoIGFzIGEgdmFyaW50LlxyXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBWYWx1ZSByZWFkXHJcbiAqL1xyXG5SZWFkZXIucHJvdG90eXBlLnN0cmluZyA9IGZ1bmN0aW9uIHJlYWRfc3RyaW5nKCkge1xyXG4gICAgdmFyIGJ5dGVzID0gdGhpcy5ieXRlcygpO1xyXG4gICAgcmV0dXJuIHV0ZjgucmVhZChieXRlcywgMCwgYnl0ZXMubGVuZ3RoKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTa2lwcyB0aGUgc3BlY2lmaWVkIG51bWJlciBvZiBieXRlcyBpZiBzcGVjaWZpZWQsIG90aGVyd2lzZSBza2lwcyBhIHZhcmludC5cclxuICogQHBhcmFtIHtudW1iZXJ9IFtsZW5ndGhdIExlbmd0aCBpZiBrbm93biwgb3RoZXJ3aXNlIGEgdmFyaW50IGlzIGFzc3VtZWRcclxuICogQHJldHVybnMge1JlYWRlcn0gYHRoaXNgXHJcbiAqL1xyXG5SZWFkZXIucHJvdG90eXBlLnNraXAgPSBmdW5jdGlvbiBza2lwKGxlbmd0aCkge1xyXG4gICAgaWYgKHR5cGVvZiBsZW5ndGggPT09IFwibnVtYmVyXCIpIHtcclxuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cclxuICAgICAgICBpZiAodGhpcy5wb3MgKyBsZW5ndGggPiB0aGlzLmxlbilcclxuICAgICAgICAgICAgdGhyb3cgaW5kZXhPdXRPZlJhbmdlKHRoaXMsIGxlbmd0aCk7XHJcbiAgICAgICAgdGhpcy5wb3MgKz0gbGVuZ3RoO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBkbyB7XHJcbiAgICAgICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xyXG4gICAgICAgICAgICBpZiAodGhpcy5wb3MgPj0gdGhpcy5sZW4pXHJcbiAgICAgICAgICAgICAgICB0aHJvdyBpbmRleE91dE9mUmFuZ2UodGhpcyk7XHJcbiAgICAgICAgfSB3aGlsZSAodGhpcy5idWZbdGhpcy5wb3MrK10gJiAxMjgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogU2tpcHMgdGhlIG5leHQgZWxlbWVudCBvZiB0aGUgc3BlY2lmaWVkIHdpcmUgdHlwZS5cclxuICogQHBhcmFtIHtudW1iZXJ9IHdpcmVUeXBlIFdpcmUgdHlwZSByZWNlaXZlZFxyXG4gKiBAcmV0dXJucyB7UmVhZGVyfSBgdGhpc2BcclxuICovXHJcblJlYWRlci5wcm90b3R5cGUuc2tpcFR5cGUgPSBmdW5jdGlvbih3aXJlVHlwZSkge1xyXG4gICAgc3dpdGNoICh3aXJlVHlwZSkge1xyXG4gICAgICAgIGNhc2UgMDpcclxuICAgICAgICAgICAgdGhpcy5za2lwKCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgMTpcclxuICAgICAgICAgICAgdGhpcy5za2lwKDgpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDI6XHJcbiAgICAgICAgICAgIHRoaXMuc2tpcCh0aGlzLnVpbnQzMigpKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAzOlxyXG4gICAgICAgICAgICB3aGlsZSAoKHdpcmVUeXBlID0gdGhpcy51aW50MzIoKSAmIDcpICE9PSA0KSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNraXBUeXBlKHdpcmVUeXBlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDU6XHJcbiAgICAgICAgICAgIHRoaXMuc2tpcCg0KTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJpbnZhbGlkIHdpcmUgdHlwZSBcIiArIHdpcmVUeXBlICsgXCIgYXQgb2Zmc2V0IFwiICsgdGhpcy5wb3MpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5SZWFkZXIuX2NvbmZpZ3VyZSA9IGZ1bmN0aW9uKEJ1ZmZlclJlYWRlcl8pIHtcclxuICAgIEJ1ZmZlclJlYWRlciA9IEJ1ZmZlclJlYWRlcl87XHJcblxyXG4gICAgdmFyIGZuID0gdXRpbC5Mb25nID8gXCJ0b0xvbmdcIiA6IC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovIFwidG9OdW1iZXJcIjtcclxuICAgIHV0aWwubWVyZ2UoUmVhZGVyLnByb3RvdHlwZSwge1xyXG5cclxuICAgICAgICBpbnQ2NDogZnVuY3Rpb24gcmVhZF9pbnQ2NCgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlYWRMb25nVmFyaW50LmNhbGwodGhpcylbZm5dKGZhbHNlKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICB1aW50NjQ6IGZ1bmN0aW9uIHJlYWRfdWludDY0KCkge1xyXG4gICAgICAgICAgICByZXR1cm4gcmVhZExvbmdWYXJpbnQuY2FsbCh0aGlzKVtmbl0odHJ1ZSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgc2ludDY0OiBmdW5jdGlvbiByZWFkX3NpbnQ2NCgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlYWRMb25nVmFyaW50LmNhbGwodGhpcykuenpEZWNvZGUoKVtmbl0oZmFsc2UpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGZpeGVkNjQ6IGZ1bmN0aW9uIHJlYWRfZml4ZWQ2NCgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlYWRGaXhlZDY0LmNhbGwodGhpcylbZm5dKHRydWUpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHNmaXhlZDY0OiBmdW5jdGlvbiByZWFkX3NmaXhlZDY0KCkge1xyXG4gICAgICAgICAgICByZXR1cm4gcmVhZEZpeGVkNjQuY2FsbCh0aGlzKVtmbl0oZmFsc2UpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9KTtcclxufTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbm1vZHVsZS5leHBvcnRzID0gQnVmZmVyUmVhZGVyO1xyXG5cclxuLy8gZXh0ZW5kcyBSZWFkZXJcclxudmFyIFJlYWRlciA9IHJlcXVpcmUoXCIuL3JlYWRlclwiKTtcclxuKEJ1ZmZlclJlYWRlci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFJlYWRlci5wcm90b3R5cGUpKS5jb25zdHJ1Y3RvciA9IEJ1ZmZlclJlYWRlcjtcclxuXHJcbnZhciB1dGlsID0gcmVxdWlyZShcIi4vdXRpbC9taW5pbWFsXCIpO1xyXG5cclxuLyoqXHJcbiAqIENvbnN0cnVjdHMgYSBuZXcgYnVmZmVyIHJlYWRlciBpbnN0YW5jZS5cclxuICogQGNsYXNzZGVzYyBXaXJlIGZvcm1hdCByZWFkZXIgdXNpbmcgbm9kZSBidWZmZXJzLlxyXG4gKiBAZXh0ZW5kcyBSZWFkZXJcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqIEBwYXJhbSB7QnVmZmVyfSBidWZmZXIgQnVmZmVyIHRvIHJlYWQgZnJvbVxyXG4gKi9cclxuZnVuY3Rpb24gQnVmZmVyUmVhZGVyKGJ1ZmZlcikge1xyXG4gICAgUmVhZGVyLmNhbGwodGhpcywgYnVmZmVyKTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlYWQgYnVmZmVyLlxyXG4gICAgICogQG5hbWUgQnVmZmVyUmVhZGVyI2J1ZlxyXG4gICAgICogQHR5cGUge0J1ZmZlcn1cclxuICAgICAqL1xyXG59XHJcblxyXG4vKiBpc3RhbmJ1bCBpZ25vcmUgZWxzZSAqL1xyXG5pZiAodXRpbC5CdWZmZXIpXHJcbiAgICBCdWZmZXJSZWFkZXIucHJvdG90eXBlLl9zbGljZSA9IHV0aWwuQnVmZmVyLnByb3RvdHlwZS5zbGljZTtcclxuXHJcbi8qKlxyXG4gKiBAb3ZlcnJpZGVcclxuICovXHJcbkJ1ZmZlclJlYWRlci5wcm90b3R5cGUuc3RyaW5nID0gZnVuY3Rpb24gcmVhZF9zdHJpbmdfYnVmZmVyKCkge1xyXG4gICAgdmFyIGxlbiA9IHRoaXMudWludDMyKCk7IC8vIG1vZGlmaWVzIHBvc1xyXG4gICAgcmV0dXJuIHRoaXMuYnVmLnV0ZjhTbGljZSh0aGlzLnBvcywgdGhpcy5wb3MgPSBNYXRoLm1pbih0aGlzLnBvcyArIGxlbiwgdGhpcy5sZW4pKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZWFkcyBhIHNlcXVlbmNlIG9mIGJ5dGVzIHByZWNlZWRlZCBieSBpdHMgbGVuZ3RoIGFzIGEgdmFyaW50LlxyXG4gKiBAbmFtZSBCdWZmZXJSZWFkZXIjYnl0ZXNcclxuICogQGZ1bmN0aW9uXHJcbiAqIEByZXR1cm5zIHtCdWZmZXJ9IFZhbHVlIHJlYWRcclxuICovXHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5tb2R1bGUuZXhwb3J0cyA9IFJvb3Q7XHJcblxyXG4vLyBleHRlbmRzIE5hbWVzcGFjZVxyXG52YXIgTmFtZXNwYWNlID0gcmVxdWlyZShcIi4vbmFtZXNwYWNlXCIpO1xyXG4oKFJvb3QucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShOYW1lc3BhY2UucHJvdG90eXBlKSkuY29uc3RydWN0b3IgPSBSb290KS5jbGFzc05hbWUgPSBcIlJvb3RcIjtcclxuXHJcbnZhciBGaWVsZCAgID0gcmVxdWlyZShcIi4vZmllbGRcIiksXHJcbiAgICBFbnVtICAgID0gcmVxdWlyZShcIi4vZW51bVwiKSxcclxuICAgIE9uZU9mICAgPSByZXF1aXJlKFwiLi9vbmVvZlwiKSxcclxuICAgIHV0aWwgICAgPSByZXF1aXJlKFwiLi91dGlsXCIpO1xyXG5cclxudmFyIFR5cGUsICAgLy8gY3ljbGljXHJcbiAgICBwYXJzZSwgIC8vIG1pZ2h0IGJlIGV4Y2x1ZGVkXHJcbiAgICBjb21tb247IC8vIFwiXHJcblxyXG4vKipcclxuICogQ29uc3RydWN0cyBhIG5ldyByb290IG5hbWVzcGFjZSBpbnN0YW5jZS5cclxuICogQGNsYXNzZGVzYyBSb290IG5hbWVzcGFjZSB3cmFwcGluZyBhbGwgdHlwZXMsIGVudW1zLCBzZXJ2aWNlcywgc3ViLW5hbWVzcGFjZXMgZXRjLiB0aGF0IGJlbG9uZyB0b2dldGhlci5cclxuICogQGV4dGVuZHMgTmFtZXNwYWNlQmFzZVxyXG4gKiBAY29uc3RydWN0b3JcclxuICogQHBhcmFtIHtPYmplY3QuPHN0cmluZywqPn0gW29wdGlvbnNdIFRvcCBsZXZlbCBvcHRpb25zXHJcbiAqL1xyXG5mdW5jdGlvbiBSb290KG9wdGlvbnMpIHtcclxuICAgIE5hbWVzcGFjZS5jYWxsKHRoaXMsIFwiXCIsIG9wdGlvbnMpO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRGVmZXJyZWQgZXh0ZW5zaW9uIGZpZWxkcy5cclxuICAgICAqIEB0eXBlIHtGaWVsZFtdfVxyXG4gICAgICovXHJcbiAgICB0aGlzLmRlZmVycmVkID0gW107XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXNvbHZlZCBmaWxlIG5hbWVzIG9mIGxvYWRlZCBmaWxlcy5cclxuICAgICAqIEB0eXBlIHtzdHJpbmdbXX1cclxuICAgICAqL1xyXG4gICAgdGhpcy5maWxlcyA9IFtdO1xyXG59XHJcblxyXG4vKipcclxuICogTG9hZHMgYSBuYW1lc3BhY2UgZGVzY3JpcHRvciBpbnRvIGEgcm9vdCBuYW1lc3BhY2UuXHJcbiAqIEBwYXJhbSB7SU5hbWVzcGFjZX0ganNvbiBOYW1lZXNwYWNlIGRlc2NyaXB0b3JcclxuICogQHBhcmFtIHtSb290fSBbcm9vdF0gUm9vdCBuYW1lc3BhY2UsIGRlZmF1bHRzIHRvIGNyZWF0ZSBhIG5ldyBvbmUgaWYgb21pdHRlZFxyXG4gKiBAcmV0dXJucyB7Um9vdH0gUm9vdCBuYW1lc3BhY2VcclxuICovXHJcblJvb3QuZnJvbUpTT04gPSBmdW5jdGlvbiBmcm9tSlNPTihqc29uLCByb290KSB7XHJcbiAgICBpZiAoIXJvb3QpXHJcbiAgICAgICAgcm9vdCA9IG5ldyBSb290KCk7XHJcbiAgICBpZiAoanNvbi5vcHRpb25zKVxyXG4gICAgICAgIHJvb3Quc2V0T3B0aW9ucyhqc29uLm9wdGlvbnMpO1xyXG4gICAgcmV0dXJuIHJvb3QuYWRkSlNPTihqc29uLm5lc3RlZCk7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVzb2x2ZXMgdGhlIHBhdGggb2YgYW4gaW1wb3J0ZWQgZmlsZSwgcmVsYXRpdmUgdG8gdGhlIGltcG9ydGluZyBvcmlnaW4uXHJcbiAqIFRoaXMgbWV0aG9kIGV4aXN0cyBzbyB5b3UgY2FuIG92ZXJyaWRlIGl0IHdpdGggeW91ciBvd24gbG9naWMgaW4gY2FzZSB5b3VyIGltcG9ydHMgYXJlIHNjYXR0ZXJlZCBvdmVyIG11bHRpcGxlIGRpcmVjdG9yaWVzLlxyXG4gKiBAZnVuY3Rpb25cclxuICogQHBhcmFtIHtzdHJpbmd9IG9yaWdpbiBUaGUgZmlsZSBuYW1lIG9mIHRoZSBpbXBvcnRpbmcgZmlsZVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gdGFyZ2V0IFRoZSBmaWxlIG5hbWUgYmVpbmcgaW1wb3J0ZWRcclxuICogQHJldHVybnMge3N0cmluZ3xudWxsfSBSZXNvbHZlZCBwYXRoIHRvIGB0YXJnZXRgIG9yIGBudWxsYCB0byBza2lwIHRoZSBmaWxlXHJcbiAqL1xyXG5Sb290LnByb3RvdHlwZS5yZXNvbHZlUGF0aCA9IHV0aWwucGF0aC5yZXNvbHZlO1xyXG5cclxuLy8gQSBzeW1ib2wtbGlrZSBmdW5jdGlvbiB0byBzYWZlbHkgc2lnbmFsIHN5bmNocm9ub3VzIGxvYWRpbmdcclxuLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuZnVuY3Rpb24gU1lOQygpIHt9IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tZW1wdHktZnVuY3Rpb25cclxuXHJcbi8qKlxyXG4gKiBMb2FkcyBvbmUgb3IgbXVsdGlwbGUgLnByb3RvIG9yIHByZXByb2Nlc3NlZCAuanNvbiBmaWxlcyBpbnRvIHRoaXMgcm9vdCBuYW1lc3BhY2UgYW5kIGNhbGxzIHRoZSBjYWxsYmFjay5cclxuICogQHBhcmFtIHtzdHJpbmd8c3RyaW5nW119IGZpbGVuYW1lIE5hbWVzIG9mIG9uZSBvciBtdWx0aXBsZSBmaWxlcyB0byBsb2FkXHJcbiAqIEBwYXJhbSB7SVBhcnNlT3B0aW9uc30gb3B0aW9ucyBQYXJzZSBvcHRpb25zXHJcbiAqIEBwYXJhbSB7TG9hZENhbGxiYWNrfSBjYWxsYmFjayBDYWxsYmFjayBmdW5jdGlvblxyXG4gKiBAcmV0dXJucyB7dW5kZWZpbmVkfVxyXG4gKi9cclxuUm9vdC5wcm90b3R5cGUubG9hZCA9IGZ1bmN0aW9uIGxvYWQoZmlsZW5hbWUsIG9wdGlvbnMsIGNhbGxiYWNrKSB7XHJcbiAgICBpZiAodHlwZW9mIG9wdGlvbnMgPT09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICAgIGNhbGxiYWNrID0gb3B0aW9ucztcclxuICAgICAgICBvcHRpb25zID0gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgaWYgKCFjYWxsYmFjaylcclxuICAgICAgICByZXR1cm4gdXRpbC5hc1Byb21pc2UobG9hZCwgc2VsZiwgZmlsZW5hbWUsIG9wdGlvbnMpO1xyXG5cclxuICAgIHZhciBzeW5jID0gY2FsbGJhY2sgPT09IFNZTkM7IC8vIHVuZG9jdW1lbnRlZFxyXG5cclxuICAgIC8vIEZpbmlzaGVzIGxvYWRpbmcgYnkgY2FsbGluZyB0aGUgY2FsbGJhY2sgKGV4YWN0bHkgb25jZSlcclxuICAgIGZ1bmN0aW9uIGZpbmlzaChlcnIsIHJvb3QpIHtcclxuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cclxuICAgICAgICBpZiAoIWNhbGxiYWNrKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgdmFyIGNiID0gY2FsbGJhY2s7XHJcbiAgICAgICAgY2FsbGJhY2sgPSBudWxsO1xyXG4gICAgICAgIGlmIChzeW5jKVxyXG4gICAgICAgICAgICB0aHJvdyBlcnI7XHJcbiAgICAgICAgY2IoZXJyLCByb290KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBQcm9jZXNzZXMgYSBzaW5nbGUgZmlsZVxyXG4gICAgZnVuY3Rpb24gcHJvY2VzcyhmaWxlbmFtZSwgc291cmNlKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgaWYgKHV0aWwuaXNTdHJpbmcoc291cmNlKSAmJiBzb3VyY2UuY2hhckF0KDApID09PSBcIntcIilcclxuICAgICAgICAgICAgICAgIHNvdXJjZSA9IEpTT04ucGFyc2Uoc291cmNlKTtcclxuICAgICAgICAgICAgaWYgKCF1dGlsLmlzU3RyaW5nKHNvdXJjZSkpXHJcbiAgICAgICAgICAgICAgICBzZWxmLnNldE9wdGlvbnMoc291cmNlLm9wdGlvbnMpLmFkZEpTT04oc291cmNlLm5lc3RlZCk7XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcGFyc2UuZmlsZW5hbWUgPSBmaWxlbmFtZTtcclxuICAgICAgICAgICAgICAgIHZhciBwYXJzZWQgPSBwYXJzZShzb3VyY2UsIHNlbGYsIG9wdGlvbnMpLFxyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmVkLFxyXG4gICAgICAgICAgICAgICAgICAgIGkgPSAwO1xyXG4gICAgICAgICAgICAgICAgaWYgKHBhcnNlZC5pbXBvcnRzKVxyXG4gICAgICAgICAgICAgICAgICAgIGZvciAoOyBpIDwgcGFyc2VkLmltcG9ydHMubGVuZ3RoOyArK2kpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNvbHZlZCA9IHNlbGYucmVzb2x2ZVBhdGgoZmlsZW5hbWUsIHBhcnNlZC5pbXBvcnRzW2ldKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZldGNoKHJlc29sdmVkKTtcclxuICAgICAgICAgICAgICAgIGlmIChwYXJzZWQud2Vha0ltcG9ydHMpXHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHBhcnNlZC53ZWFrSW1wb3J0cy5sZW5ndGg7ICsraSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc29sdmVkID0gc2VsZi5yZXNvbHZlUGF0aChmaWxlbmFtZSwgcGFyc2VkLndlYWtJbXBvcnRzW2ldKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZldGNoKHJlc29sdmVkLCB0cnVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICBmaW5pc2goZXJyKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCFzeW5jICYmICFxdWV1ZWQpXHJcbiAgICAgICAgICAgIGZpbmlzaChudWxsLCBzZWxmKTsgLy8gb25seSBvbmNlIGFueXdheVxyXG4gICAgfVxyXG5cclxuICAgIC8vIEZldGNoZXMgYSBzaW5nbGUgZmlsZVxyXG4gICAgZnVuY3Rpb24gZmV0Y2goZmlsZW5hbWUsIHdlYWspIHtcclxuXHJcbiAgICAgICAgLy8gU3RyaXAgcGF0aCBpZiB0aGlzIGZpbGUgcmVmZXJlbmNlcyBhIGJ1bmRsZWQgZGVmaW5pdGlvblxyXG4gICAgICAgIHZhciBpZHggPSBmaWxlbmFtZS5sYXN0SW5kZXhPZihcImdvb2dsZS9wcm90b2J1Zi9cIik7XHJcbiAgICAgICAgaWYgKGlkeCA+IC0xKSB7XHJcbiAgICAgICAgICAgIHZhciBhbHRuYW1lID0gZmlsZW5hbWUuc3Vic3RyaW5nKGlkeCk7XHJcbiAgICAgICAgICAgIGlmIChhbHRuYW1lIGluIGNvbW1vbilcclxuICAgICAgICAgICAgICAgIGZpbGVuYW1lID0gYWx0bmFtZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFNraXAgaWYgYWxyZWFkeSBsb2FkZWQgLyBhdHRlbXB0ZWRcclxuICAgICAgICBpZiAoc2VsZi5maWxlcy5pbmRleE9mKGZpbGVuYW1lKSA+IC0xKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgc2VsZi5maWxlcy5wdXNoKGZpbGVuYW1lKTtcclxuXHJcbiAgICAgICAgLy8gU2hvcnRjdXQgYnVuZGxlZCBkZWZpbml0aW9uc1xyXG4gICAgICAgIGlmIChmaWxlbmFtZSBpbiBjb21tb24pIHtcclxuICAgICAgICAgICAgaWYgKHN5bmMpXHJcbiAgICAgICAgICAgICAgICBwcm9jZXNzKGZpbGVuYW1lLCBjb21tb25bZmlsZW5hbWVdKTtcclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICArK3F1ZXVlZDtcclxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLS1xdWV1ZWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgcHJvY2VzcyhmaWxlbmFtZSwgY29tbW9uW2ZpbGVuYW1lXSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBPdGhlcndpc2UgZmV0Y2ggZnJvbSBkaXNrIG9yIG5ldHdvcmtcclxuICAgICAgICBpZiAoc3luYykge1xyXG4gICAgICAgICAgICB2YXIgc291cmNlO1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgc291cmNlID0gdXRpbC5mcy5yZWFkRmlsZVN5bmMoZmlsZW5hbWUpLnRvU3RyaW5nKFwidXRmOFwiKTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXdlYWspXHJcbiAgICAgICAgICAgICAgICAgICAgZmluaXNoKGVycik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcHJvY2VzcyhmaWxlbmFtZSwgc291cmNlKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICArK3F1ZXVlZDtcclxuICAgICAgICAgICAgdXRpbC5mZXRjaChmaWxlbmFtZSwgZnVuY3Rpb24oZXJyLCBzb3VyY2UpIHtcclxuICAgICAgICAgICAgICAgIC0tcXVldWVkO1xyXG4gICAgICAgICAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXHJcbiAgICAgICAgICAgICAgICBpZiAoIWNhbGxiYWNrKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjsgLy8gdGVybWluYXRlZCBtZWFud2hpbGVcclxuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgZWxzZSAqL1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghd2VhaylcclxuICAgICAgICAgICAgICAgICAgICAgICAgZmluaXNoKGVycik7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoIXF1ZXVlZCkgLy8gY2FuJ3QgYmUgY292ZXJlZCByZWxpYWJseVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmaW5pc2gobnVsbCwgc2VsZik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcHJvY2VzcyhmaWxlbmFtZSwgc291cmNlKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgdmFyIHF1ZXVlZCA9IDA7XHJcblxyXG4gICAgLy8gQXNzZW1ibGluZyB0aGUgcm9vdCBuYW1lc3BhY2UgZG9lc24ndCByZXF1aXJlIHdvcmtpbmcgdHlwZVxyXG4gICAgLy8gcmVmZXJlbmNlcyBhbnltb3JlLCBzbyB3ZSBjYW4gbG9hZCBldmVyeXRoaW5nIGluIHBhcmFsbGVsXHJcbiAgICBpZiAodXRpbC5pc1N0cmluZyhmaWxlbmFtZSkpXHJcbiAgICAgICAgZmlsZW5hbWUgPSBbIGZpbGVuYW1lIF07XHJcbiAgICBmb3IgKHZhciBpID0gMCwgcmVzb2x2ZWQ7IGkgPCBmaWxlbmFtZS5sZW5ndGg7ICsraSlcclxuICAgICAgICBpZiAocmVzb2x2ZWQgPSBzZWxmLnJlc29sdmVQYXRoKFwiXCIsIGZpbGVuYW1lW2ldKSlcclxuICAgICAgICAgICAgZmV0Y2gocmVzb2x2ZWQpO1xyXG5cclxuICAgIGlmIChzeW5jKVxyXG4gICAgICAgIHJldHVybiBzZWxmO1xyXG4gICAgaWYgKCFxdWV1ZWQpXHJcbiAgICAgICAgZmluaXNoKG51bGwsIHNlbGYpO1xyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxufTtcclxuLy8gZnVuY3Rpb24gbG9hZChmaWxlbmFtZTpzdHJpbmcsIG9wdGlvbnM6SVBhcnNlT3B0aW9ucywgY2FsbGJhY2s6TG9hZENhbGxiYWNrKTp1bmRlZmluZWRcclxuXHJcbi8qKlxyXG4gKiBMb2FkcyBvbmUgb3IgbXVsdGlwbGUgLnByb3RvIG9yIHByZXByb2Nlc3NlZCAuanNvbiBmaWxlcyBpbnRvIHRoaXMgcm9vdCBuYW1lc3BhY2UgYW5kIGNhbGxzIHRoZSBjYWxsYmFjay5cclxuICogQGZ1bmN0aW9uIFJvb3QjbG9hZFxyXG4gKiBAcGFyYW0ge3N0cmluZ3xzdHJpbmdbXX0gZmlsZW5hbWUgTmFtZXMgb2Ygb25lIG9yIG11bHRpcGxlIGZpbGVzIHRvIGxvYWRcclxuICogQHBhcmFtIHtMb2FkQ2FsbGJhY2t9IGNhbGxiYWNrIENhbGxiYWNrIGZ1bmN0aW9uXHJcbiAqIEByZXR1cm5zIHt1bmRlZmluZWR9XHJcbiAqIEB2YXJpYXRpb24gMlxyXG4gKi9cclxuLy8gZnVuY3Rpb24gbG9hZChmaWxlbmFtZTpzdHJpbmcsIGNhbGxiYWNrOkxvYWRDYWxsYmFjayk6dW5kZWZpbmVkXHJcblxyXG4vKipcclxuICogTG9hZHMgb25lIG9yIG11bHRpcGxlIC5wcm90byBvciBwcmVwcm9jZXNzZWQgLmpzb24gZmlsZXMgaW50byB0aGlzIHJvb3QgbmFtZXNwYWNlIGFuZCByZXR1cm5zIGEgcHJvbWlzZS5cclxuICogQGZ1bmN0aW9uIFJvb3QjbG9hZFxyXG4gKiBAcGFyYW0ge3N0cmluZ3xzdHJpbmdbXX0gZmlsZW5hbWUgTmFtZXMgb2Ygb25lIG9yIG11bHRpcGxlIGZpbGVzIHRvIGxvYWRcclxuICogQHBhcmFtIHtJUGFyc2VPcHRpb25zfSBbb3B0aW9uc10gUGFyc2Ugb3B0aW9ucy4gRGVmYXVsdHMgdG8ge0BsaW5rIHBhcnNlLmRlZmF1bHRzfSB3aGVuIG9taXR0ZWQuXHJcbiAqIEByZXR1cm5zIHtQcm9taXNlPFJvb3Q+fSBQcm9taXNlXHJcbiAqIEB2YXJpYXRpb24gM1xyXG4gKi9cclxuLy8gZnVuY3Rpb24gbG9hZChmaWxlbmFtZTpzdHJpbmcsIFtvcHRpb25zOklQYXJzZU9wdGlvbnNdKTpQcm9taXNlPFJvb3Q+XHJcblxyXG4vKipcclxuICogU3luY2hyb25vdXNseSBsb2FkcyBvbmUgb3IgbXVsdGlwbGUgLnByb3RvIG9yIHByZXByb2Nlc3NlZCAuanNvbiBmaWxlcyBpbnRvIHRoaXMgcm9vdCBuYW1lc3BhY2UgKG5vZGUgb25seSkuXHJcbiAqIEBmdW5jdGlvbiBSb290I2xvYWRTeW5jXHJcbiAqIEBwYXJhbSB7c3RyaW5nfHN0cmluZ1tdfSBmaWxlbmFtZSBOYW1lcyBvZiBvbmUgb3IgbXVsdGlwbGUgZmlsZXMgdG8gbG9hZFxyXG4gKiBAcGFyYW0ge0lQYXJzZU9wdGlvbnN9IFtvcHRpb25zXSBQYXJzZSBvcHRpb25zLiBEZWZhdWx0cyB0byB7QGxpbmsgcGFyc2UuZGVmYXVsdHN9IHdoZW4gb21pdHRlZC5cclxuICogQHJldHVybnMge1Jvb3R9IFJvb3QgbmFtZXNwYWNlXHJcbiAqIEB0aHJvd3Mge0Vycm9yfSBJZiBzeW5jaHJvbm91cyBmZXRjaGluZyBpcyBub3Qgc3VwcG9ydGVkIChpLmUuIGluIGJyb3dzZXJzKSBvciBpZiBhIGZpbGUncyBzeW50YXggaXMgaW52YWxpZFxyXG4gKi9cclxuUm9vdC5wcm90b3R5cGUubG9hZFN5bmMgPSBmdW5jdGlvbiBsb2FkU3luYyhmaWxlbmFtZSwgb3B0aW9ucykge1xyXG4gICAgaWYgKCF1dGlsLmlzTm9kZSlcclxuICAgICAgICB0aHJvdyBFcnJvcihcIm5vdCBzdXBwb3J0ZWRcIik7XHJcbiAgICByZXR1cm4gdGhpcy5sb2FkKGZpbGVuYW1lLCBvcHRpb25zLCBTWU5DKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBAb3ZlcnJpZGVcclxuICovXHJcblJvb3QucHJvdG90eXBlLnJlc29sdmVBbGwgPSBmdW5jdGlvbiByZXNvbHZlQWxsKCkge1xyXG4gICAgaWYgKHRoaXMuZGVmZXJyZWQubGVuZ3RoKVxyXG4gICAgICAgIHRocm93IEVycm9yKFwidW5yZXNvbHZhYmxlIGV4dGVuc2lvbnM6IFwiICsgdGhpcy5kZWZlcnJlZC5tYXAoZnVuY3Rpb24oZmllbGQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFwiJ2V4dGVuZCBcIiArIGZpZWxkLmV4dGVuZCArIFwiJyBpbiBcIiArIGZpZWxkLnBhcmVudC5mdWxsTmFtZTtcclxuICAgICAgICB9KS5qb2luKFwiLCBcIikpO1xyXG4gICAgcmV0dXJuIE5hbWVzcGFjZS5wcm90b3R5cGUucmVzb2x2ZUFsbC5jYWxsKHRoaXMpO1xyXG59O1xyXG5cclxuLy8gb25seSB1cHBlcmNhc2VkIChhbmQgdGh1cyBjb25mbGljdC1mcmVlKSBjaGlsZHJlbiBhcmUgZXhwb3NlZCwgc2VlIGJlbG93XHJcbnZhciBleHBvc2VSZSA9IC9eW0EtWl0vO1xyXG5cclxuLyoqXHJcbiAqIEhhbmRsZXMgYSBkZWZlcnJlZCBkZWNsYXJpbmcgZXh0ZW5zaW9uIGZpZWxkIGJ5IGNyZWF0aW5nIGEgc2lzdGVyIGZpZWxkIHRvIHJlcHJlc2VudCBpdCB3aXRoaW4gaXRzIGV4dGVuZGVkIHR5cGUuXHJcbiAqIEBwYXJhbSB7Um9vdH0gcm9vdCBSb290IGluc3RhbmNlXHJcbiAqIEBwYXJhbSB7RmllbGR9IGZpZWxkIERlY2xhcmluZyBleHRlbnNpb24gZmllbGQgd2l0aW4gdGhlIGRlY2xhcmluZyB0eXBlXHJcbiAqIEByZXR1cm5zIHtib29sZWFufSBgdHJ1ZWAgaWYgc3VjY2Vzc2Z1bGx5IGFkZGVkIHRvIHRoZSBleHRlbmRlZCB0eXBlLCBgZmFsc2VgIG90aGVyd2lzZVxyXG4gKiBAaW5uZXJcclxuICogQGlnbm9yZVxyXG4gKi9cclxuZnVuY3Rpb24gdHJ5SGFuZGxlRXh0ZW5zaW9uKHJvb3QsIGZpZWxkKSB7XHJcbiAgICB2YXIgZXh0ZW5kZWRUeXBlID0gZmllbGQucGFyZW50Lmxvb2t1cChmaWVsZC5leHRlbmQpO1xyXG4gICAgaWYgKGV4dGVuZGVkVHlwZSkge1xyXG4gICAgICAgIHZhciBzaXN0ZXJGaWVsZCA9IG5ldyBGaWVsZChmaWVsZC5mdWxsTmFtZSwgZmllbGQuaWQsIGZpZWxkLnR5cGUsIGZpZWxkLnJ1bGUsIHVuZGVmaW5lZCwgZmllbGQub3B0aW9ucyk7XHJcbiAgICAgICAgc2lzdGVyRmllbGQuZGVjbGFyaW5nRmllbGQgPSBmaWVsZDtcclxuICAgICAgICBmaWVsZC5leHRlbnNpb25GaWVsZCA9IHNpc3RlckZpZWxkO1xyXG4gICAgICAgIGV4dGVuZGVkVHlwZS5hZGQoc2lzdGVyRmllbGQpO1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG59XHJcblxyXG4vKipcclxuICogQ2FsbGVkIHdoZW4gYW55IG9iamVjdCBpcyBhZGRlZCB0byB0aGlzIHJvb3Qgb3IgaXRzIHN1Yi1uYW1lc3BhY2VzLlxyXG4gKiBAcGFyYW0ge1JlZmxlY3Rpb25PYmplY3R9IG9iamVjdCBPYmplY3QgYWRkZWRcclxuICogQHJldHVybnMge3VuZGVmaW5lZH1cclxuICogQHByaXZhdGVcclxuICovXHJcblJvb3QucHJvdG90eXBlLl9oYW5kbGVBZGQgPSBmdW5jdGlvbiBfaGFuZGxlQWRkKG9iamVjdCkge1xyXG4gICAgaWYgKG9iamVjdCBpbnN0YW5jZW9mIEZpZWxkKSB7XHJcblxyXG4gICAgICAgIGlmICgvKiBhbiBleHRlbnNpb24gZmllbGQgKGltcGxpZXMgbm90IHBhcnQgb2YgYSBvbmVvZikgKi8gb2JqZWN0LmV4dGVuZCAhPT0gdW5kZWZpbmVkICYmIC8qIG5vdCBhbHJlYWR5IGhhbmRsZWQgKi8gIW9iamVjdC5leHRlbnNpb25GaWVsZClcclxuICAgICAgICAgICAgaWYgKCF0cnlIYW5kbGVFeHRlbnNpb24odGhpcywgb2JqZWN0KSlcclxuICAgICAgICAgICAgICAgIHRoaXMuZGVmZXJyZWQucHVzaChvYmplY3QpO1xyXG5cclxuICAgIH0gZWxzZSBpZiAob2JqZWN0IGluc3RhbmNlb2YgRW51bSkge1xyXG5cclxuICAgICAgICBpZiAoZXhwb3NlUmUudGVzdChvYmplY3QubmFtZSkpXHJcbiAgICAgICAgICAgIG9iamVjdC5wYXJlbnRbb2JqZWN0Lm5hbWVdID0gb2JqZWN0LnZhbHVlczsgLy8gZXhwb3NlIGVudW0gdmFsdWVzIGFzIHByb3BlcnR5IG9mIGl0cyBwYXJlbnRcclxuXHJcbiAgICB9IGVsc2UgaWYgKCEob2JqZWN0IGluc3RhbmNlb2YgT25lT2YpKSAvKiBldmVyeXRoaW5nIGVsc2UgaXMgYSBuYW1lc3BhY2UgKi8ge1xyXG5cclxuICAgICAgICBpZiAob2JqZWN0IGluc3RhbmNlb2YgVHlwZSkgLy8gVHJ5IHRvIGhhbmRsZSBhbnkgZGVmZXJyZWQgZXh0ZW5zaW9uc1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZGVmZXJyZWQubGVuZ3RoOylcclxuICAgICAgICAgICAgICAgIGlmICh0cnlIYW5kbGVFeHRlbnNpb24odGhpcywgdGhpcy5kZWZlcnJlZFtpXSkpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kZWZlcnJlZC5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgKytpO1xyXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgLyogaW5pdGlhbGl6ZXMgKi8gb2JqZWN0Lm5lc3RlZEFycmF5Lmxlbmd0aDsgKytqKSAvLyByZWN1cnNlIGludG8gdGhlIG5hbWVzcGFjZVxyXG4gICAgICAgICAgICB0aGlzLl9oYW5kbGVBZGQob2JqZWN0Ll9uZXN0ZWRBcnJheVtqXSk7XHJcbiAgICAgICAgaWYgKGV4cG9zZVJlLnRlc3Qob2JqZWN0Lm5hbWUpKVxyXG4gICAgICAgICAgICBvYmplY3QucGFyZW50W29iamVjdC5uYW1lXSA9IG9iamVjdDsgLy8gZXhwb3NlIG5hbWVzcGFjZSBhcyBwcm9wZXJ0eSBvZiBpdHMgcGFyZW50XHJcbiAgICB9XHJcblxyXG4gICAgLy8gVGhlIGFib3ZlIGFsc28gYWRkcyB1cHBlcmNhc2VkIChhbmQgdGh1cyBjb25mbGljdC1mcmVlKSBuZXN0ZWQgdHlwZXMsIHNlcnZpY2VzIGFuZCBlbnVtcyBhc1xyXG4gICAgLy8gcHJvcGVydGllcyBvZiBuYW1lc3BhY2VzIGp1c3QgbGlrZSBzdGF0aWMgY29kZSBkb2VzLiBUaGlzIGFsbG93cyB1c2luZyBhIC5kLnRzIGdlbmVyYXRlZCBmb3JcclxuICAgIC8vIGEgc3RhdGljIG1vZHVsZSB3aXRoIHJlZmxlY3Rpb24tYmFzZWQgc29sdXRpb25zIHdoZXJlIHRoZSBjb25kaXRpb24gaXMgbWV0LlxyXG59O1xyXG5cclxuLyoqXHJcbiAqIENhbGxlZCB3aGVuIGFueSBvYmplY3QgaXMgcmVtb3ZlZCBmcm9tIHRoaXMgcm9vdCBvciBpdHMgc3ViLW5hbWVzcGFjZXMuXHJcbiAqIEBwYXJhbSB7UmVmbGVjdGlvbk9iamVjdH0gb2JqZWN0IE9iamVjdCByZW1vdmVkXHJcbiAqIEByZXR1cm5zIHt1bmRlZmluZWR9XHJcbiAqIEBwcml2YXRlXHJcbiAqL1xyXG5Sb290LnByb3RvdHlwZS5faGFuZGxlUmVtb3ZlID0gZnVuY3Rpb24gX2hhbmRsZVJlbW92ZShvYmplY3QpIHtcclxuICAgIGlmIChvYmplY3QgaW5zdGFuY2VvZiBGaWVsZCkge1xyXG5cclxuICAgICAgICBpZiAoLyogYW4gZXh0ZW5zaW9uIGZpZWxkICovIG9iamVjdC5leHRlbmQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBpZiAoLyogYWxyZWFkeSBoYW5kbGVkICovIG9iamVjdC5leHRlbnNpb25GaWVsZCkgeyAvLyByZW1vdmUgaXRzIHNpc3RlciBmaWVsZFxyXG4gICAgICAgICAgICAgICAgb2JqZWN0LmV4dGVuc2lvbkZpZWxkLnBhcmVudC5yZW1vdmUob2JqZWN0LmV4dGVuc2lvbkZpZWxkKTtcclxuICAgICAgICAgICAgICAgIG9iamVjdC5leHRlbnNpb25GaWVsZCA9IG51bGw7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7IC8vIGNhbmNlbCB0aGUgZXh0ZW5zaW9uXHJcbiAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSB0aGlzLmRlZmVycmVkLmluZGV4T2Yob2JqZWN0KTtcclxuICAgICAgICAgICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBlbHNlICovXHJcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggPiAtMSlcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRlZmVycmVkLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgfSBlbHNlIGlmIChvYmplY3QgaW5zdGFuY2VvZiBFbnVtKSB7XHJcblxyXG4gICAgICAgIGlmIChleHBvc2VSZS50ZXN0KG9iamVjdC5uYW1lKSlcclxuICAgICAgICAgICAgZGVsZXRlIG9iamVjdC5wYXJlbnRbb2JqZWN0Lm5hbWVdOyAvLyB1bmV4cG9zZSBlbnVtIHZhbHVlc1xyXG5cclxuICAgIH0gZWxzZSBpZiAob2JqZWN0IGluc3RhbmNlb2YgTmFtZXNwYWNlKSB7XHJcblxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgLyogaW5pdGlhbGl6ZXMgKi8gb2JqZWN0Lm5lc3RlZEFycmF5Lmxlbmd0aDsgKytpKSAvLyByZWN1cnNlIGludG8gdGhlIG5hbWVzcGFjZVxyXG4gICAgICAgICAgICB0aGlzLl9oYW5kbGVSZW1vdmUob2JqZWN0Ll9uZXN0ZWRBcnJheVtpXSk7XHJcblxyXG4gICAgICAgIGlmIChleHBvc2VSZS50ZXN0KG9iamVjdC5uYW1lKSlcclxuICAgICAgICAgICAgZGVsZXRlIG9iamVjdC5wYXJlbnRbb2JqZWN0Lm5hbWVdOyAvLyB1bmV4cG9zZSBuYW1lc3BhY2VzXHJcblxyXG4gICAgfVxyXG59O1xyXG5cclxuLy8gU2V0cyB1cCBjeWNsaWMgZGVwZW5kZW5jaWVzIChjYWxsZWQgaW4gaW5kZXgtbGlnaHQpXHJcblJvb3QuX2NvbmZpZ3VyZSA9IGZ1bmN0aW9uKFR5cGVfLCBwYXJzZV8sIGNvbW1vbl8pIHtcclxuICAgIFR5cGUgICA9IFR5cGVfO1xyXG4gICAgcGFyc2UgID0gcGFyc2VfO1xyXG4gICAgY29tbW9uID0gY29tbW9uXztcclxufTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbm1vZHVsZS5leHBvcnRzID0ge307XHJcblxyXG4vKipcclxuICogTmFtZWQgcm9vdHMuXHJcbiAqIFRoaXMgaXMgd2hlcmUgcGJqcyBzdG9yZXMgZ2VuZXJhdGVkIHN0cnVjdHVyZXMgKHRoZSBvcHRpb24gYC1yLCAtLXJvb3RgIHNwZWNpZmllcyBhIG5hbWUpLlxyXG4gKiBDYW4gYWxzbyBiZSB1c2VkIG1hbnVhbGx5IHRvIG1ha2Ugcm9vdHMgYXZhaWxhYmxlIGFjY3Jvc3MgbW9kdWxlcy5cclxuICogQG5hbWUgcm9vdHNcclxuICogQHR5cGUge09iamVjdC48c3RyaW5nLFJvb3Q+fVxyXG4gKiBAZXhhbXBsZVxyXG4gKiAvLyBwYmpzIC1yIG15cm9vdCAtbyBjb21waWxlZC5qcyAuLi5cclxuICpcclxuICogLy8gaW4gYW5vdGhlciBtb2R1bGU6XHJcbiAqIHJlcXVpcmUoXCIuL2NvbXBpbGVkLmpzXCIpO1xyXG4gKlxyXG4gKiAvLyBpbiBhbnkgc3Vic2VxdWVudCBtb2R1bGU6XHJcbiAqIHZhciByb290ID0gcHJvdG9idWYucm9vdHNbXCJteXJvb3RcIl07XHJcbiAqL1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbi8qKlxyXG4gKiBTdHJlYW1pbmcgUlBDIGhlbHBlcnMuXHJcbiAqIEBuYW1lc3BhY2VcclxuICovXHJcbnZhciBycGMgPSBleHBvcnRzO1xyXG5cclxuLyoqXHJcbiAqIFJQQyBpbXBsZW1lbnRhdGlvbiBwYXNzZWQgdG8ge0BsaW5rIFNlcnZpY2UjY3JlYXRlfSBwZXJmb3JtaW5nIGEgc2VydmljZSByZXF1ZXN0IG9uIG5ldHdvcmsgbGV2ZWwsIGkuZS4gYnkgdXRpbGl6aW5nIGh0dHAgcmVxdWVzdHMgb3Igd2Vic29ja2V0cy5cclxuICogQHR5cGVkZWYgUlBDSW1wbFxyXG4gKiBAdHlwZSB7ZnVuY3Rpb259XHJcbiAqIEBwYXJhbSB7TWV0aG9kfHJwYy5TZXJ2aWNlTWV0aG9kPE1lc3NhZ2U8e30+LE1lc3NhZ2U8e30+Pn0gbWV0aG9kIFJlZmxlY3RlZCBvciBzdGF0aWMgbWV0aG9kIGJlaW5nIGNhbGxlZFxyXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IHJlcXVlc3REYXRhIFJlcXVlc3QgZGF0YVxyXG4gKiBAcGFyYW0ge1JQQ0ltcGxDYWxsYmFja30gY2FsbGJhY2sgQ2FsbGJhY2sgZnVuY3Rpb25cclxuICogQHJldHVybnMge3VuZGVmaW5lZH1cclxuICogQGV4YW1wbGVcclxuICogZnVuY3Rpb24gcnBjSW1wbChtZXRob2QsIHJlcXVlc3REYXRhLCBjYWxsYmFjaykge1xyXG4gKiAgICAgaWYgKHByb3RvYnVmLnV0aWwubGNGaXJzdChtZXRob2QubmFtZSkgIT09IFwibXlNZXRob2RcIikgLy8gY29tcGF0aWJsZSB3aXRoIHN0YXRpYyBjb2RlXHJcbiAqICAgICAgICAgdGhyb3cgRXJyb3IoXCJubyBzdWNoIG1ldGhvZFwiKTtcclxuICogICAgIGFzeW5jaHJvbm91c2x5T2J0YWluQVJlc3BvbnNlKHJlcXVlc3REYXRhLCBmdW5jdGlvbihlcnIsIHJlc3BvbnNlRGF0YSkge1xyXG4gKiAgICAgICAgIGNhbGxiYWNrKGVyciwgcmVzcG9uc2VEYXRhKTtcclxuICogICAgIH0pO1xyXG4gKiB9XHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIE5vZGUtc3R5bGUgY2FsbGJhY2sgYXMgdXNlZCBieSB7QGxpbmsgUlBDSW1wbH0uXHJcbiAqIEB0eXBlZGVmIFJQQ0ltcGxDYWxsYmFja1xyXG4gKiBAdHlwZSB7ZnVuY3Rpb259XHJcbiAqIEBwYXJhbSB7RXJyb3J8bnVsbH0gZXJyb3IgRXJyb3IsIGlmIGFueSwgb3RoZXJ3aXNlIGBudWxsYFxyXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl8bnVsbH0gW3Jlc3BvbnNlXSBSZXNwb25zZSBkYXRhIG9yIGBudWxsYCB0byBzaWduYWwgZW5kIG9mIHN0cmVhbSwgaWYgdGhlcmUgaGFzbid0IGJlZW4gYW4gZXJyb3JcclxuICogQHJldHVybnMge3VuZGVmaW5lZH1cclxuICovXHJcblxyXG5ycGMuU2VydmljZSA9IHJlcXVpcmUoXCIuL3JwYy9zZXJ2aWNlXCIpO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxubW9kdWxlLmV4cG9ydHMgPSBTZXJ2aWNlO1xyXG5cclxudmFyIHV0aWwgPSByZXF1aXJlKFwiLi4vdXRpbC9taW5pbWFsXCIpO1xyXG5cclxuLy8gRXh0ZW5kcyBFdmVudEVtaXR0ZXJcclxuKFNlcnZpY2UucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSh1dGlsLkV2ZW50RW1pdHRlci5wcm90b3R5cGUpKS5jb25zdHJ1Y3RvciA9IFNlcnZpY2U7XHJcblxyXG4vKipcclxuICogQSBzZXJ2aWNlIG1ldGhvZCBjYWxsYmFjayBhcyB1c2VkIGJ5IHtAbGluayBycGMuU2VydmljZU1ldGhvZHxTZXJ2aWNlTWV0aG9kfS5cclxuICpcclxuICogRGlmZmVycyBmcm9tIHtAbGluayBSUENJbXBsQ2FsbGJhY2t9IGluIHRoYXQgaXQgaXMgYW4gYWN0dWFsIGNhbGxiYWNrIG9mIGEgc2VydmljZSBtZXRob2Qgd2hpY2ggbWF5IG5vdCByZXR1cm4gYHJlc3BvbnNlID0gbnVsbGAuXHJcbiAqIEB0eXBlZGVmIHJwYy5TZXJ2aWNlTWV0aG9kQ2FsbGJhY2tcclxuICogQHRlbXBsYXRlIFRSZXMgZXh0ZW5kcyBNZXNzYWdlPFRSZXM+XHJcbiAqIEB0eXBlIHtmdW5jdGlvbn1cclxuICogQHBhcmFtIHtFcnJvcnxudWxsfSBlcnJvciBFcnJvciwgaWYgYW55XHJcbiAqIEBwYXJhbSB7VFJlc30gW3Jlc3BvbnNlXSBSZXNwb25zZSBtZXNzYWdlXHJcbiAqIEByZXR1cm5zIHt1bmRlZmluZWR9XHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIEEgc2VydmljZSBtZXRob2QgcGFydCBvZiBhIHtAbGluayBycGMuU2VydmljZX0gYXMgY3JlYXRlZCBieSB7QGxpbmsgU2VydmljZS5jcmVhdGV9LlxyXG4gKiBAdHlwZWRlZiBycGMuU2VydmljZU1ldGhvZFxyXG4gKiBAdGVtcGxhdGUgVFJlcSBleHRlbmRzIE1lc3NhZ2U8VFJlcT5cclxuICogQHRlbXBsYXRlIFRSZXMgZXh0ZW5kcyBNZXNzYWdlPFRSZXM+XHJcbiAqIEB0eXBlIHtmdW5jdGlvbn1cclxuICogQHBhcmFtIHtUUmVxfFByb3BlcnRpZXM8VFJlcT59IHJlcXVlc3QgUmVxdWVzdCBtZXNzYWdlIG9yIHBsYWluIG9iamVjdFxyXG4gKiBAcGFyYW0ge3JwYy5TZXJ2aWNlTWV0aG9kQ2FsbGJhY2s8VFJlcz59IFtjYWxsYmFja10gTm9kZS1zdHlsZSBjYWxsYmFjayBjYWxsZWQgd2l0aCB0aGUgZXJyb3IsIGlmIGFueSwgYW5kIHRoZSByZXNwb25zZSBtZXNzYWdlXHJcbiAqIEByZXR1cm5zIHtQcm9taXNlPE1lc3NhZ2U8VFJlcz4+fSBQcm9taXNlIGlmIGBjYWxsYmFja2AgaGFzIGJlZW4gb21pdHRlZCwgb3RoZXJ3aXNlIGB1bmRlZmluZWRgXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIENvbnN0cnVjdHMgYSBuZXcgUlBDIHNlcnZpY2UgaW5zdGFuY2UuXHJcbiAqIEBjbGFzc2Rlc2MgQW4gUlBDIHNlcnZpY2UgYXMgcmV0dXJuZWQgYnkge0BsaW5rIFNlcnZpY2UjY3JlYXRlfS5cclxuICogQGV4cG9ydHMgcnBjLlNlcnZpY2VcclxuICogQGV4dGVuZHMgdXRpbC5FdmVudEVtaXR0ZXJcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqIEBwYXJhbSB7UlBDSW1wbH0gcnBjSW1wbCBSUEMgaW1wbGVtZW50YXRpb25cclxuICogQHBhcmFtIHtib29sZWFufSBbcmVxdWVzdERlbGltaXRlZD1mYWxzZV0gV2hldGhlciByZXF1ZXN0cyBhcmUgbGVuZ3RoLWRlbGltaXRlZFxyXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtyZXNwb25zZURlbGltaXRlZD1mYWxzZV0gV2hldGhlciByZXNwb25zZXMgYXJlIGxlbmd0aC1kZWxpbWl0ZWRcclxuICovXHJcbmZ1bmN0aW9uIFNlcnZpY2UocnBjSW1wbCwgcmVxdWVzdERlbGltaXRlZCwgcmVzcG9uc2VEZWxpbWl0ZWQpIHtcclxuXHJcbiAgICBpZiAodHlwZW9mIHJwY0ltcGwgIT09IFwiZnVuY3Rpb25cIilcclxuICAgICAgICB0aHJvdyBUeXBlRXJyb3IoXCJycGNJbXBsIG11c3QgYmUgYSBmdW5jdGlvblwiKTtcclxuXHJcbiAgICB1dGlsLkV2ZW50RW1pdHRlci5jYWxsKHRoaXMpO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogUlBDIGltcGxlbWVudGF0aW9uLiBCZWNvbWVzIGBudWxsYCBvbmNlIHRoZSBzZXJ2aWNlIGlzIGVuZGVkLlxyXG4gICAgICogQHR5cGUge1JQQ0ltcGx8bnVsbH1cclxuICAgICAqL1xyXG4gICAgdGhpcy5ycGNJbXBsID0gcnBjSW1wbDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFdoZXRoZXIgcmVxdWVzdHMgYXJlIGxlbmd0aC1kZWxpbWl0ZWQuXHJcbiAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cclxuICAgICAqL1xyXG4gICAgdGhpcy5yZXF1ZXN0RGVsaW1pdGVkID0gQm9vbGVhbihyZXF1ZXN0RGVsaW1pdGVkKTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFdoZXRoZXIgcmVzcG9uc2VzIGFyZSBsZW5ndGgtZGVsaW1pdGVkLlxyXG4gICAgICogQHR5cGUge2Jvb2xlYW59XHJcbiAgICAgKi9cclxuICAgIHRoaXMucmVzcG9uc2VEZWxpbWl0ZWQgPSBCb29sZWFuKHJlc3BvbnNlRGVsaW1pdGVkKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIENhbGxzIGEgc2VydmljZSBtZXRob2QgdGhyb3VnaCB7QGxpbmsgcnBjLlNlcnZpY2UjcnBjSW1wbHxycGNJbXBsfS5cclxuICogQHBhcmFtIHtNZXRob2R8cnBjLlNlcnZpY2VNZXRob2Q8VFJlcSxUUmVzPn0gbWV0aG9kIFJlZmxlY3RlZCBvciBzdGF0aWMgbWV0aG9kXHJcbiAqIEBwYXJhbSB7Q29uc3RydWN0b3I8VFJlcT59IHJlcXVlc3RDdG9yIFJlcXVlc3QgY29uc3RydWN0b3JcclxuICogQHBhcmFtIHtDb25zdHJ1Y3RvcjxUUmVzPn0gcmVzcG9uc2VDdG9yIFJlc3BvbnNlIGNvbnN0cnVjdG9yXHJcbiAqIEBwYXJhbSB7VFJlcXxQcm9wZXJ0aWVzPFRSZXE+fSByZXF1ZXN0IFJlcXVlc3QgbWVzc2FnZSBvciBwbGFpbiBvYmplY3RcclxuICogQHBhcmFtIHtycGMuU2VydmljZU1ldGhvZENhbGxiYWNrPFRSZXM+fSBjYWxsYmFjayBTZXJ2aWNlIGNhbGxiYWNrXHJcbiAqIEByZXR1cm5zIHt1bmRlZmluZWR9XHJcbiAqIEB0ZW1wbGF0ZSBUUmVxIGV4dGVuZHMgTWVzc2FnZTxUUmVxPlxyXG4gKiBAdGVtcGxhdGUgVFJlcyBleHRlbmRzIE1lc3NhZ2U8VFJlcz5cclxuICovXHJcblNlcnZpY2UucHJvdG90eXBlLnJwY0NhbGwgPSBmdW5jdGlvbiBycGNDYWxsKG1ldGhvZCwgcmVxdWVzdEN0b3IsIHJlc3BvbnNlQ3RvciwgcmVxdWVzdCwgY2FsbGJhY2spIHtcclxuXHJcbiAgICBpZiAoIXJlcXVlc3QpXHJcbiAgICAgICAgdGhyb3cgVHlwZUVycm9yKFwicmVxdWVzdCBtdXN0IGJlIHNwZWNpZmllZFwiKTtcclxuXHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICBpZiAoIWNhbGxiYWNrKVxyXG4gICAgICAgIHJldHVybiB1dGlsLmFzUHJvbWlzZShycGNDYWxsLCBzZWxmLCBtZXRob2QsIHJlcXVlc3RDdG9yLCByZXNwb25zZUN0b3IsIHJlcXVlc3QpO1xyXG5cclxuICAgIGlmICghc2VsZi5ycGNJbXBsKSB7XHJcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgY2FsbGJhY2soRXJyb3IoXCJhbHJlYWR5IGVuZGVkXCIpKTsgfSwgMCk7XHJcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIH1cclxuXHJcbiAgICB0cnkge1xyXG4gICAgICAgIHJldHVybiBzZWxmLnJwY0ltcGwoXHJcbiAgICAgICAgICAgIG1ldGhvZCxcclxuICAgICAgICAgICAgcmVxdWVzdEN0b3Jbc2VsZi5yZXF1ZXN0RGVsaW1pdGVkID8gXCJlbmNvZGVEZWxpbWl0ZWRcIiA6IFwiZW5jb2RlXCJdKHJlcXVlc3QpLmZpbmlzaCgpLFxyXG4gICAgICAgICAgICBmdW5jdGlvbiBycGNDYWxsYmFjayhlcnIsIHJlc3BvbnNlKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZW1pdChcImVycm9yXCIsIGVyciwgbWV0aG9kKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLmVuZCgvKiBlbmRlZEJ5UlBDICovIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCEocmVzcG9uc2UgaW5zdGFuY2VvZiByZXNwb25zZUN0b3IpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2UgPSByZXNwb25zZUN0b3Jbc2VsZi5yZXNwb25zZURlbGltaXRlZCA/IFwiZGVjb2RlRGVsaW1pdGVkXCIgOiBcImRlY29kZVwiXShyZXNwb25zZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZW1pdChcImVycm9yXCIsIGVyciwgbWV0aG9kKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHNlbGYuZW1pdChcImRhdGFcIiwgcmVzcG9uc2UsIG1ldGhvZCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCwgcmVzcG9uc2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIHNlbGYuZW1pdChcImVycm9yXCIsIGVyciwgbWV0aG9kKTtcclxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBjYWxsYmFjayhlcnIpOyB9LCAwKTtcclxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEVuZHMgdGhpcyBzZXJ2aWNlIGFuZCBlbWl0cyB0aGUgYGVuZGAgZXZlbnQuXHJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2VuZGVkQnlSUEM9ZmFsc2VdIFdoZXRoZXIgdGhlIHNlcnZpY2UgaGFzIGJlZW4gZW5kZWQgYnkgdGhlIFJQQyBpbXBsZW1lbnRhdGlvbi5cclxuICogQHJldHVybnMge3JwYy5TZXJ2aWNlfSBgdGhpc2BcclxuICovXHJcblNlcnZpY2UucHJvdG90eXBlLmVuZCA9IGZ1bmN0aW9uIGVuZChlbmRlZEJ5UlBDKSB7XHJcbiAgICBpZiAodGhpcy5ycGNJbXBsKSB7XHJcbiAgICAgICAgaWYgKCFlbmRlZEJ5UlBDKSAvLyBzaWduYWwgZW5kIHRvIHJwY0ltcGxcclxuICAgICAgICAgICAgdGhpcy5ycGNJbXBsKG51bGwsIG51bGwsIG51bGwpO1xyXG4gICAgICAgIHRoaXMucnBjSW1wbCA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5lbWl0KFwiZW5kXCIpLm9mZigpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5tb2R1bGUuZXhwb3J0cyA9IFNlcnZpY2U7XHJcblxyXG4vLyBleHRlbmRzIE5hbWVzcGFjZVxyXG52YXIgTmFtZXNwYWNlID0gcmVxdWlyZShcIi4vbmFtZXNwYWNlXCIpO1xyXG4oKFNlcnZpY2UucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShOYW1lc3BhY2UucHJvdG90eXBlKSkuY29uc3RydWN0b3IgPSBTZXJ2aWNlKS5jbGFzc05hbWUgPSBcIlNlcnZpY2VcIjtcclxuXHJcbnZhciBNZXRob2QgPSByZXF1aXJlKFwiLi9tZXRob2RcIiksXHJcbiAgICB1dGlsICAgPSByZXF1aXJlKFwiLi91dGlsXCIpLFxyXG4gICAgcnBjICAgID0gcmVxdWlyZShcIi4vcnBjXCIpO1xyXG5cclxuLyoqXHJcbiAqIENvbnN0cnVjdHMgYSBuZXcgc2VydmljZSBpbnN0YW5jZS5cclxuICogQGNsYXNzZGVzYyBSZWZsZWN0ZWQgc2VydmljZS5cclxuICogQGV4dGVuZHMgTmFtZXNwYWNlQmFzZVxyXG4gKiBAY29uc3RydWN0b3JcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgU2VydmljZSBuYW1lXHJcbiAqIEBwYXJhbSB7T2JqZWN0LjxzdHJpbmcsKj59IFtvcHRpb25zXSBTZXJ2aWNlIG9wdGlvbnNcclxuICogQHRocm93cyB7VHlwZUVycm9yfSBJZiBhcmd1bWVudHMgYXJlIGludmFsaWRcclxuICovXHJcbmZ1bmN0aW9uIFNlcnZpY2UobmFtZSwgb3B0aW9ucykge1xyXG4gICAgTmFtZXNwYWNlLmNhbGwodGhpcywgbmFtZSwgb3B0aW9ucyk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZXJ2aWNlIG1ldGhvZHMuXHJcbiAgICAgKiBAdHlwZSB7T2JqZWN0LjxzdHJpbmcsTWV0aG9kPn1cclxuICAgICAqL1xyXG4gICAgdGhpcy5tZXRob2RzID0ge307IC8vIHRvSlNPTiwgbWFya2VyXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDYWNoZWQgbWV0aG9kcyBhcyBhbiBhcnJheS5cclxuICAgICAqIEB0eXBlIHtNZXRob2RbXXxudWxsfVxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgdGhpcy5fbWV0aG9kc0FycmF5ID0gbnVsbDtcclxufVxyXG5cclxuLyoqXHJcbiAqIFNlcnZpY2UgZGVzY3JpcHRvci5cclxuICogQGludGVyZmFjZSBJU2VydmljZVxyXG4gKiBAZXh0ZW5kcyBJTmFtZXNwYWNlXHJcbiAqIEBwcm9wZXJ0eSB7T2JqZWN0LjxzdHJpbmcsSU1ldGhvZD59IG1ldGhvZHMgTWV0aG9kIGRlc2NyaXB0b3JzXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIENvbnN0cnVjdHMgYSBzZXJ2aWNlIGZyb20gYSBzZXJ2aWNlIGRlc2NyaXB0b3IuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFNlcnZpY2UgbmFtZVxyXG4gKiBAcGFyYW0ge0lTZXJ2aWNlfSBqc29uIFNlcnZpY2UgZGVzY3JpcHRvclxyXG4gKiBAcmV0dXJucyB7U2VydmljZX0gQ3JlYXRlZCBzZXJ2aWNlXHJcbiAqIEB0aHJvd3Mge1R5cGVFcnJvcn0gSWYgYXJndW1lbnRzIGFyZSBpbnZhbGlkXHJcbiAqL1xyXG5TZXJ2aWNlLmZyb21KU09OID0gZnVuY3Rpb24gZnJvbUpTT04obmFtZSwganNvbikge1xyXG4gICAgdmFyIHNlcnZpY2UgPSBuZXcgU2VydmljZShuYW1lLCBqc29uLm9wdGlvbnMpO1xyXG4gICAgLyogaXN0YW5idWwgaWdub3JlIGVsc2UgKi9cclxuICAgIGlmIChqc29uLm1ldGhvZHMpXHJcbiAgICAgICAgZm9yICh2YXIgbmFtZXMgPSBPYmplY3Qua2V5cyhqc29uLm1ldGhvZHMpLCBpID0gMDsgaSA8IG5hbWVzLmxlbmd0aDsgKytpKVxyXG4gICAgICAgICAgICBzZXJ2aWNlLmFkZChNZXRob2QuZnJvbUpTT04obmFtZXNbaV0sIGpzb24ubWV0aG9kc1tuYW1lc1tpXV0pKTtcclxuICAgIGlmIChqc29uLm5lc3RlZClcclxuICAgICAgICBzZXJ2aWNlLmFkZEpTT04oanNvbi5uZXN0ZWQpO1xyXG4gICAgc2VydmljZS5jb21tZW50ID0ganNvbi5jb21tZW50O1xyXG4gICAgcmV0dXJuIHNlcnZpY2U7XHJcbn07XHJcblxyXG4vKipcclxuICogQ29udmVydHMgdGhpcyBzZXJ2aWNlIHRvIGEgc2VydmljZSBkZXNjcmlwdG9yLlxyXG4gKiBAcGFyYW0ge0lUb0pTT05PcHRpb25zfSBbdG9KU09OT3B0aW9uc10gSlNPTiBjb252ZXJzaW9uIG9wdGlvbnNcclxuICogQHJldHVybnMge0lTZXJ2aWNlfSBTZXJ2aWNlIGRlc2NyaXB0b3JcclxuICovXHJcblNlcnZpY2UucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uIHRvSlNPTih0b0pTT05PcHRpb25zKSB7XHJcbiAgICB2YXIgaW5oZXJpdGVkID0gTmFtZXNwYWNlLnByb3RvdHlwZS50b0pTT04uY2FsbCh0aGlzLCB0b0pTT05PcHRpb25zKTtcclxuICAgIHZhciBrZWVwQ29tbWVudHMgPSB0b0pTT05PcHRpb25zID8gQm9vbGVhbih0b0pTT05PcHRpb25zLmtlZXBDb21tZW50cykgOiBmYWxzZTtcclxuICAgIHJldHVybiB1dGlsLnRvT2JqZWN0KFtcclxuICAgICAgICBcIm9wdGlvbnNcIiAsIGluaGVyaXRlZCAmJiBpbmhlcml0ZWQub3B0aW9ucyB8fCB1bmRlZmluZWQsXHJcbiAgICAgICAgXCJtZXRob2RzXCIgLCBOYW1lc3BhY2UuYXJyYXlUb0pTT04odGhpcy5tZXRob2RzQXJyYXksIHRvSlNPTk9wdGlvbnMpIHx8IC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovIHt9LFxyXG4gICAgICAgIFwibmVzdGVkXCIgICwgaW5oZXJpdGVkICYmIGluaGVyaXRlZC5uZXN0ZWQgfHwgdW5kZWZpbmVkLFxyXG4gICAgICAgIFwiY29tbWVudFwiICwga2VlcENvbW1lbnRzID8gdGhpcy5jb21tZW50IDogdW5kZWZpbmVkXHJcbiAgICBdKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBNZXRob2RzIG9mIHRoaXMgc2VydmljZSBhcyBhbiBhcnJheSBmb3IgaXRlcmF0aW9uLlxyXG4gKiBAbmFtZSBTZXJ2aWNlI21ldGhvZHNBcnJheVxyXG4gKiBAdHlwZSB7TWV0aG9kW119XHJcbiAqIEByZWFkb25seVxyXG4gKi9cclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KFNlcnZpY2UucHJvdG90eXBlLCBcIm1ldGhvZHNBcnJheVwiLCB7XHJcbiAgICBnZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9tZXRob2RzQXJyYXkgfHwgKHRoaXMuX21ldGhvZHNBcnJheSA9IHV0aWwudG9BcnJheSh0aGlzLm1ldGhvZHMpKTtcclxuICAgIH1cclxufSk7XHJcblxyXG5mdW5jdGlvbiBjbGVhckNhY2hlKHNlcnZpY2UpIHtcclxuICAgIHNlcnZpY2UuX21ldGhvZHNBcnJheSA9IG51bGw7XHJcbiAgICByZXR1cm4gc2VydmljZTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEBvdmVycmlkZVxyXG4gKi9cclxuU2VydmljZS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gZ2V0KG5hbWUpIHtcclxuICAgIHJldHVybiB0aGlzLm1ldGhvZHNbbmFtZV1cclxuICAgICAgICB8fCBOYW1lc3BhY2UucHJvdG90eXBlLmdldC5jYWxsKHRoaXMsIG5hbWUpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEBvdmVycmlkZVxyXG4gKi9cclxuU2VydmljZS5wcm90b3R5cGUucmVzb2x2ZUFsbCA9IGZ1bmN0aW9uIHJlc29sdmVBbGwoKSB7XHJcbiAgICB2YXIgbWV0aG9kcyA9IHRoaXMubWV0aG9kc0FycmF5O1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtZXRob2RzLmxlbmd0aDsgKytpKVxyXG4gICAgICAgIG1ldGhvZHNbaV0ucmVzb2x2ZSgpO1xyXG4gICAgcmV0dXJuIE5hbWVzcGFjZS5wcm90b3R5cGUucmVzb2x2ZS5jYWxsKHRoaXMpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEBvdmVycmlkZVxyXG4gKi9cclxuU2VydmljZS5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gYWRkKG9iamVjdCkge1xyXG5cclxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xyXG4gICAgaWYgKHRoaXMuZ2V0KG9iamVjdC5uYW1lKSlcclxuICAgICAgICB0aHJvdyBFcnJvcihcImR1cGxpY2F0ZSBuYW1lICdcIiArIG9iamVjdC5uYW1lICsgXCInIGluIFwiICsgdGhpcyk7XHJcblxyXG4gICAgaWYgKG9iamVjdCBpbnN0YW5jZW9mIE1ldGhvZCkge1xyXG4gICAgICAgIHRoaXMubWV0aG9kc1tvYmplY3QubmFtZV0gPSBvYmplY3Q7XHJcbiAgICAgICAgb2JqZWN0LnBhcmVudCA9IHRoaXM7XHJcbiAgICAgICAgcmV0dXJuIGNsZWFyQ2FjaGUodGhpcyk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gTmFtZXNwYWNlLnByb3RvdHlwZS5hZGQuY2FsbCh0aGlzLCBvYmplY3QpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEBvdmVycmlkZVxyXG4gKi9cclxuU2VydmljZS5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24gcmVtb3ZlKG9iamVjdCkge1xyXG4gICAgaWYgKG9iamVjdCBpbnN0YW5jZW9mIE1ldGhvZCkge1xyXG5cclxuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cclxuICAgICAgICBpZiAodGhpcy5tZXRob2RzW29iamVjdC5uYW1lXSAhPT0gb2JqZWN0KVxyXG4gICAgICAgICAgICB0aHJvdyBFcnJvcihvYmplY3QgKyBcIiBpcyBub3QgYSBtZW1iZXIgb2YgXCIgKyB0aGlzKTtcclxuXHJcbiAgICAgICAgZGVsZXRlIHRoaXMubWV0aG9kc1tvYmplY3QubmFtZV07XHJcbiAgICAgICAgb2JqZWN0LnBhcmVudCA9IG51bGw7XHJcbiAgICAgICAgcmV0dXJuIGNsZWFyQ2FjaGUodGhpcyk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gTmFtZXNwYWNlLnByb3RvdHlwZS5yZW1vdmUuY2FsbCh0aGlzLCBvYmplY3QpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBydW50aW1lIHNlcnZpY2UgdXNpbmcgdGhlIHNwZWNpZmllZCBycGMgaW1wbGVtZW50YXRpb24uXHJcbiAqIEBwYXJhbSB7UlBDSW1wbH0gcnBjSW1wbCBSUEMgaW1wbGVtZW50YXRpb25cclxuICogQHBhcmFtIHtib29sZWFufSBbcmVxdWVzdERlbGltaXRlZD1mYWxzZV0gV2hldGhlciByZXF1ZXN0cyBhcmUgbGVuZ3RoLWRlbGltaXRlZFxyXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtyZXNwb25zZURlbGltaXRlZD1mYWxzZV0gV2hldGhlciByZXNwb25zZXMgYXJlIGxlbmd0aC1kZWxpbWl0ZWRcclxuICogQHJldHVybnMge3JwYy5TZXJ2aWNlfSBSUEMgc2VydmljZS4gVXNlZnVsIHdoZXJlIHJlcXVlc3RzIGFuZC9vciByZXNwb25zZXMgYXJlIHN0cmVhbWVkLlxyXG4gKi9cclxuU2VydmljZS5wcm90b3R5cGUuY3JlYXRlID0gZnVuY3Rpb24gY3JlYXRlKHJwY0ltcGwsIHJlcXVlc3REZWxpbWl0ZWQsIHJlc3BvbnNlRGVsaW1pdGVkKSB7XHJcbiAgICB2YXIgcnBjU2VydmljZSA9IG5ldyBycGMuU2VydmljZShycGNJbXBsLCByZXF1ZXN0RGVsaW1pdGVkLCByZXNwb25zZURlbGltaXRlZCk7XHJcbiAgICBmb3IgKHZhciBpID0gMCwgbWV0aG9kOyBpIDwgLyogaW5pdGlhbGl6ZXMgKi8gdGhpcy5tZXRob2RzQXJyYXkubGVuZ3RoOyArK2kpIHtcclxuICAgICAgICB2YXIgbWV0aG9kTmFtZSA9IHV0aWwubGNGaXJzdCgobWV0aG9kID0gdGhpcy5fbWV0aG9kc0FycmF5W2ldKS5yZXNvbHZlKCkubmFtZSkucmVwbGFjZSgvW14kXFx3X10vZywgXCJcIik7XHJcbiAgICAgICAgcnBjU2VydmljZVttZXRob2ROYW1lXSA9IHV0aWwuY29kZWdlbihbXCJyXCIsXCJjXCJdLCB1dGlsLmlzUmVzZXJ2ZWQobWV0aG9kTmFtZSkgPyBtZXRob2ROYW1lICsgXCJfXCIgOiBtZXRob2ROYW1lKShcInJldHVybiB0aGlzLnJwY0NhbGwobSxxLHMscixjKVwiKSh7XHJcbiAgICAgICAgICAgIG06IG1ldGhvZCxcclxuICAgICAgICAgICAgcTogbWV0aG9kLnJlc29sdmVkUmVxdWVzdFR5cGUuY3RvcixcclxuICAgICAgICAgICAgczogbWV0aG9kLnJlc29sdmVkUmVzcG9uc2VUeXBlLmN0b3JcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIHJldHVybiBycGNTZXJ2aWNlO1xyXG59O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxubW9kdWxlLmV4cG9ydHMgPSBUeXBlO1xyXG5cclxuLy8gZXh0ZW5kcyBOYW1lc3BhY2VcclxudmFyIE5hbWVzcGFjZSA9IHJlcXVpcmUoXCIuL25hbWVzcGFjZVwiKTtcclxuKChUeXBlLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoTmFtZXNwYWNlLnByb3RvdHlwZSkpLmNvbnN0cnVjdG9yID0gVHlwZSkuY2xhc3NOYW1lID0gXCJUeXBlXCI7XHJcblxyXG52YXIgRW51bSAgICAgID0gcmVxdWlyZShcIi4vZW51bVwiKSxcclxuICAgIE9uZU9mICAgICA9IHJlcXVpcmUoXCIuL29uZW9mXCIpLFxyXG4gICAgRmllbGQgICAgID0gcmVxdWlyZShcIi4vZmllbGRcIiksXHJcbiAgICBNYXBGaWVsZCAgPSByZXF1aXJlKFwiLi9tYXBmaWVsZFwiKSxcclxuICAgIFNlcnZpY2UgICA9IHJlcXVpcmUoXCIuL3NlcnZpY2VcIiksXHJcbiAgICBNZXNzYWdlICAgPSByZXF1aXJlKFwiLi9tZXNzYWdlXCIpLFxyXG4gICAgUmVhZGVyICAgID0gcmVxdWlyZShcIi4vcmVhZGVyXCIpLFxyXG4gICAgV3JpdGVyICAgID0gcmVxdWlyZShcIi4vd3JpdGVyXCIpLFxyXG4gICAgdXRpbCAgICAgID0gcmVxdWlyZShcIi4vdXRpbFwiKSxcclxuICAgIGVuY29kZXIgICA9IHJlcXVpcmUoXCIuL2VuY29kZXJcIiksXHJcbiAgICBkZWNvZGVyICAgPSByZXF1aXJlKFwiLi9kZWNvZGVyXCIpLFxyXG4gICAgdmVyaWZpZXIgID0gcmVxdWlyZShcIi4vdmVyaWZpZXJcIiksXHJcbiAgICBjb252ZXJ0ZXIgPSByZXF1aXJlKFwiLi9jb252ZXJ0ZXJcIiksXHJcbiAgICB3cmFwcGVycyAgPSByZXF1aXJlKFwiLi93cmFwcGVyc1wiKTtcclxuXHJcbi8qKlxyXG4gKiBDb25zdHJ1Y3RzIGEgbmV3IHJlZmxlY3RlZCBtZXNzYWdlIHR5cGUgaW5zdGFuY2UuXHJcbiAqIEBjbGFzc2Rlc2MgUmVmbGVjdGVkIG1lc3NhZ2UgdHlwZS5cclxuICogQGV4dGVuZHMgTmFtZXNwYWNlQmFzZVxyXG4gKiBAY29uc3RydWN0b3JcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgTWVzc2FnZSBuYW1lXHJcbiAqIEBwYXJhbSB7T2JqZWN0LjxzdHJpbmcsKj59IFtvcHRpb25zXSBEZWNsYXJlZCBvcHRpb25zXHJcbiAqL1xyXG5mdW5jdGlvbiBUeXBlKG5hbWUsIG9wdGlvbnMpIHtcclxuICAgIE5hbWVzcGFjZS5jYWxsKHRoaXMsIG5hbWUsIG9wdGlvbnMpO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogTWVzc2FnZSBmaWVsZHMuXHJcbiAgICAgKiBAdHlwZSB7T2JqZWN0LjxzdHJpbmcsRmllbGQ+fVxyXG4gICAgICovXHJcbiAgICB0aGlzLmZpZWxkcyA9IHt9OyAgLy8gdG9KU09OLCBtYXJrZXJcclxuXHJcbiAgICAvKipcclxuICAgICAqIE9uZW9mcyBkZWNsYXJlZCB3aXRoaW4gdGhpcyBuYW1lc3BhY2UsIGlmIGFueS5cclxuICAgICAqIEB0eXBlIHtPYmplY3QuPHN0cmluZyxPbmVPZj59XHJcbiAgICAgKi9cclxuICAgIHRoaXMub25lb2ZzID0gdW5kZWZpbmVkOyAvLyB0b0pTT05cclxuXHJcbiAgICAvKipcclxuICAgICAqIEV4dGVuc2lvbiByYW5nZXMsIGlmIGFueS5cclxuICAgICAqIEB0eXBlIHtudW1iZXJbXVtdfVxyXG4gICAgICovXHJcbiAgICB0aGlzLmV4dGVuc2lvbnMgPSB1bmRlZmluZWQ7IC8vIHRvSlNPTlxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVzZXJ2ZWQgcmFuZ2VzLCBpZiBhbnkuXHJcbiAgICAgKiBAdHlwZSB7QXJyYXkuPG51bWJlcltdfHN0cmluZz59XHJcbiAgICAgKi9cclxuICAgIHRoaXMucmVzZXJ2ZWQgPSB1bmRlZmluZWQ7IC8vIHRvSlNPTlxyXG5cclxuICAgIC8qP1xyXG4gICAgICogV2hldGhlciB0aGlzIHR5cGUgaXMgYSBsZWdhY3kgZ3JvdXAuXHJcbiAgICAgKiBAdHlwZSB7Ym9vbGVhbnx1bmRlZmluZWR9XHJcbiAgICAgKi9cclxuICAgIHRoaXMuZ3JvdXAgPSB1bmRlZmluZWQ7IC8vIHRvSlNPTlxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2FjaGVkIGZpZWxkcyBieSBpZC5cclxuICAgICAqIEB0eXBlIHtPYmplY3QuPG51bWJlcixGaWVsZD58bnVsbH1cclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIHRoaXMuX2ZpZWxkc0J5SWQgPSBudWxsO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2FjaGVkIGZpZWxkcyBhcyBhbiBhcnJheS5cclxuICAgICAqIEB0eXBlIHtGaWVsZFtdfG51bGx9XHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICB0aGlzLl9maWVsZHNBcnJheSA9IG51bGw7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDYWNoZWQgb25lb2ZzIGFzIGFuIGFycmF5LlxyXG4gICAgICogQHR5cGUge09uZU9mW118bnVsbH1cclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIHRoaXMuX29uZW9mc0FycmF5ID0gbnVsbDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIENhY2hlZCBjb25zdHJ1Y3Rvci5cclxuICAgICAqIEB0eXBlIHtDb25zdHJ1Y3Rvcjx7fT59XHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICB0aGlzLl9jdG9yID0gbnVsbDtcclxufVxyXG5cclxuT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoVHlwZS5wcm90b3R5cGUsIHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIE1lc3NhZ2UgZmllbGRzIGJ5IGlkLlxyXG4gICAgICogQG5hbWUgVHlwZSNmaWVsZHNCeUlkXHJcbiAgICAgKiBAdHlwZSB7T2JqZWN0LjxudW1iZXIsRmllbGQ+fVxyXG4gICAgICogQHJlYWRvbmx5XHJcbiAgICAgKi9cclxuICAgIGZpZWxkc0J5SWQ6IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9maWVsZHNCeUlkKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2ZpZWxkc0J5SWQ7XHJcblxyXG4gICAgICAgICAgICB0aGlzLl9maWVsZHNCeUlkID0ge307XHJcbiAgICAgICAgICAgIGZvciAodmFyIG5hbWVzID0gT2JqZWN0LmtleXModGhpcy5maWVsZHMpLCBpID0gMDsgaSA8IG5hbWVzLmxlbmd0aDsgKytpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmllbGQgPSB0aGlzLmZpZWxkc1tuYW1lc1tpXV0sXHJcbiAgICAgICAgICAgICAgICAgICAgaWQgPSBmaWVsZC5pZDtcclxuXHJcbiAgICAgICAgICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9maWVsZHNCeUlkW2lkXSlcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcImR1cGxpY2F0ZSBpZCBcIiArIGlkICsgXCIgaW4gXCIgKyB0aGlzKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLl9maWVsZHNCeUlkW2lkXSA9IGZpZWxkO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9maWVsZHNCeUlkO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaWVsZHMgb2YgdGhpcyBtZXNzYWdlIGFzIGFuIGFycmF5IGZvciBpdGVyYXRpb24uXHJcbiAgICAgKiBAbmFtZSBUeXBlI2ZpZWxkc0FycmF5XHJcbiAgICAgKiBAdHlwZSB7RmllbGRbXX1cclxuICAgICAqIEByZWFkb25seVxyXG4gICAgICovXHJcbiAgICBmaWVsZHNBcnJheToge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9maWVsZHNBcnJheSB8fCAodGhpcy5fZmllbGRzQXJyYXkgPSB1dGlsLnRvQXJyYXkodGhpcy5maWVsZHMpKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogT25lb2ZzIG9mIHRoaXMgbWVzc2FnZSBhcyBhbiBhcnJheSBmb3IgaXRlcmF0aW9uLlxyXG4gICAgICogQG5hbWUgVHlwZSNvbmVvZnNBcnJheVxyXG4gICAgICogQHR5cGUge09uZU9mW119XHJcbiAgICAgKiBAcmVhZG9ubHlcclxuICAgICAqL1xyXG4gICAgb25lb2ZzQXJyYXk6IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fb25lb2ZzQXJyYXkgfHwgKHRoaXMuX29uZW9mc0FycmF5ID0gdXRpbC50b0FycmF5KHRoaXMub25lb2ZzKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSByZWdpc3RlcmVkIGNvbnN0cnVjdG9yLCBpZiBhbnkgcmVnaXN0ZXJlZCwgb3RoZXJ3aXNlIGEgZ2VuZXJpYyBjb25zdHJ1Y3Rvci5cclxuICAgICAqIEFzc2lnbmluZyBhIGZ1bmN0aW9uIHJlcGxhY2VzIHRoZSBpbnRlcm5hbCBjb25zdHJ1Y3Rvci4gSWYgdGhlIGZ1bmN0aW9uIGRvZXMgbm90IGV4dGVuZCB7QGxpbmsgTWVzc2FnZX0geWV0LCBpdHMgcHJvdG90eXBlIHdpbGwgYmUgc2V0dXAgYWNjb3JkaW5nbHkgYW5kIHN0YXRpYyBtZXRob2RzIHdpbGwgYmUgcG9wdWxhdGVkLiBJZiBpdCBhbHJlYWR5IGV4dGVuZHMge0BsaW5rIE1lc3NhZ2V9LCBpdCB3aWxsIGp1c3QgcmVwbGFjZSB0aGUgaW50ZXJuYWwgY29uc3RydWN0b3IuXHJcbiAgICAgKiBAbmFtZSBUeXBlI2N0b3JcclxuICAgICAqIEB0eXBlIHtDb25zdHJ1Y3Rvcjx7fT59XHJcbiAgICAgKi9cclxuICAgIGN0b3I6IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fY3RvciB8fCAodGhpcy5jdG9yID0gVHlwZS5nZW5lcmF0ZUNvbnN0cnVjdG9yKHRoaXMpKCkpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbihjdG9yKSB7XHJcblxyXG4gICAgICAgICAgICAvLyBFbnN1cmUgcHJvcGVyIHByb3RvdHlwZVxyXG4gICAgICAgICAgICB2YXIgcHJvdG90eXBlID0gY3Rvci5wcm90b3R5cGU7XHJcbiAgICAgICAgICAgIGlmICghKHByb3RvdHlwZSBpbnN0YW5jZW9mIE1lc3NhZ2UpKSB7XHJcbiAgICAgICAgICAgICAgICAoY3Rvci5wcm90b3R5cGUgPSBuZXcgTWVzc2FnZSgpKS5jb25zdHJ1Y3RvciA9IGN0b3I7XHJcbiAgICAgICAgICAgICAgICB1dGlsLm1lcmdlKGN0b3IucHJvdG90eXBlLCBwcm90b3R5cGUpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBDbGFzc2VzIGFuZCBtZXNzYWdlcyByZWZlcmVuY2UgdGhlaXIgcmVmbGVjdGVkIHR5cGVcclxuICAgICAgICAgICAgY3Rvci4kdHlwZSA9IGN0b3IucHJvdG90eXBlLiR0eXBlID0gdGhpcztcclxuXHJcbiAgICAgICAgICAgIC8vIE1peCBpbiBzdGF0aWMgbWV0aG9kc1xyXG4gICAgICAgICAgICB1dGlsLm1lcmdlKGN0b3IsIE1lc3NhZ2UsIHRydWUpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5fY3RvciA9IGN0b3I7XHJcblxyXG4gICAgICAgICAgICAvLyBNZXNzYWdlcyBoYXZlIG5vbi1lbnVtZXJhYmxlIGRlZmF1bHQgdmFsdWVzIG9uIHRoZWlyIHByb3RvdHlwZVxyXG4gICAgICAgICAgICB2YXIgaSA9IDA7XHJcbiAgICAgICAgICAgIGZvciAoOyBpIDwgLyogaW5pdGlhbGl6ZXMgKi8gdGhpcy5maWVsZHNBcnJheS5sZW5ndGg7ICsraSlcclxuICAgICAgICAgICAgICAgIHRoaXMuX2ZpZWxkc0FycmF5W2ldLnJlc29sdmUoKTsgLy8gZW5zdXJlcyBhIHByb3BlciB2YWx1ZVxyXG5cclxuICAgICAgICAgICAgLy8gTWVzc2FnZXMgaGF2ZSBub24tZW51bWVyYWJsZSBnZXR0ZXJzIGFuZCBzZXR0ZXJzIGZvciBlYWNoIHZpcnR1YWwgb25lb2YgZmllbGRcclxuICAgICAgICAgICAgdmFyIGN0b3JQcm9wZXJ0aWVzID0ge307XHJcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCAvKiBpbml0aWFsaXplcyAqLyB0aGlzLm9uZW9mc0FycmF5Lmxlbmd0aDsgKytpKVxyXG4gICAgICAgICAgICAgICAgY3RvclByb3BlcnRpZXNbdGhpcy5fb25lb2ZzQXJyYXlbaV0ucmVzb2x2ZSgpLm5hbWVdID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIGdldDogdXRpbC5vbmVPZkdldHRlcih0aGlzLl9vbmVvZnNBcnJheVtpXS5vbmVvZiksXHJcbiAgICAgICAgICAgICAgICAgICAgc2V0OiB1dGlsLm9uZU9mU2V0dGVyKHRoaXMuX29uZW9mc0FycmF5W2ldLm9uZW9mKVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgaWYgKGkpXHJcbiAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyhjdG9yLnByb3RvdHlwZSwgY3RvclByb3BlcnRpZXMpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSk7XHJcblxyXG4vKipcclxuICogR2VuZXJhdGVzIGEgY29uc3RydWN0b3IgZnVuY3Rpb24gZm9yIHRoZSBzcGVjaWZpZWQgdHlwZS5cclxuICogQHBhcmFtIHtUeXBlfSBtdHlwZSBNZXNzYWdlIHR5cGVcclxuICogQHJldHVybnMge0NvZGVnZW59IENvZGVnZW4gaW5zdGFuY2VcclxuICovXHJcblR5cGUuZ2VuZXJhdGVDb25zdHJ1Y3RvciA9IGZ1bmN0aW9uIGdlbmVyYXRlQ29uc3RydWN0b3IobXR5cGUpIHtcclxuICAgIC8qIGVzbGludC1kaXNhYmxlIG5vLXVuZXhwZWN0ZWQtbXVsdGlsaW5lICovXHJcbiAgICB2YXIgZ2VuID0gdXRpbC5jb2RlZ2VuKFtcInBcIl0sIG10eXBlLm5hbWUpO1xyXG4gICAgLy8gZXhwbGljaXRseSBpbml0aWFsaXplIG11dGFibGUgb2JqZWN0L2FycmF5IGZpZWxkcyBzbyB0aGF0IHRoZXNlIGFyZW4ndCBqdXN0IGluaGVyaXRlZCBmcm9tIHRoZSBwcm90b3R5cGVcclxuICAgIGZvciAodmFyIGkgPSAwLCBmaWVsZDsgaSA8IG10eXBlLmZpZWxkc0FycmF5Lmxlbmd0aDsgKytpKVxyXG4gICAgICAgIGlmICgoZmllbGQgPSBtdHlwZS5fZmllbGRzQXJyYXlbaV0pLm1hcCkgZ2VuXHJcbiAgICAgICAgICAgIChcInRoaXMlcz17fVwiLCB1dGlsLnNhZmVQcm9wKGZpZWxkLm5hbWUpKTtcclxuICAgICAgICBlbHNlIGlmIChmaWVsZC5yZXBlYXRlZCkgZ2VuXHJcbiAgICAgICAgICAgIChcInRoaXMlcz1bXVwiLCB1dGlsLnNhZmVQcm9wKGZpZWxkLm5hbWUpKTtcclxuICAgIHJldHVybiBnZW5cclxuICAgIChcImlmKHApZm9yKHZhciBrcz1PYmplY3Qua2V5cyhwKSxpPTA7aTxrcy5sZW5ndGg7KytpKWlmKHBba3NbaV1dIT1udWxsKVwiKSAvLyBvbWl0IHVuZGVmaW5lZCBvciBudWxsXHJcbiAgICAgICAgKFwidGhpc1trc1tpXV09cFtrc1tpXV1cIik7XHJcbiAgICAvKiBlc2xpbnQtZW5hYmxlIG5vLXVuZXhwZWN0ZWQtbXVsdGlsaW5lICovXHJcbn07XHJcblxyXG5mdW5jdGlvbiBjbGVhckNhY2hlKHR5cGUpIHtcclxuICAgIHR5cGUuX2ZpZWxkc0J5SWQgPSB0eXBlLl9maWVsZHNBcnJheSA9IHR5cGUuX29uZW9mc0FycmF5ID0gbnVsbDtcclxuICAgIGRlbGV0ZSB0eXBlLmVuY29kZTtcclxuICAgIGRlbGV0ZSB0eXBlLmRlY29kZTtcclxuICAgIGRlbGV0ZSB0eXBlLnZlcmlmeTtcclxuICAgIHJldHVybiB0eXBlO1xyXG59XHJcblxyXG4vKipcclxuICogTWVzc2FnZSB0eXBlIGRlc2NyaXB0b3IuXHJcbiAqIEBpbnRlcmZhY2UgSVR5cGVcclxuICogQGV4dGVuZHMgSU5hbWVzcGFjZVxyXG4gKiBAcHJvcGVydHkge09iamVjdC48c3RyaW5nLElPbmVPZj59IFtvbmVvZnNdIE9uZW9mIGRlc2NyaXB0b3JzXHJcbiAqIEBwcm9wZXJ0eSB7T2JqZWN0LjxzdHJpbmcsSUZpZWxkPn0gZmllbGRzIEZpZWxkIGRlc2NyaXB0b3JzXHJcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyW11bXX0gW2V4dGVuc2lvbnNdIEV4dGVuc2lvbiByYW5nZXNcclxuICogQHByb3BlcnR5IHtudW1iZXJbXVtdfSBbcmVzZXJ2ZWRdIFJlc2VydmVkIHJhbmdlc1xyXG4gKiBAcHJvcGVydHkge2Jvb2xlYW59IFtncm91cD1mYWxzZV0gV2hldGhlciBhIGxlZ2FjeSBncm91cCBvciBub3RcclxuICovXHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIG1lc3NhZ2UgdHlwZSBmcm9tIGEgbWVzc2FnZSB0eXBlIGRlc2NyaXB0b3IuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIE1lc3NhZ2UgbmFtZVxyXG4gKiBAcGFyYW0ge0lUeXBlfSBqc29uIE1lc3NhZ2UgdHlwZSBkZXNjcmlwdG9yXHJcbiAqIEByZXR1cm5zIHtUeXBlfSBDcmVhdGVkIG1lc3NhZ2UgdHlwZVxyXG4gKi9cclxuVHlwZS5mcm9tSlNPTiA9IGZ1bmN0aW9uIGZyb21KU09OKG5hbWUsIGpzb24pIHtcclxuICAgIHZhciB0eXBlID0gbmV3IFR5cGUobmFtZSwganNvbi5vcHRpb25zKTtcclxuICAgIHR5cGUuZXh0ZW5zaW9ucyA9IGpzb24uZXh0ZW5zaW9ucztcclxuICAgIHR5cGUucmVzZXJ2ZWQgPSBqc29uLnJlc2VydmVkO1xyXG4gICAgdmFyIG5hbWVzID0gT2JqZWN0LmtleXMoanNvbi5maWVsZHMpLFxyXG4gICAgICAgIGkgPSAwO1xyXG4gICAgZm9yICg7IGkgPCBuYW1lcy5sZW5ndGg7ICsraSlcclxuICAgICAgICB0eXBlLmFkZChcclxuICAgICAgICAgICAgKCB0eXBlb2YganNvbi5maWVsZHNbbmFtZXNbaV1dLmtleVR5cGUgIT09IFwidW5kZWZpbmVkXCJcclxuICAgICAgICAgICAgPyBNYXBGaWVsZC5mcm9tSlNPTlxyXG4gICAgICAgICAgICA6IEZpZWxkLmZyb21KU09OICkobmFtZXNbaV0sIGpzb24uZmllbGRzW25hbWVzW2ldXSlcclxuICAgICAgICApO1xyXG4gICAgaWYgKGpzb24ub25lb2ZzKVxyXG4gICAgICAgIGZvciAobmFtZXMgPSBPYmplY3Qua2V5cyhqc29uLm9uZW9mcyksIGkgPSAwOyBpIDwgbmFtZXMubGVuZ3RoOyArK2kpXHJcbiAgICAgICAgICAgIHR5cGUuYWRkKE9uZU9mLmZyb21KU09OKG5hbWVzW2ldLCBqc29uLm9uZW9mc1tuYW1lc1tpXV0pKTtcclxuICAgIGlmIChqc29uLm5lc3RlZClcclxuICAgICAgICBmb3IgKG5hbWVzID0gT2JqZWN0LmtleXMoanNvbi5uZXN0ZWQpLCBpID0gMDsgaSA8IG5hbWVzLmxlbmd0aDsgKytpKSB7XHJcbiAgICAgICAgICAgIHZhciBuZXN0ZWQgPSBqc29uLm5lc3RlZFtuYW1lc1tpXV07XHJcbiAgICAgICAgICAgIHR5cGUuYWRkKCAvLyBtb3N0IHRvIGxlYXN0IGxpa2VseVxyXG4gICAgICAgICAgICAgICAgKCBuZXN0ZWQuaWQgIT09IHVuZGVmaW5lZFxyXG4gICAgICAgICAgICAgICAgPyBGaWVsZC5mcm9tSlNPTlxyXG4gICAgICAgICAgICAgICAgOiBuZXN0ZWQuZmllbGRzICE9PSB1bmRlZmluZWRcclxuICAgICAgICAgICAgICAgID8gVHlwZS5mcm9tSlNPTlxyXG4gICAgICAgICAgICAgICAgOiBuZXN0ZWQudmFsdWVzICE9PSB1bmRlZmluZWRcclxuICAgICAgICAgICAgICAgID8gRW51bS5mcm9tSlNPTlxyXG4gICAgICAgICAgICAgICAgOiBuZXN0ZWQubWV0aG9kcyAhPT0gdW5kZWZpbmVkXHJcbiAgICAgICAgICAgICAgICA/IFNlcnZpY2UuZnJvbUpTT05cclxuICAgICAgICAgICAgICAgIDogTmFtZXNwYWNlLmZyb21KU09OICkobmFtZXNbaV0sIG5lc3RlZClcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICBpZiAoanNvbi5leHRlbnNpb25zICYmIGpzb24uZXh0ZW5zaW9ucy5sZW5ndGgpXHJcbiAgICAgICAgdHlwZS5leHRlbnNpb25zID0ganNvbi5leHRlbnNpb25zO1xyXG4gICAgaWYgKGpzb24ucmVzZXJ2ZWQgJiYganNvbi5yZXNlcnZlZC5sZW5ndGgpXHJcbiAgICAgICAgdHlwZS5yZXNlcnZlZCA9IGpzb24ucmVzZXJ2ZWQ7XHJcbiAgICBpZiAoanNvbi5ncm91cClcclxuICAgICAgICB0eXBlLmdyb3VwID0gdHJ1ZTtcclxuICAgIGlmIChqc29uLmNvbW1lbnQpXHJcbiAgICAgICAgdHlwZS5jb21tZW50ID0ganNvbi5jb21tZW50O1xyXG4gICAgcmV0dXJuIHR5cGU7XHJcbn07XHJcblxyXG4vKipcclxuICogQ29udmVydHMgdGhpcyBtZXNzYWdlIHR5cGUgdG8gYSBtZXNzYWdlIHR5cGUgZGVzY3JpcHRvci5cclxuICogQHBhcmFtIHtJVG9KU09OT3B0aW9uc30gW3RvSlNPTk9wdGlvbnNdIEpTT04gY29udmVyc2lvbiBvcHRpb25zXHJcbiAqIEByZXR1cm5zIHtJVHlwZX0gTWVzc2FnZSB0eXBlIGRlc2NyaXB0b3JcclxuICovXHJcblR5cGUucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uIHRvSlNPTih0b0pTT05PcHRpb25zKSB7XHJcbiAgICB2YXIgaW5oZXJpdGVkID0gTmFtZXNwYWNlLnByb3RvdHlwZS50b0pTT04uY2FsbCh0aGlzLCB0b0pTT05PcHRpb25zKTtcclxuICAgIHZhciBrZWVwQ29tbWVudHMgPSB0b0pTT05PcHRpb25zID8gQm9vbGVhbih0b0pTT05PcHRpb25zLmtlZXBDb21tZW50cykgOiBmYWxzZTtcclxuICAgIHJldHVybiB1dGlsLnRvT2JqZWN0KFtcclxuICAgICAgICBcIm9wdGlvbnNcIiAgICAsIGluaGVyaXRlZCAmJiBpbmhlcml0ZWQub3B0aW9ucyB8fCB1bmRlZmluZWQsXHJcbiAgICAgICAgXCJvbmVvZnNcIiAgICAgLCBOYW1lc3BhY2UuYXJyYXlUb0pTT04odGhpcy5vbmVvZnNBcnJheSwgdG9KU09OT3B0aW9ucyksXHJcbiAgICAgICAgXCJmaWVsZHNcIiAgICAgLCBOYW1lc3BhY2UuYXJyYXlUb0pTT04odGhpcy5maWVsZHNBcnJheS5maWx0ZXIoZnVuY3Rpb24ob2JqKSB7IHJldHVybiAhb2JqLmRlY2xhcmluZ0ZpZWxkOyB9KSwgdG9KU09OT3B0aW9ucykgfHwge30sXHJcbiAgICAgICAgXCJleHRlbnNpb25zXCIgLCB0aGlzLmV4dGVuc2lvbnMgJiYgdGhpcy5leHRlbnNpb25zLmxlbmd0aCA/IHRoaXMuZXh0ZW5zaW9ucyA6IHVuZGVmaW5lZCxcclxuICAgICAgICBcInJlc2VydmVkXCIgICAsIHRoaXMucmVzZXJ2ZWQgJiYgdGhpcy5yZXNlcnZlZC5sZW5ndGggPyB0aGlzLnJlc2VydmVkIDogdW5kZWZpbmVkLFxyXG4gICAgICAgIFwiZ3JvdXBcIiAgICAgICwgdGhpcy5ncm91cCB8fCB1bmRlZmluZWQsXHJcbiAgICAgICAgXCJuZXN0ZWRcIiAgICAgLCBpbmhlcml0ZWQgJiYgaW5oZXJpdGVkLm5lc3RlZCB8fCB1bmRlZmluZWQsXHJcbiAgICAgICAgXCJjb21tZW50XCIgICAgLCBrZWVwQ29tbWVudHMgPyB0aGlzLmNvbW1lbnQgOiB1bmRlZmluZWRcclxuICAgIF0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEBvdmVycmlkZVxyXG4gKi9cclxuVHlwZS5wcm90b3R5cGUucmVzb2x2ZUFsbCA9IGZ1bmN0aW9uIHJlc29sdmVBbGwoKSB7XHJcbiAgICB2YXIgZmllbGRzID0gdGhpcy5maWVsZHNBcnJheSwgaSA9IDA7XHJcbiAgICB3aGlsZSAoaSA8IGZpZWxkcy5sZW5ndGgpXHJcbiAgICAgICAgZmllbGRzW2krK10ucmVzb2x2ZSgpO1xyXG4gICAgdmFyIG9uZW9mcyA9IHRoaXMub25lb2ZzQXJyYXk7IGkgPSAwO1xyXG4gICAgd2hpbGUgKGkgPCBvbmVvZnMubGVuZ3RoKVxyXG4gICAgICAgIG9uZW9mc1tpKytdLnJlc29sdmUoKTtcclxuICAgIHJldHVybiBOYW1lc3BhY2UucHJvdG90eXBlLnJlc29sdmVBbGwuY2FsbCh0aGlzKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBAb3ZlcnJpZGVcclxuICovXHJcblR5cGUucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIGdldChuYW1lKSB7XHJcbiAgICByZXR1cm4gdGhpcy5maWVsZHNbbmFtZV1cclxuICAgICAgICB8fCB0aGlzLm9uZW9mcyAmJiB0aGlzLm9uZW9mc1tuYW1lXVxyXG4gICAgICAgIHx8IHRoaXMubmVzdGVkICYmIHRoaXMubmVzdGVkW25hbWVdXHJcbiAgICAgICAgfHwgbnVsbDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBBZGRzIGEgbmVzdGVkIG9iamVjdCB0byB0aGlzIHR5cGUuXHJcbiAqIEBwYXJhbSB7UmVmbGVjdGlvbk9iamVjdH0gb2JqZWN0IE5lc3RlZCBvYmplY3QgdG8gYWRkXHJcbiAqIEByZXR1cm5zIHtUeXBlfSBgdGhpc2BcclxuICogQHRocm93cyB7VHlwZUVycm9yfSBJZiBhcmd1bWVudHMgYXJlIGludmFsaWRcclxuICogQHRocm93cyB7RXJyb3J9IElmIHRoZXJlIGlzIGFscmVhZHkgYSBuZXN0ZWQgb2JqZWN0IHdpdGggdGhpcyBuYW1lIG9yLCBpZiBhIGZpZWxkLCB3aGVuIHRoZXJlIGlzIGFscmVhZHkgYSBmaWVsZCB3aXRoIHRoaXMgaWRcclxuICovXHJcblR5cGUucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uIGFkZChvYmplY3QpIHtcclxuXHJcbiAgICBpZiAodGhpcy5nZXQob2JqZWN0Lm5hbWUpKVxyXG4gICAgICAgIHRocm93IEVycm9yKFwiZHVwbGljYXRlIG5hbWUgJ1wiICsgb2JqZWN0Lm5hbWUgKyBcIicgaW4gXCIgKyB0aGlzKTtcclxuXHJcbiAgICBpZiAob2JqZWN0IGluc3RhbmNlb2YgRmllbGQgJiYgb2JqZWN0LmV4dGVuZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgLy8gTk9URTogRXh0ZW5zaW9uIGZpZWxkcyBhcmVuJ3QgYWN0dWFsIGZpZWxkcyBvbiB0aGUgZGVjbGFyaW5nIHR5cGUsIGJ1dCBuZXN0ZWQgb2JqZWN0cy5cclxuICAgICAgICAvLyBUaGUgcm9vdCBvYmplY3QgdGFrZXMgY2FyZSBvZiBhZGRpbmcgZGlzdGluY3Qgc2lzdGVyLWZpZWxkcyB0byB0aGUgcmVzcGVjdGl2ZSBleHRlbmRlZFxyXG4gICAgICAgIC8vIHR5cGUgaW5zdGVhZC5cclxuXHJcbiAgICAgICAgLy8gYXZvaWRzIGNhbGxpbmcgdGhlIGdldHRlciBpZiBub3QgYWJzb2x1dGVseSBuZWNlc3NhcnkgYmVjYXVzZSBpdCdzIGNhbGxlZCBxdWl0ZSBmcmVxdWVudGx5XHJcbiAgICAgICAgaWYgKHRoaXMuX2ZpZWxkc0J5SWQgPyAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqLyB0aGlzLl9maWVsZHNCeUlkW29iamVjdC5pZF0gOiB0aGlzLmZpZWxkc0J5SWRbb2JqZWN0LmlkXSlcclxuICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJkdXBsaWNhdGUgaWQgXCIgKyBvYmplY3QuaWQgKyBcIiBpbiBcIiArIHRoaXMpO1xyXG4gICAgICAgIGlmICh0aGlzLmlzUmVzZXJ2ZWRJZChvYmplY3QuaWQpKVxyXG4gICAgICAgICAgICB0aHJvdyBFcnJvcihcImlkIFwiICsgb2JqZWN0LmlkICsgXCIgaXMgcmVzZXJ2ZWQgaW4gXCIgKyB0aGlzKTtcclxuICAgICAgICBpZiAodGhpcy5pc1Jlc2VydmVkTmFtZShvYmplY3QubmFtZSkpXHJcbiAgICAgICAgICAgIHRocm93IEVycm9yKFwibmFtZSAnXCIgKyBvYmplY3QubmFtZSArIFwiJyBpcyByZXNlcnZlZCBpbiBcIiArIHRoaXMpO1xyXG5cclxuICAgICAgICBpZiAob2JqZWN0LnBhcmVudClcclxuICAgICAgICAgICAgb2JqZWN0LnBhcmVudC5yZW1vdmUob2JqZWN0KTtcclxuICAgICAgICB0aGlzLmZpZWxkc1tvYmplY3QubmFtZV0gPSBvYmplY3Q7XHJcbiAgICAgICAgb2JqZWN0Lm1lc3NhZ2UgPSB0aGlzO1xyXG4gICAgICAgIG9iamVjdC5vbkFkZCh0aGlzKTtcclxuICAgICAgICByZXR1cm4gY2xlYXJDYWNoZSh0aGlzKTtcclxuICAgIH1cclxuICAgIGlmIChvYmplY3QgaW5zdGFuY2VvZiBPbmVPZikge1xyXG4gICAgICAgIGlmICghdGhpcy5vbmVvZnMpXHJcbiAgICAgICAgICAgIHRoaXMub25lb2ZzID0ge307XHJcbiAgICAgICAgdGhpcy5vbmVvZnNbb2JqZWN0Lm5hbWVdID0gb2JqZWN0O1xyXG4gICAgICAgIG9iamVjdC5vbkFkZCh0aGlzKTtcclxuICAgICAgICByZXR1cm4gY2xlYXJDYWNoZSh0aGlzKTtcclxuICAgIH1cclxuICAgIHJldHVybiBOYW1lc3BhY2UucHJvdG90eXBlLmFkZC5jYWxsKHRoaXMsIG9iamVjdCk7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVtb3ZlcyBhIG5lc3RlZCBvYmplY3QgZnJvbSB0aGlzIHR5cGUuXHJcbiAqIEBwYXJhbSB7UmVmbGVjdGlvbk9iamVjdH0gb2JqZWN0IE5lc3RlZCBvYmplY3QgdG8gcmVtb3ZlXHJcbiAqIEByZXR1cm5zIHtUeXBlfSBgdGhpc2BcclxuICogQHRocm93cyB7VHlwZUVycm9yfSBJZiBhcmd1bWVudHMgYXJlIGludmFsaWRcclxuICogQHRocm93cyB7RXJyb3J9IElmIGBvYmplY3RgIGlzIG5vdCBhIG1lbWJlciBvZiB0aGlzIHR5cGVcclxuICovXHJcblR5cGUucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIHJlbW92ZShvYmplY3QpIHtcclxuICAgIGlmIChvYmplY3QgaW5zdGFuY2VvZiBGaWVsZCAmJiBvYmplY3QuZXh0ZW5kID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAvLyBTZWUgVHlwZSNhZGQgZm9yIHRoZSByZWFzb24gd2h5IGV4dGVuc2lvbiBmaWVsZHMgYXJlIGV4Y2x1ZGVkIGhlcmUuXHJcblxyXG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xyXG4gICAgICAgIGlmICghdGhpcy5maWVsZHMgfHwgdGhpcy5maWVsZHNbb2JqZWN0Lm5hbWVdICE9PSBvYmplY3QpXHJcbiAgICAgICAgICAgIHRocm93IEVycm9yKG9iamVjdCArIFwiIGlzIG5vdCBhIG1lbWJlciBvZiBcIiArIHRoaXMpO1xyXG5cclxuICAgICAgICBkZWxldGUgdGhpcy5maWVsZHNbb2JqZWN0Lm5hbWVdO1xyXG4gICAgICAgIG9iamVjdC5wYXJlbnQgPSBudWxsO1xyXG4gICAgICAgIG9iamVjdC5vblJlbW92ZSh0aGlzKTtcclxuICAgICAgICByZXR1cm4gY2xlYXJDYWNoZSh0aGlzKTtcclxuICAgIH1cclxuICAgIGlmIChvYmplY3QgaW5zdGFuY2VvZiBPbmVPZikge1xyXG5cclxuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cclxuICAgICAgICBpZiAoIXRoaXMub25lb2ZzIHx8IHRoaXMub25lb2ZzW29iamVjdC5uYW1lXSAhPT0gb2JqZWN0KVxyXG4gICAgICAgICAgICB0aHJvdyBFcnJvcihvYmplY3QgKyBcIiBpcyBub3QgYSBtZW1iZXIgb2YgXCIgKyB0aGlzKTtcclxuXHJcbiAgICAgICAgZGVsZXRlIHRoaXMub25lb2ZzW29iamVjdC5uYW1lXTtcclxuICAgICAgICBvYmplY3QucGFyZW50ID0gbnVsbDtcclxuICAgICAgICBvYmplY3Qub25SZW1vdmUodGhpcyk7XHJcbiAgICAgICAgcmV0dXJuIGNsZWFyQ2FjaGUodGhpcyk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gTmFtZXNwYWNlLnByb3RvdHlwZS5yZW1vdmUuY2FsbCh0aGlzLCBvYmplY3QpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFRlc3RzIGlmIHRoZSBzcGVjaWZpZWQgaWQgaXMgcmVzZXJ2ZWQuXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBpZCBJZCB0byB0ZXN0XHJcbiAqIEByZXR1cm5zIHtib29sZWFufSBgdHJ1ZWAgaWYgcmVzZXJ2ZWQsIG90aGVyd2lzZSBgZmFsc2VgXHJcbiAqL1xyXG5UeXBlLnByb3RvdHlwZS5pc1Jlc2VydmVkSWQgPSBmdW5jdGlvbiBpc1Jlc2VydmVkSWQoaWQpIHtcclxuICAgIHJldHVybiBOYW1lc3BhY2UuaXNSZXNlcnZlZElkKHRoaXMucmVzZXJ2ZWQsIGlkKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBUZXN0cyBpZiB0aGUgc3BlY2lmaWVkIG5hbWUgaXMgcmVzZXJ2ZWQuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIE5hbWUgdG8gdGVzdFxyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gYHRydWVgIGlmIHJlc2VydmVkLCBvdGhlcndpc2UgYGZhbHNlYFxyXG4gKi9cclxuVHlwZS5wcm90b3R5cGUuaXNSZXNlcnZlZE5hbWUgPSBmdW5jdGlvbiBpc1Jlc2VydmVkTmFtZShuYW1lKSB7XHJcbiAgICByZXR1cm4gTmFtZXNwYWNlLmlzUmVzZXJ2ZWROYW1lKHRoaXMucmVzZXJ2ZWQsIG5hbWUpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBuZXcgbWVzc2FnZSBvZiB0aGlzIHR5cGUgdXNpbmcgdGhlIHNwZWNpZmllZCBwcm9wZXJ0aWVzLlxyXG4gKiBAcGFyYW0ge09iamVjdC48c3RyaW5nLCo+fSBbcHJvcGVydGllc10gUHJvcGVydGllcyB0byBzZXRcclxuICogQHJldHVybnMge01lc3NhZ2U8e30+fSBNZXNzYWdlIGluc3RhbmNlXHJcbiAqL1xyXG5UeXBlLnByb3RvdHlwZS5jcmVhdGUgPSBmdW5jdGlvbiBjcmVhdGUocHJvcGVydGllcykge1xyXG4gICAgcmV0dXJuIG5ldyB0aGlzLmN0b3IocHJvcGVydGllcyk7XHJcbn07XHJcblxyXG4vKipcclxuICogU2V0cyB1cCB7QGxpbmsgVHlwZSNlbmNvZGV8ZW5jb2RlfSwge0BsaW5rIFR5cGUjZGVjb2RlfGRlY29kZX0gYW5kIHtAbGluayBUeXBlI3ZlcmlmeXx2ZXJpZnl9LlxyXG4gKiBAcmV0dXJucyB7VHlwZX0gYHRoaXNgXHJcbiAqL1xyXG5UeXBlLnByb3RvdHlwZS5zZXR1cCA9IGZ1bmN0aW9uIHNldHVwKCkge1xyXG4gICAgLy8gU2V0cyB1cCBldmVyeXRoaW5nIGF0IG9uY2Ugc28gdGhhdCB0aGUgcHJvdG90eXBlIGNoYWluIGRvZXMgbm90IGhhdmUgdG8gYmUgcmUtZXZhbHVhdGVkXHJcbiAgICAvLyBtdWx0aXBsZSB0aW1lcyAoVjgsIHNvZnQtZGVvcHQgcHJvdG90eXBlLWNoZWNrKS5cclxuXHJcbiAgICB2YXIgZnVsbE5hbWUgPSB0aGlzLmZ1bGxOYW1lLFxyXG4gICAgICAgIHR5cGVzICAgID0gW107XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IC8qIGluaXRpYWxpemVzICovIHRoaXMuZmllbGRzQXJyYXkubGVuZ3RoOyArK2kpXHJcbiAgICAgICAgdHlwZXMucHVzaCh0aGlzLl9maWVsZHNBcnJheVtpXS5yZXNvbHZlKCkucmVzb2x2ZWRUeXBlKTtcclxuXHJcbiAgICAvLyBSZXBsYWNlIHNldHVwIG1ldGhvZHMgd2l0aCB0eXBlLXNwZWNpZmljIGdlbmVyYXRlZCBmdW5jdGlvbnNcclxuICAgIHRoaXMuZW5jb2RlID0gZW5jb2Rlcih0aGlzKSh7XHJcbiAgICAgICAgV3JpdGVyIDogV3JpdGVyLFxyXG4gICAgICAgIHR5cGVzICA6IHR5cGVzLFxyXG4gICAgICAgIHV0aWwgICA6IHV0aWxcclxuICAgIH0pO1xyXG4gICAgdGhpcy5kZWNvZGUgPSBkZWNvZGVyKHRoaXMpKHtcclxuICAgICAgICBSZWFkZXIgOiBSZWFkZXIsXHJcbiAgICAgICAgdHlwZXMgIDogdHlwZXMsXHJcbiAgICAgICAgdXRpbCAgIDogdXRpbFxyXG4gICAgfSk7XHJcbiAgICB0aGlzLnZlcmlmeSA9IHZlcmlmaWVyKHRoaXMpKHtcclxuICAgICAgICB0eXBlcyA6IHR5cGVzLFxyXG4gICAgICAgIHV0aWwgIDogdXRpbFxyXG4gICAgfSk7XHJcbiAgICB0aGlzLmZyb21PYmplY3QgPSBjb252ZXJ0ZXIuZnJvbU9iamVjdCh0aGlzKSh7XHJcbiAgICAgICAgdHlwZXMgOiB0eXBlcyxcclxuICAgICAgICB1dGlsICA6IHV0aWxcclxuICAgIH0pO1xyXG4gICAgdGhpcy50b09iamVjdCA9IGNvbnZlcnRlci50b09iamVjdCh0aGlzKSh7XHJcbiAgICAgICAgdHlwZXMgOiB0eXBlcyxcclxuICAgICAgICB1dGlsICA6IHV0aWxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEluamVjdCBjdXN0b20gd3JhcHBlcnMgZm9yIGNvbW1vbiB0eXBlc1xyXG4gICAgdmFyIHdyYXBwZXIgPSB3cmFwcGVyc1tmdWxsTmFtZV07XHJcbiAgICBpZiAod3JhcHBlcikge1xyXG4gICAgICAgIHZhciBvcmlnaW5hbFRoaXMgPSBPYmplY3QuY3JlYXRlKHRoaXMpO1xyXG4gICAgICAgIC8vIGlmICh3cmFwcGVyLmZyb21PYmplY3QpIHtcclxuICAgICAgICAgICAgb3JpZ2luYWxUaGlzLmZyb21PYmplY3QgPSB0aGlzLmZyb21PYmplY3Q7XHJcbiAgICAgICAgICAgIHRoaXMuZnJvbU9iamVjdCA9IHdyYXBwZXIuZnJvbU9iamVjdC5iaW5kKG9yaWdpbmFsVGhpcyk7XHJcbiAgICAgICAgLy8gfVxyXG4gICAgICAgIC8vIGlmICh3cmFwcGVyLnRvT2JqZWN0KSB7XHJcbiAgICAgICAgICAgIG9yaWdpbmFsVGhpcy50b09iamVjdCA9IHRoaXMudG9PYmplY3Q7XHJcbiAgICAgICAgICAgIHRoaXMudG9PYmplY3QgPSB3cmFwcGVyLnRvT2JqZWN0LmJpbmQob3JpZ2luYWxUaGlzKTtcclxuICAgICAgICAvLyB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogRW5jb2RlcyBhIG1lc3NhZ2Ugb2YgdGhpcyB0eXBlLiBEb2VzIG5vdCBpbXBsaWNpdGx5IHtAbGluayBUeXBlI3ZlcmlmeXx2ZXJpZnl9IG1lc3NhZ2VzLlxyXG4gKiBAcGFyYW0ge01lc3NhZ2U8e30+fE9iamVjdC48c3RyaW5nLCo+fSBtZXNzYWdlIE1lc3NhZ2UgaW5zdGFuY2Ugb3IgcGxhaW4gb2JqZWN0XHJcbiAqIEBwYXJhbSB7V3JpdGVyfSBbd3JpdGVyXSBXcml0ZXIgdG8gZW5jb2RlIHRvXHJcbiAqIEByZXR1cm5zIHtXcml0ZXJ9IHdyaXRlclxyXG4gKi9cclxuVHlwZS5wcm90b3R5cGUuZW5jb2RlID0gZnVuY3Rpb24gZW5jb2RlX3NldHVwKG1lc3NhZ2UsIHdyaXRlcikge1xyXG4gICAgcmV0dXJuIHRoaXMuc2V0dXAoKS5lbmNvZGUobWVzc2FnZSwgd3JpdGVyKTsgLy8gb3ZlcnJpZGVzIHRoaXMgbWV0aG9kXHJcbn07XHJcblxyXG4vKipcclxuICogRW5jb2RlcyBhIG1lc3NhZ2Ugb2YgdGhpcyB0eXBlIHByZWNlZWRlZCBieSBpdHMgYnl0ZSBsZW5ndGggYXMgYSB2YXJpbnQuIERvZXMgbm90IGltcGxpY2l0bHkge0BsaW5rIFR5cGUjdmVyaWZ5fHZlcmlmeX0gbWVzc2FnZXMuXHJcbiAqIEBwYXJhbSB7TWVzc2FnZTx7fT58T2JqZWN0LjxzdHJpbmcsKj59IG1lc3NhZ2UgTWVzc2FnZSBpbnN0YW5jZSBvciBwbGFpbiBvYmplY3RcclxuICogQHBhcmFtIHtXcml0ZXJ9IFt3cml0ZXJdIFdyaXRlciB0byBlbmNvZGUgdG9cclxuICogQHJldHVybnMge1dyaXRlcn0gd3JpdGVyXHJcbiAqL1xyXG5UeXBlLnByb3RvdHlwZS5lbmNvZGVEZWxpbWl0ZWQgPSBmdW5jdGlvbiBlbmNvZGVEZWxpbWl0ZWQobWVzc2FnZSwgd3JpdGVyKSB7XHJcbiAgICByZXR1cm4gdGhpcy5lbmNvZGUobWVzc2FnZSwgd3JpdGVyICYmIHdyaXRlci5sZW4gPyB3cml0ZXIuZm9yaygpIDogd3JpdGVyKS5sZGVsaW0oKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBEZWNvZGVzIGEgbWVzc2FnZSBvZiB0aGlzIHR5cGUuXHJcbiAqIEBwYXJhbSB7UmVhZGVyfFVpbnQ4QXJyYXl9IHJlYWRlciBSZWFkZXIgb3IgYnVmZmVyIHRvIGRlY29kZSBmcm9tXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBbbGVuZ3RoXSBMZW5ndGggb2YgdGhlIG1lc3NhZ2UsIGlmIGtub3duIGJlZm9yZWhhbmRcclxuICogQHJldHVybnMge01lc3NhZ2U8e30+fSBEZWNvZGVkIG1lc3NhZ2VcclxuICogQHRocm93cyB7RXJyb3J9IElmIHRoZSBwYXlsb2FkIGlzIG5vdCBhIHJlYWRlciBvciB2YWxpZCBidWZmZXJcclxuICogQHRocm93cyB7dXRpbC5Qcm90b2NvbEVycm9yPHt9Pn0gSWYgcmVxdWlyZWQgZmllbGRzIGFyZSBtaXNzaW5nXHJcbiAqL1xyXG5UeXBlLnByb3RvdHlwZS5kZWNvZGUgPSBmdW5jdGlvbiBkZWNvZGVfc2V0dXAocmVhZGVyLCBsZW5ndGgpIHtcclxuICAgIHJldHVybiB0aGlzLnNldHVwKCkuZGVjb2RlKHJlYWRlciwgbGVuZ3RoKTsgLy8gb3ZlcnJpZGVzIHRoaXMgbWV0aG9kXHJcbn07XHJcblxyXG4vKipcclxuICogRGVjb2RlcyBhIG1lc3NhZ2Ugb2YgdGhpcyB0eXBlIHByZWNlZWRlZCBieSBpdHMgYnl0ZSBsZW5ndGggYXMgYSB2YXJpbnQuXHJcbiAqIEBwYXJhbSB7UmVhZGVyfFVpbnQ4QXJyYXl9IHJlYWRlciBSZWFkZXIgb3IgYnVmZmVyIHRvIGRlY29kZSBmcm9tXHJcbiAqIEByZXR1cm5zIHtNZXNzYWdlPHt9Pn0gRGVjb2RlZCBtZXNzYWdlXHJcbiAqIEB0aHJvd3Mge0Vycm9yfSBJZiB0aGUgcGF5bG9hZCBpcyBub3QgYSByZWFkZXIgb3IgdmFsaWQgYnVmZmVyXHJcbiAqIEB0aHJvd3Mge3V0aWwuUHJvdG9jb2xFcnJvcn0gSWYgcmVxdWlyZWQgZmllbGRzIGFyZSBtaXNzaW5nXHJcbiAqL1xyXG5UeXBlLnByb3RvdHlwZS5kZWNvZGVEZWxpbWl0ZWQgPSBmdW5jdGlvbiBkZWNvZGVEZWxpbWl0ZWQocmVhZGVyKSB7XHJcbiAgICBpZiAoIShyZWFkZXIgaW5zdGFuY2VvZiBSZWFkZXIpKVxyXG4gICAgICAgIHJlYWRlciA9IFJlYWRlci5jcmVhdGUocmVhZGVyKTtcclxuICAgIHJldHVybiB0aGlzLmRlY29kZShyZWFkZXIsIHJlYWRlci51aW50MzIoKSk7XHJcbn07XHJcblxyXG4vKipcclxuICogVmVyaWZpZXMgdGhhdCBmaWVsZCB2YWx1ZXMgYXJlIHZhbGlkIGFuZCB0aGF0IHJlcXVpcmVkIGZpZWxkcyBhcmUgcHJlc2VudC5cclxuICogQHBhcmFtIHtPYmplY3QuPHN0cmluZywqPn0gbWVzc2FnZSBQbGFpbiBvYmplY3QgdG8gdmVyaWZ5XHJcbiAqIEByZXR1cm5zIHtudWxsfHN0cmluZ30gYG51bGxgIGlmIHZhbGlkLCBvdGhlcndpc2UgdGhlIHJlYXNvbiB3aHkgaXQgaXMgbm90XHJcbiAqL1xyXG5UeXBlLnByb3RvdHlwZS52ZXJpZnkgPSBmdW5jdGlvbiB2ZXJpZnlfc2V0dXAobWVzc2FnZSkge1xyXG4gICAgcmV0dXJuIHRoaXMuc2V0dXAoKS52ZXJpZnkobWVzc2FnZSk7IC8vIG92ZXJyaWRlcyB0aGlzIG1ldGhvZFxyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBuZXcgbWVzc2FnZSBvZiB0aGlzIHR5cGUgZnJvbSBhIHBsYWluIG9iamVjdC4gQWxzbyBjb252ZXJ0cyB2YWx1ZXMgdG8gdGhlaXIgcmVzcGVjdGl2ZSBpbnRlcm5hbCB0eXBlcy5cclxuICogQHBhcmFtIHtPYmplY3QuPHN0cmluZywqPn0gb2JqZWN0IFBsYWluIG9iamVjdCB0byBjb252ZXJ0XHJcbiAqIEByZXR1cm5zIHtNZXNzYWdlPHt9Pn0gTWVzc2FnZSBpbnN0YW5jZVxyXG4gKi9cclxuVHlwZS5wcm90b3R5cGUuZnJvbU9iamVjdCA9IGZ1bmN0aW9uIGZyb21PYmplY3Qob2JqZWN0KSB7XHJcbiAgICByZXR1cm4gdGhpcy5zZXR1cCgpLmZyb21PYmplY3Qob2JqZWN0KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDb252ZXJzaW9uIG9wdGlvbnMgYXMgdXNlZCBieSB7QGxpbmsgVHlwZSN0b09iamVjdH0gYW5kIHtAbGluayBNZXNzYWdlLnRvT2JqZWN0fS5cclxuICogQGludGVyZmFjZSBJQ29udmVyc2lvbk9wdGlvbnNcclxuICogQHByb3BlcnR5IHtGdW5jdGlvbn0gW2xvbmdzXSBMb25nIGNvbnZlcnNpb24gdHlwZS5cclxuICogVmFsaWQgdmFsdWVzIGFyZSBgU3RyaW5nYCBhbmQgYE51bWJlcmAgKHRoZSBnbG9iYWwgdHlwZXMpLlxyXG4gKiBEZWZhdWx0cyB0byBjb3B5IHRoZSBwcmVzZW50IHZhbHVlLCB3aGljaCBpcyBhIHBvc3NpYmx5IHVuc2FmZSBudW1iZXIgd2l0aG91dCBhbmQgYSB7QGxpbmsgTG9uZ30gd2l0aCBhIGxvbmcgbGlicmFyeS5cclxuICogQHByb3BlcnR5IHtGdW5jdGlvbn0gW2VudW1zXSBFbnVtIHZhbHVlIGNvbnZlcnNpb24gdHlwZS5cclxuICogT25seSB2YWxpZCB2YWx1ZSBpcyBgU3RyaW5nYCAodGhlIGdsb2JhbCB0eXBlKS5cclxuICogRGVmYXVsdHMgdG8gY29weSB0aGUgcHJlc2VudCB2YWx1ZSwgd2hpY2ggaXMgdGhlIG51bWVyaWMgaWQuXHJcbiAqIEBwcm9wZXJ0eSB7RnVuY3Rpb259IFtieXRlc10gQnl0ZXMgdmFsdWUgY29udmVyc2lvbiB0eXBlLlxyXG4gKiBWYWxpZCB2YWx1ZXMgYXJlIGBBcnJheWAgYW5kIChhIGJhc2U2NCBlbmNvZGVkKSBgU3RyaW5nYCAodGhlIGdsb2JhbCB0eXBlcykuXHJcbiAqIERlZmF1bHRzIHRvIGNvcHkgdGhlIHByZXNlbnQgdmFsdWUsIHdoaWNoIHVzdWFsbHkgaXMgYSBCdWZmZXIgdW5kZXIgbm9kZSBhbmQgYW4gVWludDhBcnJheSBpbiB0aGUgYnJvd3Nlci5cclxuICogQHByb3BlcnR5IHtib29sZWFufSBbZGVmYXVsdHM9ZmFsc2VdIEFsc28gc2V0cyBkZWZhdWx0IHZhbHVlcyBvbiB0aGUgcmVzdWx0aW5nIG9iamVjdFxyXG4gKiBAcHJvcGVydHkge2Jvb2xlYW59IFthcnJheXM9ZmFsc2VdIFNldHMgZW1wdHkgYXJyYXlzIGZvciBtaXNzaW5nIHJlcGVhdGVkIGZpZWxkcyBldmVuIGlmIGBkZWZhdWx0cz1mYWxzZWBcclxuICogQHByb3BlcnR5IHtib29sZWFufSBbb2JqZWN0cz1mYWxzZV0gU2V0cyBlbXB0eSBvYmplY3RzIGZvciBtaXNzaW5nIG1hcCBmaWVsZHMgZXZlbiBpZiBgZGVmYXVsdHM9ZmFsc2VgXHJcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gW29uZW9mcz1mYWxzZV0gSW5jbHVkZXMgdmlydHVhbCBvbmVvZiBwcm9wZXJ0aWVzIHNldCB0byB0aGUgcHJlc2VudCBmaWVsZCdzIG5hbWUsIGlmIGFueVxyXG4gKiBAcHJvcGVydHkge2Jvb2xlYW59IFtqc29uPWZhbHNlXSBQZXJmb3JtcyBhZGRpdGlvbmFsIEpTT04gY29tcGF0aWJpbGl0eSBjb252ZXJzaW9ucywgaS5lLiBOYU4gYW5kIEluZmluaXR5IHRvIHN0cmluZ3NcclxuICovXHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIHBsYWluIG9iamVjdCBmcm9tIGEgbWVzc2FnZSBvZiB0aGlzIHR5cGUuIEFsc28gY29udmVydHMgdmFsdWVzIHRvIG90aGVyIHR5cGVzIGlmIHNwZWNpZmllZC5cclxuICogQHBhcmFtIHtNZXNzYWdlPHt9Pn0gbWVzc2FnZSBNZXNzYWdlIGluc3RhbmNlXHJcbiAqIEBwYXJhbSB7SUNvbnZlcnNpb25PcHRpb25zfSBbb3B0aW9uc10gQ29udmVyc2lvbiBvcHRpb25zXHJcbiAqIEByZXR1cm5zIHtPYmplY3QuPHN0cmluZywqPn0gUGxhaW4gb2JqZWN0XHJcbiAqL1xyXG5UeXBlLnByb3RvdHlwZS50b09iamVjdCA9IGZ1bmN0aW9uIHRvT2JqZWN0KG1lc3NhZ2UsIG9wdGlvbnMpIHtcclxuICAgIHJldHVybiB0aGlzLnNldHVwKCkudG9PYmplY3QobWVzc2FnZSwgb3B0aW9ucyk7XHJcbn07XHJcblxyXG4vKipcclxuICogRGVjb3JhdG9yIGZ1bmN0aW9uIGFzIHJldHVybmVkIGJ5IHtAbGluayBUeXBlLmR9IChUeXBlU2NyaXB0KS5cclxuICogQHR5cGVkZWYgVHlwZURlY29yYXRvclxyXG4gKiBAdHlwZSB7ZnVuY3Rpb259XHJcbiAqIEBwYXJhbSB7Q29uc3RydWN0b3I8VD59IHRhcmdldCBUYXJnZXQgY29uc3RydWN0b3JcclxuICogQHJldHVybnMge3VuZGVmaW5lZH1cclxuICogQHRlbXBsYXRlIFQgZXh0ZW5kcyBNZXNzYWdlPFQ+XHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIFR5cGUgZGVjb3JhdG9yIChUeXBlU2NyaXB0KS5cclxuICogQHBhcmFtIHtzdHJpbmd9IFt0eXBlTmFtZV0gVHlwZSBuYW1lLCBkZWZhdWx0cyB0byB0aGUgY29uc3RydWN0b3IncyBuYW1lXHJcbiAqIEByZXR1cm5zIHtUeXBlRGVjb3JhdG9yPFQ+fSBEZWNvcmF0b3IgZnVuY3Rpb25cclxuICogQHRlbXBsYXRlIFQgZXh0ZW5kcyBNZXNzYWdlPFQ+XHJcbiAqL1xyXG5UeXBlLmQgPSBmdW5jdGlvbiBkZWNvcmF0ZVR5cGUodHlwZU5hbWUpIHtcclxuICAgIHJldHVybiBmdW5jdGlvbiB0eXBlRGVjb3JhdG9yKHRhcmdldCkge1xyXG4gICAgICAgIHV0aWwuZGVjb3JhdGVUeXBlKHRhcmdldCwgdHlwZU5hbWUpO1xyXG4gICAgfTtcclxufTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4vKipcclxuICogQ29tbW9uIHR5cGUgY29uc3RhbnRzLlxyXG4gKiBAbmFtZXNwYWNlXHJcbiAqL1xyXG52YXIgdHlwZXMgPSBleHBvcnRzO1xyXG5cclxudmFyIHV0aWwgPSByZXF1aXJlKFwiLi91dGlsXCIpO1xyXG5cclxudmFyIHMgPSBbXHJcbiAgICBcImRvdWJsZVwiLCAgIC8vIDBcclxuICAgIFwiZmxvYXRcIiwgICAgLy8gMVxyXG4gICAgXCJpbnQzMlwiLCAgICAvLyAyXHJcbiAgICBcInVpbnQzMlwiLCAgIC8vIDNcclxuICAgIFwic2ludDMyXCIsICAgLy8gNFxyXG4gICAgXCJmaXhlZDMyXCIsICAvLyA1XHJcbiAgICBcInNmaXhlZDMyXCIsIC8vIDZcclxuICAgIFwiaW50NjRcIiwgICAgLy8gN1xyXG4gICAgXCJ1aW50NjRcIiwgICAvLyA4XHJcbiAgICBcInNpbnQ2NFwiLCAgIC8vIDlcclxuICAgIFwiZml4ZWQ2NFwiLCAgLy8gMTBcclxuICAgIFwic2ZpeGVkNjRcIiwgLy8gMTFcclxuICAgIFwiYm9vbFwiLCAgICAgLy8gMTJcclxuICAgIFwic3RyaW5nXCIsICAgLy8gMTNcclxuICAgIFwiYnl0ZXNcIiAgICAgLy8gMTRcclxuXTtcclxuXHJcbmZ1bmN0aW9uIGJha2UodmFsdWVzLCBvZmZzZXQpIHtcclxuICAgIHZhciBpID0gMCwgbyA9IHt9O1xyXG4gICAgb2Zmc2V0IHw9IDA7XHJcbiAgICB3aGlsZSAoaSA8IHZhbHVlcy5sZW5ndGgpIG9bc1tpICsgb2Zmc2V0XV0gPSB2YWx1ZXNbaSsrXTtcclxuICAgIHJldHVybiBvO1xyXG59XHJcblxyXG4vKipcclxuICogQmFzaWMgdHlwZSB3aXJlIHR5cGVzLlxyXG4gKiBAdHlwZSB7T2JqZWN0LjxzdHJpbmcsbnVtYmVyPn1cclxuICogQGNvbnN0XHJcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBkb3VibGU9MSBGaXhlZDY0IHdpcmUgdHlwZVxyXG4gKiBAcHJvcGVydHkge251bWJlcn0gZmxvYXQ9NSBGaXhlZDMyIHdpcmUgdHlwZVxyXG4gKiBAcHJvcGVydHkge251bWJlcn0gaW50MzI9MCBWYXJpbnQgd2lyZSB0eXBlXHJcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB1aW50MzI9MCBWYXJpbnQgd2lyZSB0eXBlXHJcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBzaW50MzI9MCBWYXJpbnQgd2lyZSB0eXBlXHJcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBmaXhlZDMyPTUgRml4ZWQzMiB3aXJlIHR5cGVcclxuICogQHByb3BlcnR5IHtudW1iZXJ9IHNmaXhlZDMyPTUgRml4ZWQzMiB3aXJlIHR5cGVcclxuICogQHByb3BlcnR5IHtudW1iZXJ9IGludDY0PTAgVmFyaW50IHdpcmUgdHlwZVxyXG4gKiBAcHJvcGVydHkge251bWJlcn0gdWludDY0PTAgVmFyaW50IHdpcmUgdHlwZVxyXG4gKiBAcHJvcGVydHkge251bWJlcn0gc2ludDY0PTAgVmFyaW50IHdpcmUgdHlwZVxyXG4gKiBAcHJvcGVydHkge251bWJlcn0gZml4ZWQ2ND0xIEZpeGVkNjQgd2lyZSB0eXBlXHJcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBzZml4ZWQ2ND0xIEZpeGVkNjQgd2lyZSB0eXBlXHJcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBib29sPTAgVmFyaW50IHdpcmUgdHlwZVxyXG4gKiBAcHJvcGVydHkge251bWJlcn0gc3RyaW5nPTIgTGRlbGltIHdpcmUgdHlwZVxyXG4gKiBAcHJvcGVydHkge251bWJlcn0gYnl0ZXM9MiBMZGVsaW0gd2lyZSB0eXBlXHJcbiAqL1xyXG50eXBlcy5iYXNpYyA9IGJha2UoW1xyXG4gICAgLyogZG91YmxlICAgKi8gMSxcclxuICAgIC8qIGZsb2F0ICAgICovIDUsXHJcbiAgICAvKiBpbnQzMiAgICAqLyAwLFxyXG4gICAgLyogdWludDMyICAgKi8gMCxcclxuICAgIC8qIHNpbnQzMiAgICovIDAsXHJcbiAgICAvKiBmaXhlZDMyICAqLyA1LFxyXG4gICAgLyogc2ZpeGVkMzIgKi8gNSxcclxuICAgIC8qIGludDY0ICAgICovIDAsXHJcbiAgICAvKiB1aW50NjQgICAqLyAwLFxyXG4gICAgLyogc2ludDY0ICAgKi8gMCxcclxuICAgIC8qIGZpeGVkNjQgICovIDEsXHJcbiAgICAvKiBzZml4ZWQ2NCAqLyAxLFxyXG4gICAgLyogYm9vbCAgICAgKi8gMCxcclxuICAgIC8qIHN0cmluZyAgICovIDIsXHJcbiAgICAvKiBieXRlcyAgICAqLyAyXHJcbl0pO1xyXG5cclxuLyoqXHJcbiAqIEJhc2ljIHR5cGUgZGVmYXVsdHMuXHJcbiAqIEB0eXBlIHtPYmplY3QuPHN0cmluZywqPn1cclxuICogQGNvbnN0XHJcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBkb3VibGU9MCBEb3VibGUgZGVmYXVsdFxyXG4gKiBAcHJvcGVydHkge251bWJlcn0gZmxvYXQ9MCBGbG9hdCBkZWZhdWx0XHJcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBpbnQzMj0wIEludDMyIGRlZmF1bHRcclxuICogQHByb3BlcnR5IHtudW1iZXJ9IHVpbnQzMj0wIFVpbnQzMiBkZWZhdWx0XHJcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBzaW50MzI9MCBTaW50MzIgZGVmYXVsdFxyXG4gKiBAcHJvcGVydHkge251bWJlcn0gZml4ZWQzMj0wIEZpeGVkMzIgZGVmYXVsdFxyXG4gKiBAcHJvcGVydHkge251bWJlcn0gc2ZpeGVkMzI9MCBTZml4ZWQzMiBkZWZhdWx0XHJcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBpbnQ2ND0wIEludDY0IGRlZmF1bHRcclxuICogQHByb3BlcnR5IHtudW1iZXJ9IHVpbnQ2ND0wIFVpbnQ2NCBkZWZhdWx0XHJcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBzaW50NjQ9MCBTaW50MzIgZGVmYXVsdFxyXG4gKiBAcHJvcGVydHkge251bWJlcn0gZml4ZWQ2ND0wIEZpeGVkNjQgZGVmYXVsdFxyXG4gKiBAcHJvcGVydHkge251bWJlcn0gc2ZpeGVkNjQ9MCBTZml4ZWQ2NCBkZWZhdWx0XHJcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gYm9vbD1mYWxzZSBCb29sIGRlZmF1bHRcclxuICogQHByb3BlcnR5IHtzdHJpbmd9IHN0cmluZz1cIlwiIFN0cmluZyBkZWZhdWx0XHJcbiAqIEBwcm9wZXJ0eSB7QXJyYXkuPG51bWJlcj59IGJ5dGVzPUFycmF5KDApIEJ5dGVzIGRlZmF1bHRcclxuICogQHByb3BlcnR5IHtudWxsfSBtZXNzYWdlPW51bGwgTWVzc2FnZSBkZWZhdWx0XHJcbiAqL1xyXG50eXBlcy5kZWZhdWx0cyA9IGJha2UoW1xyXG4gICAgLyogZG91YmxlICAgKi8gMCxcclxuICAgIC8qIGZsb2F0ICAgICovIDAsXHJcbiAgICAvKiBpbnQzMiAgICAqLyAwLFxyXG4gICAgLyogdWludDMyICAgKi8gMCxcclxuICAgIC8qIHNpbnQzMiAgICovIDAsXHJcbiAgICAvKiBmaXhlZDMyICAqLyAwLFxyXG4gICAgLyogc2ZpeGVkMzIgKi8gMCxcclxuICAgIC8qIGludDY0ICAgICovIDAsXHJcbiAgICAvKiB1aW50NjQgICAqLyAwLFxyXG4gICAgLyogc2ludDY0ICAgKi8gMCxcclxuICAgIC8qIGZpeGVkNjQgICovIDAsXHJcbiAgICAvKiBzZml4ZWQ2NCAqLyAwLFxyXG4gICAgLyogYm9vbCAgICAgKi8gZmFsc2UsXHJcbiAgICAvKiBzdHJpbmcgICAqLyBcIlwiLFxyXG4gICAgLyogYnl0ZXMgICAgKi8gdXRpbC5lbXB0eUFycmF5LFxyXG4gICAgLyogbWVzc2FnZSAgKi8gbnVsbFxyXG5dKTtcclxuXHJcbi8qKlxyXG4gKiBCYXNpYyBsb25nIHR5cGUgd2lyZSB0eXBlcy5cclxuICogQHR5cGUge09iamVjdC48c3RyaW5nLG51bWJlcj59XHJcbiAqIEBjb25zdFxyXG4gKiBAcHJvcGVydHkge251bWJlcn0gaW50NjQ9MCBWYXJpbnQgd2lyZSB0eXBlXHJcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB1aW50NjQ9MCBWYXJpbnQgd2lyZSB0eXBlXHJcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBzaW50NjQ9MCBWYXJpbnQgd2lyZSB0eXBlXHJcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBmaXhlZDY0PTEgRml4ZWQ2NCB3aXJlIHR5cGVcclxuICogQHByb3BlcnR5IHtudW1iZXJ9IHNmaXhlZDY0PTEgRml4ZWQ2NCB3aXJlIHR5cGVcclxuICovXHJcbnR5cGVzLmxvbmcgPSBiYWtlKFtcclxuICAgIC8qIGludDY0ICAgICovIDAsXHJcbiAgICAvKiB1aW50NjQgICAqLyAwLFxyXG4gICAgLyogc2ludDY0ICAgKi8gMCxcclxuICAgIC8qIGZpeGVkNjQgICovIDEsXHJcbiAgICAvKiBzZml4ZWQ2NCAqLyAxXHJcbl0sIDcpO1xyXG5cclxuLyoqXHJcbiAqIEFsbG93ZWQgdHlwZXMgZm9yIG1hcCBrZXlzIHdpdGggdGhlaXIgYXNzb2NpYXRlZCB3aXJlIHR5cGUuXHJcbiAqIEB0eXBlIHtPYmplY3QuPHN0cmluZyxudW1iZXI+fVxyXG4gKiBAY29uc3RcclxuICogQHByb3BlcnR5IHtudW1iZXJ9IGludDMyPTAgVmFyaW50IHdpcmUgdHlwZVxyXG4gKiBAcHJvcGVydHkge251bWJlcn0gdWludDMyPTAgVmFyaW50IHdpcmUgdHlwZVxyXG4gKiBAcHJvcGVydHkge251bWJlcn0gc2ludDMyPTAgVmFyaW50IHdpcmUgdHlwZVxyXG4gKiBAcHJvcGVydHkge251bWJlcn0gZml4ZWQzMj01IEZpeGVkMzIgd2lyZSB0eXBlXHJcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBzZml4ZWQzMj01IEZpeGVkMzIgd2lyZSB0eXBlXHJcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBpbnQ2ND0wIFZhcmludCB3aXJlIHR5cGVcclxuICogQHByb3BlcnR5IHtudW1iZXJ9IHVpbnQ2ND0wIFZhcmludCB3aXJlIHR5cGVcclxuICogQHByb3BlcnR5IHtudW1iZXJ9IHNpbnQ2ND0wIFZhcmludCB3aXJlIHR5cGVcclxuICogQHByb3BlcnR5IHtudW1iZXJ9IGZpeGVkNjQ9MSBGaXhlZDY0IHdpcmUgdHlwZVxyXG4gKiBAcHJvcGVydHkge251bWJlcn0gc2ZpeGVkNjQ9MSBGaXhlZDY0IHdpcmUgdHlwZVxyXG4gKiBAcHJvcGVydHkge251bWJlcn0gYm9vbD0wIFZhcmludCB3aXJlIHR5cGVcclxuICogQHByb3BlcnR5IHtudW1iZXJ9IHN0cmluZz0yIExkZWxpbSB3aXJlIHR5cGVcclxuICovXHJcbnR5cGVzLm1hcEtleSA9IGJha2UoW1xyXG4gICAgLyogaW50MzIgICAgKi8gMCxcclxuICAgIC8qIHVpbnQzMiAgICovIDAsXHJcbiAgICAvKiBzaW50MzIgICAqLyAwLFxyXG4gICAgLyogZml4ZWQzMiAgKi8gNSxcclxuICAgIC8qIHNmaXhlZDMyICovIDUsXHJcbiAgICAvKiBpbnQ2NCAgICAqLyAwLFxyXG4gICAgLyogdWludDY0ICAgKi8gMCxcclxuICAgIC8qIHNpbnQ2NCAgICovIDAsXHJcbiAgICAvKiBmaXhlZDY0ICAqLyAxLFxyXG4gICAgLyogc2ZpeGVkNjQgKi8gMSxcclxuICAgIC8qIGJvb2wgICAgICovIDAsXHJcbiAgICAvKiBzdHJpbmcgICAqLyAyXHJcbl0sIDIpO1xyXG5cclxuLyoqXHJcbiAqIEFsbG93ZWQgdHlwZXMgZm9yIHBhY2tlZCByZXBlYXRlZCBmaWVsZHMgd2l0aCB0aGVpciBhc3NvY2lhdGVkIHdpcmUgdHlwZS5cclxuICogQHR5cGUge09iamVjdC48c3RyaW5nLG51bWJlcj59XHJcbiAqIEBjb25zdFxyXG4gKiBAcHJvcGVydHkge251bWJlcn0gZG91YmxlPTEgRml4ZWQ2NCB3aXJlIHR5cGVcclxuICogQHByb3BlcnR5IHtudW1iZXJ9IGZsb2F0PTUgRml4ZWQzMiB3aXJlIHR5cGVcclxuICogQHByb3BlcnR5IHtudW1iZXJ9IGludDMyPTAgVmFyaW50IHdpcmUgdHlwZVxyXG4gKiBAcHJvcGVydHkge251bWJlcn0gdWludDMyPTAgVmFyaW50IHdpcmUgdHlwZVxyXG4gKiBAcHJvcGVydHkge251bWJlcn0gc2ludDMyPTAgVmFyaW50IHdpcmUgdHlwZVxyXG4gKiBAcHJvcGVydHkge251bWJlcn0gZml4ZWQzMj01IEZpeGVkMzIgd2lyZSB0eXBlXHJcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBzZml4ZWQzMj01IEZpeGVkMzIgd2lyZSB0eXBlXHJcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBpbnQ2ND0wIFZhcmludCB3aXJlIHR5cGVcclxuICogQHByb3BlcnR5IHtudW1iZXJ9IHVpbnQ2ND0wIFZhcmludCB3aXJlIHR5cGVcclxuICogQHByb3BlcnR5IHtudW1iZXJ9IHNpbnQ2ND0wIFZhcmludCB3aXJlIHR5cGVcclxuICogQHByb3BlcnR5IHtudW1iZXJ9IGZpeGVkNjQ9MSBGaXhlZDY0IHdpcmUgdHlwZVxyXG4gKiBAcHJvcGVydHkge251bWJlcn0gc2ZpeGVkNjQ9MSBGaXhlZDY0IHdpcmUgdHlwZVxyXG4gKiBAcHJvcGVydHkge251bWJlcn0gYm9vbD0wIFZhcmludCB3aXJlIHR5cGVcclxuICovXHJcbnR5cGVzLnBhY2tlZCA9IGJha2UoW1xyXG4gICAgLyogZG91YmxlICAgKi8gMSxcclxuICAgIC8qIGZsb2F0ICAgICovIDUsXHJcbiAgICAvKiBpbnQzMiAgICAqLyAwLFxyXG4gICAgLyogdWludDMyICAgKi8gMCxcclxuICAgIC8qIHNpbnQzMiAgICovIDAsXHJcbiAgICAvKiBmaXhlZDMyICAqLyA1LFxyXG4gICAgLyogc2ZpeGVkMzIgKi8gNSxcclxuICAgIC8qIGludDY0ICAgICovIDAsXHJcbiAgICAvKiB1aW50NjQgICAqLyAwLFxyXG4gICAgLyogc2ludDY0ICAgKi8gMCxcclxuICAgIC8qIGZpeGVkNjQgICovIDEsXHJcbiAgICAvKiBzZml4ZWQ2NCAqLyAxLFxyXG4gICAgLyogYm9vbCAgICAgKi8gMFxyXG5dKTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4vKipcclxuICogVmFyaW91cyB1dGlsaXR5IGZ1bmN0aW9ucy5cclxuICogQG5hbWVzcGFjZVxyXG4gKi9cclxudmFyIHV0aWwgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuL3V0aWwvbWluaW1hbFwiKTtcclxuXHJcbnZhciByb290cyA9IHJlcXVpcmUoXCIuL3Jvb3RzXCIpO1xyXG5cclxudmFyIFR5cGUsIC8vIGN5Y2xpY1xyXG4gICAgRW51bTtcclxuXHJcbnV0aWwuY29kZWdlbiA9IHJlcXVpcmUoXCJAcHJvdG9idWZqcy9jb2RlZ2VuXCIpO1xyXG51dGlsLmZldGNoICAgPSByZXF1aXJlKFwiQHByb3RvYnVmanMvZmV0Y2hcIik7XHJcbnV0aWwucGF0aCAgICA9IHJlcXVpcmUoXCJAcHJvdG9idWZqcy9wYXRoXCIpO1xyXG5cclxuLyoqXHJcbiAqIE5vZGUncyBmcyBtb2R1bGUgaWYgYXZhaWxhYmxlLlxyXG4gKiBAdHlwZSB7T2JqZWN0LjxzdHJpbmcsKj59XHJcbiAqL1xyXG51dGlsLmZzID0gdXRpbC5pbnF1aXJlKFwiZnNcIik7XHJcblxyXG4vKipcclxuICogQ29udmVydHMgYW4gb2JqZWN0J3MgdmFsdWVzIHRvIGFuIGFycmF5LlxyXG4gKiBAcGFyYW0ge09iamVjdC48c3RyaW5nLCo+fSBvYmplY3QgT2JqZWN0IHRvIGNvbnZlcnRcclxuICogQHJldHVybnMge0FycmF5LjwqPn0gQ29udmVydGVkIGFycmF5XHJcbiAqL1xyXG51dGlsLnRvQXJyYXkgPSBmdW5jdGlvbiB0b0FycmF5KG9iamVjdCkge1xyXG4gICAgaWYgKG9iamVjdCkge1xyXG4gICAgICAgIHZhciBrZXlzICA9IE9iamVjdC5rZXlzKG9iamVjdCksXHJcbiAgICAgICAgICAgIGFycmF5ID0gbmV3IEFycmF5KGtleXMubGVuZ3RoKSxcclxuICAgICAgICAgICAgaW5kZXggPSAwO1xyXG4gICAgICAgIHdoaWxlIChpbmRleCA8IGtleXMubGVuZ3RoKVxyXG4gICAgICAgICAgICBhcnJheVtpbmRleF0gPSBvYmplY3Rba2V5c1tpbmRleCsrXV07XHJcbiAgICAgICAgcmV0dXJuIGFycmF5O1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIFtdO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENvbnZlcnRzIGFuIGFycmF5IG9mIGtleXMgaW1tZWRpYXRlbHkgZm9sbG93ZWQgYnkgdGhlaXIgcmVzcGVjdGl2ZSB2YWx1ZSB0byBhbiBvYmplY3QsIG9taXR0aW5nIHVuZGVmaW5lZCB2YWx1ZXMuXHJcbiAqIEBwYXJhbSB7QXJyYXkuPCo+fSBhcnJheSBBcnJheSB0byBjb252ZXJ0XHJcbiAqIEByZXR1cm5zIHtPYmplY3QuPHN0cmluZywqPn0gQ29udmVydGVkIG9iamVjdFxyXG4gKi9cclxudXRpbC50b09iamVjdCA9IGZ1bmN0aW9uIHRvT2JqZWN0KGFycmF5KSB7XHJcbiAgICB2YXIgb2JqZWN0ID0ge30sXHJcbiAgICAgICAgaW5kZXggID0gMDtcclxuICAgIHdoaWxlIChpbmRleCA8IGFycmF5Lmxlbmd0aCkge1xyXG4gICAgICAgIHZhciBrZXkgPSBhcnJheVtpbmRleCsrXSxcclxuICAgICAgICAgICAgdmFsID0gYXJyYXlbaW5kZXgrK107XHJcbiAgICAgICAgaWYgKHZhbCAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICBvYmplY3Rba2V5XSA9IHZhbDtcclxuICAgIH1cclxuICAgIHJldHVybiBvYmplY3Q7XHJcbn07XHJcblxyXG52YXIgc2FmZVByb3BCYWNrc2xhc2hSZSA9IC9cXFxcL2csXHJcbiAgICBzYWZlUHJvcFF1b3RlUmUgICAgID0gL1wiL2c7XHJcblxyXG4vKipcclxuICogVGVzdHMgd2hldGhlciB0aGUgc3BlY2lmaWVkIG5hbWUgaXMgYSByZXNlcnZlZCB3b3JkIGluIEpTLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBOYW1lIHRvIHRlc3RcclxuICogQHJldHVybnMge2Jvb2xlYW59IGB0cnVlYCBpZiByZXNlcnZlZCwgb3RoZXJ3aXNlIGBmYWxzZWBcclxuICovXHJcbnV0aWwuaXNSZXNlcnZlZCA9IGZ1bmN0aW9uIGlzUmVzZXJ2ZWQobmFtZSkge1xyXG4gICAgcmV0dXJuIC9eKD86ZG98aWZ8aW58Zm9yfGxldHxuZXd8dHJ5fHZhcnxjYXNlfGVsc2V8ZW51bXxldmFsfGZhbHNlfG51bGx8dGhpc3x0cnVlfHZvaWR8d2l0aHxicmVha3xjYXRjaHxjbGFzc3xjb25zdHxzdXBlcnx0aHJvd3x3aGlsZXx5aWVsZHxkZWxldGV8ZXhwb3J0fGltcG9ydHxwdWJsaWN8cmV0dXJufHN0YXRpY3xzd2l0Y2h8dHlwZW9mfGRlZmF1bHR8ZXh0ZW5kc3xmaW5hbGx5fHBhY2thZ2V8cHJpdmF0ZXxjb250aW51ZXxkZWJ1Z2dlcnxmdW5jdGlvbnxhcmd1bWVudHN8aW50ZXJmYWNlfHByb3RlY3RlZHxpbXBsZW1lbnRzfGluc3RhbmNlb2YpJC8udGVzdChuYW1lKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZXR1cm5zIGEgc2FmZSBwcm9wZXJ0eSBhY2Nlc3NvciBmb3IgdGhlIHNwZWNpZmllZCBwcm9wZXJ0eSBuYW1lLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcHJvcCBQcm9wZXJ0eSBuYW1lXHJcbiAqIEByZXR1cm5zIHtzdHJpbmd9IFNhZmUgYWNjZXNzb3JcclxuICovXHJcbnV0aWwuc2FmZVByb3AgPSBmdW5jdGlvbiBzYWZlUHJvcChwcm9wKSB7XHJcbiAgICBpZiAoIS9eWyRcXHdfXSskLy50ZXN0KHByb3ApIHx8IHV0aWwuaXNSZXNlcnZlZChwcm9wKSlcclxuICAgICAgICByZXR1cm4gXCJbXFxcIlwiICsgcHJvcC5yZXBsYWNlKHNhZmVQcm9wQmFja3NsYXNoUmUsIFwiXFxcXFxcXFxcIikucmVwbGFjZShzYWZlUHJvcFF1b3RlUmUsIFwiXFxcXFxcXCJcIikgKyBcIlxcXCJdXCI7XHJcbiAgICByZXR1cm4gXCIuXCIgKyBwcm9wO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENvbnZlcnRzIHRoZSBmaXJzdCBjaGFyYWN0ZXIgb2YgYSBzdHJpbmcgdG8gdXBwZXIgY2FzZS5cclxuICogQHBhcmFtIHtzdHJpbmd9IHN0ciBTdHJpbmcgdG8gY29udmVydFxyXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBDb252ZXJ0ZWQgc3RyaW5nXHJcbiAqL1xyXG51dGlsLnVjRmlyc3QgPSBmdW5jdGlvbiB1Y0ZpcnN0KHN0cikge1xyXG4gICAgcmV0dXJuIHN0ci5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHN0ci5zdWJzdHJpbmcoMSk7XHJcbn07XHJcblxyXG52YXIgY2FtZWxDYXNlUmUgPSAvXyhbYS16XSkvZztcclxuXHJcbi8qKlxyXG4gKiBDb252ZXJ0cyBhIHN0cmluZyB0byBjYW1lbCBjYXNlLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyIFN0cmluZyB0byBjb252ZXJ0XHJcbiAqIEByZXR1cm5zIHtzdHJpbmd9IENvbnZlcnRlZCBzdHJpbmdcclxuICovXHJcbnV0aWwuY2FtZWxDYXNlID0gZnVuY3Rpb24gY2FtZWxDYXNlKHN0cikge1xyXG4gICAgcmV0dXJuIHN0ci5zdWJzdHJpbmcoMCwgMSlcclxuICAgICAgICAgKyBzdHIuc3Vic3RyaW5nKDEpXHJcbiAgICAgICAgICAgICAgIC5yZXBsYWNlKGNhbWVsQ2FzZVJlLCBmdW5jdGlvbigkMCwgJDEpIHsgcmV0dXJuICQxLnRvVXBwZXJDYXNlKCk7IH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENvbXBhcmVzIHJlZmxlY3RlZCBmaWVsZHMgYnkgaWQuXHJcbiAqIEBwYXJhbSB7RmllbGR9IGEgRmlyc3QgZmllbGRcclxuICogQHBhcmFtIHtGaWVsZH0gYiBTZWNvbmQgZmllbGRcclxuICogQHJldHVybnMge251bWJlcn0gQ29tcGFyaXNvbiB2YWx1ZVxyXG4gKi9cclxudXRpbC5jb21wYXJlRmllbGRzQnlJZCA9IGZ1bmN0aW9uIGNvbXBhcmVGaWVsZHNCeUlkKGEsIGIpIHtcclxuICAgIHJldHVybiBhLmlkIC0gYi5pZDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBEZWNvcmF0b3IgaGVscGVyIGZvciB0eXBlcyAoVHlwZVNjcmlwdCkuXHJcbiAqIEBwYXJhbSB7Q29uc3RydWN0b3I8VD59IGN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb25cclxuICogQHBhcmFtIHtzdHJpbmd9IFt0eXBlTmFtZV0gVHlwZSBuYW1lLCBkZWZhdWx0cyB0byB0aGUgY29uc3RydWN0b3IncyBuYW1lXHJcbiAqIEByZXR1cm5zIHtUeXBlfSBSZWZsZWN0ZWQgdHlwZVxyXG4gKiBAdGVtcGxhdGUgVCBleHRlbmRzIE1lc3NhZ2U8VD5cclxuICogQHByb3BlcnR5IHtSb290fSByb290IERlY29yYXRvcnMgcm9vdFxyXG4gKi9cclxudXRpbC5kZWNvcmF0ZVR5cGUgPSBmdW5jdGlvbiBkZWNvcmF0ZVR5cGUoY3RvciwgdHlwZU5hbWUpIHtcclxuXHJcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cclxuICAgIGlmIChjdG9yLiR0eXBlKSB7XHJcbiAgICAgICAgaWYgKHR5cGVOYW1lICYmIGN0b3IuJHR5cGUubmFtZSAhPT0gdHlwZU5hbWUpIHtcclxuICAgICAgICAgICAgdXRpbC5kZWNvcmF0ZVJvb3QucmVtb3ZlKGN0b3IuJHR5cGUpO1xyXG4gICAgICAgICAgICBjdG9yLiR0eXBlLm5hbWUgPSB0eXBlTmFtZTtcclxuICAgICAgICAgICAgdXRpbC5kZWNvcmF0ZVJvb3QuYWRkKGN0b3IuJHR5cGUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gY3Rvci4kdHlwZTtcclxuICAgIH1cclxuXHJcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgaWYgKCFUeXBlKVxyXG4gICAgICAgIFR5cGUgPSByZXF1aXJlKFwiLi90eXBlXCIpO1xyXG5cclxuICAgIHZhciB0eXBlID0gbmV3IFR5cGUodHlwZU5hbWUgfHwgY3Rvci5uYW1lKTtcclxuICAgIHV0aWwuZGVjb3JhdGVSb290LmFkZCh0eXBlKTtcclxuICAgIHR5cGUuY3RvciA9IGN0b3I7IC8vIHNldHMgdXAgLmVuY29kZSwgLmRlY29kZSBldGMuXHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoY3RvciwgXCIkdHlwZVwiLCB7IHZhbHVlOiB0eXBlLCBlbnVtZXJhYmxlOiBmYWxzZSB9KTtcclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjdG9yLnByb3RvdHlwZSwgXCIkdHlwZVwiLCB7IHZhbHVlOiB0eXBlLCBlbnVtZXJhYmxlOiBmYWxzZSB9KTtcclxuICAgIHJldHVybiB0eXBlO1xyXG59O1xyXG5cclxudmFyIGRlY29yYXRlRW51bUluZGV4ID0gMDtcclxuXHJcbi8qKlxyXG4gKiBEZWNvcmF0b3IgaGVscGVyIGZvciBlbnVtcyAoVHlwZVNjcmlwdCkuXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgRW51bSBvYmplY3RcclxuICogQHJldHVybnMge0VudW19IFJlZmxlY3RlZCBlbnVtXHJcbiAqL1xyXG51dGlsLmRlY29yYXRlRW51bSA9IGZ1bmN0aW9uIGRlY29yYXRlRW51bShvYmplY3QpIHtcclxuXHJcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cclxuICAgIGlmIChvYmplY3QuJHR5cGUpXHJcbiAgICAgICAgcmV0dXJuIG9iamVjdC4kdHlwZTtcclxuXHJcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgaWYgKCFFbnVtKVxyXG4gICAgICAgIEVudW0gPSByZXF1aXJlKFwiLi9lbnVtXCIpO1xyXG5cclxuICAgIHZhciBlbm0gPSBuZXcgRW51bShcIkVudW1cIiArIGRlY29yYXRlRW51bUluZGV4KyssIG9iamVjdCk7XHJcbiAgICB1dGlsLmRlY29yYXRlUm9vdC5hZGQoZW5tKTtcclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmplY3QsIFwiJHR5cGVcIiwgeyB2YWx1ZTogZW5tLCBlbnVtZXJhYmxlOiBmYWxzZSB9KTtcclxuICAgIHJldHVybiBlbm07XHJcbn07XHJcblxyXG4vKipcclxuICogRGVjb3JhdG9yIHJvb3QgKFR5cGVTY3JpcHQpLlxyXG4gKiBAbmFtZSB1dGlsLmRlY29yYXRlUm9vdFxyXG4gKiBAdHlwZSB7Um9vdH1cclxuICogQHJlYWRvbmx5XHJcbiAqL1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkodXRpbCwgXCJkZWNvcmF0ZVJvb3RcIiwge1xyXG4gICAgZ2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gcm9vdHNbXCJkZWNvcmF0ZWRcIl0gfHwgKHJvb3RzW1wiZGVjb3JhdGVkXCJdID0gbmV3IChyZXF1aXJlKFwiLi9yb290XCIpKSgpKTtcclxuICAgIH1cclxufSk7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5tb2R1bGUuZXhwb3J0cyA9IExvbmdCaXRzO1xyXG5cclxudmFyIHV0aWwgPSByZXF1aXJlKFwiLi4vdXRpbC9taW5pbWFsXCIpO1xyXG5cclxuLyoqXHJcbiAqIENvbnN0cnVjdHMgbmV3IGxvbmcgYml0cy5cclxuICogQGNsYXNzZGVzYyBIZWxwZXIgY2xhc3MgZm9yIHdvcmtpbmcgd2l0aCB0aGUgbG93IGFuZCBoaWdoIGJpdHMgb2YgYSA2NCBiaXQgdmFsdWUuXHJcbiAqIEBtZW1iZXJvZiB1dGlsXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKiBAcGFyYW0ge251bWJlcn0gbG8gTG93IDMyIGJpdHMsIHVuc2lnbmVkXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBoaSBIaWdoIDMyIGJpdHMsIHVuc2lnbmVkXHJcbiAqL1xyXG5mdW5jdGlvbiBMb25nQml0cyhsbywgaGkpIHtcclxuXHJcbiAgICAvLyBub3RlIHRoYXQgdGhlIGNhc3RzIGJlbG93IGFyZSB0aGVvcmV0aWNhbGx5IHVubmVjZXNzYXJ5IGFzIG9mIHRvZGF5LCBidXQgb2xkZXIgc3RhdGljYWxseVxyXG4gICAgLy8gZ2VuZXJhdGVkIGNvbnZlcnRlciBjb2RlIG1pZ2h0IHN0aWxsIGNhbGwgdGhlIGN0b3Igd2l0aCBzaWduZWQgMzJiaXRzLiBrZXB0IGZvciBjb21wYXQuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBMb3cgYml0cy5cclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIHRoaXMubG8gPSBsbyA+Pj4gMDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEhpZ2ggYml0cy5cclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIHRoaXMuaGkgPSBoaSA+Pj4gMDtcclxufVxyXG5cclxuLyoqXHJcbiAqIFplcm8gYml0cy5cclxuICogQG1lbWJlcm9mIHV0aWwuTG9uZ0JpdHNcclxuICogQHR5cGUge3V0aWwuTG9uZ0JpdHN9XHJcbiAqL1xyXG52YXIgemVybyA9IExvbmdCaXRzLnplcm8gPSBuZXcgTG9uZ0JpdHMoMCwgMCk7XHJcblxyXG56ZXJvLnRvTnVtYmVyID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xyXG56ZXJvLnp6RW5jb2RlID0gemVyby56ekRlY29kZSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpczsgfTtcclxuemVyby5sZW5ndGggPSBmdW5jdGlvbigpIHsgcmV0dXJuIDE7IH07XHJcblxyXG4vKipcclxuICogWmVybyBoYXNoLlxyXG4gKiBAbWVtYmVyb2YgdXRpbC5Mb25nQml0c1xyXG4gKiBAdHlwZSB7c3RyaW5nfVxyXG4gKi9cclxudmFyIHplcm9IYXNoID0gTG9uZ0JpdHMuemVyb0hhc2ggPSBcIlxcMFxcMFxcMFxcMFxcMFxcMFxcMFxcMFwiO1xyXG5cclxuLyoqXHJcbiAqIENvbnN0cnVjdHMgbmV3IGxvbmcgYml0cyBmcm9tIHRoZSBzcGVjaWZpZWQgbnVtYmVyLlxyXG4gKiBAcGFyYW0ge251bWJlcn0gdmFsdWUgVmFsdWVcclxuICogQHJldHVybnMge3V0aWwuTG9uZ0JpdHN9IEluc3RhbmNlXHJcbiAqL1xyXG5Mb25nQml0cy5mcm9tTnVtYmVyID0gZnVuY3Rpb24gZnJvbU51bWJlcih2YWx1ZSkge1xyXG4gICAgaWYgKHZhbHVlID09PSAwKVxyXG4gICAgICAgIHJldHVybiB6ZXJvO1xyXG4gICAgdmFyIHNpZ24gPSB2YWx1ZSA8IDA7XHJcbiAgICBpZiAoc2lnbilcclxuICAgICAgICB2YWx1ZSA9IC12YWx1ZTtcclxuICAgIHZhciBsbyA9IHZhbHVlID4+PiAwLFxyXG4gICAgICAgIGhpID0gKHZhbHVlIC0gbG8pIC8gNDI5NDk2NzI5NiA+Pj4gMDtcclxuICAgIGlmIChzaWduKSB7XHJcbiAgICAgICAgaGkgPSB+aGkgPj4+IDA7XHJcbiAgICAgICAgbG8gPSB+bG8gPj4+IDA7XHJcbiAgICAgICAgaWYgKCsrbG8gPiA0Mjk0OTY3Mjk1KSB7XHJcbiAgICAgICAgICAgIGxvID0gMDtcclxuICAgICAgICAgICAgaWYgKCsraGkgPiA0Mjk0OTY3Mjk1KVxyXG4gICAgICAgICAgICAgICAgaGkgPSAwO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBuZXcgTG9uZ0JpdHMobG8sIGhpKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDb25zdHJ1Y3RzIG5ldyBsb25nIGJpdHMgZnJvbSBhIG51bWJlciwgbG9uZyBvciBzdHJpbmcuXHJcbiAqIEBwYXJhbSB7TG9uZ3xudW1iZXJ8c3RyaW5nfSB2YWx1ZSBWYWx1ZVxyXG4gKiBAcmV0dXJucyB7dXRpbC5Mb25nQml0c30gSW5zdGFuY2VcclxuICovXHJcbkxvbmdCaXRzLmZyb20gPSBmdW5jdGlvbiBmcm9tKHZhbHVlKSB7XHJcbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSBcIm51bWJlclwiKVxyXG4gICAgICAgIHJldHVybiBMb25nQml0cy5mcm9tTnVtYmVyKHZhbHVlKTtcclxuICAgIGlmICh1dGlsLmlzU3RyaW5nKHZhbHVlKSkge1xyXG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBlbHNlICovXHJcbiAgICAgICAgaWYgKHV0aWwuTG9uZylcclxuICAgICAgICAgICAgdmFsdWUgPSB1dGlsLkxvbmcuZnJvbVN0cmluZyh2YWx1ZSk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICByZXR1cm4gTG9uZ0JpdHMuZnJvbU51bWJlcihwYXJzZUludCh2YWx1ZSwgMTApKTtcclxuICAgIH1cclxuICAgIHJldHVybiB2YWx1ZS5sb3cgfHwgdmFsdWUuaGlnaCA/IG5ldyBMb25nQml0cyh2YWx1ZS5sb3cgPj4+IDAsIHZhbHVlLmhpZ2ggPj4+IDApIDogemVybztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDb252ZXJ0cyB0aGlzIGxvbmcgYml0cyB0byBhIHBvc3NpYmx5IHVuc2FmZSBKYXZhU2NyaXB0IG51bWJlci5cclxuICogQHBhcmFtIHtib29sZWFufSBbdW5zaWduZWQ9ZmFsc2VdIFdoZXRoZXIgdW5zaWduZWQgb3Igbm90XHJcbiAqIEByZXR1cm5zIHtudW1iZXJ9IFBvc3NpYmx5IHVuc2FmZSBudW1iZXJcclxuICovXHJcbkxvbmdCaXRzLnByb3RvdHlwZS50b051bWJlciA9IGZ1bmN0aW9uIHRvTnVtYmVyKHVuc2lnbmVkKSB7XHJcbiAgICBpZiAoIXVuc2lnbmVkICYmIHRoaXMuaGkgPj4+IDMxKSB7XHJcbiAgICAgICAgdmFyIGxvID0gfnRoaXMubG8gKyAxID4+PiAwLFxyXG4gICAgICAgICAgICBoaSA9IH50aGlzLmhpICAgICA+Pj4gMDtcclxuICAgICAgICBpZiAoIWxvKVxyXG4gICAgICAgICAgICBoaSA9IGhpICsgMSA+Pj4gMDtcclxuICAgICAgICByZXR1cm4gLShsbyArIGhpICogNDI5NDk2NzI5Nik7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5sbyArIHRoaXMuaGkgKiA0Mjk0OTY3Mjk2O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENvbnZlcnRzIHRoaXMgbG9uZyBiaXRzIHRvIGEgbG9uZy5cclxuICogQHBhcmFtIHtib29sZWFufSBbdW5zaWduZWQ9ZmFsc2VdIFdoZXRoZXIgdW5zaWduZWQgb3Igbm90XHJcbiAqIEByZXR1cm5zIHtMb25nfSBMb25nXHJcbiAqL1xyXG5Mb25nQml0cy5wcm90b3R5cGUudG9Mb25nID0gZnVuY3Rpb24gdG9Mb25nKHVuc2lnbmVkKSB7XHJcbiAgICByZXR1cm4gdXRpbC5Mb25nXHJcbiAgICAgICAgPyBuZXcgdXRpbC5Mb25nKHRoaXMubG8gfCAwLCB0aGlzLmhpIHwgMCwgQm9vbGVhbih1bnNpZ25lZCkpXHJcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgICAgICA6IHsgbG93OiB0aGlzLmxvIHwgMCwgaGlnaDogdGhpcy5oaSB8IDAsIHVuc2lnbmVkOiBCb29sZWFuKHVuc2lnbmVkKSB9O1xyXG59O1xyXG5cclxudmFyIGNoYXJDb2RlQXQgPSBTdHJpbmcucHJvdG90eXBlLmNoYXJDb2RlQXQ7XHJcblxyXG4vKipcclxuICogQ29uc3RydWN0cyBuZXcgbG9uZyBiaXRzIGZyb20gdGhlIHNwZWNpZmllZCA4IGNoYXJhY3RlcnMgbG9uZyBoYXNoLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gaGFzaCBIYXNoXHJcbiAqIEByZXR1cm5zIHt1dGlsLkxvbmdCaXRzfSBCaXRzXHJcbiAqL1xyXG5Mb25nQml0cy5mcm9tSGFzaCA9IGZ1bmN0aW9uIGZyb21IYXNoKGhhc2gpIHtcclxuICAgIGlmIChoYXNoID09PSB6ZXJvSGFzaClcclxuICAgICAgICByZXR1cm4gemVybztcclxuICAgIHJldHVybiBuZXcgTG9uZ0JpdHMoXHJcbiAgICAgICAgKCBjaGFyQ29kZUF0LmNhbGwoaGFzaCwgMClcclxuICAgICAgICB8IGNoYXJDb2RlQXQuY2FsbChoYXNoLCAxKSA8PCA4XHJcbiAgICAgICAgfCBjaGFyQ29kZUF0LmNhbGwoaGFzaCwgMikgPDwgMTZcclxuICAgICAgICB8IGNoYXJDb2RlQXQuY2FsbChoYXNoLCAzKSA8PCAyNCkgPj4+IDBcclxuICAgICxcclxuICAgICAgICAoIGNoYXJDb2RlQXQuY2FsbChoYXNoLCA0KVxyXG4gICAgICAgIHwgY2hhckNvZGVBdC5jYWxsKGhhc2gsIDUpIDw8IDhcclxuICAgICAgICB8IGNoYXJDb2RlQXQuY2FsbChoYXNoLCA2KSA8PCAxNlxyXG4gICAgICAgIHwgY2hhckNvZGVBdC5jYWxsKGhhc2gsIDcpIDw8IDI0KSA+Pj4gMFxyXG4gICAgKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDb252ZXJ0cyB0aGlzIGxvbmcgYml0cyB0byBhIDggY2hhcmFjdGVycyBsb25nIGhhc2guXHJcbiAqIEByZXR1cm5zIHtzdHJpbmd9IEhhc2hcclxuICovXHJcbkxvbmdCaXRzLnByb3RvdHlwZS50b0hhc2ggPSBmdW5jdGlvbiB0b0hhc2goKSB7XHJcbiAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZShcclxuICAgICAgICB0aGlzLmxvICAgICAgICAmIDI1NSxcclxuICAgICAgICB0aGlzLmxvID4+PiA4ICAmIDI1NSxcclxuICAgICAgICB0aGlzLmxvID4+PiAxNiAmIDI1NSxcclxuICAgICAgICB0aGlzLmxvID4+PiAyNCAgICAgICxcclxuICAgICAgICB0aGlzLmhpICAgICAgICAmIDI1NSxcclxuICAgICAgICB0aGlzLmhpID4+PiA4ICAmIDI1NSxcclxuICAgICAgICB0aGlzLmhpID4+PiAxNiAmIDI1NSxcclxuICAgICAgICB0aGlzLmhpID4+PiAyNFxyXG4gICAgKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBaaWctemFnIGVuY29kZXMgdGhpcyBsb25nIGJpdHMuXHJcbiAqIEByZXR1cm5zIHt1dGlsLkxvbmdCaXRzfSBgdGhpc2BcclxuICovXHJcbkxvbmdCaXRzLnByb3RvdHlwZS56ekVuY29kZSA9IGZ1bmN0aW9uIHp6RW5jb2RlKCkge1xyXG4gICAgdmFyIG1hc2sgPSAgIHRoaXMuaGkgPj4gMzE7XHJcbiAgICB0aGlzLmhpICA9ICgodGhpcy5oaSA8PCAxIHwgdGhpcy5sbyA+Pj4gMzEpIF4gbWFzaykgPj4+IDA7XHJcbiAgICB0aGlzLmxvICA9ICggdGhpcy5sbyA8PCAxICAgICAgICAgICAgICAgICAgIF4gbWFzaykgPj4+IDA7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBaaWctemFnIGRlY29kZXMgdGhpcyBsb25nIGJpdHMuXHJcbiAqIEByZXR1cm5zIHt1dGlsLkxvbmdCaXRzfSBgdGhpc2BcclxuICovXHJcbkxvbmdCaXRzLnByb3RvdHlwZS56ekRlY29kZSA9IGZ1bmN0aW9uIHp6RGVjb2RlKCkge1xyXG4gICAgdmFyIG1hc2sgPSAtKHRoaXMubG8gJiAxKTtcclxuICAgIHRoaXMubG8gID0gKCh0aGlzLmxvID4+PiAxIHwgdGhpcy5oaSA8PCAzMSkgXiBtYXNrKSA+Pj4gMDtcclxuICAgIHRoaXMuaGkgID0gKCB0aGlzLmhpID4+PiAxICAgICAgICAgICAgICAgICAgXiBtYXNrKSA+Pj4gMDtcclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENhbGN1bGF0ZXMgdGhlIGxlbmd0aCBvZiB0aGlzIGxvbmdiaXRzIHdoZW4gZW5jb2RlZCBhcyBhIHZhcmludC5cclxuICogQHJldHVybnMge251bWJlcn0gTGVuZ3RoXHJcbiAqL1xyXG5Mb25nQml0cy5wcm90b3R5cGUubGVuZ3RoID0gZnVuY3Rpb24gbGVuZ3RoKCkge1xyXG4gICAgdmFyIHBhcnQwID0gIHRoaXMubG8sXHJcbiAgICAgICAgcGFydDEgPSAodGhpcy5sbyA+Pj4gMjggfCB0aGlzLmhpIDw8IDQpID4+PiAwLFxyXG4gICAgICAgIHBhcnQyID0gIHRoaXMuaGkgPj4+IDI0O1xyXG4gICAgcmV0dXJuIHBhcnQyID09PSAwXHJcbiAgICAgICAgID8gcGFydDEgPT09IDBcclxuICAgICAgICAgICA/IHBhcnQwIDwgMTYzODRcclxuICAgICAgICAgICAgID8gcGFydDAgPCAxMjggPyAxIDogMlxyXG4gICAgICAgICAgICAgOiBwYXJ0MCA8IDIwOTcxNTIgPyAzIDogNFxyXG4gICAgICAgICAgIDogcGFydDEgPCAxNjM4NFxyXG4gICAgICAgICAgICAgPyBwYXJ0MSA8IDEyOCA/IDUgOiA2XHJcbiAgICAgICAgICAgICA6IHBhcnQxIDwgMjA5NzE1MiA/IDcgOiA4XHJcbiAgICAgICAgIDogcGFydDIgPCAxMjggPyA5IDogMTA7XHJcbn07XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgdXRpbCA9IGV4cG9ydHM7XHJcblxyXG4vLyB1c2VkIHRvIHJldHVybiBhIFByb21pc2Ugd2hlcmUgY2FsbGJhY2sgaXMgb21pdHRlZFxyXG51dGlsLmFzUHJvbWlzZSA9IHJlcXVpcmUoXCJAcHJvdG9idWZqcy9hc3Byb21pc2VcIik7XHJcblxyXG4vLyBjb252ZXJ0cyB0byAvIGZyb20gYmFzZTY0IGVuY29kZWQgc3RyaW5nc1xyXG51dGlsLmJhc2U2NCA9IHJlcXVpcmUoXCJAcHJvdG9idWZqcy9iYXNlNjRcIik7XHJcblxyXG4vLyBiYXNlIGNsYXNzIG9mIHJwYy5TZXJ2aWNlXHJcbnV0aWwuRXZlbnRFbWl0dGVyID0gcmVxdWlyZShcIkBwcm90b2J1ZmpzL2V2ZW50ZW1pdHRlclwiKTtcclxuXHJcbi8vIGZsb2F0IGhhbmRsaW5nIGFjY3Jvc3MgYnJvd3NlcnNcclxudXRpbC5mbG9hdCA9IHJlcXVpcmUoXCJAcHJvdG9idWZqcy9mbG9hdFwiKTtcclxuXHJcbi8vIHJlcXVpcmVzIG1vZHVsZXMgb3B0aW9uYWxseSBhbmQgaGlkZXMgdGhlIGNhbGwgZnJvbSBidW5kbGVyc1xyXG51dGlsLmlucXVpcmUgPSByZXF1aXJlKFwiQHByb3RvYnVmanMvaW5xdWlyZVwiKTtcclxuXHJcbi8vIGNvbnZlcnRzIHRvIC8gZnJvbSB1dGY4IGVuY29kZWQgc3RyaW5nc1xyXG51dGlsLnV0ZjggPSByZXF1aXJlKFwiQHByb3RvYnVmanMvdXRmOFwiKTtcclxuXHJcbi8vIHByb3ZpZGVzIGEgbm9kZS1saWtlIGJ1ZmZlciBwb29sIGluIHRoZSBicm93c2VyXHJcbnV0aWwucG9vbCA9IHJlcXVpcmUoXCJAcHJvdG9idWZqcy9wb29sXCIpO1xyXG5cclxuLy8gdXRpbGl0eSB0byB3b3JrIHdpdGggdGhlIGxvdyBhbmQgaGlnaCBiaXRzIG9mIGEgNjQgYml0IHZhbHVlXHJcbnV0aWwuTG9uZ0JpdHMgPSByZXF1aXJlKFwiLi9sb25nYml0c1wiKTtcclxuXHJcbi8vIGdsb2JhbCBvYmplY3QgcmVmZXJlbmNlXHJcbnV0aWwuZ2xvYmFsID0gdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiAmJiB3aW5kb3dcclxuICAgICAgICAgICB8fCB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiICYmIGdsb2JhbFxyXG4gICAgICAgICAgIHx8IHR5cGVvZiBzZWxmICAgIT09IFwidW5kZWZpbmVkXCIgJiYgc2VsZlxyXG4gICAgICAgICAgIHx8IHRoaXM7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8taW52YWxpZC10aGlzXHJcblxyXG4vKipcclxuICogQW4gaW1tdWFibGUgZW1wdHkgYXJyYXkuXHJcbiAqIEBtZW1iZXJvZiB1dGlsXHJcbiAqIEB0eXBlIHtBcnJheS48Kj59XHJcbiAqIEBjb25zdFxyXG4gKi9cclxudXRpbC5lbXB0eUFycmF5ID0gT2JqZWN0LmZyZWV6ZSA/IE9iamVjdC5mcmVlemUoW10pIDogLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi8gW107IC8vIHVzZWQgb24gcHJvdG90eXBlc1xyXG5cclxuLyoqXHJcbiAqIEFuIGltbXV0YWJsZSBlbXB0eSBvYmplY3QuXHJcbiAqIEB0eXBlIHtPYmplY3R9XHJcbiAqIEBjb25zdFxyXG4gKi9cclxudXRpbC5lbXB0eU9iamVjdCA9IE9iamVjdC5mcmVlemUgPyBPYmplY3QuZnJlZXplKHt9KSA6IC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovIHt9OyAvLyB1c2VkIG9uIHByb3RvdHlwZXNcclxuXHJcbi8qKlxyXG4gKiBXaGV0aGVyIHJ1bm5pbmcgd2l0aGluIG5vZGUgb3Igbm90LlxyXG4gKiBAbWVtYmVyb2YgdXRpbFxyXG4gKiBAdHlwZSB7Ym9vbGVhbn1cclxuICogQGNvbnN0XHJcbiAqL1xyXG51dGlsLmlzTm9kZSA9IEJvb2xlYW4odXRpbC5nbG9iYWwucHJvY2VzcyAmJiB1dGlsLmdsb2JhbC5wcm9jZXNzLnZlcnNpb25zICYmIHV0aWwuZ2xvYmFsLnByb2Nlc3MudmVyc2lvbnMubm9kZSk7XHJcblxyXG4vKipcclxuICogVGVzdHMgaWYgdGhlIHNwZWNpZmllZCB2YWx1ZSBpcyBhbiBpbnRlZ2VyLlxyXG4gKiBAZnVuY3Rpb25cclxuICogQHBhcmFtIHsqfSB2YWx1ZSBWYWx1ZSB0byB0ZXN0XHJcbiAqIEByZXR1cm5zIHtib29sZWFufSBgdHJ1ZWAgaWYgdGhlIHZhbHVlIGlzIGFuIGludGVnZXJcclxuICovXHJcbnV0aWwuaXNJbnRlZ2VyID0gTnVtYmVyLmlzSW50ZWdlciB8fCAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqLyBmdW5jdGlvbiBpc0ludGVnZXIodmFsdWUpIHtcclxuICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09IFwibnVtYmVyXCIgJiYgaXNGaW5pdGUodmFsdWUpICYmIE1hdGguZmxvb3IodmFsdWUpID09PSB2YWx1ZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBUZXN0cyBpZiB0aGUgc3BlY2lmaWVkIHZhbHVlIGlzIGEgc3RyaW5nLlxyXG4gKiBAcGFyYW0geyp9IHZhbHVlIFZhbHVlIHRvIHRlc3RcclxuICogQHJldHVybnMge2Jvb2xlYW59IGB0cnVlYCBpZiB0aGUgdmFsdWUgaXMgYSBzdHJpbmdcclxuICovXHJcbnV0aWwuaXNTdHJpbmcgPSBmdW5jdGlvbiBpc1N0cmluZyh2YWx1ZSkge1xyXG4gICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIiB8fCB2YWx1ZSBpbnN0YW5jZW9mIFN0cmluZztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBUZXN0cyBpZiB0aGUgc3BlY2lmaWVkIHZhbHVlIGlzIGEgbm9uLW51bGwgb2JqZWN0LlxyXG4gKiBAcGFyYW0geyp9IHZhbHVlIFZhbHVlIHRvIHRlc3RcclxuICogQHJldHVybnMge2Jvb2xlYW59IGB0cnVlYCBpZiB0aGUgdmFsdWUgaXMgYSBub24tbnVsbCBvYmplY3RcclxuICovXHJcbnV0aWwuaXNPYmplY3QgPSBmdW5jdGlvbiBpc09iamVjdCh2YWx1ZSkge1xyXG4gICAgcmV0dXJuIHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIjtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDaGVja3MgaWYgYSBwcm9wZXJ0eSBvbiBhIG1lc3NhZ2UgaXMgY29uc2lkZXJlZCB0byBiZSBwcmVzZW50LlxyXG4gKiBUaGlzIGlzIGFuIGFsaWFzIG9mIHtAbGluayB1dGlsLmlzU2V0fS5cclxuICogQGZ1bmN0aW9uXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmogUGxhaW4gb2JqZWN0IG9yIG1lc3NhZ2UgaW5zdGFuY2VcclxuICogQHBhcmFtIHtzdHJpbmd9IHByb3AgUHJvcGVydHkgbmFtZVxyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gYHRydWVgIGlmIGNvbnNpZGVyZWQgdG8gYmUgcHJlc2VudCwgb3RoZXJ3aXNlIGBmYWxzZWBcclxuICovXHJcbnV0aWwuaXNzZXQgPVxyXG5cclxuLyoqXHJcbiAqIENoZWNrcyBpZiBhIHByb3BlcnR5IG9uIGEgbWVzc2FnZSBpcyBjb25zaWRlcmVkIHRvIGJlIHByZXNlbnQuXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmogUGxhaW4gb2JqZWN0IG9yIG1lc3NhZ2UgaW5zdGFuY2VcclxuICogQHBhcmFtIHtzdHJpbmd9IHByb3AgUHJvcGVydHkgbmFtZVxyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gYHRydWVgIGlmIGNvbnNpZGVyZWQgdG8gYmUgcHJlc2VudCwgb3RoZXJ3aXNlIGBmYWxzZWBcclxuICovXHJcbnV0aWwuaXNTZXQgPSBmdW5jdGlvbiBpc1NldChvYmosIHByb3ApIHtcclxuICAgIHZhciB2YWx1ZSA9IG9ialtwcm9wXTtcclxuICAgIGlmICh2YWx1ZSAhPSBudWxsICYmIG9iai5oYXNPd25Qcm9wZXJ0eShwcm9wKSkgLy8gZXNsaW50LWRpc2FibGUtbGluZSBlcWVxZXEsIG5vLXByb3RvdHlwZS1idWlsdGluc1xyXG4gICAgICAgIHJldHVybiB0eXBlb2YgdmFsdWUgIT09IFwib2JqZWN0XCIgfHwgKEFycmF5LmlzQXJyYXkodmFsdWUpID8gdmFsdWUubGVuZ3RoIDogT2JqZWN0LmtleXModmFsdWUpLmxlbmd0aCkgPiAwO1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEFueSBjb21wYXRpYmxlIEJ1ZmZlciBpbnN0YW5jZS5cclxuICogVGhpcyBpcyBhIG1pbmltYWwgc3RhbmQtYWxvbmUgZGVmaW5pdGlvbiBvZiBhIEJ1ZmZlciBpbnN0YW5jZS4gVGhlIGFjdHVhbCB0eXBlIGlzIHRoYXQgZXhwb3J0ZWQgYnkgbm9kZSdzIHR5cGluZ3MuXHJcbiAqIEBpbnRlcmZhY2UgQnVmZmVyXHJcbiAqIEBleHRlbmRzIFVpbnQ4QXJyYXlcclxuICovXHJcblxyXG4vKipcclxuICogTm9kZSdzIEJ1ZmZlciBjbGFzcyBpZiBhdmFpbGFibGUuXHJcbiAqIEB0eXBlIHtDb25zdHJ1Y3RvcjxCdWZmZXI+fVxyXG4gKi9cclxudXRpbC5CdWZmZXIgPSAoZnVuY3Rpb24oKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIHZhciBCdWZmZXIgPSB1dGlsLmlucXVpcmUoXCJidWZmZXJcIikuQnVmZmVyO1xyXG4gICAgICAgIC8vIHJlZnVzZSB0byB1c2Ugbm9uLW5vZGUgYnVmZmVycyBpZiBub3QgZXhwbGljaXRseSBhc3NpZ25lZCAocGVyZiByZWFzb25zKTpcclxuICAgICAgICByZXR1cm4gQnVmZmVyLnByb3RvdHlwZS51dGY4V3JpdGUgPyBCdWZmZXIgOiAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqLyBudWxsO1xyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbn0pKCk7XHJcblxyXG4vLyBJbnRlcm5hbCBhbGlhcyBvZiBvciBwb2x5ZnVsbCBmb3IgQnVmZmVyLmZyb20uXHJcbnV0aWwuX0J1ZmZlcl9mcm9tID0gbnVsbDtcclxuXHJcbi8vIEludGVybmFsIGFsaWFzIG9mIG9yIHBvbHlmaWxsIGZvciBCdWZmZXIuYWxsb2NVbnNhZmUuXHJcbnV0aWwuX0J1ZmZlcl9hbGxvY1Vuc2FmZSA9IG51bGw7XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIG5ldyBidWZmZXIgb2Ygd2hhdGV2ZXIgdHlwZSBzdXBwb3J0ZWQgYnkgdGhlIGVudmlyb25tZW50LlxyXG4gKiBAcGFyYW0ge251bWJlcnxudW1iZXJbXX0gW3NpemVPckFycmF5PTBdIEJ1ZmZlciBzaXplIG9yIG51bWJlciBhcnJheVxyXG4gKiBAcmV0dXJucyB7VWludDhBcnJheXxCdWZmZXJ9IEJ1ZmZlclxyXG4gKi9cclxudXRpbC5uZXdCdWZmZXIgPSBmdW5jdGlvbiBuZXdCdWZmZXIoc2l6ZU9yQXJyYXkpIHtcclxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICByZXR1cm4gdHlwZW9mIHNpemVPckFycmF5ID09PSBcIm51bWJlclwiXHJcbiAgICAgICAgPyB1dGlsLkJ1ZmZlclxyXG4gICAgICAgICAgICA/IHV0aWwuX0J1ZmZlcl9hbGxvY1Vuc2FmZShzaXplT3JBcnJheSlcclxuICAgICAgICAgICAgOiBuZXcgdXRpbC5BcnJheShzaXplT3JBcnJheSlcclxuICAgICAgICA6IHV0aWwuQnVmZmVyXHJcbiAgICAgICAgICAgID8gdXRpbC5fQnVmZmVyX2Zyb20oc2l6ZU9yQXJyYXkpXHJcbiAgICAgICAgICAgIDogdHlwZW9mIFVpbnQ4QXJyYXkgPT09IFwidW5kZWZpbmVkXCJcclxuICAgICAgICAgICAgICAgID8gc2l6ZU9yQXJyYXlcclxuICAgICAgICAgICAgICAgIDogbmV3IFVpbnQ4QXJyYXkoc2l6ZU9yQXJyYXkpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEFycmF5IGltcGxlbWVudGF0aW9uIHVzZWQgaW4gdGhlIGJyb3dzZXIuIGBVaW50OEFycmF5YCBpZiBzdXBwb3J0ZWQsIG90aGVyd2lzZSBgQXJyYXlgLlxyXG4gKiBAdHlwZSB7Q29uc3RydWN0b3I8VWludDhBcnJheT59XHJcbiAqL1xyXG51dGlsLkFycmF5ID0gdHlwZW9mIFVpbnQ4QXJyYXkgIT09IFwidW5kZWZpbmVkXCIgPyBVaW50OEFycmF5IC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovIDogQXJyYXk7XHJcblxyXG4vKipcclxuICogQW55IGNvbXBhdGlibGUgTG9uZyBpbnN0YW5jZS5cclxuICogVGhpcyBpcyBhIG1pbmltYWwgc3RhbmQtYWxvbmUgZGVmaW5pdGlvbiBvZiBhIExvbmcgaW5zdGFuY2UuIFRoZSBhY3R1YWwgdHlwZSBpcyB0aGF0IGV4cG9ydGVkIGJ5IGxvbmcuanMuXHJcbiAqIEBpbnRlcmZhY2UgTG9uZ1xyXG4gKiBAcHJvcGVydHkge251bWJlcn0gbG93IExvdyBiaXRzXHJcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBoaWdoIEhpZ2ggYml0c1xyXG4gKiBAcHJvcGVydHkge2Jvb2xlYW59IHVuc2lnbmVkIFdoZXRoZXIgdW5zaWduZWQgb3Igbm90XHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIExvbmcuanMncyBMb25nIGNsYXNzIGlmIGF2YWlsYWJsZS5cclxuICogQHR5cGUge0NvbnN0cnVjdG9yPExvbmc+fVxyXG4gKi9cclxudXRpbC5Mb25nID0gLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi8gdXRpbC5nbG9iYWwuZGNvZGVJTyAmJiAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqLyB1dGlsLmdsb2JhbC5kY29kZUlPLkxvbmdcclxuICAgICAgICAgfHwgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi8gdXRpbC5nbG9iYWwuTG9uZ1xyXG4gICAgICAgICB8fCB1dGlsLmlucXVpcmUoXCJsb25nXCIpO1xyXG5cclxuLyoqXHJcbiAqIFJlZ3VsYXIgZXhwcmVzc2lvbiB1c2VkIHRvIHZlcmlmeSAyIGJpdCAoYGJvb2xgKSBtYXAga2V5cy5cclxuICogQHR5cGUge1JlZ0V4cH1cclxuICogQGNvbnN0XHJcbiAqL1xyXG51dGlsLmtleTJSZSA9IC9edHJ1ZXxmYWxzZXwwfDEkLztcclxuXHJcbi8qKlxyXG4gKiBSZWd1bGFyIGV4cHJlc3Npb24gdXNlZCB0byB2ZXJpZnkgMzIgYml0IChgaW50MzJgIGV0Yy4pIG1hcCBrZXlzLlxyXG4gKiBAdHlwZSB7UmVnRXhwfVxyXG4gKiBAY29uc3RcclxuICovXHJcbnV0aWwua2V5MzJSZSA9IC9eLT8oPzowfFsxLTldWzAtOV0qKSQvO1xyXG5cclxuLyoqXHJcbiAqIFJlZ3VsYXIgZXhwcmVzc2lvbiB1c2VkIHRvIHZlcmlmeSA2NCBiaXQgKGBpbnQ2NGAgZXRjLikgbWFwIGtleXMuXHJcbiAqIEB0eXBlIHtSZWdFeHB9XHJcbiAqIEBjb25zdFxyXG4gKi9cclxudXRpbC5rZXk2NFJlID0gL14oPzpbXFxcXHgwMC1cXFxceGZmXXs4fXwtPyg/OjB8WzEtOV1bMC05XSopKSQvO1xyXG5cclxuLyoqXHJcbiAqIENvbnZlcnRzIGEgbnVtYmVyIG9yIGxvbmcgdG8gYW4gOCBjaGFyYWN0ZXJzIGxvbmcgaGFzaCBzdHJpbmcuXHJcbiAqIEBwYXJhbSB7TG9uZ3xudW1iZXJ9IHZhbHVlIFZhbHVlIHRvIGNvbnZlcnRcclxuICogQHJldHVybnMge3N0cmluZ30gSGFzaFxyXG4gKi9cclxudXRpbC5sb25nVG9IYXNoID0gZnVuY3Rpb24gbG9uZ1RvSGFzaCh2YWx1ZSkge1xyXG4gICAgcmV0dXJuIHZhbHVlXHJcbiAgICAgICAgPyB1dGlsLkxvbmdCaXRzLmZyb20odmFsdWUpLnRvSGFzaCgpXHJcbiAgICAgICAgOiB1dGlsLkxvbmdCaXRzLnplcm9IYXNoO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENvbnZlcnRzIGFuIDggY2hhcmFjdGVycyBsb25nIGhhc2ggc3RyaW5nIHRvIGEgbG9uZyBvciBudW1iZXIuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBoYXNoIEhhc2hcclxuICogQHBhcmFtIHtib29sZWFufSBbdW5zaWduZWQ9ZmFsc2VdIFdoZXRoZXIgdW5zaWduZWQgb3Igbm90XHJcbiAqIEByZXR1cm5zIHtMb25nfG51bWJlcn0gT3JpZ2luYWwgdmFsdWVcclxuICovXHJcbnV0aWwubG9uZ0Zyb21IYXNoID0gZnVuY3Rpb24gbG9uZ0Zyb21IYXNoKGhhc2gsIHVuc2lnbmVkKSB7XHJcbiAgICB2YXIgYml0cyA9IHV0aWwuTG9uZ0JpdHMuZnJvbUhhc2goaGFzaCk7XHJcbiAgICBpZiAodXRpbC5Mb25nKVxyXG4gICAgICAgIHJldHVybiB1dGlsLkxvbmcuZnJvbUJpdHMoYml0cy5sbywgYml0cy5oaSwgdW5zaWduZWQpO1xyXG4gICAgcmV0dXJuIGJpdHMudG9OdW1iZXIoQm9vbGVhbih1bnNpZ25lZCkpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIE1lcmdlcyB0aGUgcHJvcGVydGllcyBvZiB0aGUgc291cmNlIG9iamVjdCBpbnRvIHRoZSBkZXN0aW5hdGlvbiBvYmplY3QuXHJcbiAqIEBtZW1iZXJvZiB1dGlsXHJcbiAqIEBwYXJhbSB7T2JqZWN0LjxzdHJpbmcsKj59IGRzdCBEZXN0aW5hdGlvbiBvYmplY3RcclxuICogQHBhcmFtIHtPYmplY3QuPHN0cmluZywqPn0gc3JjIFNvdXJjZSBvYmplY3RcclxuICogQHBhcmFtIHtib29sZWFufSBbaWZOb3RTZXQ9ZmFsc2VdIE1lcmdlcyBvbmx5IGlmIHRoZSBrZXkgaXMgbm90IGFscmVhZHkgc2V0XHJcbiAqIEByZXR1cm5zIHtPYmplY3QuPHN0cmluZywqPn0gRGVzdGluYXRpb24gb2JqZWN0XHJcbiAqL1xyXG5mdW5jdGlvbiBtZXJnZShkc3QsIHNyYywgaWZOb3RTZXQpIHsgLy8gdXNlZCBieSBjb252ZXJ0ZXJzXHJcbiAgICBmb3IgKHZhciBrZXlzID0gT2JqZWN0LmtleXMoc3JjKSwgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgKytpKVxyXG4gICAgICAgIGlmIChkc3Rba2V5c1tpXV0gPT09IHVuZGVmaW5lZCB8fCAhaWZOb3RTZXQpXHJcbiAgICAgICAgICAgIGRzdFtrZXlzW2ldXSA9IHNyY1trZXlzW2ldXTtcclxuICAgIHJldHVybiBkc3Q7XHJcbn1cclxuXHJcbnV0aWwubWVyZ2UgPSBtZXJnZTtcclxuXHJcbi8qKlxyXG4gKiBDb252ZXJ0cyB0aGUgZmlyc3QgY2hhcmFjdGVyIG9mIGEgc3RyaW5nIHRvIGxvd2VyIGNhc2UuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHIgU3RyaW5nIHRvIGNvbnZlcnRcclxuICogQHJldHVybnMge3N0cmluZ30gQ29udmVydGVkIHN0cmluZ1xyXG4gKi9cclxudXRpbC5sY0ZpcnN0ID0gZnVuY3Rpb24gbGNGaXJzdChzdHIpIHtcclxuICAgIHJldHVybiBzdHIuY2hhckF0KDApLnRvTG93ZXJDYXNlKCkgKyBzdHIuc3Vic3RyaW5nKDEpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBjdXN0b20gZXJyb3IgY29uc3RydWN0b3IuXHJcbiAqIEBtZW1iZXJvZiB1dGlsXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIEVycm9yIG5hbWVcclxuICogQHJldHVybnMge0NvbnN0cnVjdG9yPEVycm9yPn0gQ3VzdG9tIGVycm9yIGNvbnN0cnVjdG9yXHJcbiAqL1xyXG5mdW5jdGlvbiBuZXdFcnJvcihuYW1lKSB7XHJcblxyXG4gICAgZnVuY3Rpb24gQ3VzdG9tRXJyb3IobWVzc2FnZSwgcHJvcGVydGllcykge1xyXG5cclxuICAgICAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgQ3VzdG9tRXJyb3IpKVxyXG4gICAgICAgICAgICByZXR1cm4gbmV3IEN1c3RvbUVycm9yKG1lc3NhZ2UsIHByb3BlcnRpZXMpO1xyXG5cclxuICAgICAgICAvLyBFcnJvci5jYWxsKHRoaXMsIG1lc3NhZ2UpO1xyXG4gICAgICAgIC8vIF4ganVzdCByZXR1cm5zIGEgbmV3IGVycm9yIGluc3RhbmNlIGJlY2F1c2UgdGhlIGN0b3IgY2FuIGJlIGNhbGxlZCBhcyBhIGZ1bmN0aW9uXHJcblxyXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcIm1lc3NhZ2VcIiwgeyBnZXQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gbWVzc2FnZTsgfSB9KTtcclxuXHJcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgICAgICBpZiAoRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UpIC8vIG5vZGVcclxuICAgICAgICAgICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgQ3VzdG9tRXJyb3IpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwic3RhY2tcIiwgeyB2YWx1ZTogKG5ldyBFcnJvcigpKS5zdGFjayB8fCBcIlwiIH0pO1xyXG5cclxuICAgICAgICBpZiAocHJvcGVydGllcylcclxuICAgICAgICAgICAgbWVyZ2UodGhpcywgcHJvcGVydGllcyk7XHJcbiAgICB9XHJcblxyXG4gICAgKEN1c3RvbUVycm9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRXJyb3IucHJvdG90eXBlKSkuY29uc3RydWN0b3IgPSBDdXN0b21FcnJvcjtcclxuXHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQ3VzdG9tRXJyb3IucHJvdG90eXBlLCBcIm5hbWVcIiwgeyBnZXQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gbmFtZTsgfSB9KTtcclxuXHJcbiAgICBDdXN0b21FcnJvci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZygpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5uYW1lICsgXCI6IFwiICsgdGhpcy5tZXNzYWdlO1xyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gQ3VzdG9tRXJyb3I7XHJcbn1cclxuXHJcbnV0aWwubmV3RXJyb3IgPSBuZXdFcnJvcjtcclxuXHJcbi8qKlxyXG4gKiBDb25zdHJ1Y3RzIGEgbmV3IHByb3RvY29sIGVycm9yLlxyXG4gKiBAY2xhc3NkZXNjIEVycm9yIHN1YmNsYXNzIGluZGljYXRpbmcgYSBwcm90b2NvbCBzcGVjaWZjIGVycm9yLlxyXG4gKiBAbWVtYmVyb2YgdXRpbFxyXG4gKiBAZXh0ZW5kcyBFcnJvclxyXG4gKiBAdGVtcGxhdGUgVCBleHRlbmRzIE1lc3NhZ2U8VD5cclxuICogQGNvbnN0cnVjdG9yXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlIEVycm9yIG1lc3NhZ2VcclxuICogQHBhcmFtIHtPYmplY3QuPHN0cmluZywqPn0gW3Byb3BlcnRpZXNdIEFkZGl0aW9uYWwgcHJvcGVydGllc1xyXG4gKiBAZXhhbXBsZVxyXG4gKiB0cnkge1xyXG4gKiAgICAgTXlNZXNzYWdlLmRlY29kZShzb21lQnVmZmVyKTsgLy8gdGhyb3dzIGlmIHJlcXVpcmVkIGZpZWxkcyBhcmUgbWlzc2luZ1xyXG4gKiB9IGNhdGNoIChlKSB7XHJcbiAqICAgICBpZiAoZSBpbnN0YW5jZW9mIFByb3RvY29sRXJyb3IgJiYgZS5pbnN0YW5jZSlcclxuICogICAgICAgICBjb25zb2xlLmxvZyhcImRlY29kZWQgc28gZmFyOiBcIiArIEpTT04uc3RyaW5naWZ5KGUuaW5zdGFuY2UpKTtcclxuICogfVxyXG4gKi9cclxudXRpbC5Qcm90b2NvbEVycm9yID0gbmV3RXJyb3IoXCJQcm90b2NvbEVycm9yXCIpO1xyXG5cclxuLyoqXHJcbiAqIFNvIGZhciBkZWNvZGVkIG1lc3NhZ2UgaW5zdGFuY2UuXHJcbiAqIEBuYW1lIHV0aWwuUHJvdG9jb2xFcnJvciNpbnN0YW5jZVxyXG4gKiBAdHlwZSB7TWVzc2FnZTxUPn1cclxuICovXHJcblxyXG4vKipcclxuICogQSBPbmVPZiBnZXR0ZXIgYXMgcmV0dXJuZWQgYnkge0BsaW5rIHV0aWwub25lT2ZHZXR0ZXJ9LlxyXG4gKiBAdHlwZWRlZiBPbmVPZkdldHRlclxyXG4gKiBAdHlwZSB7ZnVuY3Rpb259XHJcbiAqIEByZXR1cm5zIHtzdHJpbmd8dW5kZWZpbmVkfSBTZXQgZmllbGQgbmFtZSwgaWYgYW55XHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIEJ1aWxkcyBhIGdldHRlciBmb3IgYSBvbmVvZidzIHByZXNlbnQgZmllbGQgbmFtZS5cclxuICogQHBhcmFtIHtzdHJpbmdbXX0gZmllbGROYW1lcyBGaWVsZCBuYW1lc1xyXG4gKiBAcmV0dXJucyB7T25lT2ZHZXR0ZXJ9IFVuYm91bmQgZ2V0dGVyXHJcbiAqL1xyXG51dGlsLm9uZU9mR2V0dGVyID0gZnVuY3Rpb24gZ2V0T25lT2YoZmllbGROYW1lcykge1xyXG4gICAgdmFyIGZpZWxkTWFwID0ge307XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGZpZWxkTmFtZXMubGVuZ3RoOyArK2kpXHJcbiAgICAgICAgZmllbGRNYXBbZmllbGROYW1lc1tpXV0gPSAxO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHJldHVybnMge3N0cmluZ3x1bmRlZmluZWR9IFNldCBmaWVsZCBuYW1lLCBpZiBhbnlcclxuICAgICAqIEB0aGlzIE9iamVjdFxyXG4gICAgICogQGlnbm9yZVxyXG4gICAgICovXHJcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgY29uc2lzdGVudC1yZXR1cm5cclxuICAgICAgICBmb3IgKHZhciBrZXlzID0gT2JqZWN0LmtleXModGhpcyksIGkgPSBrZXlzLmxlbmd0aCAtIDE7IGkgPiAtMTsgLS1pKVxyXG4gICAgICAgICAgICBpZiAoZmllbGRNYXBba2V5c1tpXV0gPT09IDEgJiYgdGhpc1trZXlzW2ldXSAhPT0gdW5kZWZpbmVkICYmIHRoaXNba2V5c1tpXV0gIT09IG51bGwpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4ga2V5c1tpXTtcclxuICAgIH07XHJcbn07XHJcblxyXG4vKipcclxuICogQSBPbmVPZiBzZXR0ZXIgYXMgcmV0dXJuZWQgYnkge0BsaW5rIHV0aWwub25lT2ZTZXR0ZXJ9LlxyXG4gKiBAdHlwZWRlZiBPbmVPZlNldHRlclxyXG4gKiBAdHlwZSB7ZnVuY3Rpb259XHJcbiAqIEBwYXJhbSB7c3RyaW5nfHVuZGVmaW5lZH0gdmFsdWUgRmllbGQgbmFtZVxyXG4gKiBAcmV0dXJucyB7dW5kZWZpbmVkfVxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBCdWlsZHMgYSBzZXR0ZXIgZm9yIGEgb25lb2YncyBwcmVzZW50IGZpZWxkIG5hbWUuXHJcbiAqIEBwYXJhbSB7c3RyaW5nW119IGZpZWxkTmFtZXMgRmllbGQgbmFtZXNcclxuICogQHJldHVybnMge09uZU9mU2V0dGVyfSBVbmJvdW5kIHNldHRlclxyXG4gKi9cclxudXRpbC5vbmVPZlNldHRlciA9IGZ1bmN0aW9uIHNldE9uZU9mKGZpZWxkTmFtZXMpIHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIEZpZWxkIG5hbWVcclxuICAgICAqIEByZXR1cm5zIHt1bmRlZmluZWR9XHJcbiAgICAgKiBAdGhpcyBPYmplY3RcclxuICAgICAqIEBpZ25vcmVcclxuICAgICAqL1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uKG5hbWUpIHtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGZpZWxkTmFtZXMubGVuZ3RoOyArK2kpXHJcbiAgICAgICAgICAgIGlmIChmaWVsZE5hbWVzW2ldICE9PSBuYW1lKVxyXG4gICAgICAgICAgICAgICAgZGVsZXRlIHRoaXNbZmllbGROYW1lc1tpXV07XHJcbiAgICB9O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIERlZmF1bHQgY29udmVyc2lvbiBvcHRpb25zIHVzZWQgZm9yIHtAbGluayBNZXNzYWdlI3RvSlNPTn0gaW1wbGVtZW50YXRpb25zLlxyXG4gKlxyXG4gKiBUaGVzZSBvcHRpb25zIGFyZSBjbG9zZSB0byBwcm90bzMncyBKU09OIG1hcHBpbmcgd2l0aCB0aGUgZXhjZXB0aW9uIHRoYXQgaW50ZXJuYWwgdHlwZXMgbGlrZSBBbnkgYXJlIGhhbmRsZWQganVzdCBsaWtlIG1lc3NhZ2VzLiBNb3JlIHByZWNpc2VseTpcclxuICpcclxuICogLSBMb25ncyBiZWNvbWUgc3RyaW5nc1xyXG4gKiAtIEVudW1zIGJlY29tZSBzdHJpbmcga2V5c1xyXG4gKiAtIEJ5dGVzIGJlY29tZSBiYXNlNjQgZW5jb2RlZCBzdHJpbmdzXHJcbiAqIC0gKFN1Yi0pTWVzc2FnZXMgYmVjb21lIHBsYWluIG9iamVjdHNcclxuICogLSBNYXBzIGJlY29tZSBwbGFpbiBvYmplY3RzIHdpdGggYWxsIHN0cmluZyBrZXlzXHJcbiAqIC0gUmVwZWF0ZWQgZmllbGRzIGJlY29tZSBhcnJheXNcclxuICogLSBOYU4gYW5kIEluZmluaXR5IGZvciBmbG9hdCBhbmQgZG91YmxlIGZpZWxkcyBiZWNvbWUgc3RyaW5nc1xyXG4gKlxyXG4gKiBAdHlwZSB7SUNvbnZlcnNpb25PcHRpb25zfVxyXG4gKiBAc2VlIGh0dHBzOi8vZGV2ZWxvcGVycy5nb29nbGUuY29tL3Byb3RvY29sLWJ1ZmZlcnMvZG9jcy9wcm90bzM/aGw9ZW4janNvblxyXG4gKi9cclxudXRpbC50b0pTT05PcHRpb25zID0ge1xyXG4gICAgbG9uZ3M6IFN0cmluZyxcclxuICAgIGVudW1zOiBTdHJpbmcsXHJcbiAgICBieXRlczogU3RyaW5nLFxyXG4gICAganNvbjogdHJ1ZVxyXG59O1xyXG5cclxuLy8gU2V0cyB1cCBidWZmZXIgdXRpbGl0eSBhY2NvcmRpbmcgdG8gdGhlIGVudmlyb25tZW50IChjYWxsZWQgaW4gaW5kZXgtbWluaW1hbClcclxudXRpbC5fY29uZmlndXJlID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgQnVmZmVyID0gdXRpbC5CdWZmZXI7XHJcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cclxuICAgIGlmICghQnVmZmVyKSB7XHJcbiAgICAgICAgdXRpbC5fQnVmZmVyX2Zyb20gPSB1dGlsLl9CdWZmZXJfYWxsb2NVbnNhZmUgPSBudWxsO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIC8vIGJlY2F1c2Ugbm9kZSA0LnggYnVmZmVycyBhcmUgaW5jb21wYXRpYmxlICYgaW1tdXRhYmxlXHJcbiAgICAvLyBzZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9kY29kZUlPL3Byb3RvYnVmLmpzL3B1bGwvNjY1XHJcbiAgICB1dGlsLl9CdWZmZXJfZnJvbSA9IEJ1ZmZlci5mcm9tICE9PSBVaW50OEFycmF5LmZyb20gJiYgQnVmZmVyLmZyb20gfHxcclxuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgICAgIGZ1bmN0aW9uIEJ1ZmZlcl9mcm9tKHZhbHVlLCBlbmNvZGluZykge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IEJ1ZmZlcih2YWx1ZSwgZW5jb2RpbmcpO1xyXG4gICAgICAgIH07XHJcbiAgICB1dGlsLl9CdWZmZXJfYWxsb2NVbnNhZmUgPSBCdWZmZXIuYWxsb2NVbnNhZmUgfHxcclxuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgICAgIGZ1bmN0aW9uIEJ1ZmZlcl9hbGxvY1Vuc2FmZShzaXplKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgQnVmZmVyKHNpemUpO1xyXG4gICAgICAgIH07XHJcbn07XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5tb2R1bGUuZXhwb3J0cyA9IHZlcmlmaWVyO1xyXG5cclxudmFyIEVudW0gICAgICA9IHJlcXVpcmUoXCIuL2VudW1cIiksXHJcbiAgICB1dGlsICAgICAgPSByZXF1aXJlKFwiLi91dGlsXCIpO1xyXG5cclxuZnVuY3Rpb24gaW52YWxpZChmaWVsZCwgZXhwZWN0ZWQpIHtcclxuICAgIHJldHVybiBmaWVsZC5uYW1lICsgXCI6IFwiICsgZXhwZWN0ZWQgKyAoZmllbGQucmVwZWF0ZWQgJiYgZXhwZWN0ZWQgIT09IFwiYXJyYXlcIiA/IFwiW11cIiA6IGZpZWxkLm1hcCAmJiBleHBlY3RlZCAhPT0gXCJvYmplY3RcIiA/IFwie2s6XCIrZmllbGQua2V5VHlwZStcIn1cIiA6IFwiXCIpICsgXCIgZXhwZWN0ZWRcIjtcclxufVxyXG5cclxuLyoqXHJcbiAqIEdlbmVyYXRlcyBhIHBhcnRpYWwgdmFsdWUgdmVyaWZpZXIuXHJcbiAqIEBwYXJhbSB7Q29kZWdlbn0gZ2VuIENvZGVnZW4gaW5zdGFuY2VcclxuICogQHBhcmFtIHtGaWVsZH0gZmllbGQgUmVmbGVjdGVkIGZpZWxkXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBmaWVsZEluZGV4IEZpZWxkIGluZGV4XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSByZWYgVmFyaWFibGUgcmVmZXJlbmNlXHJcbiAqIEByZXR1cm5zIHtDb2RlZ2VufSBDb2RlZ2VuIGluc3RhbmNlXHJcbiAqIEBpZ25vcmVcclxuICovXHJcbmZ1bmN0aW9uIGdlblZlcmlmeVZhbHVlKGdlbiwgZmllbGQsIGZpZWxkSW5kZXgsIHJlZikge1xyXG4gICAgLyogZXNsaW50LWRpc2FibGUgbm8tdW5leHBlY3RlZC1tdWx0aWxpbmUgKi9cclxuICAgIGlmIChmaWVsZC5yZXNvbHZlZFR5cGUpIHtcclxuICAgICAgICBpZiAoZmllbGQucmVzb2x2ZWRUeXBlIGluc3RhbmNlb2YgRW51bSkgeyBnZW5cclxuICAgICAgICAgICAgKFwic3dpdGNoKCVzKXtcIiwgcmVmKVxyXG4gICAgICAgICAgICAgICAgKFwiZGVmYXVsdDpcIilcclxuICAgICAgICAgICAgICAgICAgICAoXCJyZXR1cm4lalwiLCBpbnZhbGlkKGZpZWxkLCBcImVudW0gdmFsdWVcIikpO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBrZXlzID0gT2JqZWN0LmtleXMoZmllbGQucmVzb2x2ZWRUeXBlLnZhbHVlcyksIGogPSAwOyBqIDwga2V5cy5sZW5ndGg7ICsraikgZ2VuXHJcbiAgICAgICAgICAgICAgICAoXCJjYXNlICVpOlwiLCBmaWVsZC5yZXNvbHZlZFR5cGUudmFsdWVzW2tleXNbal1dKTtcclxuICAgICAgICAgICAgZ2VuXHJcbiAgICAgICAgICAgICAgICAgICAgKFwiYnJlYWtcIilcclxuICAgICAgICAgICAgKFwifVwiKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBnZW5cclxuICAgICAgICAgICAgKFwie1wiKVxyXG4gICAgICAgICAgICAgICAgKFwidmFyIGU9dHlwZXNbJWldLnZlcmlmeSglcyk7XCIsIGZpZWxkSW5kZXgsIHJlZilcclxuICAgICAgICAgICAgICAgIChcImlmKGUpXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgKFwicmV0dXJuJWorZVwiLCBmaWVsZC5uYW1lICsgXCIuXCIpXHJcbiAgICAgICAgICAgIChcIn1cIik7XHJcbiAgICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBzd2l0Y2ggKGZpZWxkLnR5cGUpIHtcclxuICAgICAgICAgICAgY2FzZSBcImludDMyXCI6XHJcbiAgICAgICAgICAgIGNhc2UgXCJ1aW50MzJcIjpcclxuICAgICAgICAgICAgY2FzZSBcInNpbnQzMlwiOlxyXG4gICAgICAgICAgICBjYXNlIFwiZml4ZWQzMlwiOlxyXG4gICAgICAgICAgICBjYXNlIFwic2ZpeGVkMzJcIjogZ2VuXHJcbiAgICAgICAgICAgICAgICAoXCJpZighdXRpbC5pc0ludGVnZXIoJXMpKVwiLCByZWYpXHJcbiAgICAgICAgICAgICAgICAgICAgKFwicmV0dXJuJWpcIiwgaW52YWxpZChmaWVsZCwgXCJpbnRlZ2VyXCIpKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFwiaW50NjRcIjpcclxuICAgICAgICAgICAgY2FzZSBcInVpbnQ2NFwiOlxyXG4gICAgICAgICAgICBjYXNlIFwic2ludDY0XCI6XHJcbiAgICAgICAgICAgIGNhc2UgXCJmaXhlZDY0XCI6XHJcbiAgICAgICAgICAgIGNhc2UgXCJzZml4ZWQ2NFwiOiBnZW5cclxuICAgICAgICAgICAgICAgIChcImlmKCF1dGlsLmlzSW50ZWdlciglcykmJiEoJXMmJnV0aWwuaXNJbnRlZ2VyKCVzLmxvdykmJnV0aWwuaXNJbnRlZ2VyKCVzLmhpZ2gpKSlcIiwgcmVmLCByZWYsIHJlZiwgcmVmKVxyXG4gICAgICAgICAgICAgICAgICAgIChcInJldHVybiVqXCIsIGludmFsaWQoZmllbGQsIFwiaW50ZWdlcnxMb25nXCIpKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFwiZmxvYXRcIjpcclxuICAgICAgICAgICAgY2FzZSBcImRvdWJsZVwiOiBnZW5cclxuICAgICAgICAgICAgICAgIChcImlmKHR5cGVvZiAlcyE9PVxcXCJudW1iZXJcXFwiKVwiLCByZWYpXHJcbiAgICAgICAgICAgICAgICAgICAgKFwicmV0dXJuJWpcIiwgaW52YWxpZChmaWVsZCwgXCJudW1iZXJcIikpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgXCJib29sXCI6IGdlblxyXG4gICAgICAgICAgICAgICAgKFwiaWYodHlwZW9mICVzIT09XFxcImJvb2xlYW5cXFwiKVwiLCByZWYpXHJcbiAgICAgICAgICAgICAgICAgICAgKFwicmV0dXJuJWpcIiwgaW52YWxpZChmaWVsZCwgXCJib29sZWFuXCIpKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFwic3RyaW5nXCI6IGdlblxyXG4gICAgICAgICAgICAgICAgKFwiaWYoIXV0aWwuaXNTdHJpbmcoJXMpKVwiLCByZWYpXHJcbiAgICAgICAgICAgICAgICAgICAgKFwicmV0dXJuJWpcIiwgaW52YWxpZChmaWVsZCwgXCJzdHJpbmdcIikpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgXCJieXRlc1wiOiBnZW5cclxuICAgICAgICAgICAgICAgIChcImlmKCEoJXMmJnR5cGVvZiAlcy5sZW5ndGg9PT1cXFwibnVtYmVyXFxcInx8dXRpbC5pc1N0cmluZyglcykpKVwiLCByZWYsIHJlZiwgcmVmKVxyXG4gICAgICAgICAgICAgICAgICAgIChcInJldHVybiVqXCIsIGludmFsaWQoZmllbGQsIFwiYnVmZmVyXCIpKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBnZW47XHJcbiAgICAvKiBlc2xpbnQtZW5hYmxlIG5vLXVuZXhwZWN0ZWQtbXVsdGlsaW5lICovXHJcbn1cclxuXHJcbi8qKlxyXG4gKiBHZW5lcmF0ZXMgYSBwYXJ0aWFsIGtleSB2ZXJpZmllci5cclxuICogQHBhcmFtIHtDb2RlZ2VufSBnZW4gQ29kZWdlbiBpbnN0YW5jZVxyXG4gKiBAcGFyYW0ge0ZpZWxkfSBmaWVsZCBSZWZsZWN0ZWQgZmllbGRcclxuICogQHBhcmFtIHtzdHJpbmd9IHJlZiBWYXJpYWJsZSByZWZlcmVuY2VcclxuICogQHJldHVybnMge0NvZGVnZW59IENvZGVnZW4gaW5zdGFuY2VcclxuICogQGlnbm9yZVxyXG4gKi9cclxuZnVuY3Rpb24gZ2VuVmVyaWZ5S2V5KGdlbiwgZmllbGQsIHJlZikge1xyXG4gICAgLyogZXNsaW50LWRpc2FibGUgbm8tdW5leHBlY3RlZC1tdWx0aWxpbmUgKi9cclxuICAgIHN3aXRjaCAoZmllbGQua2V5VHlwZSkge1xyXG4gICAgICAgIGNhc2UgXCJpbnQzMlwiOlxyXG4gICAgICAgIGNhc2UgXCJ1aW50MzJcIjpcclxuICAgICAgICBjYXNlIFwic2ludDMyXCI6XHJcbiAgICAgICAgY2FzZSBcImZpeGVkMzJcIjpcclxuICAgICAgICBjYXNlIFwic2ZpeGVkMzJcIjogZ2VuXHJcbiAgICAgICAgICAgIChcImlmKCF1dGlsLmtleTMyUmUudGVzdCglcykpXCIsIHJlZilcclxuICAgICAgICAgICAgICAgIChcInJldHVybiVqXCIsIGludmFsaWQoZmllbGQsIFwiaW50ZWdlciBrZXlcIikpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIFwiaW50NjRcIjpcclxuICAgICAgICBjYXNlIFwidWludDY0XCI6XHJcbiAgICAgICAgY2FzZSBcInNpbnQ2NFwiOlxyXG4gICAgICAgIGNhc2UgXCJmaXhlZDY0XCI6XHJcbiAgICAgICAgY2FzZSBcInNmaXhlZDY0XCI6IGdlblxyXG4gICAgICAgICAgICAoXCJpZighdXRpbC5rZXk2NFJlLnRlc3QoJXMpKVwiLCByZWYpIC8vIHNlZSBjb21tZW50IGFib3ZlOiB4IGlzIG9rLCBkIGlzIG5vdFxyXG4gICAgICAgICAgICAgICAgKFwicmV0dXJuJWpcIiwgaW52YWxpZChmaWVsZCwgXCJpbnRlZ2VyfExvbmcga2V5XCIpKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBcImJvb2xcIjogZ2VuXHJcbiAgICAgICAgICAgIChcImlmKCF1dGlsLmtleTJSZS50ZXN0KCVzKSlcIiwgcmVmKVxyXG4gICAgICAgICAgICAgICAgKFwicmV0dXJuJWpcIiwgaW52YWxpZChmaWVsZCwgXCJib29sZWFuIGtleVwiKSk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGdlbjtcclxuICAgIC8qIGVzbGludC1lbmFibGUgbm8tdW5leHBlY3RlZC1tdWx0aWxpbmUgKi9cclxufVxyXG5cclxuLyoqXHJcbiAqIEdlbmVyYXRlcyBhIHZlcmlmaWVyIHNwZWNpZmljIHRvIHRoZSBzcGVjaWZpZWQgbWVzc2FnZSB0eXBlLlxyXG4gKiBAcGFyYW0ge1R5cGV9IG10eXBlIE1lc3NhZ2UgdHlwZVxyXG4gKiBAcmV0dXJucyB7Q29kZWdlbn0gQ29kZWdlbiBpbnN0YW5jZVxyXG4gKi9cclxuZnVuY3Rpb24gdmVyaWZpZXIobXR5cGUpIHtcclxuICAgIC8qIGVzbGludC1kaXNhYmxlIG5vLXVuZXhwZWN0ZWQtbXVsdGlsaW5lICovXHJcblxyXG4gICAgdmFyIGdlbiA9IHV0aWwuY29kZWdlbihbXCJtXCJdLCBtdHlwZS5uYW1lICsgXCIkdmVyaWZ5XCIpXHJcbiAgICAoXCJpZih0eXBlb2YgbSE9PVxcXCJvYmplY3RcXFwifHxtPT09bnVsbClcIilcclxuICAgICAgICAoXCJyZXR1cm4lalwiLCBcIm9iamVjdCBleHBlY3RlZFwiKTtcclxuICAgIHZhciBvbmVvZnMgPSBtdHlwZS5vbmVvZnNBcnJheSxcclxuICAgICAgICBzZWVuRmlyc3RGaWVsZCA9IHt9O1xyXG4gICAgaWYgKG9uZW9mcy5sZW5ndGgpIGdlblxyXG4gICAgKFwidmFyIHA9e31cIik7XHJcblxyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCAvKiBpbml0aWFsaXplcyAqLyBtdHlwZS5maWVsZHNBcnJheS5sZW5ndGg7ICsraSkge1xyXG4gICAgICAgIHZhciBmaWVsZCA9IG10eXBlLl9maWVsZHNBcnJheVtpXS5yZXNvbHZlKCksXHJcbiAgICAgICAgICAgIHJlZiAgID0gXCJtXCIgKyB1dGlsLnNhZmVQcm9wKGZpZWxkLm5hbWUpO1xyXG5cclxuICAgICAgICBpZiAoZmllbGQub3B0aW9uYWwpIGdlblxyXG4gICAgICAgIChcImlmKCVzIT1udWxsJiZtLmhhc093blByb3BlcnR5KCVqKSl7XCIsIHJlZiwgZmllbGQubmFtZSk7IC8vICE9PSB1bmRlZmluZWQgJiYgIT09IG51bGxcclxuXHJcbiAgICAgICAgLy8gbWFwIGZpZWxkc1xyXG4gICAgICAgIGlmIChmaWVsZC5tYXApIHsgZ2VuXHJcbiAgICAgICAgICAgIChcImlmKCF1dGlsLmlzT2JqZWN0KCVzKSlcIiwgcmVmKVxyXG4gICAgICAgICAgICAgICAgKFwicmV0dXJuJWpcIiwgaW52YWxpZChmaWVsZCwgXCJvYmplY3RcIikpXHJcbiAgICAgICAgICAgIChcInZhciBrPU9iamVjdC5rZXlzKCVzKVwiLCByZWYpXHJcbiAgICAgICAgICAgIChcImZvcih2YXIgaT0wO2k8ay5sZW5ndGg7KytpKXtcIik7XHJcbiAgICAgICAgICAgICAgICBnZW5WZXJpZnlLZXkoZ2VuLCBmaWVsZCwgXCJrW2ldXCIpO1xyXG4gICAgICAgICAgICAgICAgZ2VuVmVyaWZ5VmFsdWUoZ2VuLCBmaWVsZCwgaSwgcmVmICsgXCJba1tpXV1cIilcclxuICAgICAgICAgICAgKFwifVwiKTtcclxuXHJcbiAgICAgICAgLy8gcmVwZWF0ZWQgZmllbGRzXHJcbiAgICAgICAgfSBlbHNlIGlmIChmaWVsZC5yZXBlYXRlZCkgeyBnZW5cclxuICAgICAgICAgICAgKFwiaWYoIUFycmF5LmlzQXJyYXkoJXMpKVwiLCByZWYpXHJcbiAgICAgICAgICAgICAgICAoXCJyZXR1cm4lalwiLCBpbnZhbGlkKGZpZWxkLCBcImFycmF5XCIpKVxyXG4gICAgICAgICAgICAoXCJmb3IodmFyIGk9MDtpPCVzLmxlbmd0aDsrK2kpe1wiLCByZWYpO1xyXG4gICAgICAgICAgICAgICAgZ2VuVmVyaWZ5VmFsdWUoZ2VuLCBmaWVsZCwgaSwgcmVmICsgXCJbaV1cIilcclxuICAgICAgICAgICAgKFwifVwiKTtcclxuXHJcbiAgICAgICAgLy8gcmVxdWlyZWQgb3IgcHJlc2VudCBmaWVsZHNcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBpZiAoZmllbGQucGFydE9mKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgb25lb2ZQcm9wID0gdXRpbC5zYWZlUHJvcChmaWVsZC5wYXJ0T2YubmFtZSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2VlbkZpcnN0RmllbGRbZmllbGQucGFydE9mLm5hbWVdID09PSAxKSBnZW5cclxuICAgICAgICAgICAgKFwiaWYocCVzPT09MSlcIiwgb25lb2ZQcm9wKVxyXG4gICAgICAgICAgICAgICAgKFwicmV0dXJuJWpcIiwgZmllbGQucGFydE9mLm5hbWUgKyBcIjogbXVsdGlwbGUgdmFsdWVzXCIpO1xyXG4gICAgICAgICAgICAgICAgc2VlbkZpcnN0RmllbGRbZmllbGQucGFydE9mLm5hbWVdID0gMTtcclxuICAgICAgICAgICAgICAgIGdlblxyXG4gICAgICAgICAgICAoXCJwJXM9MVwiLCBvbmVvZlByb3ApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGdlblZlcmlmeVZhbHVlKGdlbiwgZmllbGQsIGksIHJlZik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChmaWVsZC5vcHRpb25hbCkgZ2VuXHJcbiAgICAgICAgKFwifVwiKTtcclxuICAgIH1cclxuICAgIHJldHVybiBnZW5cclxuICAgIChcInJldHVybiBudWxsXCIpO1xyXG4gICAgLyogZXNsaW50LWVuYWJsZSBuby11bmV4cGVjdGVkLW11bHRpbGluZSAqL1xyXG59IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4vKipcclxuICogV3JhcHBlcnMgZm9yIGNvbW1vbiB0eXBlcy5cclxuICogQHR5cGUge09iamVjdC48c3RyaW5nLElXcmFwcGVyPn1cclxuICogQGNvbnN0XHJcbiAqL1xyXG52YXIgd3JhcHBlcnMgPSBleHBvcnRzO1xyXG5cclxudmFyIE1lc3NhZ2UgPSByZXF1aXJlKFwiLi9tZXNzYWdlXCIpO1xyXG5cclxuLyoqXHJcbiAqIEZyb20gb2JqZWN0IGNvbnZlcnRlciBwYXJ0IG9mIGFuIHtAbGluayBJV3JhcHBlcn0uXHJcbiAqIEB0eXBlZGVmIFdyYXBwZXJGcm9tT2JqZWN0Q29udmVydGVyXHJcbiAqIEB0eXBlIHtmdW5jdGlvbn1cclxuICogQHBhcmFtIHtPYmplY3QuPHN0cmluZywqPn0gb2JqZWN0IFBsYWluIG9iamVjdFxyXG4gKiBAcmV0dXJucyB7TWVzc2FnZTx7fT59IE1lc3NhZ2UgaW5zdGFuY2VcclxuICogQHRoaXMgVHlwZVxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBUbyBvYmplY3QgY29udmVydGVyIHBhcnQgb2YgYW4ge0BsaW5rIElXcmFwcGVyfS5cclxuICogQHR5cGVkZWYgV3JhcHBlclRvT2JqZWN0Q29udmVydGVyXHJcbiAqIEB0eXBlIHtmdW5jdGlvbn1cclxuICogQHBhcmFtIHtNZXNzYWdlPHt9Pn0gbWVzc2FnZSBNZXNzYWdlIGluc3RhbmNlXHJcbiAqIEBwYXJhbSB7SUNvbnZlcnNpb25PcHRpb25zfSBbb3B0aW9uc10gQ29udmVyc2lvbiBvcHRpb25zXHJcbiAqIEByZXR1cm5zIHtPYmplY3QuPHN0cmluZywqPn0gUGxhaW4gb2JqZWN0XHJcbiAqIEB0aGlzIFR5cGVcclxuICovXHJcblxyXG4vKipcclxuICogQ29tbW9uIHR5cGUgd3JhcHBlciBwYXJ0IG9mIHtAbGluayB3cmFwcGVyc30uXHJcbiAqIEBpbnRlcmZhY2UgSVdyYXBwZXJcclxuICogQHByb3BlcnR5IHtXcmFwcGVyRnJvbU9iamVjdENvbnZlcnRlcn0gW2Zyb21PYmplY3RdIEZyb20gb2JqZWN0IGNvbnZlcnRlclxyXG4gKiBAcHJvcGVydHkge1dyYXBwZXJUb09iamVjdENvbnZlcnRlcn0gW3RvT2JqZWN0XSBUbyBvYmplY3QgY29udmVydGVyXHJcbiAqL1xyXG5cclxuLy8gQ3VzdG9tIHdyYXBwZXIgZm9yIEFueVxyXG53cmFwcGVyc1tcIi5nb29nbGUucHJvdG9idWYuQW55XCJdID0ge1xyXG5cclxuICAgIGZyb21PYmplY3Q6IGZ1bmN0aW9uKG9iamVjdCkge1xyXG5cclxuICAgICAgICAvLyB1bndyYXAgdmFsdWUgdHlwZSBpZiBtYXBwZWRcclxuICAgICAgICBpZiAob2JqZWN0ICYmIG9iamVjdFtcIkB0eXBlXCJdKSB7XHJcbiAgICAgICAgICAgIHZhciB0eXBlID0gdGhpcy5sb29rdXAob2JqZWN0W1wiQHR5cGVcIl0pO1xyXG4gICAgICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgZWxzZSAqL1xyXG4gICAgICAgICAgICBpZiAodHlwZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gdHlwZV91cmwgZG9lcyBub3QgYWNjZXB0IGxlYWRpbmcgXCIuXCJcclxuICAgICAgICAgICAgICAgIHZhciB0eXBlX3VybCA9IG9iamVjdFtcIkB0eXBlXCJdLmNoYXJBdCgwKSA9PT0gXCIuXCIgP1xyXG4gICAgICAgICAgICAgICAgICAgIG9iamVjdFtcIkB0eXBlXCJdLnN1YnN0cigxKSA6IG9iamVjdFtcIkB0eXBlXCJdO1xyXG4gICAgICAgICAgICAgICAgLy8gdHlwZV91cmwgcHJlZml4IGlzIG9wdGlvbmFsLCBidXQgcGF0aCBzZXBlcmF0b3IgaXMgcmVxdWlyZWRcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZV91cmw6IFwiL1wiICsgdHlwZV91cmwsXHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHR5cGUuZW5jb2RlKHR5cGUuZnJvbU9iamVjdChvYmplY3QpKS5maW5pc2goKVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLmZyb21PYmplY3Qob2JqZWN0KTtcclxuICAgIH0sXHJcblxyXG4gICAgdG9PYmplY3Q6IGZ1bmN0aW9uKG1lc3NhZ2UsIG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgLy8gZGVjb2RlIHZhbHVlIGlmIHJlcXVlc3RlZCBhbmQgdW5tYXBwZWRcclxuICAgICAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLmpzb24gJiYgbWVzc2FnZS50eXBlX3VybCAmJiBtZXNzYWdlLnZhbHVlKSB7XHJcbiAgICAgICAgICAgIC8vIE9ubHkgdXNlIGZ1bGx5IHF1YWxpZmllZCB0eXBlIG5hbWUgYWZ0ZXIgdGhlIGxhc3QgJy8nXHJcbiAgICAgICAgICAgIHZhciBuYW1lID0gbWVzc2FnZS50eXBlX3VybC5zdWJzdHJpbmcobWVzc2FnZS50eXBlX3VybC5sYXN0SW5kZXhPZihcIi9cIikgKyAxKTtcclxuICAgICAgICAgICAgdmFyIHR5cGUgPSB0aGlzLmxvb2t1cChuYW1lKTtcclxuICAgICAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIGVsc2UgKi9cclxuICAgICAgICAgICAgaWYgKHR5cGUpXHJcbiAgICAgICAgICAgICAgICBtZXNzYWdlID0gdHlwZS5kZWNvZGUobWVzc2FnZS52YWx1ZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyB3cmFwIHZhbHVlIGlmIHVubWFwcGVkXHJcbiAgICAgICAgaWYgKCEobWVzc2FnZSBpbnN0YW5jZW9mIHRoaXMuY3RvcikgJiYgbWVzc2FnZSBpbnN0YW5jZW9mIE1lc3NhZ2UpIHtcclxuICAgICAgICAgICAgdmFyIG9iamVjdCA9IG1lc3NhZ2UuJHR5cGUudG9PYmplY3QobWVzc2FnZSwgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgIG9iamVjdFtcIkB0eXBlXCJdID0gbWVzc2FnZS4kdHlwZS5mdWxsTmFtZTtcclxuICAgICAgICAgICAgcmV0dXJuIG9iamVjdDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLnRvT2JqZWN0KG1lc3NhZ2UsIG9wdGlvbnMpO1xyXG4gICAgfVxyXG59O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxubW9kdWxlLmV4cG9ydHMgPSBXcml0ZXI7XHJcblxyXG52YXIgdXRpbCAgICAgID0gcmVxdWlyZShcIi4vdXRpbC9taW5pbWFsXCIpO1xyXG5cclxudmFyIEJ1ZmZlcldyaXRlcjsgLy8gY3ljbGljXHJcblxyXG52YXIgTG9uZ0JpdHMgID0gdXRpbC5Mb25nQml0cyxcclxuICAgIGJhc2U2NCAgICA9IHV0aWwuYmFzZTY0LFxyXG4gICAgdXRmOCAgICAgID0gdXRpbC51dGY4O1xyXG5cclxuLyoqXHJcbiAqIENvbnN0cnVjdHMgYSBuZXcgd3JpdGVyIG9wZXJhdGlvbiBpbnN0YW5jZS5cclxuICogQGNsYXNzZGVzYyBTY2hlZHVsZWQgd3JpdGVyIG9wZXJhdGlvbi5cclxuICogQGNvbnN0cnVjdG9yXHJcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oKiwgVWludDhBcnJheSwgbnVtYmVyKX0gZm4gRnVuY3Rpb24gdG8gY2FsbFxyXG4gKiBAcGFyYW0ge251bWJlcn0gbGVuIFZhbHVlIGJ5dGUgbGVuZ3RoXHJcbiAqIEBwYXJhbSB7Kn0gdmFsIFZhbHVlIHRvIHdyaXRlXHJcbiAqIEBpZ25vcmVcclxuICovXHJcbmZ1bmN0aW9uIE9wKGZuLCBsZW4sIHZhbCkge1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRnVuY3Rpb24gdG8gY2FsbC5cclxuICAgICAqIEB0eXBlIHtmdW5jdGlvbihVaW50OEFycmF5LCBudW1iZXIsICopfVxyXG4gICAgICovXHJcbiAgICB0aGlzLmZuID0gZm47XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBWYWx1ZSBieXRlIGxlbmd0aC5cclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIHRoaXMubGVuID0gbGVuO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogTmV4dCBvcGVyYXRpb24uXHJcbiAgICAgKiBAdHlwZSB7V3JpdGVyLk9wfHVuZGVmaW5lZH1cclxuICAgICAqL1xyXG4gICAgdGhpcy5uZXh0ID0gdW5kZWZpbmVkO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVmFsdWUgdG8gd3JpdGUuXHJcbiAgICAgKiBAdHlwZSB7Kn1cclxuICAgICAqL1xyXG4gICAgdGhpcy52YWwgPSB2YWw7IC8vIHR5cGUgdmFyaWVzXHJcbn1cclxuXHJcbi8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbmZ1bmN0aW9uIG5vb3AoKSB7fSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWVtcHR5LWZ1bmN0aW9uXHJcblxyXG4vKipcclxuICogQ29uc3RydWN0cyBhIG5ldyB3cml0ZXIgc3RhdGUgaW5zdGFuY2UuXHJcbiAqIEBjbGFzc2Rlc2MgQ29waWVkIHdyaXRlciBzdGF0ZS5cclxuICogQG1lbWJlcm9mIFdyaXRlclxyXG4gKiBAY29uc3RydWN0b3JcclxuICogQHBhcmFtIHtXcml0ZXJ9IHdyaXRlciBXcml0ZXIgdG8gY29weSBzdGF0ZSBmcm9tXHJcbiAqIEBpZ25vcmVcclxuICovXHJcbmZ1bmN0aW9uIFN0YXRlKHdyaXRlcikge1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ3VycmVudCBoZWFkLlxyXG4gICAgICogQHR5cGUge1dyaXRlci5PcH1cclxuICAgICAqL1xyXG4gICAgdGhpcy5oZWFkID0gd3JpdGVyLmhlYWQ7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDdXJyZW50IHRhaWwuXHJcbiAgICAgKiBAdHlwZSB7V3JpdGVyLk9wfVxyXG4gICAgICovXHJcbiAgICB0aGlzLnRhaWwgPSB3cml0ZXIudGFpbDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEN1cnJlbnQgYnVmZmVyIGxlbmd0aC5cclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIHRoaXMubGVuID0gd3JpdGVyLmxlbjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIE5leHQgc3RhdGUuXHJcbiAgICAgKiBAdHlwZSB7U3RhdGV8bnVsbH1cclxuICAgICAqL1xyXG4gICAgdGhpcy5uZXh0ID0gd3JpdGVyLnN0YXRlcztcclxufVxyXG5cclxuLyoqXHJcbiAqIENvbnN0cnVjdHMgYSBuZXcgd3JpdGVyIGluc3RhbmNlLlxyXG4gKiBAY2xhc3NkZXNjIFdpcmUgZm9ybWF0IHdyaXRlciB1c2luZyBgVWludDhBcnJheWAgaWYgYXZhaWxhYmxlLCBvdGhlcndpc2UgYEFycmF5YC5cclxuICogQGNvbnN0cnVjdG9yXHJcbiAqL1xyXG5mdW5jdGlvbiBXcml0ZXIoKSB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDdXJyZW50IGxlbmd0aC5cclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIHRoaXMubGVuID0gMDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIE9wZXJhdGlvbnMgaGVhZC5cclxuICAgICAqIEB0eXBlIHtPYmplY3R9XHJcbiAgICAgKi9cclxuICAgIHRoaXMuaGVhZCA9IG5ldyBPcChub29wLCAwLCAwKTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIE9wZXJhdGlvbnMgdGFpbFxyXG4gICAgICogQHR5cGUge09iamVjdH1cclxuICAgICAqL1xyXG4gICAgdGhpcy50YWlsID0gdGhpcy5oZWFkO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogTGlua2VkIGZvcmtlZCBzdGF0ZXMuXHJcbiAgICAgKiBAdHlwZSB7T2JqZWN0fG51bGx9XHJcbiAgICAgKi9cclxuICAgIHRoaXMuc3RhdGVzID0gbnVsbDtcclxuXHJcbiAgICAvLyBXaGVuIGEgdmFsdWUgaXMgd3JpdHRlbiwgdGhlIHdyaXRlciBjYWxjdWxhdGVzIGl0cyBieXRlIGxlbmd0aCBhbmQgcHV0cyBpdCBpbnRvIGEgbGlua2VkXHJcbiAgICAvLyBsaXN0IG9mIG9wZXJhdGlvbnMgdG8gcGVyZm9ybSB3aGVuIGZpbmlzaCgpIGlzIGNhbGxlZC4gVGhpcyBib3RoIGFsbG93cyB1cyB0byBhbGxvY2F0ZVxyXG4gICAgLy8gYnVmZmVycyBvZiB0aGUgZXhhY3QgcmVxdWlyZWQgc2l6ZSBhbmQgcmVkdWNlcyB0aGUgYW1vdW50IG9mIHdvcmsgd2UgaGF2ZSB0byBkbyBjb21wYXJlZFxyXG4gICAgLy8gdG8gZmlyc3QgY2FsY3VsYXRpbmcgb3ZlciBvYmplY3RzIGFuZCB0aGVuIGVuY29kaW5nIG92ZXIgb2JqZWN0cy4gSW4gb3VyIGNhc2UsIHRoZSBlbmNvZGluZ1xyXG4gICAgLy8gcGFydCBpcyBqdXN0IGEgbGlua2VkIGxpc3Qgd2FsayBjYWxsaW5nIG9wZXJhdGlvbnMgd2l0aCBhbHJlYWR5IHByZXBhcmVkIHZhbHVlcy5cclxufVxyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBuZXcgd3JpdGVyLlxyXG4gKiBAZnVuY3Rpb25cclxuICogQHJldHVybnMge0J1ZmZlcldyaXRlcnxXcml0ZXJ9IEEge0BsaW5rIEJ1ZmZlcldyaXRlcn0gd2hlbiBCdWZmZXJzIGFyZSBzdXBwb3J0ZWQsIG90aGVyd2lzZSBhIHtAbGluayBXcml0ZXJ9XHJcbiAqL1xyXG5Xcml0ZXIuY3JlYXRlID0gdXRpbC5CdWZmZXJcclxuICAgID8gZnVuY3Rpb24gY3JlYXRlX2J1ZmZlcl9zZXR1cCgpIHtcclxuICAgICAgICByZXR1cm4gKFdyaXRlci5jcmVhdGUgPSBmdW5jdGlvbiBjcmVhdGVfYnVmZmVyKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IEJ1ZmZlcldyaXRlcigpO1xyXG4gICAgICAgIH0pKCk7XHJcbiAgICB9XHJcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgOiBmdW5jdGlvbiBjcmVhdGVfYXJyYXkoKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBXcml0ZXIoKTtcclxuICAgIH07XHJcblxyXG4vKipcclxuICogQWxsb2NhdGVzIGEgYnVmZmVyIG9mIHRoZSBzcGVjaWZpZWQgc2l6ZS5cclxuICogQHBhcmFtIHtudW1iZXJ9IHNpemUgQnVmZmVyIHNpemVcclxuICogQHJldHVybnMge1VpbnQ4QXJyYXl9IEJ1ZmZlclxyXG4gKi9cclxuV3JpdGVyLmFsbG9jID0gZnVuY3Rpb24gYWxsb2Moc2l6ZSkge1xyXG4gICAgcmV0dXJuIG5ldyB1dGlsLkFycmF5KHNpemUpO1xyXG59O1xyXG5cclxuLy8gVXNlIFVpbnQ4QXJyYXkgYnVmZmVyIHBvb2wgaW4gdGhlIGJyb3dzZXIsIGp1c3QgbGlrZSBub2RlIGRvZXMgd2l0aCBidWZmZXJzXHJcbi8qIGlzdGFuYnVsIGlnbm9yZSBlbHNlICovXHJcbmlmICh1dGlsLkFycmF5ICE9PSBBcnJheSlcclxuICAgIFdyaXRlci5hbGxvYyA9IHV0aWwucG9vbChXcml0ZXIuYWxsb2MsIHV0aWwuQXJyYXkucHJvdG90eXBlLnN1YmFycmF5KTtcclxuXHJcbi8qKlxyXG4gKiBQdXNoZXMgYSBuZXcgb3BlcmF0aW9uIHRvIHRoZSBxdWV1ZS5cclxuICogQHBhcmFtIHtmdW5jdGlvbihVaW50OEFycmF5LCBudW1iZXIsICopfSBmbiBGdW5jdGlvbiB0byBjYWxsXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBsZW4gVmFsdWUgYnl0ZSBsZW5ndGhcclxuICogQHBhcmFtIHtudW1iZXJ9IHZhbCBWYWx1ZSB0byB3cml0ZVxyXG4gKiBAcmV0dXJucyB7V3JpdGVyfSBgdGhpc2BcclxuICogQHByaXZhdGVcclxuICovXHJcbldyaXRlci5wcm90b3R5cGUuX3B1c2ggPSBmdW5jdGlvbiBwdXNoKGZuLCBsZW4sIHZhbCkge1xyXG4gICAgdGhpcy50YWlsID0gdGhpcy50YWlsLm5leHQgPSBuZXcgT3AoZm4sIGxlbiwgdmFsKTtcclxuICAgIHRoaXMubGVuICs9IGxlbjtcclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gd3JpdGVCeXRlKHZhbCwgYnVmLCBwb3MpIHtcclxuICAgIGJ1Zltwb3NdID0gdmFsICYgMjU1O1xyXG59XHJcblxyXG5mdW5jdGlvbiB3cml0ZVZhcmludDMyKHZhbCwgYnVmLCBwb3MpIHtcclxuICAgIHdoaWxlICh2YWwgPiAxMjcpIHtcclxuICAgICAgICBidWZbcG9zKytdID0gdmFsICYgMTI3IHwgMTI4O1xyXG4gICAgICAgIHZhbCA+Pj49IDc7XHJcbiAgICB9XHJcbiAgICBidWZbcG9zXSA9IHZhbDtcclxufVxyXG5cclxuLyoqXHJcbiAqIENvbnN0cnVjdHMgYSBuZXcgdmFyaW50IHdyaXRlciBvcGVyYXRpb24gaW5zdGFuY2UuXHJcbiAqIEBjbGFzc2Rlc2MgU2NoZWR1bGVkIHZhcmludCB3cml0ZXIgb3BlcmF0aW9uLlxyXG4gKiBAZXh0ZW5kcyBPcFxyXG4gKiBAY29uc3RydWN0b3JcclxuICogQHBhcmFtIHtudW1iZXJ9IGxlbiBWYWx1ZSBieXRlIGxlbmd0aFxyXG4gKiBAcGFyYW0ge251bWJlcn0gdmFsIFZhbHVlIHRvIHdyaXRlXHJcbiAqIEBpZ25vcmVcclxuICovXHJcbmZ1bmN0aW9uIFZhcmludE9wKGxlbiwgdmFsKSB7XHJcbiAgICB0aGlzLmxlbiA9IGxlbjtcclxuICAgIHRoaXMubmV4dCA9IHVuZGVmaW5lZDtcclxuICAgIHRoaXMudmFsID0gdmFsO1xyXG59XHJcblxyXG5WYXJpbnRPcC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKE9wLnByb3RvdHlwZSk7XHJcblZhcmludE9wLnByb3RvdHlwZS5mbiA9IHdyaXRlVmFyaW50MzI7XHJcblxyXG4vKipcclxuICogV3JpdGVzIGFuIHVuc2lnbmVkIDMyIGJpdCB2YWx1ZSBhcyBhIHZhcmludC5cclxuICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlIFZhbHVlIHRvIHdyaXRlXHJcbiAqIEByZXR1cm5zIHtXcml0ZXJ9IGB0aGlzYFxyXG4gKi9cclxuV3JpdGVyLnByb3RvdHlwZS51aW50MzIgPSBmdW5jdGlvbiB3cml0ZV91aW50MzIodmFsdWUpIHtcclxuICAgIC8vIGhlcmUsIHRoZSBjYWxsIHRvIHRoaXMucHVzaCBoYXMgYmVlbiBpbmxpbmVkIGFuZCBhIHZhcmludCBzcGVjaWZpYyBPcCBzdWJjbGFzcyBpcyB1c2VkLlxyXG4gICAgLy8gdWludDMyIGlzIGJ5IGZhciB0aGUgbW9zdCBmcmVxdWVudGx5IHVzZWQgb3BlcmF0aW9uIGFuZCBiZW5lZml0cyBzaWduaWZpY2FudGx5IGZyb20gdGhpcy5cclxuICAgIHRoaXMubGVuICs9ICh0aGlzLnRhaWwgPSB0aGlzLnRhaWwubmV4dCA9IG5ldyBWYXJpbnRPcChcclxuICAgICAgICAodmFsdWUgPSB2YWx1ZSA+Pj4gMClcclxuICAgICAgICAgICAgICAgIDwgMTI4ICAgICAgID8gMVxyXG4gICAgICAgIDogdmFsdWUgPCAxNjM4NCAgICAgPyAyXHJcbiAgICAgICAgOiB2YWx1ZSA8IDIwOTcxNTIgICA/IDNcclxuICAgICAgICA6IHZhbHVlIDwgMjY4NDM1NDU2ID8gNFxyXG4gICAgICAgIDogICAgICAgICAgICAgICAgICAgICA1LFxyXG4gICAgdmFsdWUpKS5sZW47XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBXcml0ZXMgYSBzaWduZWQgMzIgYml0IHZhbHVlIGFzIGEgdmFyaW50LlxyXG4gKiBAZnVuY3Rpb25cclxuICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlIFZhbHVlIHRvIHdyaXRlXHJcbiAqIEByZXR1cm5zIHtXcml0ZXJ9IGB0aGlzYFxyXG4gKi9cclxuV3JpdGVyLnByb3RvdHlwZS5pbnQzMiA9IGZ1bmN0aW9uIHdyaXRlX2ludDMyKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdmFsdWUgPCAwXHJcbiAgICAgICAgPyB0aGlzLl9wdXNoKHdyaXRlVmFyaW50NjQsIDEwLCBMb25nQml0cy5mcm9tTnVtYmVyKHZhbHVlKSkgLy8gMTAgYnl0ZXMgcGVyIHNwZWNcclxuICAgICAgICA6IHRoaXMudWludDMyKHZhbHVlKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBXcml0ZXMgYSAzMiBiaXQgdmFsdWUgYXMgYSB2YXJpbnQsIHppZy16YWcgZW5jb2RlZC5cclxuICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlIFZhbHVlIHRvIHdyaXRlXHJcbiAqIEByZXR1cm5zIHtXcml0ZXJ9IGB0aGlzYFxyXG4gKi9cclxuV3JpdGVyLnByb3RvdHlwZS5zaW50MzIgPSBmdW5jdGlvbiB3cml0ZV9zaW50MzIodmFsdWUpIHtcclxuICAgIHJldHVybiB0aGlzLnVpbnQzMigodmFsdWUgPDwgMSBeIHZhbHVlID4+IDMxKSA+Pj4gMCk7XHJcbn07XHJcblxyXG5mdW5jdGlvbiB3cml0ZVZhcmludDY0KHZhbCwgYnVmLCBwb3MpIHtcclxuICAgIHdoaWxlICh2YWwuaGkpIHtcclxuICAgICAgICBidWZbcG9zKytdID0gdmFsLmxvICYgMTI3IHwgMTI4O1xyXG4gICAgICAgIHZhbC5sbyA9ICh2YWwubG8gPj4+IDcgfCB2YWwuaGkgPDwgMjUpID4+PiAwO1xyXG4gICAgICAgIHZhbC5oaSA+Pj49IDc7XHJcbiAgICB9XHJcbiAgICB3aGlsZSAodmFsLmxvID4gMTI3KSB7XHJcbiAgICAgICAgYnVmW3BvcysrXSA9IHZhbC5sbyAmIDEyNyB8IDEyODtcclxuICAgICAgICB2YWwubG8gPSB2YWwubG8gPj4+IDc7XHJcbiAgICB9XHJcbiAgICBidWZbcG9zKytdID0gdmFsLmxvO1xyXG59XHJcblxyXG4vKipcclxuICogV3JpdGVzIGFuIHVuc2lnbmVkIDY0IGJpdCB2YWx1ZSBhcyBhIHZhcmludC5cclxuICogQHBhcmFtIHtMb25nfG51bWJlcnxzdHJpbmd9IHZhbHVlIFZhbHVlIHRvIHdyaXRlXHJcbiAqIEByZXR1cm5zIHtXcml0ZXJ9IGB0aGlzYFxyXG4gKiBAdGhyb3dzIHtUeXBlRXJyb3J9IElmIGB2YWx1ZWAgaXMgYSBzdHJpbmcgYW5kIG5vIGxvbmcgbGlicmFyeSBpcyBwcmVzZW50LlxyXG4gKi9cclxuV3JpdGVyLnByb3RvdHlwZS51aW50NjQgPSBmdW5jdGlvbiB3cml0ZV91aW50NjQodmFsdWUpIHtcclxuICAgIHZhciBiaXRzID0gTG9uZ0JpdHMuZnJvbSh2YWx1ZSk7XHJcbiAgICByZXR1cm4gdGhpcy5fcHVzaCh3cml0ZVZhcmludDY0LCBiaXRzLmxlbmd0aCgpLCBiaXRzKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBXcml0ZXMgYSBzaWduZWQgNjQgYml0IHZhbHVlIGFzIGEgdmFyaW50LlxyXG4gKiBAZnVuY3Rpb25cclxuICogQHBhcmFtIHtMb25nfG51bWJlcnxzdHJpbmd9IHZhbHVlIFZhbHVlIHRvIHdyaXRlXHJcbiAqIEByZXR1cm5zIHtXcml0ZXJ9IGB0aGlzYFxyXG4gKiBAdGhyb3dzIHtUeXBlRXJyb3J9IElmIGB2YWx1ZWAgaXMgYSBzdHJpbmcgYW5kIG5vIGxvbmcgbGlicmFyeSBpcyBwcmVzZW50LlxyXG4gKi9cclxuV3JpdGVyLnByb3RvdHlwZS5pbnQ2NCA9IFdyaXRlci5wcm90b3R5cGUudWludDY0O1xyXG5cclxuLyoqXHJcbiAqIFdyaXRlcyBhIHNpZ25lZCA2NCBiaXQgdmFsdWUgYXMgYSB2YXJpbnQsIHppZy16YWcgZW5jb2RlZC5cclxuICogQHBhcmFtIHtMb25nfG51bWJlcnxzdHJpbmd9IHZhbHVlIFZhbHVlIHRvIHdyaXRlXHJcbiAqIEByZXR1cm5zIHtXcml0ZXJ9IGB0aGlzYFxyXG4gKiBAdGhyb3dzIHtUeXBlRXJyb3J9IElmIGB2YWx1ZWAgaXMgYSBzdHJpbmcgYW5kIG5vIGxvbmcgbGlicmFyeSBpcyBwcmVzZW50LlxyXG4gKi9cclxuV3JpdGVyLnByb3RvdHlwZS5zaW50NjQgPSBmdW5jdGlvbiB3cml0ZV9zaW50NjQodmFsdWUpIHtcclxuICAgIHZhciBiaXRzID0gTG9uZ0JpdHMuZnJvbSh2YWx1ZSkuenpFbmNvZGUoKTtcclxuICAgIHJldHVybiB0aGlzLl9wdXNoKHdyaXRlVmFyaW50NjQsIGJpdHMubGVuZ3RoKCksIGJpdHMpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFdyaXRlcyBhIGJvb2xpc2ggdmFsdWUgYXMgYSB2YXJpbnQuXHJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gdmFsdWUgVmFsdWUgdG8gd3JpdGVcclxuICogQHJldHVybnMge1dyaXRlcn0gYHRoaXNgXHJcbiAqL1xyXG5Xcml0ZXIucHJvdG90eXBlLmJvb2wgPSBmdW5jdGlvbiB3cml0ZV9ib29sKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdGhpcy5fcHVzaCh3cml0ZUJ5dGUsIDEsIHZhbHVlID8gMSA6IDApO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gd3JpdGVGaXhlZDMyKHZhbCwgYnVmLCBwb3MpIHtcclxuICAgIGJ1Zltwb3MgICAgXSA9ICB2YWwgICAgICAgICAmIDI1NTtcclxuICAgIGJ1Zltwb3MgKyAxXSA9ICB2YWwgPj4+IDggICAmIDI1NTtcclxuICAgIGJ1Zltwb3MgKyAyXSA9ICB2YWwgPj4+IDE2ICAmIDI1NTtcclxuICAgIGJ1Zltwb3MgKyAzXSA9ICB2YWwgPj4+IDI0O1xyXG59XHJcblxyXG4vKipcclxuICogV3JpdGVzIGFuIHVuc2lnbmVkIDMyIGJpdCB2YWx1ZSBhcyBmaXhlZCAzMiBiaXRzLlxyXG4gKiBAcGFyYW0ge251bWJlcn0gdmFsdWUgVmFsdWUgdG8gd3JpdGVcclxuICogQHJldHVybnMge1dyaXRlcn0gYHRoaXNgXHJcbiAqL1xyXG5Xcml0ZXIucHJvdG90eXBlLmZpeGVkMzIgPSBmdW5jdGlvbiB3cml0ZV9maXhlZDMyKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdGhpcy5fcHVzaCh3cml0ZUZpeGVkMzIsIDQsIHZhbHVlID4+PiAwKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBXcml0ZXMgYSBzaWduZWQgMzIgYml0IHZhbHVlIGFzIGZpeGVkIDMyIGJpdHMuXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcGFyYW0ge251bWJlcn0gdmFsdWUgVmFsdWUgdG8gd3JpdGVcclxuICogQHJldHVybnMge1dyaXRlcn0gYHRoaXNgXHJcbiAqL1xyXG5Xcml0ZXIucHJvdG90eXBlLnNmaXhlZDMyID0gV3JpdGVyLnByb3RvdHlwZS5maXhlZDMyO1xyXG5cclxuLyoqXHJcbiAqIFdyaXRlcyBhbiB1bnNpZ25lZCA2NCBiaXQgdmFsdWUgYXMgZml4ZWQgNjQgYml0cy5cclxuICogQHBhcmFtIHtMb25nfG51bWJlcnxzdHJpbmd9IHZhbHVlIFZhbHVlIHRvIHdyaXRlXHJcbiAqIEByZXR1cm5zIHtXcml0ZXJ9IGB0aGlzYFxyXG4gKiBAdGhyb3dzIHtUeXBlRXJyb3J9IElmIGB2YWx1ZWAgaXMgYSBzdHJpbmcgYW5kIG5vIGxvbmcgbGlicmFyeSBpcyBwcmVzZW50LlxyXG4gKi9cclxuV3JpdGVyLnByb3RvdHlwZS5maXhlZDY0ID0gZnVuY3Rpb24gd3JpdGVfZml4ZWQ2NCh2YWx1ZSkge1xyXG4gICAgdmFyIGJpdHMgPSBMb25nQml0cy5mcm9tKHZhbHVlKTtcclxuICAgIHJldHVybiB0aGlzLl9wdXNoKHdyaXRlRml4ZWQzMiwgNCwgYml0cy5sbykuX3B1c2god3JpdGVGaXhlZDMyLCA0LCBiaXRzLmhpKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBXcml0ZXMgYSBzaWduZWQgNjQgYml0IHZhbHVlIGFzIGZpeGVkIDY0IGJpdHMuXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcGFyYW0ge0xvbmd8bnVtYmVyfHN0cmluZ30gdmFsdWUgVmFsdWUgdG8gd3JpdGVcclxuICogQHJldHVybnMge1dyaXRlcn0gYHRoaXNgXHJcbiAqIEB0aHJvd3Mge1R5cGVFcnJvcn0gSWYgYHZhbHVlYCBpcyBhIHN0cmluZyBhbmQgbm8gbG9uZyBsaWJyYXJ5IGlzIHByZXNlbnQuXHJcbiAqL1xyXG5Xcml0ZXIucHJvdG90eXBlLnNmaXhlZDY0ID0gV3JpdGVyLnByb3RvdHlwZS5maXhlZDY0O1xyXG5cclxuLyoqXHJcbiAqIFdyaXRlcyBhIGZsb2F0ICgzMiBiaXQpLlxyXG4gKiBAZnVuY3Rpb25cclxuICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlIFZhbHVlIHRvIHdyaXRlXHJcbiAqIEByZXR1cm5zIHtXcml0ZXJ9IGB0aGlzYFxyXG4gKi9cclxuV3JpdGVyLnByb3RvdHlwZS5mbG9hdCA9IGZ1bmN0aW9uIHdyaXRlX2Zsb2F0KHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdGhpcy5fcHVzaCh1dGlsLmZsb2F0LndyaXRlRmxvYXRMRSwgNCwgdmFsdWUpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFdyaXRlcyBhIGRvdWJsZSAoNjQgYml0IGZsb2F0KS5cclxuICogQGZ1bmN0aW9uXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSBWYWx1ZSB0byB3cml0ZVxyXG4gKiBAcmV0dXJucyB7V3JpdGVyfSBgdGhpc2BcclxuICovXHJcbldyaXRlci5wcm90b3R5cGUuZG91YmxlID0gZnVuY3Rpb24gd3JpdGVfZG91YmxlKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdGhpcy5fcHVzaCh1dGlsLmZsb2F0LndyaXRlRG91YmxlTEUsIDgsIHZhbHVlKTtcclxufTtcclxuXHJcbnZhciB3cml0ZUJ5dGVzID0gdXRpbC5BcnJheS5wcm90b3R5cGUuc2V0XHJcbiAgICA/IGZ1bmN0aW9uIHdyaXRlQnl0ZXNfc2V0KHZhbCwgYnVmLCBwb3MpIHtcclxuICAgICAgICBidWYuc2V0KHZhbCwgcG9zKTsgLy8gYWxzbyB3b3JrcyBmb3IgcGxhaW4gYXJyYXkgdmFsdWVzXHJcbiAgICB9XHJcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgOiBmdW5jdGlvbiB3cml0ZUJ5dGVzX2Zvcih2YWwsIGJ1ZiwgcG9zKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB2YWwubGVuZ3RoOyArK2kpXHJcbiAgICAgICAgICAgIGJ1Zltwb3MgKyBpXSA9IHZhbFtpXTtcclxuICAgIH07XHJcblxyXG4vKipcclxuICogV3JpdGVzIGEgc2VxdWVuY2Ugb2YgYnl0ZXMuXHJcbiAqIEBwYXJhbSB7VWludDhBcnJheXxzdHJpbmd9IHZhbHVlIEJ1ZmZlciBvciBiYXNlNjQgZW5jb2RlZCBzdHJpbmcgdG8gd3JpdGVcclxuICogQHJldHVybnMge1dyaXRlcn0gYHRoaXNgXHJcbiAqL1xyXG5Xcml0ZXIucHJvdG90eXBlLmJ5dGVzID0gZnVuY3Rpb24gd3JpdGVfYnl0ZXModmFsdWUpIHtcclxuICAgIHZhciBsZW4gPSB2YWx1ZS5sZW5ndGggPj4+IDA7XHJcbiAgICBpZiAoIWxlbilcclxuICAgICAgICByZXR1cm4gdGhpcy5fcHVzaCh3cml0ZUJ5dGUsIDEsIDApO1xyXG4gICAgaWYgKHV0aWwuaXNTdHJpbmcodmFsdWUpKSB7XHJcbiAgICAgICAgdmFyIGJ1ZiA9IFdyaXRlci5hbGxvYyhsZW4gPSBiYXNlNjQubGVuZ3RoKHZhbHVlKSk7XHJcbiAgICAgICAgYmFzZTY0LmRlY29kZSh2YWx1ZSwgYnVmLCAwKTtcclxuICAgICAgICB2YWx1ZSA9IGJ1ZjtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLnVpbnQzMihsZW4pLl9wdXNoKHdyaXRlQnl0ZXMsIGxlbiwgdmFsdWUpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFdyaXRlcyBhIHN0cmluZy5cclxuICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlIFZhbHVlIHRvIHdyaXRlXHJcbiAqIEByZXR1cm5zIHtXcml0ZXJ9IGB0aGlzYFxyXG4gKi9cclxuV3JpdGVyLnByb3RvdHlwZS5zdHJpbmcgPSBmdW5jdGlvbiB3cml0ZV9zdHJpbmcodmFsdWUpIHtcclxuICAgIHZhciBsZW4gPSB1dGY4Lmxlbmd0aCh2YWx1ZSk7XHJcbiAgICByZXR1cm4gbGVuXHJcbiAgICAgICAgPyB0aGlzLnVpbnQzMihsZW4pLl9wdXNoKHV0Zjgud3JpdGUsIGxlbiwgdmFsdWUpXHJcbiAgICAgICAgOiB0aGlzLl9wdXNoKHdyaXRlQnl0ZSwgMSwgMCk7XHJcbn07XHJcblxyXG4vKipcclxuICogRm9ya3MgdGhpcyB3cml0ZXIncyBzdGF0ZSBieSBwdXNoaW5nIGl0IHRvIGEgc3RhY2suXHJcbiAqIENhbGxpbmcge0BsaW5rIFdyaXRlciNyZXNldHxyZXNldH0gb3Ige0BsaW5rIFdyaXRlciNsZGVsaW18bGRlbGltfSByZXNldHMgdGhlIHdyaXRlciB0byB0aGUgcHJldmlvdXMgc3RhdGUuXHJcbiAqIEByZXR1cm5zIHtXcml0ZXJ9IGB0aGlzYFxyXG4gKi9cclxuV3JpdGVyLnByb3RvdHlwZS5mb3JrID0gZnVuY3Rpb24gZm9yaygpIHtcclxuICAgIHRoaXMuc3RhdGVzID0gbmV3IFN0YXRlKHRoaXMpO1xyXG4gICAgdGhpcy5oZWFkID0gdGhpcy50YWlsID0gbmV3IE9wKG5vb3AsIDAsIDApO1xyXG4gICAgdGhpcy5sZW4gPSAwO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVzZXRzIHRoaXMgaW5zdGFuY2UgdG8gdGhlIGxhc3Qgc3RhdGUuXHJcbiAqIEByZXR1cm5zIHtXcml0ZXJ9IGB0aGlzYFxyXG4gKi9cclxuV3JpdGVyLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uIHJlc2V0KCkge1xyXG4gICAgaWYgKHRoaXMuc3RhdGVzKSB7XHJcbiAgICAgICAgdGhpcy5oZWFkICAgPSB0aGlzLnN0YXRlcy5oZWFkO1xyXG4gICAgICAgIHRoaXMudGFpbCAgID0gdGhpcy5zdGF0ZXMudGFpbDtcclxuICAgICAgICB0aGlzLmxlbiAgICA9IHRoaXMuc3RhdGVzLmxlbjtcclxuICAgICAgICB0aGlzLnN0YXRlcyA9IHRoaXMuc3RhdGVzLm5leHQ7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuaGVhZCA9IHRoaXMudGFpbCA9IG5ldyBPcChub29wLCAwLCAwKTtcclxuICAgICAgICB0aGlzLmxlbiAgPSAwO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVzZXRzIHRvIHRoZSBsYXN0IHN0YXRlIGFuZCBhcHBlbmRzIHRoZSBmb3JrIHN0YXRlJ3MgY3VycmVudCB3cml0ZSBsZW5ndGggYXMgYSB2YXJpbnQgZm9sbG93ZWQgYnkgaXRzIG9wZXJhdGlvbnMuXHJcbiAqIEByZXR1cm5zIHtXcml0ZXJ9IGB0aGlzYFxyXG4gKi9cclxuV3JpdGVyLnByb3RvdHlwZS5sZGVsaW0gPSBmdW5jdGlvbiBsZGVsaW0oKSB7XHJcbiAgICB2YXIgaGVhZCA9IHRoaXMuaGVhZCxcclxuICAgICAgICB0YWlsID0gdGhpcy50YWlsLFxyXG4gICAgICAgIGxlbiAgPSB0aGlzLmxlbjtcclxuICAgIHRoaXMucmVzZXQoKS51aW50MzIobGVuKTtcclxuICAgIGlmIChsZW4pIHtcclxuICAgICAgICB0aGlzLnRhaWwubmV4dCA9IGhlYWQubmV4dDsgLy8gc2tpcCBub29wXHJcbiAgICAgICAgdGhpcy50YWlsID0gdGFpbDtcclxuICAgICAgICB0aGlzLmxlbiArPSBsZW47XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBGaW5pc2hlcyB0aGUgd3JpdGUgb3BlcmF0aW9uLlxyXG4gKiBAcmV0dXJucyB7VWludDhBcnJheX0gRmluaXNoZWQgYnVmZmVyXHJcbiAqL1xyXG5Xcml0ZXIucHJvdG90eXBlLmZpbmlzaCA9IGZ1bmN0aW9uIGZpbmlzaCgpIHtcclxuICAgIHZhciBoZWFkID0gdGhpcy5oZWFkLm5leHQsIC8vIHNraXAgbm9vcFxyXG4gICAgICAgIGJ1ZiAgPSB0aGlzLmNvbnN0cnVjdG9yLmFsbG9jKHRoaXMubGVuKSxcclxuICAgICAgICBwb3MgID0gMDtcclxuICAgIHdoaWxlIChoZWFkKSB7XHJcbiAgICAgICAgaGVhZC5mbihoZWFkLnZhbCwgYnVmLCBwb3MpO1xyXG4gICAgICAgIHBvcyArPSBoZWFkLmxlbjtcclxuICAgICAgICBoZWFkID0gaGVhZC5uZXh0O1xyXG4gICAgfVxyXG4gICAgLy8gdGhpcy5oZWFkID0gdGhpcy50YWlsID0gbnVsbDtcclxuICAgIHJldHVybiBidWY7XHJcbn07XHJcblxyXG5Xcml0ZXIuX2NvbmZpZ3VyZSA9IGZ1bmN0aW9uKEJ1ZmZlcldyaXRlcl8pIHtcclxuICAgIEJ1ZmZlcldyaXRlciA9IEJ1ZmZlcldyaXRlcl87XHJcbn07XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5tb2R1bGUuZXhwb3J0cyA9IEJ1ZmZlcldyaXRlcjtcclxuXHJcbi8vIGV4dGVuZHMgV3JpdGVyXHJcbnZhciBXcml0ZXIgPSByZXF1aXJlKFwiLi93cml0ZXJcIik7XHJcbihCdWZmZXJXcml0ZXIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShXcml0ZXIucHJvdG90eXBlKSkuY29uc3RydWN0b3IgPSBCdWZmZXJXcml0ZXI7XHJcblxyXG52YXIgdXRpbCA9IHJlcXVpcmUoXCIuL3V0aWwvbWluaW1hbFwiKTtcclxuXHJcbnZhciBCdWZmZXIgPSB1dGlsLkJ1ZmZlcjtcclxuXHJcbi8qKlxyXG4gKiBDb25zdHJ1Y3RzIGEgbmV3IGJ1ZmZlciB3cml0ZXIgaW5zdGFuY2UuXHJcbiAqIEBjbGFzc2Rlc2MgV2lyZSBmb3JtYXQgd3JpdGVyIHVzaW5nIG5vZGUgYnVmZmVycy5cclxuICogQGV4dGVuZHMgV3JpdGVyXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKi9cclxuZnVuY3Rpb24gQnVmZmVyV3JpdGVyKCkge1xyXG4gICAgV3JpdGVyLmNhbGwodGhpcyk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBBbGxvY2F0ZXMgYSBidWZmZXIgb2YgdGhlIHNwZWNpZmllZCBzaXplLlxyXG4gKiBAcGFyYW0ge251bWJlcn0gc2l6ZSBCdWZmZXIgc2l6ZVxyXG4gKiBAcmV0dXJucyB7QnVmZmVyfSBCdWZmZXJcclxuICovXHJcbkJ1ZmZlcldyaXRlci5hbGxvYyA9IGZ1bmN0aW9uIGFsbG9jX2J1ZmZlcihzaXplKSB7XHJcbiAgICByZXR1cm4gKEJ1ZmZlcldyaXRlci5hbGxvYyA9IHV0aWwuX0J1ZmZlcl9hbGxvY1Vuc2FmZSkoc2l6ZSk7XHJcbn07XHJcblxyXG52YXIgd3JpdGVCeXRlc0J1ZmZlciA9IEJ1ZmZlciAmJiBCdWZmZXIucHJvdG90eXBlIGluc3RhbmNlb2YgVWludDhBcnJheSAmJiBCdWZmZXIucHJvdG90eXBlLnNldC5uYW1lID09PSBcInNldFwiXHJcbiAgICA/IGZ1bmN0aW9uIHdyaXRlQnl0ZXNCdWZmZXJfc2V0KHZhbCwgYnVmLCBwb3MpIHtcclxuICAgICAgICBidWYuc2V0KHZhbCwgcG9zKTsgLy8gZmFzdGVyIHRoYW4gY29weSAocmVxdWlyZXMgbm9kZSA+PSA0IHdoZXJlIEJ1ZmZlcnMgZXh0ZW5kIFVpbnQ4QXJyYXkgYW5kIHNldCBpcyBwcm9wZXJseSBpbmhlcml0ZWQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFsc28gd29ya3MgZm9yIHBsYWluIGFycmF5IHZhbHVlc1xyXG4gICAgfVxyXG4gICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgIDogZnVuY3Rpb24gd3JpdGVCeXRlc0J1ZmZlcl9jb3B5KHZhbCwgYnVmLCBwb3MpIHtcclxuICAgICAgICBpZiAodmFsLmNvcHkpIC8vIEJ1ZmZlciB2YWx1ZXNcclxuICAgICAgICAgICAgdmFsLmNvcHkoYnVmLCBwb3MsIDAsIHZhbC5sZW5ndGgpO1xyXG4gICAgICAgIGVsc2UgZm9yICh2YXIgaSA9IDA7IGkgPCB2YWwubGVuZ3RoOykgLy8gcGxhaW4gYXJyYXkgdmFsdWVzXHJcbiAgICAgICAgICAgIGJ1Zltwb3MrK10gPSB2YWxbaSsrXTtcclxuICAgIH07XHJcblxyXG4vKipcclxuICogQG92ZXJyaWRlXHJcbiAqL1xyXG5CdWZmZXJXcml0ZXIucHJvdG90eXBlLmJ5dGVzID0gZnVuY3Rpb24gd3JpdGVfYnl0ZXNfYnVmZmVyKHZhbHVlKSB7XHJcbiAgICBpZiAodXRpbC5pc1N0cmluZyh2YWx1ZSkpXHJcbiAgICAgICAgdmFsdWUgPSB1dGlsLl9CdWZmZXJfZnJvbSh2YWx1ZSwgXCJiYXNlNjRcIik7XHJcbiAgICB2YXIgbGVuID0gdmFsdWUubGVuZ3RoID4+PiAwO1xyXG4gICAgdGhpcy51aW50MzIobGVuKTtcclxuICAgIGlmIChsZW4pXHJcbiAgICAgICAgdGhpcy5fcHVzaCh3cml0ZUJ5dGVzQnVmZmVyLCBsZW4sIHZhbHVlKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gd3JpdGVTdHJpbmdCdWZmZXIodmFsLCBidWYsIHBvcykge1xyXG4gICAgaWYgKHZhbC5sZW5ndGggPCA0MCkgLy8gcGxhaW4ganMgaXMgZmFzdGVyIGZvciBzaG9ydCBzdHJpbmdzIChwcm9iYWJseSBkdWUgdG8gcmVkdW5kYW50IGFzc2VydGlvbnMpXHJcbiAgICAgICAgdXRpbC51dGY4LndyaXRlKHZhbCwgYnVmLCBwb3MpO1xyXG4gICAgZWxzZVxyXG4gICAgICAgIGJ1Zi51dGY4V3JpdGUodmFsLCBwb3MpO1xyXG59XHJcblxyXG4vKipcclxuICogQG92ZXJyaWRlXHJcbiAqL1xyXG5CdWZmZXJXcml0ZXIucHJvdG90eXBlLnN0cmluZyA9IGZ1bmN0aW9uIHdyaXRlX3N0cmluZ19idWZmZXIodmFsdWUpIHtcclxuICAgIHZhciBsZW4gPSBCdWZmZXIuYnl0ZUxlbmd0aCh2YWx1ZSk7XHJcbiAgICB0aGlzLnVpbnQzMihsZW4pO1xyXG4gICAgaWYgKGxlbilcclxuICAgICAgICB0aGlzLl9wdXNoKHdyaXRlU3RyaW5nQnVmZmVyLCBsZW4sIHZhbHVlKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuXHJcbi8qKlxyXG4gKiBGaW5pc2hlcyB0aGUgd3JpdGUgb3BlcmF0aW9uLlxyXG4gKiBAbmFtZSBCdWZmZXJXcml0ZXIjZmluaXNoXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcmV0dXJucyB7QnVmZmVyfSBGaW5pc2hlZCBidWZmZXJcclxuICovXHJcbiIsInZhciBwcm90b2J1ZiA9IHJlcXVpcmUoXCJwcm90b2J1ZmpzL2xpZ2h0XCIpO1xyXG4vLyB2YXIgZGVzY3JpcHRvciA9IHJlcXVpcmUoXCJ0ZXN0X21lc3NhZ2UuanNvblwiKTtcclxudmFyIHJvb3QgPSBwcm90b2J1Zi5Sb290LmZyb21KU09OKHtcclxuICAgIFwibmVzdGVkXCI6IHtcclxuICAgICAgICBcIlRlc3RNZXNzYWdlXCIgOiB7XHJcbiAgICAgICAgICAgIFwiZmllbGRzXCI6IHtcclxuICAgICAgICAgICAgICAgIFwiZXJyb3JcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiaWRcIjogMVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59KTtcclxudmFyIHRlc3RNZXNzYWdlID0gcm9vdC5UZXN0TWVzc2FnZTtcclxuXHJcbi8vIGZ1bmN0aW9uIGRlc2VyaWFsaXplKGJ5dGVzKSB7XHJcbi8vICAgICB2YXIgZGVzUGVyc29uID0gbWVzc2FnZXMuUGVyc29uLmRlc2VyaWFsaXplQmluYXJ5KGJ5dGVzKTtcclxuICAgIFxyXG4vLyAgICAgdmFyIG5hbWUgPSBkZXNQZXJzb24uZ2V0TmFtZSgpO1xyXG4vLyAgICAgdmFyIGlkID0gZGVzUGVyc29uLmdldElkKCk7XHJcbi8vICAgICB2YXIgZW1haWwgPSBkZXNQZXJzb24uZ2V0RW1haWwoKTtcclxuICAgIFxyXG4vLyAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RzX25hbWUnKS5pbm5lckhUTUwgPSBuYW1lO1xyXG4vLyAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RzX2lkJykuaW5uZXJIVE1MID0gaWQ7XHJcbi8vICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZHNfZW1haWwnKS5pbm5lckhUTUwgPSBlbWFpbDtcclxuLy8gfVxyXG5cclxudmFyIG9SZXEgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcclxub1JlcS5vcGVuKFwiUE9TVFwiLCBcImh0dHA6Ly9sb2NhbGhvc3Q6NTAwMC9iZW5jaG1hcmtcIiwgdHJ1ZSk7XHJcbm9SZXEuc2V0UmVxdWVzdEhlYWRlcihcIkNvbnRlbnQtVHlwZVwiLCBcImFwcGxpY2F0aW9uL2pzb25cIik7XHJcbm9SZXEucmVzcG9uc2VUeXBlID0gXCJhcnJheWJ1ZmZlclwiO1xyXG5cclxub1JlcS5vbmxvYWQgPSBmdW5jdGlvbiAob0V2ZW50KSB7XHJcbiAgICBkZWJ1Z2dlcjtcclxuICAgIGNvbnNvbGUubG9nKCdYSFIgcmVxdWVzdCBzdWNjZXNzJyk7XHJcbiAgICB2YXIgYXJyYXlCdWZmZXIgPSBvUmVxLnJlc3BvbnNlOyAvLyBOb3RlOiBub3Qgb1JlcS5yZXNwb25zZVRleHRcclxuICAgIGlmIChhcnJheUJ1ZmZlcikge1xyXG4gICAgdmFyIGJ5dGVBcnJheSA9IG5ldyBVaW50OEFycmF5KGFycmF5QnVmZmVyKTtcclxuICAgIGRlYnVnZ2VyO1xyXG4gICAgdmFyIGRlY29kZWQgPSB0ZXN0TWVzc2FnZS5kZWNvZGUoYnl0ZUFycmF5KTtcclxuICAgIHZhciBvYmplY3QgPSB0ZXN0TWVzc2FnZS50b09iamVjdChkZWNvZGVkKTtcclxuICAgIGNvbnNvbGUubG9nKG9iamVjdCk7XHJcbn1cclxufTtcclxuXHJcbm9SZXEuc2VuZChKU09OLnN0cmluZ2lmeSh7XHJcblx0XCJLZXlcIjogXCJrUjdVY3RCakU2UHRFZ2ZnVGVVZlkjJHRrKncrZzNka0AuTThLN0Uya2taVnFvM1Q0QncjPkw5eHVCNnBwPVt5XCIsXHJcblx0XCJNb2RlXCI6IDFcclxufSkpOyJdfQ==
