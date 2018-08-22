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

},{}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
// minimal library entry point.

"use strict";
module.exports = require("./src/index-minimal");

},{"./src/index-minimal":9}],9:[function(require,module,exports){
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

},{"./reader":10,"./reader_buffer":11,"./roots":12,"./rpc":13,"./util/minimal":16,"./writer":17,"./writer_buffer":18}],10:[function(require,module,exports){
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

},{"./util/minimal":16}],11:[function(require,module,exports){
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

},{"./reader":10,"./util/minimal":16}],12:[function(require,module,exports){
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

},{}],13:[function(require,module,exports){
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

},{"./rpc/service":14}],14:[function(require,module,exports){
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

},{"../util/minimal":16}],15:[function(require,module,exports){
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

},{"../util/minimal":16}],16:[function(require,module,exports){
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

},{"./longbits":15,"@protobufjs/aspromise":1,"@protobufjs/base64":2,"@protobufjs/eventemitter":3,"@protobufjs/float":4,"@protobufjs/inquire":5,"@protobufjs/pool":6,"@protobufjs/utf8":7}],17:[function(require,module,exports){
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

},{"./util/minimal":16}],18:[function(require,module,exports){
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

},{"./util/minimal":16,"./writer":17}],19:[function(require,module,exports){
var rootMessage = require("./testmessage.js");
// var descriptor = require("test_message.json");
var testMessage = rootMessage.TestMessage;
var testRequest = rootMessage.TestRequest;
debugger;
var testRequestMessage = testRequest.create({
    Key : "kR7UctBjE6PtEgfgTeUfY#$tk*w+g3dk@.M8K7E2kkZVqo3T4Bw#>L9xuB6pp=[y",
    Mode : 1
});
console.log(testRequest.verify({
    Key : "kR7UctBjE6PtEgfgTeUfY#$tk*w+g3dk@.M8K7E2kkZVqo3T4Bw#>L9xuB6pp=[y",
    Mode : 1
}));
var encodedRequest = testRequest.encode(testRequestMessage).finish();

console.log(testRequest.toObject(testRequest.decode(encodedRequest)));
// function deserialize(bytes) {
//     var desPerson = messages.Person.deserializeBinary(bytes);
    
//     var name = desPerson.getName();
//     var id = desPerson.getId();
//     var email = desPerson.getEmail();
    
//     document.getElementById('ds_name').innerHTML = name;
//     document.getElementById('ds_id').innerHTML = id;
//     document.getElementById('ds_email').innerHTML = email;
// }

var json = false;

// JSON STYLE
var oReq = new XMLHttpRequest();
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

if (json) {
    oReq.open("POST", "http://localhost:5000/benchmark", true);
    oReq.setRequestHeader("Content-Type", "application/json");
    oReq.responseType = "arraybuffer";
    
    oReq.send(JSON.stringify({
        "Key": "kR7UctBjE6PtEgfgTeUfY#$tk*w+g3dk@.M8K7E2kkZVqo3T4Bw#>L9xuB6pp=[y",
        "Mode": 1
    }));
} else {
    oReq.open("POST", "http://localhost:5000/benchmark", true);
    oReq.setRequestHeader("Content-Type", "application/octet-stream");
    oReq.responseType = "arraybuffer";
    oReq.send(encodedRequest);
}
},{"./testmessage.js":20}],20:[function(require,module,exports){
/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
"use strict";

var $protobuf = require("protobufjs/minimal");

// Common aliases
var $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

$root.TestMessage = (function() {

    /**
     * Properties of a TestMessage.
     * @exports ITestMessage
     * @interface ITestMessage
     * @property {string|null} [error] TestMessage error
     */

    /**
     * Constructs a new TestMessage.
     * @exports TestMessage
     * @classdesc Represents a TestMessage.
     * @implements ITestMessage
     * @constructor
     * @param {ITestMessage=} [properties] Properties to set
     */
    function TestMessage(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * TestMessage error.
     * @member {string} error
     * @memberof TestMessage
     * @instance
     */
    TestMessage.prototype.error = "";

    /**
     * Creates a new TestMessage instance using the specified properties.
     * @function create
     * @memberof TestMessage
     * @static
     * @param {ITestMessage=} [properties] Properties to set
     * @returns {TestMessage} TestMessage instance
     */
    TestMessage.create = function create(properties) {
        return new TestMessage(properties);
    };

    /**
     * Encodes the specified TestMessage message. Does not implicitly {@link TestMessage.verify|verify} messages.
     * @function encode
     * @memberof TestMessage
     * @static
     * @param {ITestMessage} message TestMessage message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    TestMessage.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.error != null && message.hasOwnProperty("error"))
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.error);
        return writer;
    };

    /**
     * Encodes the specified TestMessage message, length delimited. Does not implicitly {@link TestMessage.verify|verify} messages.
     * @function encodeDelimited
     * @memberof TestMessage
     * @static
     * @param {ITestMessage} message TestMessage message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    TestMessage.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a TestMessage message from the specified reader or buffer.
     * @function decode
     * @memberof TestMessage
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {TestMessage} TestMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    TestMessage.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.TestMessage();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.error = reader.string();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a TestMessage message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof TestMessage
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {TestMessage} TestMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    TestMessage.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a TestMessage message.
     * @function verify
     * @memberof TestMessage
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    TestMessage.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.error != null && message.hasOwnProperty("error"))
            if (!$util.isString(message.error))
                return "error: string expected";
        return null;
    };

    /**
     * Creates a TestMessage message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof TestMessage
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {TestMessage} TestMessage
     */
    TestMessage.fromObject = function fromObject(object) {
        if (object instanceof $root.TestMessage)
            return object;
        var message = new $root.TestMessage();
        if (object.error != null)
            message.error = String(object.error);
        return message;
    };

    /**
     * Creates a plain object from a TestMessage message. Also converts values to other types if specified.
     * @function toObject
     * @memberof TestMessage
     * @static
     * @param {TestMessage} message TestMessage
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    TestMessage.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults)
            object.error = "";
        if (message.error != null && message.hasOwnProperty("error"))
            object.error = message.error;
        return object;
    };

    /**
     * Converts this TestMessage to JSON.
     * @function toJSON
     * @memberof TestMessage
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    TestMessage.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return TestMessage;
})();

$root.TestRequest = (function() {

    /**
     * Properties of a TestRequest.
     * @exports ITestRequest
     * @interface ITestRequest
     * @property {string|null} [Key] TestRequest Key
     * @property {BenchmarkMode|null} [Mode] TestRequest Mode
     */

    /**
     * Constructs a new TestRequest.
     * @exports TestRequest
     * @classdesc Represents a TestRequest.
     * @implements ITestRequest
     * @constructor
     * @param {ITestRequest=} [properties] Properties to set
     */
    function TestRequest(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * TestRequest Key.
     * @member {string} Key
     * @memberof TestRequest
     * @instance
     */
    TestRequest.prototype.Key = "";

    /**
     * TestRequest Mode.
     * @member {BenchmarkMode} Mode
     * @memberof TestRequest
     * @instance
     */
    TestRequest.prototype.Mode = 0;

    /**
     * Creates a new TestRequest instance using the specified properties.
     * @function create
     * @memberof TestRequest
     * @static
     * @param {ITestRequest=} [properties] Properties to set
     * @returns {TestRequest} TestRequest instance
     */
    TestRequest.create = function create(properties) {
        return new TestRequest(properties);
    };

    /**
     * Encodes the specified TestRequest message. Does not implicitly {@link TestRequest.verify|verify} messages.
     * @function encode
     * @memberof TestRequest
     * @static
     * @param {ITestRequest} message TestRequest message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    TestRequest.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.Key != null && message.hasOwnProperty("Key"))
            writer.uint32(/* id 20, wireType 2 =*/162).string(message.Key);
        if (message.Mode != null && message.hasOwnProperty("Mode"))
            writer.uint32(/* id 21, wireType 0 =*/168).int32(message.Mode);
        return writer;
    };

    /**
     * Encodes the specified TestRequest message, length delimited. Does not implicitly {@link TestRequest.verify|verify} messages.
     * @function encodeDelimited
     * @memberof TestRequest
     * @static
     * @param {ITestRequest} message TestRequest message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    TestRequest.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a TestRequest message from the specified reader or buffer.
     * @function decode
     * @memberof TestRequest
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {TestRequest} TestRequest
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    TestRequest.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.TestRequest();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 20:
                message.Key = reader.string();
                break;
            case 21:
                message.Mode = reader.int32();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a TestRequest message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof TestRequest
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {TestRequest} TestRequest
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    TestRequest.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a TestRequest message.
     * @function verify
     * @memberof TestRequest
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    TestRequest.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.Key != null && message.hasOwnProperty("Key"))
            if (!$util.isString(message.Key))
                return "Key: string expected";
        if (message.Mode != null && message.hasOwnProperty("Mode"))
            switch (message.Mode) {
            default:
                return "Mode: enum value expected";
            case 0:
            case 1:
            case 2:
            case 3:
                break;
            }
        return null;
    };

    /**
     * Creates a TestRequest message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof TestRequest
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {TestRequest} TestRequest
     */
    TestRequest.fromObject = function fromObject(object) {
        if (object instanceof $root.TestRequest)
            return object;
        var message = new $root.TestRequest();
        if (object.Key != null)
            message.Key = String(object.Key);
        switch (object.Mode) {
        case "ALL":
        case 0:
            message.Mode = 0;
            break;
        case "GeoLocate":
        case 1:
            message.Mode = 1;
            break;
        case "KinesisSend":
        case 2:
            message.Mode = 2;
            break;
        case "BrowserParser":
        case 3:
            message.Mode = 3;
            break;
        }
        return message;
    };

    /**
     * Creates a plain object from a TestRequest message. Also converts values to other types if specified.
     * @function toObject
     * @memberof TestRequest
     * @static
     * @param {TestRequest} message TestRequest
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    TestRequest.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.Key = "";
            object.Mode = options.enums === String ? "ALL" : 0;
        }
        if (message.Key != null && message.hasOwnProperty("Key"))
            object.Key = message.Key;
        if (message.Mode != null && message.hasOwnProperty("Mode"))
            object.Mode = options.enums === String ? $root.BenchmarkMode[message.Mode] : message.Mode;
        return object;
    };

    /**
     * Converts this TestRequest to JSON.
     * @function toJSON
     * @memberof TestRequest
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    TestRequest.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return TestRequest;
})();

/**
 * BenchmarkMode enum.
 * @exports BenchmarkMode
 * @enum {string}
 * @property {number} ALL=0 ALL value
 * @property {number} GeoLocate=1 GeoLocate value
 * @property {number} KinesisSend=2 KinesisSend value
 * @property {number} BrowserParser=3 BrowserParser value
 */
$root.BenchmarkMode = (function() {
    var valuesById = {}, values = Object.create(valuesById);
    values[valuesById[0] = "ALL"] = 0;
    values[valuesById[1] = "GeoLocate"] = 1;
    values[valuesById[2] = "KinesisSend"] = 2;
    values[valuesById[3] = "BrowserParser"] = 3;
    return values;
})();

module.exports = $root;

},{"protobufjs/minimal":8}]},{},[19])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvQHByb3RvYnVmanMvYXNwcm9taXNlL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL0Bwcm90b2J1ZmpzL2Jhc2U2NC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9AcHJvdG9idWZqcy9ldmVudGVtaXR0ZXIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvQHByb3RvYnVmanMvZmxvYXQvaW5kZXguanMiLCJub2RlX21vZHVsZXMvQHByb3RvYnVmanMvaW5xdWlyZS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9AcHJvdG9idWZqcy9wb29sL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL0Bwcm90b2J1ZmpzL3V0ZjgvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcHJvdG9idWZqcy9taW5pbWFsLmpzIiwibm9kZV9tb2R1bGVzL3Byb3RvYnVmanMvc3JjL2luZGV4LW1pbmltYWwuanMiLCJub2RlX21vZHVsZXMvcHJvdG9idWZqcy9zcmMvcmVhZGVyLmpzIiwibm9kZV9tb2R1bGVzL3Byb3RvYnVmanMvc3JjL3JlYWRlcl9idWZmZXIuanMiLCJub2RlX21vZHVsZXMvcHJvdG9idWZqcy9zcmMvcm9vdHMuanMiLCJub2RlX21vZHVsZXMvcHJvdG9idWZqcy9zcmMvcnBjLmpzIiwibm9kZV9tb2R1bGVzL3Byb3RvYnVmanMvc3JjL3JwYy9zZXJ2aWNlLmpzIiwibm9kZV9tb2R1bGVzL3Byb3RvYnVmanMvc3JjL3V0aWwvbG9uZ2JpdHMuanMiLCJub2RlX21vZHVsZXMvcHJvdG9idWZqcy9zcmMvdXRpbC9taW5pbWFsLmpzIiwibm9kZV9tb2R1bGVzL3Byb3RvYnVmanMvc3JjL3dyaXRlci5qcyIsIm5vZGVfbW9kdWxlcy9wcm90b2J1ZmpzL3NyYy93cml0ZXJfYnVmZmVyLmpzIiwicmVxdWVzdF9zdGF0aWMuanMiLCJ0ZXN0bWVzc2FnZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvVUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN4TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUM5WkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM2NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbm1vZHVsZS5leHBvcnRzID0gYXNQcm9taXNlO1xyXG5cclxuLyoqXHJcbiAqIENhbGxiYWNrIGFzIHVzZWQgYnkge0BsaW5rIHV0aWwuYXNQcm9taXNlfS5cclxuICogQHR5cGVkZWYgYXNQcm9taXNlQ2FsbGJhY2tcclxuICogQHR5cGUge2Z1bmN0aW9ufVxyXG4gKiBAcGFyYW0ge0Vycm9yfG51bGx9IGVycm9yIEVycm9yLCBpZiBhbnlcclxuICogQHBhcmFtIHsuLi4qfSBwYXJhbXMgQWRkaXRpb25hbCBhcmd1bWVudHNcclxuICogQHJldHVybnMge3VuZGVmaW5lZH1cclxuICovXHJcblxyXG4vKipcclxuICogUmV0dXJucyBhIHByb21pc2UgZnJvbSBhIG5vZGUtc3R5bGUgY2FsbGJhY2sgZnVuY3Rpb24uXHJcbiAqIEBtZW1iZXJvZiB1dGlsXHJcbiAqIEBwYXJhbSB7YXNQcm9taXNlQ2FsbGJhY2t9IGZuIEZ1bmN0aW9uIHRvIGNhbGxcclxuICogQHBhcmFtIHsqfSBjdHggRnVuY3Rpb24gY29udGV4dFxyXG4gKiBAcGFyYW0gey4uLip9IHBhcmFtcyBGdW5jdGlvbiBhcmd1bWVudHNcclxuICogQHJldHVybnMge1Byb21pc2U8Kj59IFByb21pc2lmaWVkIGZ1bmN0aW9uXHJcbiAqL1xyXG5mdW5jdGlvbiBhc1Byb21pc2UoZm4sIGN0eC8qLCB2YXJhcmdzICovKSB7XHJcbiAgICB2YXIgcGFyYW1zICA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSksXHJcbiAgICAgICAgb2Zmc2V0ICA9IDAsXHJcbiAgICAgICAgaW5kZXggICA9IDIsXHJcbiAgICAgICAgcGVuZGluZyA9IHRydWU7XHJcbiAgICB3aGlsZSAoaW5kZXggPCBhcmd1bWVudHMubGVuZ3RoKVxyXG4gICAgICAgIHBhcmFtc1tvZmZzZXQrK10gPSBhcmd1bWVudHNbaW5kZXgrK107XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gZXhlY3V0b3IocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAgICAgcGFyYW1zW29mZnNldF0gPSBmdW5jdGlvbiBjYWxsYmFjayhlcnIvKiwgdmFyYXJncyAqLykge1xyXG4gICAgICAgICAgICBpZiAocGVuZGluZykge1xyXG4gICAgICAgICAgICAgICAgcGVuZGluZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgaWYgKGVycilcclxuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBwYXJhbXMgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXQgPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChvZmZzZXQgPCBwYXJhbXMubGVuZ3RoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJhbXNbb2Zmc2V0KytdID0gYXJndW1lbnRzW29mZnNldF07XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZS5hcHBseShudWxsLCBwYXJhbXMpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBmbi5hcHBseShjdHggfHwgbnVsbCwgcGFyYW1zKTtcclxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgaWYgKHBlbmRpbmcpIHtcclxuICAgICAgICAgICAgICAgIHBlbmRpbmcgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4vKipcclxuICogQSBtaW5pbWFsIGJhc2U2NCBpbXBsZW1lbnRhdGlvbiBmb3IgbnVtYmVyIGFycmF5cy5cclxuICogQG1lbWJlcm9mIHV0aWxcclxuICogQG5hbWVzcGFjZVxyXG4gKi9cclxudmFyIGJhc2U2NCA9IGV4cG9ydHM7XHJcblxyXG4vKipcclxuICogQ2FsY3VsYXRlcyB0aGUgYnl0ZSBsZW5ndGggb2YgYSBiYXNlNjQgZW5jb2RlZCBzdHJpbmcuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgQmFzZTY0IGVuY29kZWQgc3RyaW5nXHJcbiAqIEByZXR1cm5zIHtudW1iZXJ9IEJ5dGUgbGVuZ3RoXHJcbiAqL1xyXG5iYXNlNjQubGVuZ3RoID0gZnVuY3Rpb24gbGVuZ3RoKHN0cmluZykge1xyXG4gICAgdmFyIHAgPSBzdHJpbmcubGVuZ3RoO1xyXG4gICAgaWYgKCFwKVxyXG4gICAgICAgIHJldHVybiAwO1xyXG4gICAgdmFyIG4gPSAwO1xyXG4gICAgd2hpbGUgKC0tcCAlIDQgPiAxICYmIHN0cmluZy5jaGFyQXQocCkgPT09IFwiPVwiKVxyXG4gICAgICAgICsrbjtcclxuICAgIHJldHVybiBNYXRoLmNlaWwoc3RyaW5nLmxlbmd0aCAqIDMpIC8gNCAtIG47XHJcbn07XHJcblxyXG4vLyBCYXNlNjQgZW5jb2RpbmcgdGFibGVcclxudmFyIGI2NCA9IG5ldyBBcnJheSg2NCk7XHJcblxyXG4vLyBCYXNlNjQgZGVjb2RpbmcgdGFibGVcclxudmFyIHM2NCA9IG5ldyBBcnJheSgxMjMpO1xyXG5cclxuLy8gNjUuLjkwLCA5Ny4uMTIyLCA0OC4uNTcsIDQzLCA0N1xyXG5mb3IgKHZhciBpID0gMDsgaSA8IDY0OylcclxuICAgIHM2NFtiNjRbaV0gPSBpIDwgMjYgPyBpICsgNjUgOiBpIDwgNTIgPyBpICsgNzEgOiBpIDwgNjIgPyBpIC0gNCA6IGkgLSA1OSB8IDQzXSA9IGkrKztcclxuXHJcbi8qKlxyXG4gKiBFbmNvZGVzIGEgYnVmZmVyIHRvIGEgYmFzZTY0IGVuY29kZWQgc3RyaW5nLlxyXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGJ1ZmZlciBTb3VyY2UgYnVmZmVyXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBzdGFydCBTb3VyY2Ugc3RhcnRcclxuICogQHBhcmFtIHtudW1iZXJ9IGVuZCBTb3VyY2UgZW5kXHJcbiAqIEByZXR1cm5zIHtzdHJpbmd9IEJhc2U2NCBlbmNvZGVkIHN0cmluZ1xyXG4gKi9cclxuYmFzZTY0LmVuY29kZSA9IGZ1bmN0aW9uIGVuY29kZShidWZmZXIsIHN0YXJ0LCBlbmQpIHtcclxuICAgIHZhciBwYXJ0cyA9IG51bGwsXHJcbiAgICAgICAgY2h1bmsgPSBbXTtcclxuICAgIHZhciBpID0gMCwgLy8gb3V0cHV0IGluZGV4XHJcbiAgICAgICAgaiA9IDAsIC8vIGdvdG8gaW5kZXhcclxuICAgICAgICB0OyAgICAgLy8gdGVtcG9yYXJ5XHJcbiAgICB3aGlsZSAoc3RhcnQgPCBlbmQpIHtcclxuICAgICAgICB2YXIgYiA9IGJ1ZmZlcltzdGFydCsrXTtcclxuICAgICAgICBzd2l0Y2ggKGopIHtcclxuICAgICAgICAgICAgY2FzZSAwOlxyXG4gICAgICAgICAgICAgICAgY2h1bmtbaSsrXSA9IGI2NFtiID4+IDJdO1xyXG4gICAgICAgICAgICAgICAgdCA9IChiICYgMykgPDwgNDtcclxuICAgICAgICAgICAgICAgIGogPSAxO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgMTpcclxuICAgICAgICAgICAgICAgIGNodW5rW2krK10gPSBiNjRbdCB8IGIgPj4gNF07XHJcbiAgICAgICAgICAgICAgICB0ID0gKGIgJiAxNSkgPDwgMjtcclxuICAgICAgICAgICAgICAgIGogPSAyO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgMjpcclxuICAgICAgICAgICAgICAgIGNodW5rW2krK10gPSBiNjRbdCB8IGIgPj4gNl07XHJcbiAgICAgICAgICAgICAgICBjaHVua1tpKytdID0gYjY0W2IgJiA2M107XHJcbiAgICAgICAgICAgICAgICBqID0gMDtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoaSA+IDgxOTEpIHtcclxuICAgICAgICAgICAgKHBhcnRzIHx8IChwYXJ0cyA9IFtdKSkucHVzaChTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KFN0cmluZywgY2h1bmspKTtcclxuICAgICAgICAgICAgaSA9IDA7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYgKGopIHtcclxuICAgICAgICBjaHVua1tpKytdID0gYjY0W3RdO1xyXG4gICAgICAgIGNodW5rW2krK10gPSA2MTtcclxuICAgICAgICBpZiAoaiA9PT0gMSlcclxuICAgICAgICAgICAgY2h1bmtbaSsrXSA9IDYxO1xyXG4gICAgfVxyXG4gICAgaWYgKHBhcnRzKSB7XHJcbiAgICAgICAgaWYgKGkpXHJcbiAgICAgICAgICAgIHBhcnRzLnB1c2goU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShTdHJpbmcsIGNodW5rLnNsaWNlKDAsIGkpKSk7XHJcbiAgICAgICAgcmV0dXJuIHBhcnRzLmpvaW4oXCJcIik7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShTdHJpbmcsIGNodW5rLnNsaWNlKDAsIGkpKTtcclxufTtcclxuXHJcbnZhciBpbnZhbGlkRW5jb2RpbmcgPSBcImludmFsaWQgZW5jb2RpbmdcIjtcclxuXHJcbi8qKlxyXG4gKiBEZWNvZGVzIGEgYmFzZTY0IGVuY29kZWQgc3RyaW5nIHRvIGEgYnVmZmVyLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIFNvdXJjZSBzdHJpbmdcclxuICogQHBhcmFtIHtVaW50OEFycmF5fSBidWZmZXIgRGVzdGluYXRpb24gYnVmZmVyXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBvZmZzZXQgRGVzdGluYXRpb24gb2Zmc2V0XHJcbiAqIEByZXR1cm5zIHtudW1iZXJ9IE51bWJlciBvZiBieXRlcyB3cml0dGVuXHJcbiAqIEB0aHJvd3Mge0Vycm9yfSBJZiBlbmNvZGluZyBpcyBpbnZhbGlkXHJcbiAqL1xyXG5iYXNlNjQuZGVjb2RlID0gZnVuY3Rpb24gZGVjb2RlKHN0cmluZywgYnVmZmVyLCBvZmZzZXQpIHtcclxuICAgIHZhciBzdGFydCA9IG9mZnNldDtcclxuICAgIHZhciBqID0gMCwgLy8gZ290byBpbmRleFxyXG4gICAgICAgIHQ7ICAgICAvLyB0ZW1wb3JhcnlcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyaW5nLmxlbmd0aDspIHtcclxuICAgICAgICB2YXIgYyA9IHN0cmluZy5jaGFyQ29kZUF0KGkrKyk7XHJcbiAgICAgICAgaWYgKGMgPT09IDYxICYmIGogPiAxKVxyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBpZiAoKGMgPSBzNjRbY10pID09PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgIHRocm93IEVycm9yKGludmFsaWRFbmNvZGluZyk7XHJcbiAgICAgICAgc3dpdGNoIChqKSB7XHJcbiAgICAgICAgICAgIGNhc2UgMDpcclxuICAgICAgICAgICAgICAgIHQgPSBjO1xyXG4gICAgICAgICAgICAgICAgaiA9IDE7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAxOlxyXG4gICAgICAgICAgICAgICAgYnVmZmVyW29mZnNldCsrXSA9IHQgPDwgMiB8IChjICYgNDgpID4+IDQ7XHJcbiAgICAgICAgICAgICAgICB0ID0gYztcclxuICAgICAgICAgICAgICAgIGogPSAyO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgMjpcclxuICAgICAgICAgICAgICAgIGJ1ZmZlcltvZmZzZXQrK10gPSAodCAmIDE1KSA8PCA0IHwgKGMgJiA2MCkgPj4gMjtcclxuICAgICAgICAgICAgICAgIHQgPSBjO1xyXG4gICAgICAgICAgICAgICAgaiA9IDM7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAzOlxyXG4gICAgICAgICAgICAgICAgYnVmZmVyW29mZnNldCsrXSA9ICh0ICYgMykgPDwgNiB8IGM7XHJcbiAgICAgICAgICAgICAgICBqID0gMDtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmIChqID09PSAxKVxyXG4gICAgICAgIHRocm93IEVycm9yKGludmFsaWRFbmNvZGluZyk7XHJcbiAgICByZXR1cm4gb2Zmc2V0IC0gc3RhcnQ7XHJcbn07XHJcblxyXG4vKipcclxuICogVGVzdHMgaWYgdGhlIHNwZWNpZmllZCBzdHJpbmcgYXBwZWFycyB0byBiZSBiYXNlNjQgZW5jb2RlZC5cclxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyBTdHJpbmcgdG8gdGVzdFxyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gYHRydWVgIGlmIHByb2JhYmx5IGJhc2U2NCBlbmNvZGVkLCBvdGhlcndpc2UgZmFsc2VcclxuICovXHJcbmJhc2U2NC50ZXN0ID0gZnVuY3Rpb24gdGVzdChzdHJpbmcpIHtcclxuICAgIHJldHVybiAvXig/OltBLVphLXowLTkrL117NH0pKig/OltBLVphLXowLTkrL117Mn09PXxbQS1aYS16MC05Ky9dezN9PSk/JC8udGVzdChzdHJpbmcpO1xyXG59O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XHJcblxyXG4vKipcclxuICogQ29uc3RydWN0cyBhIG5ldyBldmVudCBlbWl0dGVyIGluc3RhbmNlLlxyXG4gKiBAY2xhc3NkZXNjIEEgbWluaW1hbCBldmVudCBlbWl0dGVyLlxyXG4gKiBAbWVtYmVyb2YgdXRpbFxyXG4gKiBAY29uc3RydWN0b3JcclxuICovXHJcbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlZ2lzdGVyZWQgbGlzdGVuZXJzLlxyXG4gICAgICogQHR5cGUge09iamVjdC48c3RyaW5nLCo+fVxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgdGhpcy5fbGlzdGVuZXJzID0ge307XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBSZWdpc3RlcnMgYW4gZXZlbnQgbGlzdGVuZXIuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBldnQgRXZlbnQgbmFtZVxyXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBmbiBMaXN0ZW5lclxyXG4gKiBAcGFyYW0geyp9IFtjdHhdIExpc3RlbmVyIGNvbnRleHRcclxuICogQHJldHVybnMge3V0aWwuRXZlbnRFbWl0dGVyfSBgdGhpc2BcclxuICovXHJcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBmdW5jdGlvbiBvbihldnQsIGZuLCBjdHgpIHtcclxuICAgICh0aGlzLl9saXN0ZW5lcnNbZXZ0XSB8fCAodGhpcy5fbGlzdGVuZXJzW2V2dF0gPSBbXSkpLnB1c2goe1xyXG4gICAgICAgIGZuICA6IGZuLFxyXG4gICAgICAgIGN0eCA6IGN0eCB8fCB0aGlzXHJcbiAgICB9KTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlbW92ZXMgYW4gZXZlbnQgbGlzdGVuZXIgb3IgYW55IG1hdGNoaW5nIGxpc3RlbmVycyBpZiBhcmd1bWVudHMgYXJlIG9taXR0ZWQuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBbZXZ0XSBFdmVudCBuYW1lLiBSZW1vdmVzIGFsbCBsaXN0ZW5lcnMgaWYgb21pdHRlZC5cclxuICogQHBhcmFtIHtmdW5jdGlvbn0gW2ZuXSBMaXN0ZW5lciB0byByZW1vdmUuIFJlbW92ZXMgYWxsIGxpc3RlbmVycyBvZiBgZXZ0YCBpZiBvbWl0dGVkLlxyXG4gKiBAcmV0dXJucyB7dXRpbC5FdmVudEVtaXR0ZXJ9IGB0aGlzYFxyXG4gKi9cclxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vZmYgPSBmdW5jdGlvbiBvZmYoZXZ0LCBmbikge1xyXG4gICAgaWYgKGV2dCA9PT0gdW5kZWZpbmVkKVxyXG4gICAgICAgIHRoaXMuX2xpc3RlbmVycyA9IHt9O1xyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgaWYgKGZuID09PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgIHRoaXMuX2xpc3RlbmVyc1tldnRdID0gW107XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9saXN0ZW5lcnNbZXZ0XTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaXN0ZW5lcnMubGVuZ3RoOylcclxuICAgICAgICAgICAgICAgIGlmIChsaXN0ZW5lcnNbaV0uZm4gPT09IGZuKVxyXG4gICAgICAgICAgICAgICAgICAgIGxpc3RlbmVycy5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgKytpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEVtaXRzIGFuIGV2ZW50IGJ5IGNhbGxpbmcgaXRzIGxpc3RlbmVycyB3aXRoIHRoZSBzcGVjaWZpZWQgYXJndW1lbnRzLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gZXZ0IEV2ZW50IG5hbWVcclxuICogQHBhcmFtIHsuLi4qfSBhcmdzIEFyZ3VtZW50c1xyXG4gKiBAcmV0dXJucyB7dXRpbC5FdmVudEVtaXR0ZXJ9IGB0aGlzYFxyXG4gKi9cclxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24gZW1pdChldnQpIHtcclxuICAgIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9saXN0ZW5lcnNbZXZ0XTtcclxuICAgIGlmIChsaXN0ZW5lcnMpIHtcclxuICAgICAgICB2YXIgYXJncyA9IFtdLFxyXG4gICAgICAgICAgICBpID0gMTtcclxuICAgICAgICBmb3IgKDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7KVxyXG4gICAgICAgICAgICBhcmdzLnB1c2goYXJndW1lbnRzW2krK10pO1xyXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsaXN0ZW5lcnMubGVuZ3RoOylcclxuICAgICAgICAgICAgbGlzdGVuZXJzW2ldLmZuLmFwcGx5KGxpc3RlbmVyc1tpKytdLmN0eCwgYXJncyk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoZmFjdG9yeSk7XHJcblxyXG4vKipcclxuICogUmVhZHMgLyB3cml0ZXMgZmxvYXRzIC8gZG91YmxlcyBmcm9tIC8gdG8gYnVmZmVycy5cclxuICogQG5hbWUgdXRpbC5mbG9hdFxyXG4gKiBAbmFtZXNwYWNlXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIFdyaXRlcyBhIDMyIGJpdCBmbG9hdCB0byBhIGJ1ZmZlciB1c2luZyBsaXR0bGUgZW5kaWFuIGJ5dGUgb3JkZXIuXHJcbiAqIEBuYW1lIHV0aWwuZmxvYXQud3JpdGVGbG9hdExFXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcGFyYW0ge251bWJlcn0gdmFsIFZhbHVlIHRvIHdyaXRlXHJcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYnVmIFRhcmdldCBidWZmZXJcclxuICogQHBhcmFtIHtudW1iZXJ9IHBvcyBUYXJnZXQgYnVmZmVyIG9mZnNldFxyXG4gKiBAcmV0dXJucyB7dW5kZWZpbmVkfVxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBXcml0ZXMgYSAzMiBiaXQgZmxvYXQgdG8gYSBidWZmZXIgdXNpbmcgYmlnIGVuZGlhbiBieXRlIG9yZGVyLlxyXG4gKiBAbmFtZSB1dGlsLmZsb2F0LndyaXRlRmxvYXRCRVxyXG4gKiBAZnVuY3Rpb25cclxuICogQHBhcmFtIHtudW1iZXJ9IHZhbCBWYWx1ZSB0byB3cml0ZVxyXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGJ1ZiBUYXJnZXQgYnVmZmVyXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBwb3MgVGFyZ2V0IGJ1ZmZlciBvZmZzZXRcclxuICogQHJldHVybnMge3VuZGVmaW5lZH1cclxuICovXHJcblxyXG4vKipcclxuICogUmVhZHMgYSAzMiBiaXQgZmxvYXQgZnJvbSBhIGJ1ZmZlciB1c2luZyBsaXR0bGUgZW5kaWFuIGJ5dGUgb3JkZXIuXHJcbiAqIEBuYW1lIHV0aWwuZmxvYXQucmVhZEZsb2F0TEVcclxuICogQGZ1bmN0aW9uXHJcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYnVmIFNvdXJjZSBidWZmZXJcclxuICogQHBhcmFtIHtudW1iZXJ9IHBvcyBTb3VyY2UgYnVmZmVyIG9mZnNldFxyXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBWYWx1ZSByZWFkXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIFJlYWRzIGEgMzIgYml0IGZsb2F0IGZyb20gYSBidWZmZXIgdXNpbmcgYmlnIGVuZGlhbiBieXRlIG9yZGVyLlxyXG4gKiBAbmFtZSB1dGlsLmZsb2F0LnJlYWRGbG9hdEJFXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGJ1ZiBTb3VyY2UgYnVmZmVyXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBwb3MgU291cmNlIGJ1ZmZlciBvZmZzZXRcclxuICogQHJldHVybnMge251bWJlcn0gVmFsdWUgcmVhZFxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBXcml0ZXMgYSA2NCBiaXQgZG91YmxlIHRvIGEgYnVmZmVyIHVzaW5nIGxpdHRsZSBlbmRpYW4gYnl0ZSBvcmRlci5cclxuICogQG5hbWUgdXRpbC5mbG9hdC53cml0ZURvdWJsZUxFXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcGFyYW0ge251bWJlcn0gdmFsIFZhbHVlIHRvIHdyaXRlXHJcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYnVmIFRhcmdldCBidWZmZXJcclxuICogQHBhcmFtIHtudW1iZXJ9IHBvcyBUYXJnZXQgYnVmZmVyIG9mZnNldFxyXG4gKiBAcmV0dXJucyB7dW5kZWZpbmVkfVxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBXcml0ZXMgYSA2NCBiaXQgZG91YmxlIHRvIGEgYnVmZmVyIHVzaW5nIGJpZyBlbmRpYW4gYnl0ZSBvcmRlci5cclxuICogQG5hbWUgdXRpbC5mbG9hdC53cml0ZURvdWJsZUJFXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcGFyYW0ge251bWJlcn0gdmFsIFZhbHVlIHRvIHdyaXRlXHJcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYnVmIFRhcmdldCBidWZmZXJcclxuICogQHBhcmFtIHtudW1iZXJ9IHBvcyBUYXJnZXQgYnVmZmVyIG9mZnNldFxyXG4gKiBAcmV0dXJucyB7dW5kZWZpbmVkfVxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBSZWFkcyBhIDY0IGJpdCBkb3VibGUgZnJvbSBhIGJ1ZmZlciB1c2luZyBsaXR0bGUgZW5kaWFuIGJ5dGUgb3JkZXIuXHJcbiAqIEBuYW1lIHV0aWwuZmxvYXQucmVhZERvdWJsZUxFXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGJ1ZiBTb3VyY2UgYnVmZmVyXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBwb3MgU291cmNlIGJ1ZmZlciBvZmZzZXRcclxuICogQHJldHVybnMge251bWJlcn0gVmFsdWUgcmVhZFxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBSZWFkcyBhIDY0IGJpdCBkb3VibGUgZnJvbSBhIGJ1ZmZlciB1c2luZyBiaWcgZW5kaWFuIGJ5dGUgb3JkZXIuXHJcbiAqIEBuYW1lIHV0aWwuZmxvYXQucmVhZERvdWJsZUJFXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGJ1ZiBTb3VyY2UgYnVmZmVyXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBwb3MgU291cmNlIGJ1ZmZlciBvZmZzZXRcclxuICogQHJldHVybnMge251bWJlcn0gVmFsdWUgcmVhZFxyXG4gKi9cclxuXHJcbi8vIEZhY3RvcnkgZnVuY3Rpb24gZm9yIHRoZSBwdXJwb3NlIG9mIG5vZGUtYmFzZWQgdGVzdGluZyBpbiBtb2RpZmllZCBnbG9iYWwgZW52aXJvbm1lbnRzXHJcbmZ1bmN0aW9uIGZhY3RvcnkoZXhwb3J0cykge1xyXG5cclxuICAgIC8vIGZsb2F0OiB0eXBlZCBhcnJheVxyXG4gICAgaWYgKHR5cGVvZiBGbG9hdDMyQXJyYXkgIT09IFwidW5kZWZpbmVkXCIpIChmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgICAgdmFyIGYzMiA9IG5ldyBGbG9hdDMyQXJyYXkoWyAtMCBdKSxcclxuICAgICAgICAgICAgZjhiID0gbmV3IFVpbnQ4QXJyYXkoZjMyLmJ1ZmZlciksXHJcbiAgICAgICAgICAgIGxlICA9IGY4YlszXSA9PT0gMTI4O1xyXG5cclxuICAgICAgICBmdW5jdGlvbiB3cml0ZUZsb2F0X2YzMl9jcHkodmFsLCBidWYsIHBvcykge1xyXG4gICAgICAgICAgICBmMzJbMF0gPSB2YWw7XHJcbiAgICAgICAgICAgIGJ1Zltwb3MgICAgXSA9IGY4YlswXTtcclxuICAgICAgICAgICAgYnVmW3BvcyArIDFdID0gZjhiWzFdO1xyXG4gICAgICAgICAgICBidWZbcG9zICsgMl0gPSBmOGJbMl07XHJcbiAgICAgICAgICAgIGJ1Zltwb3MgKyAzXSA9IGY4YlszXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHdyaXRlRmxvYXRfZjMyX3Jldih2YWwsIGJ1ZiwgcG9zKSB7XHJcbiAgICAgICAgICAgIGYzMlswXSA9IHZhbDtcclxuICAgICAgICAgICAgYnVmW3BvcyAgICBdID0gZjhiWzNdO1xyXG4gICAgICAgICAgICBidWZbcG9zICsgMV0gPSBmOGJbMl07XHJcbiAgICAgICAgICAgIGJ1Zltwb3MgKyAyXSA9IGY4YlsxXTtcclxuICAgICAgICAgICAgYnVmW3BvcyArIDNdID0gZjhiWzBdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgICAgICBleHBvcnRzLndyaXRlRmxvYXRMRSA9IGxlID8gd3JpdGVGbG9hdF9mMzJfY3B5IDogd3JpdGVGbG9hdF9mMzJfcmV2O1xyXG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICAgICAgZXhwb3J0cy53cml0ZUZsb2F0QkUgPSBsZSA/IHdyaXRlRmxvYXRfZjMyX3JldiA6IHdyaXRlRmxvYXRfZjMyX2NweTtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gcmVhZEZsb2F0X2YzMl9jcHkoYnVmLCBwb3MpIHtcclxuICAgICAgICAgICAgZjhiWzBdID0gYnVmW3BvcyAgICBdO1xyXG4gICAgICAgICAgICBmOGJbMV0gPSBidWZbcG9zICsgMV07XHJcbiAgICAgICAgICAgIGY4YlsyXSA9IGJ1Zltwb3MgKyAyXTtcclxuICAgICAgICAgICAgZjhiWzNdID0gYnVmW3BvcyArIDNdO1xyXG4gICAgICAgICAgICByZXR1cm4gZjMyWzBdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gcmVhZEZsb2F0X2YzMl9yZXYoYnVmLCBwb3MpIHtcclxuICAgICAgICAgICAgZjhiWzNdID0gYnVmW3BvcyAgICBdO1xyXG4gICAgICAgICAgICBmOGJbMl0gPSBidWZbcG9zICsgMV07XHJcbiAgICAgICAgICAgIGY4YlsxXSA9IGJ1Zltwb3MgKyAyXTtcclxuICAgICAgICAgICAgZjhiWzBdID0gYnVmW3BvcyArIDNdO1xyXG4gICAgICAgICAgICByZXR1cm4gZjMyWzBdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgICAgICBleHBvcnRzLnJlYWRGbG9hdExFID0gbGUgPyByZWFkRmxvYXRfZjMyX2NweSA6IHJlYWRGbG9hdF9mMzJfcmV2O1xyXG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICAgICAgZXhwb3J0cy5yZWFkRmxvYXRCRSA9IGxlID8gcmVhZEZsb2F0X2YzMl9yZXYgOiByZWFkRmxvYXRfZjMyX2NweTtcclxuXHJcbiAgICAvLyBmbG9hdDogaWVlZTc1NFxyXG4gICAgfSkoKTsgZWxzZSAoZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHdyaXRlRmxvYXRfaWVlZTc1NCh3cml0ZVVpbnQsIHZhbCwgYnVmLCBwb3MpIHtcclxuICAgICAgICAgICAgdmFyIHNpZ24gPSB2YWwgPCAwID8gMSA6IDA7XHJcbiAgICAgICAgICAgIGlmIChzaWduKVxyXG4gICAgICAgICAgICAgICAgdmFsID0gLXZhbDtcclxuICAgICAgICAgICAgaWYgKHZhbCA9PT0gMClcclxuICAgICAgICAgICAgICAgIHdyaXRlVWludCgxIC8gdmFsID4gMCA/IC8qIHBvc2l0aXZlICovIDAgOiAvKiBuZWdhdGl2ZSAwICovIDIxNDc0ODM2NDgsIGJ1ZiwgcG9zKTtcclxuICAgICAgICAgICAgZWxzZSBpZiAoaXNOYU4odmFsKSlcclxuICAgICAgICAgICAgICAgIHdyaXRlVWludCgyMTQzMjg5MzQ0LCBidWYsIHBvcyk7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKHZhbCA+IDMuNDAyODIzNDY2Mzg1Mjg4NmUrMzgpIC8vICstSW5maW5pdHlcclxuICAgICAgICAgICAgICAgIHdyaXRlVWludCgoc2lnbiA8PCAzMSB8IDIxMzkwOTUwNDApID4+PiAwLCBidWYsIHBvcyk7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKHZhbCA8IDEuMTc1NDk0MzUwODIyMjg3NWUtMzgpIC8vIGRlbm9ybWFsXHJcbiAgICAgICAgICAgICAgICB3cml0ZVVpbnQoKHNpZ24gPDwgMzEgfCBNYXRoLnJvdW5kKHZhbCAvIDEuNDAxMjk4NDY0MzI0ODE3ZS00NSkpID4+PiAwLCBidWYsIHBvcyk7XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdmFyIGV4cG9uZW50ID0gTWF0aC5mbG9vcihNYXRoLmxvZyh2YWwpIC8gTWF0aC5MTjIpLFxyXG4gICAgICAgICAgICAgICAgICAgIG1hbnRpc3NhID0gTWF0aC5yb3VuZCh2YWwgKiBNYXRoLnBvdygyLCAtZXhwb25lbnQpICogODM4ODYwOCkgJiA4Mzg4NjA3O1xyXG4gICAgICAgICAgICAgICAgd3JpdGVVaW50KChzaWduIDw8IDMxIHwgZXhwb25lbnQgKyAxMjcgPDwgMjMgfCBtYW50aXNzYSkgPj4+IDAsIGJ1ZiwgcG9zKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZXhwb3J0cy53cml0ZUZsb2F0TEUgPSB3cml0ZUZsb2F0X2llZWU3NTQuYmluZChudWxsLCB3cml0ZVVpbnRMRSk7XHJcbiAgICAgICAgZXhwb3J0cy53cml0ZUZsb2F0QkUgPSB3cml0ZUZsb2F0X2llZWU3NTQuYmluZChudWxsLCB3cml0ZVVpbnRCRSk7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHJlYWRGbG9hdF9pZWVlNzU0KHJlYWRVaW50LCBidWYsIHBvcykge1xyXG4gICAgICAgICAgICB2YXIgdWludCA9IHJlYWRVaW50KGJ1ZiwgcG9zKSxcclxuICAgICAgICAgICAgICAgIHNpZ24gPSAodWludCA+PiAzMSkgKiAyICsgMSxcclxuICAgICAgICAgICAgICAgIGV4cG9uZW50ID0gdWludCA+Pj4gMjMgJiAyNTUsXHJcbiAgICAgICAgICAgICAgICBtYW50aXNzYSA9IHVpbnQgJiA4Mzg4NjA3O1xyXG4gICAgICAgICAgICByZXR1cm4gZXhwb25lbnQgPT09IDI1NVxyXG4gICAgICAgICAgICAgICAgPyBtYW50aXNzYVxyXG4gICAgICAgICAgICAgICAgPyBOYU5cclxuICAgICAgICAgICAgICAgIDogc2lnbiAqIEluZmluaXR5XHJcbiAgICAgICAgICAgICAgICA6IGV4cG9uZW50ID09PSAwIC8vIGRlbm9ybWFsXHJcbiAgICAgICAgICAgICAgICA/IHNpZ24gKiAxLjQwMTI5ODQ2NDMyNDgxN2UtNDUgKiBtYW50aXNzYVxyXG4gICAgICAgICAgICAgICAgOiBzaWduICogTWF0aC5wb3coMiwgZXhwb25lbnQgLSAxNTApICogKG1hbnRpc3NhICsgODM4ODYwOCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBleHBvcnRzLnJlYWRGbG9hdExFID0gcmVhZEZsb2F0X2llZWU3NTQuYmluZChudWxsLCByZWFkVWludExFKTtcclxuICAgICAgICBleHBvcnRzLnJlYWRGbG9hdEJFID0gcmVhZEZsb2F0X2llZWU3NTQuYmluZChudWxsLCByZWFkVWludEJFKTtcclxuXHJcbiAgICB9KSgpO1xyXG5cclxuICAgIC8vIGRvdWJsZTogdHlwZWQgYXJyYXlcclxuICAgIGlmICh0eXBlb2YgRmxvYXQ2NEFycmF5ICE9PSBcInVuZGVmaW5lZFwiKSAoZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICAgIHZhciBmNjQgPSBuZXcgRmxvYXQ2NEFycmF5KFstMF0pLFxyXG4gICAgICAgICAgICBmOGIgPSBuZXcgVWludDhBcnJheShmNjQuYnVmZmVyKSxcclxuICAgICAgICAgICAgbGUgID0gZjhiWzddID09PSAxMjg7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHdyaXRlRG91YmxlX2Y2NF9jcHkodmFsLCBidWYsIHBvcykge1xyXG4gICAgICAgICAgICBmNjRbMF0gPSB2YWw7XHJcbiAgICAgICAgICAgIGJ1Zltwb3MgICAgXSA9IGY4YlswXTtcclxuICAgICAgICAgICAgYnVmW3BvcyArIDFdID0gZjhiWzFdO1xyXG4gICAgICAgICAgICBidWZbcG9zICsgMl0gPSBmOGJbMl07XHJcbiAgICAgICAgICAgIGJ1Zltwb3MgKyAzXSA9IGY4YlszXTtcclxuICAgICAgICAgICAgYnVmW3BvcyArIDRdID0gZjhiWzRdO1xyXG4gICAgICAgICAgICBidWZbcG9zICsgNV0gPSBmOGJbNV07XHJcbiAgICAgICAgICAgIGJ1Zltwb3MgKyA2XSA9IGY4Yls2XTtcclxuICAgICAgICAgICAgYnVmW3BvcyArIDddID0gZjhiWzddO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gd3JpdGVEb3VibGVfZjY0X3Jldih2YWwsIGJ1ZiwgcG9zKSB7XHJcbiAgICAgICAgICAgIGY2NFswXSA9IHZhbDtcclxuICAgICAgICAgICAgYnVmW3BvcyAgICBdID0gZjhiWzddO1xyXG4gICAgICAgICAgICBidWZbcG9zICsgMV0gPSBmOGJbNl07XHJcbiAgICAgICAgICAgIGJ1Zltwb3MgKyAyXSA9IGY4Yls1XTtcclxuICAgICAgICAgICAgYnVmW3BvcyArIDNdID0gZjhiWzRdO1xyXG4gICAgICAgICAgICBidWZbcG9zICsgNF0gPSBmOGJbM107XHJcbiAgICAgICAgICAgIGJ1Zltwb3MgKyA1XSA9IGY4YlsyXTtcclxuICAgICAgICAgICAgYnVmW3BvcyArIDZdID0gZjhiWzFdO1xyXG4gICAgICAgICAgICBidWZbcG9zICsgN10gPSBmOGJbMF07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgICAgIGV4cG9ydHMud3JpdGVEb3VibGVMRSA9IGxlID8gd3JpdGVEb3VibGVfZjY0X2NweSA6IHdyaXRlRG91YmxlX2Y2NF9yZXY7XHJcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgICAgICBleHBvcnRzLndyaXRlRG91YmxlQkUgPSBsZSA/IHdyaXRlRG91YmxlX2Y2NF9yZXYgOiB3cml0ZURvdWJsZV9mNjRfY3B5O1xyXG5cclxuICAgICAgICBmdW5jdGlvbiByZWFkRG91YmxlX2Y2NF9jcHkoYnVmLCBwb3MpIHtcclxuICAgICAgICAgICAgZjhiWzBdID0gYnVmW3BvcyAgICBdO1xyXG4gICAgICAgICAgICBmOGJbMV0gPSBidWZbcG9zICsgMV07XHJcbiAgICAgICAgICAgIGY4YlsyXSA9IGJ1Zltwb3MgKyAyXTtcclxuICAgICAgICAgICAgZjhiWzNdID0gYnVmW3BvcyArIDNdO1xyXG4gICAgICAgICAgICBmOGJbNF0gPSBidWZbcG9zICsgNF07XHJcbiAgICAgICAgICAgIGY4Yls1XSA9IGJ1Zltwb3MgKyA1XTtcclxuICAgICAgICAgICAgZjhiWzZdID0gYnVmW3BvcyArIDZdO1xyXG4gICAgICAgICAgICBmOGJbN10gPSBidWZbcG9zICsgN107XHJcbiAgICAgICAgICAgIHJldHVybiBmNjRbMF07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiByZWFkRG91YmxlX2Y2NF9yZXYoYnVmLCBwb3MpIHtcclxuICAgICAgICAgICAgZjhiWzddID0gYnVmW3BvcyAgICBdO1xyXG4gICAgICAgICAgICBmOGJbNl0gPSBidWZbcG9zICsgMV07XHJcbiAgICAgICAgICAgIGY4Yls1XSA9IGJ1Zltwb3MgKyAyXTtcclxuICAgICAgICAgICAgZjhiWzRdID0gYnVmW3BvcyArIDNdO1xyXG4gICAgICAgICAgICBmOGJbM10gPSBidWZbcG9zICsgNF07XHJcbiAgICAgICAgICAgIGY4YlsyXSA9IGJ1Zltwb3MgKyA1XTtcclxuICAgICAgICAgICAgZjhiWzFdID0gYnVmW3BvcyArIDZdO1xyXG4gICAgICAgICAgICBmOGJbMF0gPSBidWZbcG9zICsgN107XHJcbiAgICAgICAgICAgIHJldHVybiBmNjRbMF07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgICAgIGV4cG9ydHMucmVhZERvdWJsZUxFID0gbGUgPyByZWFkRG91YmxlX2Y2NF9jcHkgOiByZWFkRG91YmxlX2Y2NF9yZXY7XHJcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgICAgICBleHBvcnRzLnJlYWREb3VibGVCRSA9IGxlID8gcmVhZERvdWJsZV9mNjRfcmV2IDogcmVhZERvdWJsZV9mNjRfY3B5O1xyXG5cclxuICAgIC8vIGRvdWJsZTogaWVlZTc1NFxyXG4gICAgfSkoKTsgZWxzZSAoZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHdyaXRlRG91YmxlX2llZWU3NTQod3JpdGVVaW50LCBvZmYwLCBvZmYxLCB2YWwsIGJ1ZiwgcG9zKSB7XHJcbiAgICAgICAgICAgIHZhciBzaWduID0gdmFsIDwgMCA/IDEgOiAwO1xyXG4gICAgICAgICAgICBpZiAoc2lnbilcclxuICAgICAgICAgICAgICAgIHZhbCA9IC12YWw7XHJcbiAgICAgICAgICAgIGlmICh2YWwgPT09IDApIHtcclxuICAgICAgICAgICAgICAgIHdyaXRlVWludCgwLCBidWYsIHBvcyArIG9mZjApO1xyXG4gICAgICAgICAgICAgICAgd3JpdGVVaW50KDEgLyB2YWwgPiAwID8gLyogcG9zaXRpdmUgKi8gMCA6IC8qIG5lZ2F0aXZlIDAgKi8gMjE0NzQ4MzY0OCwgYnVmLCBwb3MgKyBvZmYxKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChpc05hTih2YWwpKSB7XHJcbiAgICAgICAgICAgICAgICB3cml0ZVVpbnQoMCwgYnVmLCBwb3MgKyBvZmYwKTtcclxuICAgICAgICAgICAgICAgIHdyaXRlVWludCgyMTQ2OTU5MzYwLCBidWYsIHBvcyArIG9mZjEpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHZhbCA+IDEuNzk3NjkzMTM0ODYyMzE1N2UrMzA4KSB7IC8vICstSW5maW5pdHlcclxuICAgICAgICAgICAgICAgIHdyaXRlVWludCgwLCBidWYsIHBvcyArIG9mZjApO1xyXG4gICAgICAgICAgICAgICAgd3JpdGVVaW50KChzaWduIDw8IDMxIHwgMjE0NjQzNTA3MikgPj4+IDAsIGJ1ZiwgcG9zICsgb2ZmMSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbWFudGlzc2E7XHJcbiAgICAgICAgICAgICAgICBpZiAodmFsIDwgMi4yMjUwNzM4NTg1MDcyMDE0ZS0zMDgpIHsgLy8gZGVub3JtYWxcclxuICAgICAgICAgICAgICAgICAgICBtYW50aXNzYSA9IHZhbCAvIDVlLTMyNDtcclxuICAgICAgICAgICAgICAgICAgICB3cml0ZVVpbnQobWFudGlzc2EgPj4+IDAsIGJ1ZiwgcG9zICsgb2ZmMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVVaW50KChzaWduIDw8IDMxIHwgbWFudGlzc2EgLyA0Mjk0OTY3Mjk2KSA+Pj4gMCwgYnVmLCBwb3MgKyBvZmYxKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGV4cG9uZW50ID0gTWF0aC5mbG9vcihNYXRoLmxvZyh2YWwpIC8gTWF0aC5MTjIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChleHBvbmVudCA9PT0gMTAyNClcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXhwb25lbnQgPSAxMDIzO1xyXG4gICAgICAgICAgICAgICAgICAgIG1hbnRpc3NhID0gdmFsICogTWF0aC5wb3coMiwgLWV4cG9uZW50KTtcclxuICAgICAgICAgICAgICAgICAgICB3cml0ZVVpbnQobWFudGlzc2EgKiA0NTAzNTk5NjI3MzcwNDk2ID4+PiAwLCBidWYsIHBvcyArIG9mZjApO1xyXG4gICAgICAgICAgICAgICAgICAgIHdyaXRlVWludCgoc2lnbiA8PCAzMSB8IGV4cG9uZW50ICsgMTAyMyA8PCAyMCB8IG1hbnRpc3NhICogMTA0ODU3NiAmIDEwNDg1NzUpID4+PiAwLCBidWYsIHBvcyArIG9mZjEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBleHBvcnRzLndyaXRlRG91YmxlTEUgPSB3cml0ZURvdWJsZV9pZWVlNzU0LmJpbmQobnVsbCwgd3JpdGVVaW50TEUsIDAsIDQpO1xyXG4gICAgICAgIGV4cG9ydHMud3JpdGVEb3VibGVCRSA9IHdyaXRlRG91YmxlX2llZWU3NTQuYmluZChudWxsLCB3cml0ZVVpbnRCRSwgNCwgMCk7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHJlYWREb3VibGVfaWVlZTc1NChyZWFkVWludCwgb2ZmMCwgb2ZmMSwgYnVmLCBwb3MpIHtcclxuICAgICAgICAgICAgdmFyIGxvID0gcmVhZFVpbnQoYnVmLCBwb3MgKyBvZmYwKSxcclxuICAgICAgICAgICAgICAgIGhpID0gcmVhZFVpbnQoYnVmLCBwb3MgKyBvZmYxKTtcclxuICAgICAgICAgICAgdmFyIHNpZ24gPSAoaGkgPj4gMzEpICogMiArIDEsXHJcbiAgICAgICAgICAgICAgICBleHBvbmVudCA9IGhpID4+PiAyMCAmIDIwNDcsXHJcbiAgICAgICAgICAgICAgICBtYW50aXNzYSA9IDQyOTQ5NjcyOTYgKiAoaGkgJiAxMDQ4NTc1KSArIGxvO1xyXG4gICAgICAgICAgICByZXR1cm4gZXhwb25lbnQgPT09IDIwNDdcclxuICAgICAgICAgICAgICAgID8gbWFudGlzc2FcclxuICAgICAgICAgICAgICAgID8gTmFOXHJcbiAgICAgICAgICAgICAgICA6IHNpZ24gKiBJbmZpbml0eVxyXG4gICAgICAgICAgICAgICAgOiBleHBvbmVudCA9PT0gMCAvLyBkZW5vcm1hbFxyXG4gICAgICAgICAgICAgICAgPyBzaWduICogNWUtMzI0ICogbWFudGlzc2FcclxuICAgICAgICAgICAgICAgIDogc2lnbiAqIE1hdGgucG93KDIsIGV4cG9uZW50IC0gMTA3NSkgKiAobWFudGlzc2EgKyA0NTAzNTk5NjI3MzcwNDk2KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGV4cG9ydHMucmVhZERvdWJsZUxFID0gcmVhZERvdWJsZV9pZWVlNzU0LmJpbmQobnVsbCwgcmVhZFVpbnRMRSwgMCwgNCk7XHJcbiAgICAgICAgZXhwb3J0cy5yZWFkRG91YmxlQkUgPSByZWFkRG91YmxlX2llZWU3NTQuYmluZChudWxsLCByZWFkVWludEJFLCA0LCAwKTtcclxuXHJcbiAgICB9KSgpO1xyXG5cclxuICAgIHJldHVybiBleHBvcnRzO1xyXG59XHJcblxyXG4vLyB1aW50IGhlbHBlcnNcclxuXHJcbmZ1bmN0aW9uIHdyaXRlVWludExFKHZhbCwgYnVmLCBwb3MpIHtcclxuICAgIGJ1Zltwb3MgICAgXSA9ICB2YWwgICAgICAgICYgMjU1O1xyXG4gICAgYnVmW3BvcyArIDFdID0gIHZhbCA+Pj4gOCAgJiAyNTU7XHJcbiAgICBidWZbcG9zICsgMl0gPSAgdmFsID4+PiAxNiAmIDI1NTtcclxuICAgIGJ1Zltwb3MgKyAzXSA9ICB2YWwgPj4+IDI0O1xyXG59XHJcblxyXG5mdW5jdGlvbiB3cml0ZVVpbnRCRSh2YWwsIGJ1ZiwgcG9zKSB7XHJcbiAgICBidWZbcG9zICAgIF0gPSAgdmFsID4+PiAyNDtcclxuICAgIGJ1Zltwb3MgKyAxXSA9ICB2YWwgPj4+IDE2ICYgMjU1O1xyXG4gICAgYnVmW3BvcyArIDJdID0gIHZhbCA+Pj4gOCAgJiAyNTU7XHJcbiAgICBidWZbcG9zICsgM10gPSAgdmFsICAgICAgICAmIDI1NTtcclxufVxyXG5cclxuZnVuY3Rpb24gcmVhZFVpbnRMRShidWYsIHBvcykge1xyXG4gICAgcmV0dXJuIChidWZbcG9zICAgIF1cclxuICAgICAgICAgIHwgYnVmW3BvcyArIDFdIDw8IDhcclxuICAgICAgICAgIHwgYnVmW3BvcyArIDJdIDw8IDE2XHJcbiAgICAgICAgICB8IGJ1Zltwb3MgKyAzXSA8PCAyNCkgPj4+IDA7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlYWRVaW50QkUoYnVmLCBwb3MpIHtcclxuICAgIHJldHVybiAoYnVmW3BvcyAgICBdIDw8IDI0XHJcbiAgICAgICAgICB8IGJ1Zltwb3MgKyAxXSA8PCAxNlxyXG4gICAgICAgICAgfCBidWZbcG9zICsgMl0gPDwgOFxyXG4gICAgICAgICAgfCBidWZbcG9zICsgM10pID4+PiAwO1xyXG59XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5tb2R1bGUuZXhwb3J0cyA9IGlucXVpcmU7XHJcblxyXG4vKipcclxuICogUmVxdWlyZXMgYSBtb2R1bGUgb25seSBpZiBhdmFpbGFibGUuXHJcbiAqIEBtZW1iZXJvZiB1dGlsXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBtb2R1bGVOYW1lIE1vZHVsZSB0byByZXF1aXJlXHJcbiAqIEByZXR1cm5zIHs/T2JqZWN0fSBSZXF1aXJlZCBtb2R1bGUgaWYgYXZhaWxhYmxlIGFuZCBub3QgZW1wdHksIG90aGVyd2lzZSBgbnVsbGBcclxuICovXHJcbmZ1bmN0aW9uIGlucXVpcmUobW9kdWxlTmFtZSkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICB2YXIgbW9kID0gZXZhbChcInF1aXJlXCIucmVwbGFjZSgvXi8sXCJyZVwiKSkobW9kdWxlTmFtZSk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tZXZhbFxyXG4gICAgICAgIGlmIChtb2QgJiYgKG1vZC5sZW5ndGggfHwgT2JqZWN0LmtleXMobW9kKS5sZW5ndGgpKVxyXG4gICAgICAgICAgICByZXR1cm4gbW9kO1xyXG4gICAgfSBjYXRjaCAoZSkge30gLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1lbXB0eVxyXG4gICAgcmV0dXJuIG51bGw7XHJcbn1cclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbm1vZHVsZS5leHBvcnRzID0gcG9vbDtcclxuXHJcbi8qKlxyXG4gKiBBbiBhbGxvY2F0b3IgYXMgdXNlZCBieSB7QGxpbmsgdXRpbC5wb29sfS5cclxuICogQHR5cGVkZWYgUG9vbEFsbG9jYXRvclxyXG4gKiBAdHlwZSB7ZnVuY3Rpb259XHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBzaXplIEJ1ZmZlciBzaXplXHJcbiAqIEByZXR1cm5zIHtVaW50OEFycmF5fSBCdWZmZXJcclxuICovXHJcblxyXG4vKipcclxuICogQSBzbGljZXIgYXMgdXNlZCBieSB7QGxpbmsgdXRpbC5wb29sfS5cclxuICogQHR5cGVkZWYgUG9vbFNsaWNlclxyXG4gKiBAdHlwZSB7ZnVuY3Rpb259XHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBzdGFydCBTdGFydCBvZmZzZXRcclxuICogQHBhcmFtIHtudW1iZXJ9IGVuZCBFbmQgb2Zmc2V0XHJcbiAqIEByZXR1cm5zIHtVaW50OEFycmF5fSBCdWZmZXIgc2xpY2VcclxuICogQHRoaXMge1VpbnQ4QXJyYXl9XHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIEEgZ2VuZXJhbCBwdXJwb3NlIGJ1ZmZlciBwb29sLlxyXG4gKiBAbWVtYmVyb2YgdXRpbFxyXG4gKiBAZnVuY3Rpb25cclxuICogQHBhcmFtIHtQb29sQWxsb2NhdG9yfSBhbGxvYyBBbGxvY2F0b3JcclxuICogQHBhcmFtIHtQb29sU2xpY2VyfSBzbGljZSBTbGljZXJcclxuICogQHBhcmFtIHtudW1iZXJ9IFtzaXplPTgxOTJdIFNsYWIgc2l6ZVxyXG4gKiBAcmV0dXJucyB7UG9vbEFsbG9jYXRvcn0gUG9vbGVkIGFsbG9jYXRvclxyXG4gKi9cclxuZnVuY3Rpb24gcG9vbChhbGxvYywgc2xpY2UsIHNpemUpIHtcclxuICAgIHZhciBTSVpFICAgPSBzaXplIHx8IDgxOTI7XHJcbiAgICB2YXIgTUFYICAgID0gU0laRSA+Pj4gMTtcclxuICAgIHZhciBzbGFiICAgPSBudWxsO1xyXG4gICAgdmFyIG9mZnNldCA9IFNJWkU7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24gcG9vbF9hbGxvYyhzaXplKSB7XHJcbiAgICAgICAgaWYgKHNpemUgPCAxIHx8IHNpemUgPiBNQVgpXHJcbiAgICAgICAgICAgIHJldHVybiBhbGxvYyhzaXplKTtcclxuICAgICAgICBpZiAob2Zmc2V0ICsgc2l6ZSA+IFNJWkUpIHtcclxuICAgICAgICAgICAgc2xhYiA9IGFsbG9jKFNJWkUpO1xyXG4gICAgICAgICAgICBvZmZzZXQgPSAwO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgYnVmID0gc2xpY2UuY2FsbChzbGFiLCBvZmZzZXQsIG9mZnNldCArPSBzaXplKTtcclxuICAgICAgICBpZiAob2Zmc2V0ICYgNykgLy8gYWxpZ24gdG8gMzIgYml0XHJcbiAgICAgICAgICAgIG9mZnNldCA9IChvZmZzZXQgfCA3KSArIDE7XHJcbiAgICAgICAgcmV0dXJuIGJ1ZjtcclxuICAgIH07XHJcbn1cclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4vKipcclxuICogQSBtaW5pbWFsIFVURjggaW1wbGVtZW50YXRpb24gZm9yIG51bWJlciBhcnJheXMuXHJcbiAqIEBtZW1iZXJvZiB1dGlsXHJcbiAqIEBuYW1lc3BhY2VcclxuICovXHJcbnZhciB1dGY4ID0gZXhwb3J0cztcclxuXHJcbi8qKlxyXG4gKiBDYWxjdWxhdGVzIHRoZSBVVEY4IGJ5dGUgbGVuZ3RoIG9mIGEgc3RyaW5nLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIFN0cmluZ1xyXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBCeXRlIGxlbmd0aFxyXG4gKi9cclxudXRmOC5sZW5ndGggPSBmdW5jdGlvbiB1dGY4X2xlbmd0aChzdHJpbmcpIHtcclxuICAgIHZhciBsZW4gPSAwLFxyXG4gICAgICAgIGMgPSAwO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHJpbmcubGVuZ3RoOyArK2kpIHtcclxuICAgICAgICBjID0gc3RyaW5nLmNoYXJDb2RlQXQoaSk7XHJcbiAgICAgICAgaWYgKGMgPCAxMjgpXHJcbiAgICAgICAgICAgIGxlbiArPSAxO1xyXG4gICAgICAgIGVsc2UgaWYgKGMgPCAyMDQ4KVxyXG4gICAgICAgICAgICBsZW4gKz0gMjtcclxuICAgICAgICBlbHNlIGlmICgoYyAmIDB4RkMwMCkgPT09IDB4RDgwMCAmJiAoc3RyaW5nLmNoYXJDb2RlQXQoaSArIDEpICYgMHhGQzAwKSA9PT0gMHhEQzAwKSB7XHJcbiAgICAgICAgICAgICsraTtcclxuICAgICAgICAgICAgbGVuICs9IDQ7XHJcbiAgICAgICAgfSBlbHNlXHJcbiAgICAgICAgICAgIGxlbiArPSAzO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGxlbjtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZWFkcyBVVEY4IGJ5dGVzIGFzIGEgc3RyaW5nLlxyXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGJ1ZmZlciBTb3VyY2UgYnVmZmVyXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBzdGFydCBTb3VyY2Ugc3RhcnRcclxuICogQHBhcmFtIHtudW1iZXJ9IGVuZCBTb3VyY2UgZW5kXHJcbiAqIEByZXR1cm5zIHtzdHJpbmd9IFN0cmluZyByZWFkXHJcbiAqL1xyXG51dGY4LnJlYWQgPSBmdW5jdGlvbiB1dGY4X3JlYWQoYnVmZmVyLCBzdGFydCwgZW5kKSB7XHJcbiAgICB2YXIgbGVuID0gZW5kIC0gc3RhcnQ7XHJcbiAgICBpZiAobGVuIDwgMSlcclxuICAgICAgICByZXR1cm4gXCJcIjtcclxuICAgIHZhciBwYXJ0cyA9IG51bGwsXHJcbiAgICAgICAgY2h1bmsgPSBbXSxcclxuICAgICAgICBpID0gMCwgLy8gY2hhciBvZmZzZXRcclxuICAgICAgICB0OyAgICAgLy8gdGVtcG9yYXJ5XHJcbiAgICB3aGlsZSAoc3RhcnQgPCBlbmQpIHtcclxuICAgICAgICB0ID0gYnVmZmVyW3N0YXJ0KytdO1xyXG4gICAgICAgIGlmICh0IDwgMTI4KVxyXG4gICAgICAgICAgICBjaHVua1tpKytdID0gdDtcclxuICAgICAgICBlbHNlIGlmICh0ID4gMTkxICYmIHQgPCAyMjQpXHJcbiAgICAgICAgICAgIGNodW5rW2krK10gPSAodCAmIDMxKSA8PCA2IHwgYnVmZmVyW3N0YXJ0KytdICYgNjM7XHJcbiAgICAgICAgZWxzZSBpZiAodCA+IDIzOSAmJiB0IDwgMzY1KSB7XHJcbiAgICAgICAgICAgIHQgPSAoKHQgJiA3KSA8PCAxOCB8IChidWZmZXJbc3RhcnQrK10gJiA2MykgPDwgMTIgfCAoYnVmZmVyW3N0YXJ0KytdICYgNjMpIDw8IDYgfCBidWZmZXJbc3RhcnQrK10gJiA2MykgLSAweDEwMDAwO1xyXG4gICAgICAgICAgICBjaHVua1tpKytdID0gMHhEODAwICsgKHQgPj4gMTApO1xyXG4gICAgICAgICAgICBjaHVua1tpKytdID0gMHhEQzAwICsgKHQgJiAxMDIzKTtcclxuICAgICAgICB9IGVsc2VcclxuICAgICAgICAgICAgY2h1bmtbaSsrXSA9ICh0ICYgMTUpIDw8IDEyIHwgKGJ1ZmZlcltzdGFydCsrXSAmIDYzKSA8PCA2IHwgYnVmZmVyW3N0YXJ0KytdICYgNjM7XHJcbiAgICAgICAgaWYgKGkgPiA4MTkxKSB7XHJcbiAgICAgICAgICAgIChwYXJ0cyB8fCAocGFydHMgPSBbXSkpLnB1c2goU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShTdHJpbmcsIGNodW5rKSk7XHJcbiAgICAgICAgICAgIGkgPSAwO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmIChwYXJ0cykge1xyXG4gICAgICAgIGlmIChpKVxyXG4gICAgICAgICAgICBwYXJ0cy5wdXNoKFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkoU3RyaW5nLCBjaHVuay5zbGljZSgwLCBpKSkpO1xyXG4gICAgICAgIHJldHVybiBwYXJ0cy5qb2luKFwiXCIpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkoU3RyaW5nLCBjaHVuay5zbGljZSgwLCBpKSk7XHJcbn07XHJcblxyXG4vKipcclxuICogV3JpdGVzIGEgc3RyaW5nIGFzIFVURjggYnl0ZXMuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgU291cmNlIHN0cmluZ1xyXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGJ1ZmZlciBEZXN0aW5hdGlvbiBidWZmZXJcclxuICogQHBhcmFtIHtudW1iZXJ9IG9mZnNldCBEZXN0aW5hdGlvbiBvZmZzZXRcclxuICogQHJldHVybnMge251bWJlcn0gQnl0ZXMgd3JpdHRlblxyXG4gKi9cclxudXRmOC53cml0ZSA9IGZ1bmN0aW9uIHV0Zjhfd3JpdGUoc3RyaW5nLCBidWZmZXIsIG9mZnNldCkge1xyXG4gICAgdmFyIHN0YXJ0ID0gb2Zmc2V0LFxyXG4gICAgICAgIGMxLCAvLyBjaGFyYWN0ZXIgMVxyXG4gICAgICAgIGMyOyAvLyBjaGFyYWN0ZXIgMlxyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHJpbmcubGVuZ3RoOyArK2kpIHtcclxuICAgICAgICBjMSA9IHN0cmluZy5jaGFyQ29kZUF0KGkpO1xyXG4gICAgICAgIGlmIChjMSA8IDEyOCkge1xyXG4gICAgICAgICAgICBidWZmZXJbb2Zmc2V0KytdID0gYzE7XHJcbiAgICAgICAgfSBlbHNlIGlmIChjMSA8IDIwNDgpIHtcclxuICAgICAgICAgICAgYnVmZmVyW29mZnNldCsrXSA9IGMxID4+IDYgICAgICAgfCAxOTI7XHJcbiAgICAgICAgICAgIGJ1ZmZlcltvZmZzZXQrK10gPSBjMSAgICAgICAmIDYzIHwgMTI4O1xyXG4gICAgICAgIH0gZWxzZSBpZiAoKGMxICYgMHhGQzAwKSA9PT0gMHhEODAwICYmICgoYzIgPSBzdHJpbmcuY2hhckNvZGVBdChpICsgMSkpICYgMHhGQzAwKSA9PT0gMHhEQzAwKSB7XHJcbiAgICAgICAgICAgIGMxID0gMHgxMDAwMCArICgoYzEgJiAweDAzRkYpIDw8IDEwKSArIChjMiAmIDB4MDNGRik7XHJcbiAgICAgICAgICAgICsraTtcclxuICAgICAgICAgICAgYnVmZmVyW29mZnNldCsrXSA9IGMxID4+IDE4ICAgICAgfCAyNDA7XHJcbiAgICAgICAgICAgIGJ1ZmZlcltvZmZzZXQrK10gPSBjMSA+PiAxMiAmIDYzIHwgMTI4O1xyXG4gICAgICAgICAgICBidWZmZXJbb2Zmc2V0KytdID0gYzEgPj4gNiAgJiA2MyB8IDEyODtcclxuICAgICAgICAgICAgYnVmZmVyW29mZnNldCsrXSA9IGMxICAgICAgICYgNjMgfCAxMjg7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgYnVmZmVyW29mZnNldCsrXSA9IGMxID4+IDEyICAgICAgfCAyMjQ7XHJcbiAgICAgICAgICAgIGJ1ZmZlcltvZmZzZXQrK10gPSBjMSA+PiA2ICAmIDYzIHwgMTI4O1xyXG4gICAgICAgICAgICBidWZmZXJbb2Zmc2V0KytdID0gYzEgICAgICAgJiA2MyB8IDEyODtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gb2Zmc2V0IC0gc3RhcnQ7XHJcbn07XHJcbiIsIi8vIG1pbmltYWwgbGlicmFyeSBlbnRyeSBwb2ludC5cclxuXHJcblwidXNlIHN0cmljdFwiO1xyXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuL3NyYy9pbmRleC1taW5pbWFsXCIpO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIHByb3RvYnVmID0gZXhwb3J0cztcclxuXHJcbi8qKlxyXG4gKiBCdWlsZCB0eXBlLCBvbmUgb2YgYFwiZnVsbFwiYCwgYFwibGlnaHRcImAgb3IgYFwibWluaW1hbFwiYC5cclxuICogQG5hbWUgYnVpbGRcclxuICogQHR5cGUge3N0cmluZ31cclxuICogQGNvbnN0XHJcbiAqL1xyXG5wcm90b2J1Zi5idWlsZCA9IFwibWluaW1hbFwiO1xyXG5cclxuLy8gU2VyaWFsaXphdGlvblxyXG5wcm90b2J1Zi5Xcml0ZXIgICAgICAgPSByZXF1aXJlKFwiLi93cml0ZXJcIik7XHJcbnByb3RvYnVmLkJ1ZmZlcldyaXRlciA9IHJlcXVpcmUoXCIuL3dyaXRlcl9idWZmZXJcIik7XHJcbnByb3RvYnVmLlJlYWRlciAgICAgICA9IHJlcXVpcmUoXCIuL3JlYWRlclwiKTtcclxucHJvdG9idWYuQnVmZmVyUmVhZGVyID0gcmVxdWlyZShcIi4vcmVhZGVyX2J1ZmZlclwiKTtcclxuXHJcbi8vIFV0aWxpdHlcclxucHJvdG9idWYudXRpbCAgICAgICAgID0gcmVxdWlyZShcIi4vdXRpbC9taW5pbWFsXCIpO1xyXG5wcm90b2J1Zi5ycGMgICAgICAgICAgPSByZXF1aXJlKFwiLi9ycGNcIik7XHJcbnByb3RvYnVmLnJvb3RzICAgICAgICA9IHJlcXVpcmUoXCIuL3Jvb3RzXCIpO1xyXG5wcm90b2J1Zi5jb25maWd1cmUgICAgPSBjb25maWd1cmU7XHJcblxyXG4vKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4vKipcclxuICogUmVjb25maWd1cmVzIHRoZSBsaWJyYXJ5IGFjY29yZGluZyB0byB0aGUgZW52aXJvbm1lbnQuXHJcbiAqIEByZXR1cm5zIHt1bmRlZmluZWR9XHJcbiAqL1xyXG5mdW5jdGlvbiBjb25maWd1cmUoKSB7XHJcbiAgICBwcm90b2J1Zi5SZWFkZXIuX2NvbmZpZ3VyZShwcm90b2J1Zi5CdWZmZXJSZWFkZXIpO1xyXG4gICAgcHJvdG9idWYudXRpbC5fY29uZmlndXJlKCk7XHJcbn1cclxuXHJcbi8vIFNldCB1cCBidWZmZXIgdXRpbGl0eSBhY2NvcmRpbmcgdG8gdGhlIGVudmlyb25tZW50XHJcbnByb3RvYnVmLldyaXRlci5fY29uZmlndXJlKHByb3RvYnVmLkJ1ZmZlcldyaXRlcik7XHJcbmNvbmZpZ3VyZSgpO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxubW9kdWxlLmV4cG9ydHMgPSBSZWFkZXI7XHJcblxyXG52YXIgdXRpbCAgICAgID0gcmVxdWlyZShcIi4vdXRpbC9taW5pbWFsXCIpO1xyXG5cclxudmFyIEJ1ZmZlclJlYWRlcjsgLy8gY3ljbGljXHJcblxyXG52YXIgTG9uZ0JpdHMgID0gdXRpbC5Mb25nQml0cyxcclxuICAgIHV0ZjggICAgICA9IHV0aWwudXRmODtcclxuXHJcbi8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbmZ1bmN0aW9uIGluZGV4T3V0T2ZSYW5nZShyZWFkZXIsIHdyaXRlTGVuZ3RoKSB7XHJcbiAgICByZXR1cm4gUmFuZ2VFcnJvcihcImluZGV4IG91dCBvZiByYW5nZTogXCIgKyByZWFkZXIucG9zICsgXCIgKyBcIiArICh3cml0ZUxlbmd0aCB8fCAxKSArIFwiID4gXCIgKyByZWFkZXIubGVuKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIENvbnN0cnVjdHMgYSBuZXcgcmVhZGVyIGluc3RhbmNlIHVzaW5nIHRoZSBzcGVjaWZpZWQgYnVmZmVyLlxyXG4gKiBAY2xhc3NkZXNjIFdpcmUgZm9ybWF0IHJlYWRlciB1c2luZyBgVWludDhBcnJheWAgaWYgYXZhaWxhYmxlLCBvdGhlcndpc2UgYEFycmF5YC5cclxuICogQGNvbnN0cnVjdG9yXHJcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYnVmZmVyIEJ1ZmZlciB0byByZWFkIGZyb21cclxuICovXHJcbmZ1bmN0aW9uIFJlYWRlcihidWZmZXIpIHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlYWQgYnVmZmVyLlxyXG4gICAgICogQHR5cGUge1VpbnQ4QXJyYXl9XHJcbiAgICAgKi9cclxuICAgIHRoaXMuYnVmID0gYnVmZmVyO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVhZCBidWZmZXIgcG9zaXRpb24uXHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICB0aGlzLnBvcyA9IDA7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZWFkIGJ1ZmZlciBsZW5ndGguXHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICB0aGlzLmxlbiA9IGJ1ZmZlci5sZW5ndGg7XHJcbn1cclxuXHJcbnZhciBjcmVhdGVfYXJyYXkgPSB0eXBlb2YgVWludDhBcnJheSAhPT0gXCJ1bmRlZmluZWRcIlxyXG4gICAgPyBmdW5jdGlvbiBjcmVhdGVfdHlwZWRfYXJyYXkoYnVmZmVyKSB7XHJcbiAgICAgICAgaWYgKGJ1ZmZlciBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkgfHwgQXJyYXkuaXNBcnJheShidWZmZXIpKVxyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFJlYWRlcihidWZmZXIpO1xyXG4gICAgICAgIHRocm93IEVycm9yKFwiaWxsZWdhbCBidWZmZXJcIik7XHJcbiAgICB9XHJcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgOiBmdW5jdGlvbiBjcmVhdGVfYXJyYXkoYnVmZmVyKSB7XHJcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoYnVmZmVyKSlcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBSZWFkZXIoYnVmZmVyKTtcclxuICAgICAgICB0aHJvdyBFcnJvcihcImlsbGVnYWwgYnVmZmVyXCIpO1xyXG4gICAgfTtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgbmV3IHJlYWRlciB1c2luZyB0aGUgc3BlY2lmaWVkIGJ1ZmZlci5cclxuICogQGZ1bmN0aW9uXHJcbiAqIEBwYXJhbSB7VWludDhBcnJheXxCdWZmZXJ9IGJ1ZmZlciBCdWZmZXIgdG8gcmVhZCBmcm9tXHJcbiAqIEByZXR1cm5zIHtSZWFkZXJ8QnVmZmVyUmVhZGVyfSBBIHtAbGluayBCdWZmZXJSZWFkZXJ9IGlmIGBidWZmZXJgIGlzIGEgQnVmZmVyLCBvdGhlcndpc2UgYSB7QGxpbmsgUmVhZGVyfVxyXG4gKiBAdGhyb3dzIHtFcnJvcn0gSWYgYGJ1ZmZlcmAgaXMgbm90IGEgdmFsaWQgYnVmZmVyXHJcbiAqL1xyXG5SZWFkZXIuY3JlYXRlID0gdXRpbC5CdWZmZXJcclxuICAgID8gZnVuY3Rpb24gY3JlYXRlX2J1ZmZlcl9zZXR1cChidWZmZXIpIHtcclxuICAgICAgICByZXR1cm4gKFJlYWRlci5jcmVhdGUgPSBmdW5jdGlvbiBjcmVhdGVfYnVmZmVyKGJ1ZmZlcikge1xyXG4gICAgICAgICAgICByZXR1cm4gdXRpbC5CdWZmZXIuaXNCdWZmZXIoYnVmZmVyKVxyXG4gICAgICAgICAgICAgICAgPyBuZXcgQnVmZmVyUmVhZGVyKGJ1ZmZlcilcclxuICAgICAgICAgICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICAgICAgICAgICAgICA6IGNyZWF0ZV9hcnJheShidWZmZXIpO1xyXG4gICAgICAgIH0pKGJ1ZmZlcik7XHJcbiAgICB9XHJcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgOiBjcmVhdGVfYXJyYXk7XHJcblxyXG5SZWFkZXIucHJvdG90eXBlLl9zbGljZSA9IHV0aWwuQXJyYXkucHJvdG90eXBlLnN1YmFycmF5IHx8IC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovIHV0aWwuQXJyYXkucHJvdG90eXBlLnNsaWNlO1xyXG5cclxuLyoqXHJcbiAqIFJlYWRzIGEgdmFyaW50IGFzIGFuIHVuc2lnbmVkIDMyIGJpdCB2YWx1ZS5cclxuICogQGZ1bmN0aW9uXHJcbiAqIEByZXR1cm5zIHtudW1iZXJ9IFZhbHVlIHJlYWRcclxuICovXHJcblJlYWRlci5wcm90b3R5cGUudWludDMyID0gKGZ1bmN0aW9uIHJlYWRfdWludDMyX3NldHVwKCkge1xyXG4gICAgdmFyIHZhbHVlID0gNDI5NDk2NzI5NTsgLy8gb3B0aW1pemVyIHR5cGUtaGludCwgdGVuZHMgdG8gZGVvcHQgb3RoZXJ3aXNlICg/ISlcclxuICAgIHJldHVybiBmdW5jdGlvbiByZWFkX3VpbnQzMigpIHtcclxuICAgICAgICB2YWx1ZSA9ICggICAgICAgICB0aGlzLmJ1Zlt0aGlzLnBvc10gJiAxMjcgICAgICAgKSA+Pj4gMDsgaWYgKHRoaXMuYnVmW3RoaXMucG9zKytdIDwgMTI4KSByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgdmFsdWUgPSAodmFsdWUgfCAodGhpcy5idWZbdGhpcy5wb3NdICYgMTI3KSA8PCAgNykgPj4+IDA7IGlmICh0aGlzLmJ1Zlt0aGlzLnBvcysrXSA8IDEyOCkgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIHZhbHVlID0gKHZhbHVlIHwgKHRoaXMuYnVmW3RoaXMucG9zXSAmIDEyNykgPDwgMTQpID4+PiAwOyBpZiAodGhpcy5idWZbdGhpcy5wb3MrK10gPCAxMjgpIHJldHVybiB2YWx1ZTtcclxuICAgICAgICB2YWx1ZSA9ICh2YWx1ZSB8ICh0aGlzLmJ1Zlt0aGlzLnBvc10gJiAxMjcpIDw8IDIxKSA+Pj4gMDsgaWYgKHRoaXMuYnVmW3RoaXMucG9zKytdIDwgMTI4KSByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgdmFsdWUgPSAodmFsdWUgfCAodGhpcy5idWZbdGhpcy5wb3NdICYgIDE1KSA8PCAyOCkgPj4+IDA7IGlmICh0aGlzLmJ1Zlt0aGlzLnBvcysrXSA8IDEyOCkgcmV0dXJuIHZhbHVlO1xyXG5cclxuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cclxuICAgICAgICBpZiAoKHRoaXMucG9zICs9IDUpID4gdGhpcy5sZW4pIHtcclxuICAgICAgICAgICAgdGhpcy5wb3MgPSB0aGlzLmxlbjtcclxuICAgICAgICAgICAgdGhyb3cgaW5kZXhPdXRPZlJhbmdlKHRoaXMsIDEwKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgfTtcclxufSkoKTtcclxuXHJcbi8qKlxyXG4gKiBSZWFkcyBhIHZhcmludCBhcyBhIHNpZ25lZCAzMiBiaXQgdmFsdWUuXHJcbiAqIEByZXR1cm5zIHtudW1iZXJ9IFZhbHVlIHJlYWRcclxuICovXHJcblJlYWRlci5wcm90b3R5cGUuaW50MzIgPSBmdW5jdGlvbiByZWFkX2ludDMyKCkge1xyXG4gICAgcmV0dXJuIHRoaXMudWludDMyKCkgfCAwO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlYWRzIGEgemlnLXphZyBlbmNvZGVkIHZhcmludCBhcyBhIHNpZ25lZCAzMiBiaXQgdmFsdWUuXHJcbiAqIEByZXR1cm5zIHtudW1iZXJ9IFZhbHVlIHJlYWRcclxuICovXHJcblJlYWRlci5wcm90b3R5cGUuc2ludDMyID0gZnVuY3Rpb24gcmVhZF9zaW50MzIoKSB7XHJcbiAgICB2YXIgdmFsdWUgPSB0aGlzLnVpbnQzMigpO1xyXG4gICAgcmV0dXJuIHZhbHVlID4+PiAxIF4gLSh2YWx1ZSAmIDEpIHwgMDtcclxufTtcclxuXHJcbi8qIGVzbGludC1kaXNhYmxlIG5vLWludmFsaWQtdGhpcyAqL1xyXG5cclxuZnVuY3Rpb24gcmVhZExvbmdWYXJpbnQoKSB7XHJcbiAgICAvLyB0ZW5kcyB0byBkZW9wdCB3aXRoIGxvY2FsIHZhcnMgZm9yIG9jdGV0IGV0Yy5cclxuICAgIHZhciBiaXRzID0gbmV3IExvbmdCaXRzKDAsIDApO1xyXG4gICAgdmFyIGkgPSAwO1xyXG4gICAgaWYgKHRoaXMubGVuIC0gdGhpcy5wb3MgPiA0KSB7IC8vIGZhc3Qgcm91dGUgKGxvKVxyXG4gICAgICAgIGZvciAoOyBpIDwgNDsgKytpKSB7XHJcbiAgICAgICAgICAgIC8vIDFzdC4uNHRoXHJcbiAgICAgICAgICAgIGJpdHMubG8gPSAoYml0cy5sbyB8ICh0aGlzLmJ1Zlt0aGlzLnBvc10gJiAxMjcpIDw8IGkgKiA3KSA+Pj4gMDtcclxuICAgICAgICAgICAgaWYgKHRoaXMuYnVmW3RoaXMucG9zKytdIDwgMTI4KVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGJpdHM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIDV0aFxyXG4gICAgICAgIGJpdHMubG8gPSAoYml0cy5sbyB8ICh0aGlzLmJ1Zlt0aGlzLnBvc10gJiAxMjcpIDw8IDI4KSA+Pj4gMDtcclxuICAgICAgICBiaXRzLmhpID0gKGJpdHMuaGkgfCAodGhpcy5idWZbdGhpcy5wb3NdICYgMTI3KSA+PiAgNCkgPj4+IDA7XHJcbiAgICAgICAgaWYgKHRoaXMuYnVmW3RoaXMucG9zKytdIDwgMTI4KVxyXG4gICAgICAgICAgICByZXR1cm4gYml0cztcclxuICAgICAgICBpID0gMDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgZm9yICg7IGkgPCAzOyArK2kpIHtcclxuICAgICAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXHJcbiAgICAgICAgICAgIGlmICh0aGlzLnBvcyA+PSB0aGlzLmxlbilcclxuICAgICAgICAgICAgICAgIHRocm93IGluZGV4T3V0T2ZSYW5nZSh0aGlzKTtcclxuICAgICAgICAgICAgLy8gMXN0Li4zdGhcclxuICAgICAgICAgICAgYml0cy5sbyA9IChiaXRzLmxvIHwgKHRoaXMuYnVmW3RoaXMucG9zXSAmIDEyNykgPDwgaSAqIDcpID4+PiAwO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5idWZbdGhpcy5wb3MrK10gPCAxMjgpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYml0cztcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gNHRoXHJcbiAgICAgICAgYml0cy5sbyA9IChiaXRzLmxvIHwgKHRoaXMuYnVmW3RoaXMucG9zKytdICYgMTI3KSA8PCBpICogNykgPj4+IDA7XHJcbiAgICAgICAgcmV0dXJuIGJpdHM7XHJcbiAgICB9XHJcbiAgICBpZiAodGhpcy5sZW4gLSB0aGlzLnBvcyA+IDQpIHsgLy8gZmFzdCByb3V0ZSAoaGkpXHJcbiAgICAgICAgZm9yICg7IGkgPCA1OyArK2kpIHtcclxuICAgICAgICAgICAgLy8gNnRoLi4xMHRoXHJcbiAgICAgICAgICAgIGJpdHMuaGkgPSAoYml0cy5oaSB8ICh0aGlzLmJ1Zlt0aGlzLnBvc10gJiAxMjcpIDw8IGkgKiA3ICsgMykgPj4+IDA7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmJ1Zlt0aGlzLnBvcysrXSA8IDEyOClcclxuICAgICAgICAgICAgICAgIHJldHVybiBiaXRzO1xyXG4gICAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgZm9yICg7IGkgPCA1OyArK2kpIHtcclxuICAgICAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXHJcbiAgICAgICAgICAgIGlmICh0aGlzLnBvcyA+PSB0aGlzLmxlbilcclxuICAgICAgICAgICAgICAgIHRocm93IGluZGV4T3V0T2ZSYW5nZSh0aGlzKTtcclxuICAgICAgICAgICAgLy8gNnRoLi4xMHRoXHJcbiAgICAgICAgICAgIGJpdHMuaGkgPSAoYml0cy5oaSB8ICh0aGlzLmJ1Zlt0aGlzLnBvc10gJiAxMjcpIDw8IGkgKiA3ICsgMykgPj4+IDA7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmJ1Zlt0aGlzLnBvcysrXSA8IDEyOClcclxuICAgICAgICAgICAgICAgIHJldHVybiBiaXRzO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICB0aHJvdyBFcnJvcihcImludmFsaWQgdmFyaW50IGVuY29kaW5nXCIpO1xyXG59XHJcblxyXG4vKiBlc2xpbnQtZW5hYmxlIG5vLWludmFsaWQtdGhpcyAqL1xyXG5cclxuLyoqXHJcbiAqIFJlYWRzIGEgdmFyaW50IGFzIGEgc2lnbmVkIDY0IGJpdCB2YWx1ZS5cclxuICogQG5hbWUgUmVhZGVyI2ludDY0XHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcmV0dXJucyB7TG9uZ30gVmFsdWUgcmVhZFxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBSZWFkcyBhIHZhcmludCBhcyBhbiB1bnNpZ25lZCA2NCBiaXQgdmFsdWUuXHJcbiAqIEBuYW1lIFJlYWRlciN1aW50NjRcclxuICogQGZ1bmN0aW9uXHJcbiAqIEByZXR1cm5zIHtMb25nfSBWYWx1ZSByZWFkXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIFJlYWRzIGEgemlnLXphZyBlbmNvZGVkIHZhcmludCBhcyBhIHNpZ25lZCA2NCBiaXQgdmFsdWUuXHJcbiAqIEBuYW1lIFJlYWRlciNzaW50NjRcclxuICogQGZ1bmN0aW9uXHJcbiAqIEByZXR1cm5zIHtMb25nfSBWYWx1ZSByZWFkXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIFJlYWRzIGEgdmFyaW50IGFzIGEgYm9vbGVhbi5cclxuICogQHJldHVybnMge2Jvb2xlYW59IFZhbHVlIHJlYWRcclxuICovXHJcblJlYWRlci5wcm90b3R5cGUuYm9vbCA9IGZ1bmN0aW9uIHJlYWRfYm9vbCgpIHtcclxuICAgIHJldHVybiB0aGlzLnVpbnQzMigpICE9PSAwO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gcmVhZEZpeGVkMzJfZW5kKGJ1ZiwgZW5kKSB7IC8vIG5vdGUgdGhhdCB0aGlzIHVzZXMgYGVuZGAsIG5vdCBgcG9zYFxyXG4gICAgcmV0dXJuIChidWZbZW5kIC0gNF1cclxuICAgICAgICAgIHwgYnVmW2VuZCAtIDNdIDw8IDhcclxuICAgICAgICAgIHwgYnVmW2VuZCAtIDJdIDw8IDE2XHJcbiAgICAgICAgICB8IGJ1ZltlbmQgLSAxXSA8PCAyNCkgPj4+IDA7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBSZWFkcyBmaXhlZCAzMiBiaXRzIGFzIGFuIHVuc2lnbmVkIDMyIGJpdCBpbnRlZ2VyLlxyXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBWYWx1ZSByZWFkXHJcbiAqL1xyXG5SZWFkZXIucHJvdG90eXBlLmZpeGVkMzIgPSBmdW5jdGlvbiByZWFkX2ZpeGVkMzIoKSB7XHJcblxyXG4gICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXHJcbiAgICBpZiAodGhpcy5wb3MgKyA0ID4gdGhpcy5sZW4pXHJcbiAgICAgICAgdGhyb3cgaW5kZXhPdXRPZlJhbmdlKHRoaXMsIDQpO1xyXG5cclxuICAgIHJldHVybiByZWFkRml4ZWQzMl9lbmQodGhpcy5idWYsIHRoaXMucG9zICs9IDQpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlYWRzIGZpeGVkIDMyIGJpdHMgYXMgYSBzaWduZWQgMzIgYml0IGludGVnZXIuXHJcbiAqIEByZXR1cm5zIHtudW1iZXJ9IFZhbHVlIHJlYWRcclxuICovXHJcblJlYWRlci5wcm90b3R5cGUuc2ZpeGVkMzIgPSBmdW5jdGlvbiByZWFkX3NmaXhlZDMyKCkge1xyXG5cclxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xyXG4gICAgaWYgKHRoaXMucG9zICsgNCA+IHRoaXMubGVuKVxyXG4gICAgICAgIHRocm93IGluZGV4T3V0T2ZSYW5nZSh0aGlzLCA0KTtcclxuXHJcbiAgICByZXR1cm4gcmVhZEZpeGVkMzJfZW5kKHRoaXMuYnVmLCB0aGlzLnBvcyArPSA0KSB8IDA7XHJcbn07XHJcblxyXG4vKiBlc2xpbnQtZGlzYWJsZSBuby1pbnZhbGlkLXRoaXMgKi9cclxuXHJcbmZ1bmN0aW9uIHJlYWRGaXhlZDY0KC8qIHRoaXM6IFJlYWRlciAqLykge1xyXG5cclxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xyXG4gICAgaWYgKHRoaXMucG9zICsgOCA+IHRoaXMubGVuKVxyXG4gICAgICAgIHRocm93IGluZGV4T3V0T2ZSYW5nZSh0aGlzLCA4KTtcclxuXHJcbiAgICByZXR1cm4gbmV3IExvbmdCaXRzKHJlYWRGaXhlZDMyX2VuZCh0aGlzLmJ1ZiwgdGhpcy5wb3MgKz0gNCksIHJlYWRGaXhlZDMyX2VuZCh0aGlzLmJ1ZiwgdGhpcy5wb3MgKz0gNCkpO1xyXG59XHJcblxyXG4vKiBlc2xpbnQtZW5hYmxlIG5vLWludmFsaWQtdGhpcyAqL1xyXG5cclxuLyoqXHJcbiAqIFJlYWRzIGZpeGVkIDY0IGJpdHMuXHJcbiAqIEBuYW1lIFJlYWRlciNmaXhlZDY0XHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcmV0dXJucyB7TG9uZ30gVmFsdWUgcmVhZFxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBSZWFkcyB6aWctemFnIGVuY29kZWQgZml4ZWQgNjQgYml0cy5cclxuICogQG5hbWUgUmVhZGVyI3NmaXhlZDY0XHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcmV0dXJucyB7TG9uZ30gVmFsdWUgcmVhZFxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBSZWFkcyBhIGZsb2F0ICgzMiBiaXQpIGFzIGEgbnVtYmVyLlxyXG4gKiBAZnVuY3Rpb25cclxuICogQHJldHVybnMge251bWJlcn0gVmFsdWUgcmVhZFxyXG4gKi9cclxuUmVhZGVyLnByb3RvdHlwZS5mbG9hdCA9IGZ1bmN0aW9uIHJlYWRfZmxvYXQoKSB7XHJcblxyXG4gICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXHJcbiAgICBpZiAodGhpcy5wb3MgKyA0ID4gdGhpcy5sZW4pXHJcbiAgICAgICAgdGhyb3cgaW5kZXhPdXRPZlJhbmdlKHRoaXMsIDQpO1xyXG5cclxuICAgIHZhciB2YWx1ZSA9IHV0aWwuZmxvYXQucmVhZEZsb2F0TEUodGhpcy5idWYsIHRoaXMucG9zKTtcclxuICAgIHRoaXMucG9zICs9IDQ7XHJcbiAgICByZXR1cm4gdmFsdWU7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVhZHMgYSBkb3VibGUgKDY0IGJpdCBmbG9hdCkgYXMgYSBudW1iZXIuXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBWYWx1ZSByZWFkXHJcbiAqL1xyXG5SZWFkZXIucHJvdG90eXBlLmRvdWJsZSA9IGZ1bmN0aW9uIHJlYWRfZG91YmxlKCkge1xyXG5cclxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xyXG4gICAgaWYgKHRoaXMucG9zICsgOCA+IHRoaXMubGVuKVxyXG4gICAgICAgIHRocm93IGluZGV4T3V0T2ZSYW5nZSh0aGlzLCA0KTtcclxuXHJcbiAgICB2YXIgdmFsdWUgPSB1dGlsLmZsb2F0LnJlYWREb3VibGVMRSh0aGlzLmJ1ZiwgdGhpcy5wb3MpO1xyXG4gICAgdGhpcy5wb3MgKz0gODtcclxuICAgIHJldHVybiB2YWx1ZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZWFkcyBhIHNlcXVlbmNlIG9mIGJ5dGVzIHByZWNlZWRlZCBieSBpdHMgbGVuZ3RoIGFzIGEgdmFyaW50LlxyXG4gKiBAcmV0dXJucyB7VWludDhBcnJheX0gVmFsdWUgcmVhZFxyXG4gKi9cclxuUmVhZGVyLnByb3RvdHlwZS5ieXRlcyA9IGZ1bmN0aW9uIHJlYWRfYnl0ZXMoKSB7XHJcbiAgICB2YXIgbGVuZ3RoID0gdGhpcy51aW50MzIoKSxcclxuICAgICAgICBzdGFydCAgPSB0aGlzLnBvcyxcclxuICAgICAgICBlbmQgICAgPSB0aGlzLnBvcyArIGxlbmd0aDtcclxuXHJcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cclxuICAgIGlmIChlbmQgPiB0aGlzLmxlbilcclxuICAgICAgICB0aHJvdyBpbmRleE91dE9mUmFuZ2UodGhpcywgbGVuZ3RoKTtcclxuXHJcbiAgICB0aGlzLnBvcyArPSBsZW5ndGg7XHJcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh0aGlzLmJ1ZikpIC8vIHBsYWluIGFycmF5XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuYnVmLnNsaWNlKHN0YXJ0LCBlbmQpO1xyXG4gICAgcmV0dXJuIHN0YXJ0ID09PSBlbmQgLy8gZml4IGZvciBJRSAxMC9XaW44IGFuZCBvdGhlcnMnIHN1YmFycmF5IHJldHVybmluZyBhcnJheSBvZiBzaXplIDFcclxuICAgICAgICA/IG5ldyB0aGlzLmJ1Zi5jb25zdHJ1Y3RvcigwKVxyXG4gICAgICAgIDogdGhpcy5fc2xpY2UuY2FsbCh0aGlzLmJ1Ziwgc3RhcnQsIGVuZCk7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVhZHMgYSBzdHJpbmcgcHJlY2VlZGVkIGJ5IGl0cyBieXRlIGxlbmd0aCBhcyBhIHZhcmludC5cclxuICogQHJldHVybnMge3N0cmluZ30gVmFsdWUgcmVhZFxyXG4gKi9cclxuUmVhZGVyLnByb3RvdHlwZS5zdHJpbmcgPSBmdW5jdGlvbiByZWFkX3N0cmluZygpIHtcclxuICAgIHZhciBieXRlcyA9IHRoaXMuYnl0ZXMoKTtcclxuICAgIHJldHVybiB1dGY4LnJlYWQoYnl0ZXMsIDAsIGJ5dGVzLmxlbmd0aCk7XHJcbn07XHJcblxyXG4vKipcclxuICogU2tpcHMgdGhlIHNwZWNpZmllZCBudW1iZXIgb2YgYnl0ZXMgaWYgc3BlY2lmaWVkLCBvdGhlcndpc2Ugc2tpcHMgYSB2YXJpbnQuXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBbbGVuZ3RoXSBMZW5ndGggaWYga25vd24sIG90aGVyd2lzZSBhIHZhcmludCBpcyBhc3N1bWVkXHJcbiAqIEByZXR1cm5zIHtSZWFkZXJ9IGB0aGlzYFxyXG4gKi9cclxuUmVhZGVyLnByb3RvdHlwZS5za2lwID0gZnVuY3Rpb24gc2tpcChsZW5ndGgpIHtcclxuICAgIGlmICh0eXBlb2YgbGVuZ3RoID09PSBcIm51bWJlclwiKSB7XHJcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXHJcbiAgICAgICAgaWYgKHRoaXMucG9zICsgbGVuZ3RoID4gdGhpcy5sZW4pXHJcbiAgICAgICAgICAgIHRocm93IGluZGV4T3V0T2ZSYW5nZSh0aGlzLCBsZW5ndGgpO1xyXG4gICAgICAgIHRoaXMucG9zICs9IGxlbmd0aDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgZG8ge1xyXG4gICAgICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cclxuICAgICAgICAgICAgaWYgKHRoaXMucG9zID49IHRoaXMubGVuKVxyXG4gICAgICAgICAgICAgICAgdGhyb3cgaW5kZXhPdXRPZlJhbmdlKHRoaXMpO1xyXG4gICAgICAgIH0gd2hpbGUgKHRoaXMuYnVmW3RoaXMucG9zKytdICYgMTI4KTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNraXBzIHRoZSBuZXh0IGVsZW1lbnQgb2YgdGhlIHNwZWNpZmllZCB3aXJlIHR5cGUuXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSB3aXJlVHlwZSBXaXJlIHR5cGUgcmVjZWl2ZWRcclxuICogQHJldHVybnMge1JlYWRlcn0gYHRoaXNgXHJcbiAqL1xyXG5SZWFkZXIucHJvdG90eXBlLnNraXBUeXBlID0gZnVuY3Rpb24od2lyZVR5cGUpIHtcclxuICAgIHN3aXRjaCAod2lyZVR5cGUpIHtcclxuICAgICAgICBjYXNlIDA6XHJcbiAgICAgICAgICAgIHRoaXMuc2tpcCgpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDE6XHJcbiAgICAgICAgICAgIHRoaXMuc2tpcCg4KTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAyOlxyXG4gICAgICAgICAgICB0aGlzLnNraXAodGhpcy51aW50MzIoKSk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgMzpcclxuICAgICAgICAgICAgd2hpbGUgKCh3aXJlVHlwZSA9IHRoaXMudWludDMyKCkgJiA3KSAhPT0gNCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5za2lwVHlwZSh3aXJlVHlwZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSA1OlxyXG4gICAgICAgICAgICB0aGlzLnNraXAoNCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIHRocm93IEVycm9yKFwiaW52YWxpZCB3aXJlIHR5cGUgXCIgKyB3aXJlVHlwZSArIFwiIGF0IG9mZnNldCBcIiArIHRoaXMucG9zKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuUmVhZGVyLl9jb25maWd1cmUgPSBmdW5jdGlvbihCdWZmZXJSZWFkZXJfKSB7XHJcbiAgICBCdWZmZXJSZWFkZXIgPSBCdWZmZXJSZWFkZXJfO1xyXG5cclxuICAgIHZhciBmbiA9IHV0aWwuTG9uZyA/IFwidG9Mb25nXCIgOiAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqLyBcInRvTnVtYmVyXCI7XHJcbiAgICB1dGlsLm1lcmdlKFJlYWRlci5wcm90b3R5cGUsIHtcclxuXHJcbiAgICAgICAgaW50NjQ6IGZ1bmN0aW9uIHJlYWRfaW50NjQoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiByZWFkTG9uZ1ZhcmludC5jYWxsKHRoaXMpW2ZuXShmYWxzZSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgdWludDY0OiBmdW5jdGlvbiByZWFkX3VpbnQ2NCgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlYWRMb25nVmFyaW50LmNhbGwodGhpcylbZm5dKHRydWUpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHNpbnQ2NDogZnVuY3Rpb24gcmVhZF9zaW50NjQoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiByZWFkTG9uZ1ZhcmludC5jYWxsKHRoaXMpLnp6RGVjb2RlKClbZm5dKGZhbHNlKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBmaXhlZDY0OiBmdW5jdGlvbiByZWFkX2ZpeGVkNjQoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiByZWFkRml4ZWQ2NC5jYWxsKHRoaXMpW2ZuXSh0cnVlKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBzZml4ZWQ2NDogZnVuY3Rpb24gcmVhZF9zZml4ZWQ2NCgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlYWRGaXhlZDY0LmNhbGwodGhpcylbZm5dKGZhbHNlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfSk7XHJcbn07XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5tb2R1bGUuZXhwb3J0cyA9IEJ1ZmZlclJlYWRlcjtcclxuXHJcbi8vIGV4dGVuZHMgUmVhZGVyXHJcbnZhciBSZWFkZXIgPSByZXF1aXJlKFwiLi9yZWFkZXJcIik7XHJcbihCdWZmZXJSZWFkZXIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShSZWFkZXIucHJvdG90eXBlKSkuY29uc3RydWN0b3IgPSBCdWZmZXJSZWFkZXI7XHJcblxyXG52YXIgdXRpbCA9IHJlcXVpcmUoXCIuL3V0aWwvbWluaW1hbFwiKTtcclxuXHJcbi8qKlxyXG4gKiBDb25zdHJ1Y3RzIGEgbmV3IGJ1ZmZlciByZWFkZXIgaW5zdGFuY2UuXHJcbiAqIEBjbGFzc2Rlc2MgV2lyZSBmb3JtYXQgcmVhZGVyIHVzaW5nIG5vZGUgYnVmZmVycy5cclxuICogQGV4dGVuZHMgUmVhZGVyXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKiBAcGFyYW0ge0J1ZmZlcn0gYnVmZmVyIEJ1ZmZlciB0byByZWFkIGZyb21cclxuICovXHJcbmZ1bmN0aW9uIEJ1ZmZlclJlYWRlcihidWZmZXIpIHtcclxuICAgIFJlYWRlci5jYWxsKHRoaXMsIGJ1ZmZlcik7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZWFkIGJ1ZmZlci5cclxuICAgICAqIEBuYW1lIEJ1ZmZlclJlYWRlciNidWZcclxuICAgICAqIEB0eXBlIHtCdWZmZXJ9XHJcbiAgICAgKi9cclxufVxyXG5cclxuLyogaXN0YW5idWwgaWdub3JlIGVsc2UgKi9cclxuaWYgKHV0aWwuQnVmZmVyKVxyXG4gICAgQnVmZmVyUmVhZGVyLnByb3RvdHlwZS5fc2xpY2UgPSB1dGlsLkJ1ZmZlci5wcm90b3R5cGUuc2xpY2U7XHJcblxyXG4vKipcclxuICogQG92ZXJyaWRlXHJcbiAqL1xyXG5CdWZmZXJSZWFkZXIucHJvdG90eXBlLnN0cmluZyA9IGZ1bmN0aW9uIHJlYWRfc3RyaW5nX2J1ZmZlcigpIHtcclxuICAgIHZhciBsZW4gPSB0aGlzLnVpbnQzMigpOyAvLyBtb2RpZmllcyBwb3NcclxuICAgIHJldHVybiB0aGlzLmJ1Zi51dGY4U2xpY2UodGhpcy5wb3MsIHRoaXMucG9zID0gTWF0aC5taW4odGhpcy5wb3MgKyBsZW4sIHRoaXMubGVuKSk7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVhZHMgYSBzZXF1ZW5jZSBvZiBieXRlcyBwcmVjZWVkZWQgYnkgaXRzIGxlbmd0aCBhcyBhIHZhcmludC5cclxuICogQG5hbWUgQnVmZmVyUmVhZGVyI2J5dGVzXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcmV0dXJucyB7QnVmZmVyfSBWYWx1ZSByZWFkXHJcbiAqL1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxubW9kdWxlLmV4cG9ydHMgPSB7fTtcclxuXHJcbi8qKlxyXG4gKiBOYW1lZCByb290cy5cclxuICogVGhpcyBpcyB3aGVyZSBwYmpzIHN0b3JlcyBnZW5lcmF0ZWQgc3RydWN0dXJlcyAodGhlIG9wdGlvbiBgLXIsIC0tcm9vdGAgc3BlY2lmaWVzIGEgbmFtZSkuXHJcbiAqIENhbiBhbHNvIGJlIHVzZWQgbWFudWFsbHkgdG8gbWFrZSByb290cyBhdmFpbGFibGUgYWNjcm9zcyBtb2R1bGVzLlxyXG4gKiBAbmFtZSByb290c1xyXG4gKiBAdHlwZSB7T2JqZWN0LjxzdHJpbmcsUm9vdD59XHJcbiAqIEBleGFtcGxlXHJcbiAqIC8vIHBianMgLXIgbXlyb290IC1vIGNvbXBpbGVkLmpzIC4uLlxyXG4gKlxyXG4gKiAvLyBpbiBhbm90aGVyIG1vZHVsZTpcclxuICogcmVxdWlyZShcIi4vY29tcGlsZWQuanNcIik7XHJcbiAqXHJcbiAqIC8vIGluIGFueSBzdWJzZXF1ZW50IG1vZHVsZTpcclxuICogdmFyIHJvb3QgPSBwcm90b2J1Zi5yb290c1tcIm15cm9vdFwiXTtcclxuICovXHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxuLyoqXHJcbiAqIFN0cmVhbWluZyBSUEMgaGVscGVycy5cclxuICogQG5hbWVzcGFjZVxyXG4gKi9cclxudmFyIHJwYyA9IGV4cG9ydHM7XHJcblxyXG4vKipcclxuICogUlBDIGltcGxlbWVudGF0aW9uIHBhc3NlZCB0byB7QGxpbmsgU2VydmljZSNjcmVhdGV9IHBlcmZvcm1pbmcgYSBzZXJ2aWNlIHJlcXVlc3Qgb24gbmV0d29yayBsZXZlbCwgaS5lLiBieSB1dGlsaXppbmcgaHR0cCByZXF1ZXN0cyBvciB3ZWJzb2NrZXRzLlxyXG4gKiBAdHlwZWRlZiBSUENJbXBsXHJcbiAqIEB0eXBlIHtmdW5jdGlvbn1cclxuICogQHBhcmFtIHtNZXRob2R8cnBjLlNlcnZpY2VNZXRob2Q8TWVzc2FnZTx7fT4sTWVzc2FnZTx7fT4+fSBtZXRob2QgUmVmbGVjdGVkIG9yIHN0YXRpYyBtZXRob2QgYmVpbmcgY2FsbGVkXHJcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gcmVxdWVzdERhdGEgUmVxdWVzdCBkYXRhXHJcbiAqIEBwYXJhbSB7UlBDSW1wbENhbGxiYWNrfSBjYWxsYmFjayBDYWxsYmFjayBmdW5jdGlvblxyXG4gKiBAcmV0dXJucyB7dW5kZWZpbmVkfVxyXG4gKiBAZXhhbXBsZVxyXG4gKiBmdW5jdGlvbiBycGNJbXBsKG1ldGhvZCwgcmVxdWVzdERhdGEsIGNhbGxiYWNrKSB7XHJcbiAqICAgICBpZiAocHJvdG9idWYudXRpbC5sY0ZpcnN0KG1ldGhvZC5uYW1lKSAhPT0gXCJteU1ldGhvZFwiKSAvLyBjb21wYXRpYmxlIHdpdGggc3RhdGljIGNvZGVcclxuICogICAgICAgICB0aHJvdyBFcnJvcihcIm5vIHN1Y2ggbWV0aG9kXCIpO1xyXG4gKiAgICAgYXN5bmNocm9ub3VzbHlPYnRhaW5BUmVzcG9uc2UocmVxdWVzdERhdGEsIGZ1bmN0aW9uKGVyciwgcmVzcG9uc2VEYXRhKSB7XHJcbiAqICAgICAgICAgY2FsbGJhY2soZXJyLCByZXNwb25zZURhdGEpO1xyXG4gKiAgICAgfSk7XHJcbiAqIH1cclxuICovXHJcblxyXG4vKipcclxuICogTm9kZS1zdHlsZSBjYWxsYmFjayBhcyB1c2VkIGJ5IHtAbGluayBSUENJbXBsfS5cclxuICogQHR5cGVkZWYgUlBDSW1wbENhbGxiYWNrXHJcbiAqIEB0eXBlIHtmdW5jdGlvbn1cclxuICogQHBhcmFtIHtFcnJvcnxudWxsfSBlcnJvciBFcnJvciwgaWYgYW55LCBvdGhlcndpc2UgYG51bGxgXHJcbiAqIEBwYXJhbSB7VWludDhBcnJheXxudWxsfSBbcmVzcG9uc2VdIFJlc3BvbnNlIGRhdGEgb3IgYG51bGxgIHRvIHNpZ25hbCBlbmQgb2Ygc3RyZWFtLCBpZiB0aGVyZSBoYXNuJ3QgYmVlbiBhbiBlcnJvclxyXG4gKiBAcmV0dXJucyB7dW5kZWZpbmVkfVxyXG4gKi9cclxuXHJcbnJwYy5TZXJ2aWNlID0gcmVxdWlyZShcIi4vcnBjL3NlcnZpY2VcIik7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5tb2R1bGUuZXhwb3J0cyA9IFNlcnZpY2U7XHJcblxyXG52YXIgdXRpbCA9IHJlcXVpcmUoXCIuLi91dGlsL21pbmltYWxcIik7XHJcblxyXG4vLyBFeHRlbmRzIEV2ZW50RW1pdHRlclxyXG4oU2VydmljZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHV0aWwuRXZlbnRFbWl0dGVyLnByb3RvdHlwZSkpLmNvbnN0cnVjdG9yID0gU2VydmljZTtcclxuXHJcbi8qKlxyXG4gKiBBIHNlcnZpY2UgbWV0aG9kIGNhbGxiYWNrIGFzIHVzZWQgYnkge0BsaW5rIHJwYy5TZXJ2aWNlTWV0aG9kfFNlcnZpY2VNZXRob2R9LlxyXG4gKlxyXG4gKiBEaWZmZXJzIGZyb20ge0BsaW5rIFJQQ0ltcGxDYWxsYmFja30gaW4gdGhhdCBpdCBpcyBhbiBhY3R1YWwgY2FsbGJhY2sgb2YgYSBzZXJ2aWNlIG1ldGhvZCB3aGljaCBtYXkgbm90IHJldHVybiBgcmVzcG9uc2UgPSBudWxsYC5cclxuICogQHR5cGVkZWYgcnBjLlNlcnZpY2VNZXRob2RDYWxsYmFja1xyXG4gKiBAdGVtcGxhdGUgVFJlcyBleHRlbmRzIE1lc3NhZ2U8VFJlcz5cclxuICogQHR5cGUge2Z1bmN0aW9ufVxyXG4gKiBAcGFyYW0ge0Vycm9yfG51bGx9IGVycm9yIEVycm9yLCBpZiBhbnlcclxuICogQHBhcmFtIHtUUmVzfSBbcmVzcG9uc2VdIFJlc3BvbnNlIG1lc3NhZ2VcclxuICogQHJldHVybnMge3VuZGVmaW5lZH1cclxuICovXHJcblxyXG4vKipcclxuICogQSBzZXJ2aWNlIG1ldGhvZCBwYXJ0IG9mIGEge0BsaW5rIHJwYy5TZXJ2aWNlfSBhcyBjcmVhdGVkIGJ5IHtAbGluayBTZXJ2aWNlLmNyZWF0ZX0uXHJcbiAqIEB0eXBlZGVmIHJwYy5TZXJ2aWNlTWV0aG9kXHJcbiAqIEB0ZW1wbGF0ZSBUUmVxIGV4dGVuZHMgTWVzc2FnZTxUUmVxPlxyXG4gKiBAdGVtcGxhdGUgVFJlcyBleHRlbmRzIE1lc3NhZ2U8VFJlcz5cclxuICogQHR5cGUge2Z1bmN0aW9ufVxyXG4gKiBAcGFyYW0ge1RSZXF8UHJvcGVydGllczxUUmVxPn0gcmVxdWVzdCBSZXF1ZXN0IG1lc3NhZ2Ugb3IgcGxhaW4gb2JqZWN0XHJcbiAqIEBwYXJhbSB7cnBjLlNlcnZpY2VNZXRob2RDYWxsYmFjazxUUmVzPn0gW2NhbGxiYWNrXSBOb2RlLXN0eWxlIGNhbGxiYWNrIGNhbGxlZCB3aXRoIHRoZSBlcnJvciwgaWYgYW55LCBhbmQgdGhlIHJlc3BvbnNlIG1lc3NhZ2VcclxuICogQHJldHVybnMge1Byb21pc2U8TWVzc2FnZTxUUmVzPj59IFByb21pc2UgaWYgYGNhbGxiYWNrYCBoYXMgYmVlbiBvbWl0dGVkLCBvdGhlcndpc2UgYHVuZGVmaW5lZGBcclxuICovXHJcblxyXG4vKipcclxuICogQ29uc3RydWN0cyBhIG5ldyBSUEMgc2VydmljZSBpbnN0YW5jZS5cclxuICogQGNsYXNzZGVzYyBBbiBSUEMgc2VydmljZSBhcyByZXR1cm5lZCBieSB7QGxpbmsgU2VydmljZSNjcmVhdGV9LlxyXG4gKiBAZXhwb3J0cyBycGMuU2VydmljZVxyXG4gKiBAZXh0ZW5kcyB1dGlsLkV2ZW50RW1pdHRlclxyXG4gKiBAY29uc3RydWN0b3JcclxuICogQHBhcmFtIHtSUENJbXBsfSBycGNJbXBsIFJQQyBpbXBsZW1lbnRhdGlvblxyXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtyZXF1ZXN0RGVsaW1pdGVkPWZhbHNlXSBXaGV0aGVyIHJlcXVlc3RzIGFyZSBsZW5ndGgtZGVsaW1pdGVkXHJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW3Jlc3BvbnNlRGVsaW1pdGVkPWZhbHNlXSBXaGV0aGVyIHJlc3BvbnNlcyBhcmUgbGVuZ3RoLWRlbGltaXRlZFxyXG4gKi9cclxuZnVuY3Rpb24gU2VydmljZShycGNJbXBsLCByZXF1ZXN0RGVsaW1pdGVkLCByZXNwb25zZURlbGltaXRlZCkge1xyXG5cclxuICAgIGlmICh0eXBlb2YgcnBjSW1wbCAhPT0gXCJmdW5jdGlvblwiKVxyXG4gICAgICAgIHRocm93IFR5cGVFcnJvcihcInJwY0ltcGwgbXVzdCBiZSBhIGZ1bmN0aW9uXCIpO1xyXG5cclxuICAgIHV0aWwuRXZlbnRFbWl0dGVyLmNhbGwodGhpcyk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSUEMgaW1wbGVtZW50YXRpb24uIEJlY29tZXMgYG51bGxgIG9uY2UgdGhlIHNlcnZpY2UgaXMgZW5kZWQuXHJcbiAgICAgKiBAdHlwZSB7UlBDSW1wbHxudWxsfVxyXG4gICAgICovXHJcbiAgICB0aGlzLnJwY0ltcGwgPSBycGNJbXBsO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogV2hldGhlciByZXF1ZXN0cyBhcmUgbGVuZ3RoLWRlbGltaXRlZC5cclxuICAgICAqIEB0eXBlIHtib29sZWFufVxyXG4gICAgICovXHJcbiAgICB0aGlzLnJlcXVlc3REZWxpbWl0ZWQgPSBCb29sZWFuKHJlcXVlc3REZWxpbWl0ZWQpO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogV2hldGhlciByZXNwb25zZXMgYXJlIGxlbmd0aC1kZWxpbWl0ZWQuXHJcbiAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cclxuICAgICAqL1xyXG4gICAgdGhpcy5yZXNwb25zZURlbGltaXRlZCA9IEJvb2xlYW4ocmVzcG9uc2VEZWxpbWl0ZWQpO1xyXG59XHJcblxyXG4vKipcclxuICogQ2FsbHMgYSBzZXJ2aWNlIG1ldGhvZCB0aHJvdWdoIHtAbGluayBycGMuU2VydmljZSNycGNJbXBsfHJwY0ltcGx9LlxyXG4gKiBAcGFyYW0ge01ldGhvZHxycGMuU2VydmljZU1ldGhvZDxUUmVxLFRSZXM+fSBtZXRob2QgUmVmbGVjdGVkIG9yIHN0YXRpYyBtZXRob2RcclxuICogQHBhcmFtIHtDb25zdHJ1Y3RvcjxUUmVxPn0gcmVxdWVzdEN0b3IgUmVxdWVzdCBjb25zdHJ1Y3RvclxyXG4gKiBAcGFyYW0ge0NvbnN0cnVjdG9yPFRSZXM+fSByZXNwb25zZUN0b3IgUmVzcG9uc2UgY29uc3RydWN0b3JcclxuICogQHBhcmFtIHtUUmVxfFByb3BlcnRpZXM8VFJlcT59IHJlcXVlc3QgUmVxdWVzdCBtZXNzYWdlIG9yIHBsYWluIG9iamVjdFxyXG4gKiBAcGFyYW0ge3JwYy5TZXJ2aWNlTWV0aG9kQ2FsbGJhY2s8VFJlcz59IGNhbGxiYWNrIFNlcnZpY2UgY2FsbGJhY2tcclxuICogQHJldHVybnMge3VuZGVmaW5lZH1cclxuICogQHRlbXBsYXRlIFRSZXEgZXh0ZW5kcyBNZXNzYWdlPFRSZXE+XHJcbiAqIEB0ZW1wbGF0ZSBUUmVzIGV4dGVuZHMgTWVzc2FnZTxUUmVzPlxyXG4gKi9cclxuU2VydmljZS5wcm90b3R5cGUucnBjQ2FsbCA9IGZ1bmN0aW9uIHJwY0NhbGwobWV0aG9kLCByZXF1ZXN0Q3RvciwgcmVzcG9uc2VDdG9yLCByZXF1ZXN0LCBjYWxsYmFjaykge1xyXG5cclxuICAgIGlmICghcmVxdWVzdClcclxuICAgICAgICB0aHJvdyBUeXBlRXJyb3IoXCJyZXF1ZXN0IG11c3QgYmUgc3BlY2lmaWVkXCIpO1xyXG5cclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgIGlmICghY2FsbGJhY2spXHJcbiAgICAgICAgcmV0dXJuIHV0aWwuYXNQcm9taXNlKHJwY0NhbGwsIHNlbGYsIG1ldGhvZCwgcmVxdWVzdEN0b3IsIHJlc3BvbnNlQ3RvciwgcmVxdWVzdCk7XHJcblxyXG4gICAgaWYgKCFzZWxmLnJwY0ltcGwpIHtcclxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBjYWxsYmFjayhFcnJvcihcImFscmVhZHkgZW5kZWRcIikpOyB9LCAwKTtcclxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgICAgcmV0dXJuIHNlbGYucnBjSW1wbChcclxuICAgICAgICAgICAgbWV0aG9kLFxyXG4gICAgICAgICAgICByZXF1ZXN0Q3RvcltzZWxmLnJlcXVlc3REZWxpbWl0ZWQgPyBcImVuY29kZURlbGltaXRlZFwiIDogXCJlbmNvZGVcIl0ocmVxdWVzdCkuZmluaXNoKCksXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIHJwY0NhbGxiYWNrKGVyciwgcmVzcG9uc2UpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5lbWl0KFwiZXJyb3JcIiwgZXJyLCBtZXRob2QpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZSA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZW5kKC8qIGVuZGVkQnlSUEMgKi8gdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIShyZXNwb25zZSBpbnN0YW5jZW9mIHJlc3BvbnNlQ3RvcikpIHtcclxuICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZSA9IHJlc3BvbnNlQ3RvcltzZWxmLnJlc3BvbnNlRGVsaW1pdGVkID8gXCJkZWNvZGVEZWxpbWl0ZWRcIiA6IFwiZGVjb2RlXCJdKHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5lbWl0KFwiZXJyb3JcIiwgZXJyLCBtZXRob2QpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZi5lbWl0KFwiZGF0YVwiLCByZXNwb25zZSwgbWV0aG9kKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhudWxsLCByZXNwb25zZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICApO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgc2VsZi5lbWl0KFwiZXJyb3JcIiwgZXJyLCBtZXRob2QpO1xyXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IGNhbGxiYWNrKGVycik7IH0sIDApO1xyXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKipcclxuICogRW5kcyB0aGlzIHNlcnZpY2UgYW5kIGVtaXRzIHRoZSBgZW5kYCBldmVudC5cclxuICogQHBhcmFtIHtib29sZWFufSBbZW5kZWRCeVJQQz1mYWxzZV0gV2hldGhlciB0aGUgc2VydmljZSBoYXMgYmVlbiBlbmRlZCBieSB0aGUgUlBDIGltcGxlbWVudGF0aW9uLlxyXG4gKiBAcmV0dXJucyB7cnBjLlNlcnZpY2V9IGB0aGlzYFxyXG4gKi9cclxuU2VydmljZS5wcm90b3R5cGUuZW5kID0gZnVuY3Rpb24gZW5kKGVuZGVkQnlSUEMpIHtcclxuICAgIGlmICh0aGlzLnJwY0ltcGwpIHtcclxuICAgICAgICBpZiAoIWVuZGVkQnlSUEMpIC8vIHNpZ25hbCBlbmQgdG8gcnBjSW1wbFxyXG4gICAgICAgICAgICB0aGlzLnJwY0ltcGwobnVsbCwgbnVsbCwgbnVsbCk7XHJcbiAgICAgICAgdGhpcy5ycGNJbXBsID0gbnVsbDtcclxuICAgICAgICB0aGlzLmVtaXQoXCJlbmRcIikub2ZmKCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbm1vZHVsZS5leHBvcnRzID0gTG9uZ0JpdHM7XHJcblxyXG52YXIgdXRpbCA9IHJlcXVpcmUoXCIuLi91dGlsL21pbmltYWxcIik7XHJcblxyXG4vKipcclxuICogQ29uc3RydWN0cyBuZXcgbG9uZyBiaXRzLlxyXG4gKiBAY2xhc3NkZXNjIEhlbHBlciBjbGFzcyBmb3Igd29ya2luZyB3aXRoIHRoZSBsb3cgYW5kIGhpZ2ggYml0cyBvZiBhIDY0IGJpdCB2YWx1ZS5cclxuICogQG1lbWJlcm9mIHV0aWxcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBsbyBMb3cgMzIgYml0cywgdW5zaWduZWRcclxuICogQHBhcmFtIHtudW1iZXJ9IGhpIEhpZ2ggMzIgYml0cywgdW5zaWduZWRcclxuICovXHJcbmZ1bmN0aW9uIExvbmdCaXRzKGxvLCBoaSkge1xyXG5cclxuICAgIC8vIG5vdGUgdGhhdCB0aGUgY2FzdHMgYmVsb3cgYXJlIHRoZW9yZXRpY2FsbHkgdW5uZWNlc3NhcnkgYXMgb2YgdG9kYXksIGJ1dCBvbGRlciBzdGF0aWNhbGx5XHJcbiAgICAvLyBnZW5lcmF0ZWQgY29udmVydGVyIGNvZGUgbWlnaHQgc3RpbGwgY2FsbCB0aGUgY3RvciB3aXRoIHNpZ25lZCAzMmJpdHMuIGtlcHQgZm9yIGNvbXBhdC5cclxuXHJcbiAgICAvKipcclxuICAgICAqIExvdyBiaXRzLlxyXG4gICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAqL1xyXG4gICAgdGhpcy5sbyA9IGxvID4+PiAwO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogSGlnaCBiaXRzLlxyXG4gICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAqL1xyXG4gICAgdGhpcy5oaSA9IGhpID4+PiAwO1xyXG59XHJcblxyXG4vKipcclxuICogWmVybyBiaXRzLlxyXG4gKiBAbWVtYmVyb2YgdXRpbC5Mb25nQml0c1xyXG4gKiBAdHlwZSB7dXRpbC5Mb25nQml0c31cclxuICovXHJcbnZhciB6ZXJvID0gTG9uZ0JpdHMuemVybyA9IG5ldyBMb25nQml0cygwLCAwKTtcclxuXHJcbnplcm8udG9OdW1iZXIgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XHJcbnplcm8uenpFbmNvZGUgPSB6ZXJvLnp6RGVjb2RlID0gZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzOyB9O1xyXG56ZXJvLmxlbmd0aCA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMTsgfTtcclxuXHJcbi8qKlxyXG4gKiBaZXJvIGhhc2guXHJcbiAqIEBtZW1iZXJvZiB1dGlsLkxvbmdCaXRzXHJcbiAqIEB0eXBlIHtzdHJpbmd9XHJcbiAqL1xyXG52YXIgemVyb0hhc2ggPSBMb25nQml0cy56ZXJvSGFzaCA9IFwiXFwwXFwwXFwwXFwwXFwwXFwwXFwwXFwwXCI7XHJcblxyXG4vKipcclxuICogQ29uc3RydWN0cyBuZXcgbG9uZyBiaXRzIGZyb20gdGhlIHNwZWNpZmllZCBudW1iZXIuXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSBWYWx1ZVxyXG4gKiBAcmV0dXJucyB7dXRpbC5Mb25nQml0c30gSW5zdGFuY2VcclxuICovXHJcbkxvbmdCaXRzLmZyb21OdW1iZXIgPSBmdW5jdGlvbiBmcm9tTnVtYmVyKHZhbHVlKSB7XHJcbiAgICBpZiAodmFsdWUgPT09IDApXHJcbiAgICAgICAgcmV0dXJuIHplcm87XHJcbiAgICB2YXIgc2lnbiA9IHZhbHVlIDwgMDtcclxuICAgIGlmIChzaWduKVxyXG4gICAgICAgIHZhbHVlID0gLXZhbHVlO1xyXG4gICAgdmFyIGxvID0gdmFsdWUgPj4+IDAsXHJcbiAgICAgICAgaGkgPSAodmFsdWUgLSBsbykgLyA0Mjk0OTY3Mjk2ID4+PiAwO1xyXG4gICAgaWYgKHNpZ24pIHtcclxuICAgICAgICBoaSA9IH5oaSA+Pj4gMDtcclxuICAgICAgICBsbyA9IH5sbyA+Pj4gMDtcclxuICAgICAgICBpZiAoKytsbyA+IDQyOTQ5NjcyOTUpIHtcclxuICAgICAgICAgICAgbG8gPSAwO1xyXG4gICAgICAgICAgICBpZiAoKytoaSA+IDQyOTQ5NjcyOTUpXHJcbiAgICAgICAgICAgICAgICBoaSA9IDA7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG5ldyBMb25nQml0cyhsbywgaGkpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENvbnN0cnVjdHMgbmV3IGxvbmcgYml0cyBmcm9tIGEgbnVtYmVyLCBsb25nIG9yIHN0cmluZy5cclxuICogQHBhcmFtIHtMb25nfG51bWJlcnxzdHJpbmd9IHZhbHVlIFZhbHVlXHJcbiAqIEByZXR1cm5zIHt1dGlsLkxvbmdCaXRzfSBJbnN0YW5jZVxyXG4gKi9cclxuTG9uZ0JpdHMuZnJvbSA9IGZ1bmN0aW9uIGZyb20odmFsdWUpIHtcclxuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwibnVtYmVyXCIpXHJcbiAgICAgICAgcmV0dXJuIExvbmdCaXRzLmZyb21OdW1iZXIodmFsdWUpO1xyXG4gICAgaWYgKHV0aWwuaXNTdHJpbmcodmFsdWUpKSB7XHJcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIGVsc2UgKi9cclxuICAgICAgICBpZiAodXRpbC5Mb25nKVxyXG4gICAgICAgICAgICB2YWx1ZSA9IHV0aWwuTG9uZy5mcm9tU3RyaW5nKHZhbHVlKTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHJldHVybiBMb25nQml0cy5mcm9tTnVtYmVyKHBhcnNlSW50KHZhbHVlLCAxMCkpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHZhbHVlLmxvdyB8fCB2YWx1ZS5oaWdoID8gbmV3IExvbmdCaXRzKHZhbHVlLmxvdyA+Pj4gMCwgdmFsdWUuaGlnaCA+Pj4gMCkgOiB6ZXJvO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENvbnZlcnRzIHRoaXMgbG9uZyBiaXRzIHRvIGEgcG9zc2libHkgdW5zYWZlIEphdmFTY3JpcHQgbnVtYmVyLlxyXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFt1bnNpZ25lZD1mYWxzZV0gV2hldGhlciB1bnNpZ25lZCBvciBub3RcclxuICogQHJldHVybnMge251bWJlcn0gUG9zc2libHkgdW5zYWZlIG51bWJlclxyXG4gKi9cclxuTG9uZ0JpdHMucHJvdG90eXBlLnRvTnVtYmVyID0gZnVuY3Rpb24gdG9OdW1iZXIodW5zaWduZWQpIHtcclxuICAgIGlmICghdW5zaWduZWQgJiYgdGhpcy5oaSA+Pj4gMzEpIHtcclxuICAgICAgICB2YXIgbG8gPSB+dGhpcy5sbyArIDEgPj4+IDAsXHJcbiAgICAgICAgICAgIGhpID0gfnRoaXMuaGkgICAgID4+PiAwO1xyXG4gICAgICAgIGlmICghbG8pXHJcbiAgICAgICAgICAgIGhpID0gaGkgKyAxID4+PiAwO1xyXG4gICAgICAgIHJldHVybiAtKGxvICsgaGkgKiA0Mjk0OTY3Mjk2KTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLmxvICsgdGhpcy5oaSAqIDQyOTQ5NjcyOTY7XHJcbn07XHJcblxyXG4vKipcclxuICogQ29udmVydHMgdGhpcyBsb25nIGJpdHMgdG8gYSBsb25nLlxyXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFt1bnNpZ25lZD1mYWxzZV0gV2hldGhlciB1bnNpZ25lZCBvciBub3RcclxuICogQHJldHVybnMge0xvbmd9IExvbmdcclxuICovXHJcbkxvbmdCaXRzLnByb3RvdHlwZS50b0xvbmcgPSBmdW5jdGlvbiB0b0xvbmcodW5zaWduZWQpIHtcclxuICAgIHJldHVybiB1dGlsLkxvbmdcclxuICAgICAgICA/IG5ldyB1dGlsLkxvbmcodGhpcy5sbyB8IDAsIHRoaXMuaGkgfCAwLCBCb29sZWFuKHVuc2lnbmVkKSlcclxuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgICAgIDogeyBsb3c6IHRoaXMubG8gfCAwLCBoaWdoOiB0aGlzLmhpIHwgMCwgdW5zaWduZWQ6IEJvb2xlYW4odW5zaWduZWQpIH07XHJcbn07XHJcblxyXG52YXIgY2hhckNvZGVBdCA9IFN0cmluZy5wcm90b3R5cGUuY2hhckNvZGVBdDtcclxuXHJcbi8qKlxyXG4gKiBDb25zdHJ1Y3RzIG5ldyBsb25nIGJpdHMgZnJvbSB0aGUgc3BlY2lmaWVkIDggY2hhcmFjdGVycyBsb25nIGhhc2guXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBoYXNoIEhhc2hcclxuICogQHJldHVybnMge3V0aWwuTG9uZ0JpdHN9IEJpdHNcclxuICovXHJcbkxvbmdCaXRzLmZyb21IYXNoID0gZnVuY3Rpb24gZnJvbUhhc2goaGFzaCkge1xyXG4gICAgaWYgKGhhc2ggPT09IHplcm9IYXNoKVxyXG4gICAgICAgIHJldHVybiB6ZXJvO1xyXG4gICAgcmV0dXJuIG5ldyBMb25nQml0cyhcclxuICAgICAgICAoIGNoYXJDb2RlQXQuY2FsbChoYXNoLCAwKVxyXG4gICAgICAgIHwgY2hhckNvZGVBdC5jYWxsKGhhc2gsIDEpIDw8IDhcclxuICAgICAgICB8IGNoYXJDb2RlQXQuY2FsbChoYXNoLCAyKSA8PCAxNlxyXG4gICAgICAgIHwgY2hhckNvZGVBdC5jYWxsKGhhc2gsIDMpIDw8IDI0KSA+Pj4gMFxyXG4gICAgLFxyXG4gICAgICAgICggY2hhckNvZGVBdC5jYWxsKGhhc2gsIDQpXHJcbiAgICAgICAgfCBjaGFyQ29kZUF0LmNhbGwoaGFzaCwgNSkgPDwgOFxyXG4gICAgICAgIHwgY2hhckNvZGVBdC5jYWxsKGhhc2gsIDYpIDw8IDE2XHJcbiAgICAgICAgfCBjaGFyQ29kZUF0LmNhbGwoaGFzaCwgNykgPDwgMjQpID4+PiAwXHJcbiAgICApO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENvbnZlcnRzIHRoaXMgbG9uZyBiaXRzIHRvIGEgOCBjaGFyYWN0ZXJzIGxvbmcgaGFzaC5cclxuICogQHJldHVybnMge3N0cmluZ30gSGFzaFxyXG4gKi9cclxuTG9uZ0JpdHMucHJvdG90eXBlLnRvSGFzaCA9IGZ1bmN0aW9uIHRvSGFzaCgpIHtcclxuICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlKFxyXG4gICAgICAgIHRoaXMubG8gICAgICAgICYgMjU1LFxyXG4gICAgICAgIHRoaXMubG8gPj4+IDggICYgMjU1LFxyXG4gICAgICAgIHRoaXMubG8gPj4+IDE2ICYgMjU1LFxyXG4gICAgICAgIHRoaXMubG8gPj4+IDI0ICAgICAgLFxyXG4gICAgICAgIHRoaXMuaGkgICAgICAgICYgMjU1LFxyXG4gICAgICAgIHRoaXMuaGkgPj4+IDggICYgMjU1LFxyXG4gICAgICAgIHRoaXMuaGkgPj4+IDE2ICYgMjU1LFxyXG4gICAgICAgIHRoaXMuaGkgPj4+IDI0XHJcbiAgICApO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFppZy16YWcgZW5jb2RlcyB0aGlzIGxvbmcgYml0cy5cclxuICogQHJldHVybnMge3V0aWwuTG9uZ0JpdHN9IGB0aGlzYFxyXG4gKi9cclxuTG9uZ0JpdHMucHJvdG90eXBlLnp6RW5jb2RlID0gZnVuY3Rpb24genpFbmNvZGUoKSB7XHJcbiAgICB2YXIgbWFzayA9ICAgdGhpcy5oaSA+PiAzMTtcclxuICAgIHRoaXMuaGkgID0gKCh0aGlzLmhpIDw8IDEgfCB0aGlzLmxvID4+PiAzMSkgXiBtYXNrKSA+Pj4gMDtcclxuICAgIHRoaXMubG8gID0gKCB0aGlzLmxvIDw8IDEgICAgICAgICAgICAgICAgICAgXiBtYXNrKSA+Pj4gMDtcclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFppZy16YWcgZGVjb2RlcyB0aGlzIGxvbmcgYml0cy5cclxuICogQHJldHVybnMge3V0aWwuTG9uZ0JpdHN9IGB0aGlzYFxyXG4gKi9cclxuTG9uZ0JpdHMucHJvdG90eXBlLnp6RGVjb2RlID0gZnVuY3Rpb24genpEZWNvZGUoKSB7XHJcbiAgICB2YXIgbWFzayA9IC0odGhpcy5sbyAmIDEpO1xyXG4gICAgdGhpcy5sbyAgPSAoKHRoaXMubG8gPj4+IDEgfCB0aGlzLmhpIDw8IDMxKSBeIG1hc2spID4+PiAwO1xyXG4gICAgdGhpcy5oaSAgPSAoIHRoaXMuaGkgPj4+IDEgICAgICAgICAgICAgICAgICBeIG1hc2spID4+PiAwO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogQ2FsY3VsYXRlcyB0aGUgbGVuZ3RoIG9mIHRoaXMgbG9uZ2JpdHMgd2hlbiBlbmNvZGVkIGFzIGEgdmFyaW50LlxyXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBMZW5ndGhcclxuICovXHJcbkxvbmdCaXRzLnByb3RvdHlwZS5sZW5ndGggPSBmdW5jdGlvbiBsZW5ndGgoKSB7XHJcbiAgICB2YXIgcGFydDAgPSAgdGhpcy5sbyxcclxuICAgICAgICBwYXJ0MSA9ICh0aGlzLmxvID4+PiAyOCB8IHRoaXMuaGkgPDwgNCkgPj4+IDAsXHJcbiAgICAgICAgcGFydDIgPSAgdGhpcy5oaSA+Pj4gMjQ7XHJcbiAgICByZXR1cm4gcGFydDIgPT09IDBcclxuICAgICAgICAgPyBwYXJ0MSA9PT0gMFxyXG4gICAgICAgICAgID8gcGFydDAgPCAxNjM4NFxyXG4gICAgICAgICAgICAgPyBwYXJ0MCA8IDEyOCA/IDEgOiAyXHJcbiAgICAgICAgICAgICA6IHBhcnQwIDwgMjA5NzE1MiA/IDMgOiA0XHJcbiAgICAgICAgICAgOiBwYXJ0MSA8IDE2Mzg0XHJcbiAgICAgICAgICAgICA/IHBhcnQxIDwgMTI4ID8gNSA6IDZcclxuICAgICAgICAgICAgIDogcGFydDEgPCAyMDk3MTUyID8gNyA6IDhcclxuICAgICAgICAgOiBwYXJ0MiA8IDEyOCA/IDkgOiAxMDtcclxufTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciB1dGlsID0gZXhwb3J0cztcclxuXHJcbi8vIHVzZWQgdG8gcmV0dXJuIGEgUHJvbWlzZSB3aGVyZSBjYWxsYmFjayBpcyBvbWl0dGVkXHJcbnV0aWwuYXNQcm9taXNlID0gcmVxdWlyZShcIkBwcm90b2J1ZmpzL2FzcHJvbWlzZVwiKTtcclxuXHJcbi8vIGNvbnZlcnRzIHRvIC8gZnJvbSBiYXNlNjQgZW5jb2RlZCBzdHJpbmdzXHJcbnV0aWwuYmFzZTY0ID0gcmVxdWlyZShcIkBwcm90b2J1ZmpzL2Jhc2U2NFwiKTtcclxuXHJcbi8vIGJhc2UgY2xhc3Mgb2YgcnBjLlNlcnZpY2VcclxudXRpbC5FdmVudEVtaXR0ZXIgPSByZXF1aXJlKFwiQHByb3RvYnVmanMvZXZlbnRlbWl0dGVyXCIpO1xyXG5cclxuLy8gZmxvYXQgaGFuZGxpbmcgYWNjcm9zcyBicm93c2Vyc1xyXG51dGlsLmZsb2F0ID0gcmVxdWlyZShcIkBwcm90b2J1ZmpzL2Zsb2F0XCIpO1xyXG5cclxuLy8gcmVxdWlyZXMgbW9kdWxlcyBvcHRpb25hbGx5IGFuZCBoaWRlcyB0aGUgY2FsbCBmcm9tIGJ1bmRsZXJzXHJcbnV0aWwuaW5xdWlyZSA9IHJlcXVpcmUoXCJAcHJvdG9idWZqcy9pbnF1aXJlXCIpO1xyXG5cclxuLy8gY29udmVydHMgdG8gLyBmcm9tIHV0ZjggZW5jb2RlZCBzdHJpbmdzXHJcbnV0aWwudXRmOCA9IHJlcXVpcmUoXCJAcHJvdG9idWZqcy91dGY4XCIpO1xyXG5cclxuLy8gcHJvdmlkZXMgYSBub2RlLWxpa2UgYnVmZmVyIHBvb2wgaW4gdGhlIGJyb3dzZXJcclxudXRpbC5wb29sID0gcmVxdWlyZShcIkBwcm90b2J1ZmpzL3Bvb2xcIik7XHJcblxyXG4vLyB1dGlsaXR5IHRvIHdvcmsgd2l0aCB0aGUgbG93IGFuZCBoaWdoIGJpdHMgb2YgYSA2NCBiaXQgdmFsdWVcclxudXRpbC5Mb25nQml0cyA9IHJlcXVpcmUoXCIuL2xvbmdiaXRzXCIpO1xyXG5cclxuLy8gZ2xvYmFsIG9iamVjdCByZWZlcmVuY2VcclxudXRpbC5nbG9iYWwgPSB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiICYmIHdpbmRvd1xyXG4gICAgICAgICAgIHx8IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgJiYgZ2xvYmFsXHJcbiAgICAgICAgICAgfHwgdHlwZW9mIHNlbGYgICAhPT0gXCJ1bmRlZmluZWRcIiAmJiBzZWxmXHJcbiAgICAgICAgICAgfHwgdGhpczsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1pbnZhbGlkLXRoaXNcclxuXHJcbi8qKlxyXG4gKiBBbiBpbW11YWJsZSBlbXB0eSBhcnJheS5cclxuICogQG1lbWJlcm9mIHV0aWxcclxuICogQHR5cGUge0FycmF5LjwqPn1cclxuICogQGNvbnN0XHJcbiAqL1xyXG51dGlsLmVtcHR5QXJyYXkgPSBPYmplY3QuZnJlZXplID8gT2JqZWN0LmZyZWV6ZShbXSkgOiAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqLyBbXTsgLy8gdXNlZCBvbiBwcm90b3R5cGVzXHJcblxyXG4vKipcclxuICogQW4gaW1tdXRhYmxlIGVtcHR5IG9iamVjdC5cclxuICogQHR5cGUge09iamVjdH1cclxuICogQGNvbnN0XHJcbiAqL1xyXG51dGlsLmVtcHR5T2JqZWN0ID0gT2JqZWN0LmZyZWV6ZSA/IE9iamVjdC5mcmVlemUoe30pIDogLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi8ge307IC8vIHVzZWQgb24gcHJvdG90eXBlc1xyXG5cclxuLyoqXHJcbiAqIFdoZXRoZXIgcnVubmluZyB3aXRoaW4gbm9kZSBvciBub3QuXHJcbiAqIEBtZW1iZXJvZiB1dGlsXHJcbiAqIEB0eXBlIHtib29sZWFufVxyXG4gKiBAY29uc3RcclxuICovXHJcbnV0aWwuaXNOb2RlID0gQm9vbGVhbih1dGlsLmdsb2JhbC5wcm9jZXNzICYmIHV0aWwuZ2xvYmFsLnByb2Nlc3MudmVyc2lvbnMgJiYgdXRpbC5nbG9iYWwucHJvY2Vzcy52ZXJzaW9ucy5ub2RlKTtcclxuXHJcbi8qKlxyXG4gKiBUZXN0cyBpZiB0aGUgc3BlY2lmaWVkIHZhbHVlIGlzIGFuIGludGVnZXIuXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcGFyYW0geyp9IHZhbHVlIFZhbHVlIHRvIHRlc3RcclxuICogQHJldHVybnMge2Jvb2xlYW59IGB0cnVlYCBpZiB0aGUgdmFsdWUgaXMgYW4gaW50ZWdlclxyXG4gKi9cclxudXRpbC5pc0ludGVnZXIgPSBOdW1iZXIuaXNJbnRlZ2VyIHx8IC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovIGZ1bmN0aW9uIGlzSW50ZWdlcih2YWx1ZSkge1xyXG4gICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gXCJudW1iZXJcIiAmJiBpc0Zpbml0ZSh2YWx1ZSkgJiYgTWF0aC5mbG9vcih2YWx1ZSkgPT09IHZhbHVlO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFRlc3RzIGlmIHRoZSBzcGVjaWZpZWQgdmFsdWUgaXMgYSBzdHJpbmcuXHJcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVmFsdWUgdG8gdGVzdFxyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gYHRydWVgIGlmIHRoZSB2YWx1ZSBpcyBhIHN0cmluZ1xyXG4gKi9cclxudXRpbC5pc1N0cmluZyA9IGZ1bmN0aW9uIGlzU3RyaW5nKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiIHx8IHZhbHVlIGluc3RhbmNlb2YgU3RyaW5nO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFRlc3RzIGlmIHRoZSBzcGVjaWZpZWQgdmFsdWUgaXMgYSBub24tbnVsbCBvYmplY3QuXHJcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVmFsdWUgdG8gdGVzdFxyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gYHRydWVgIGlmIHRoZSB2YWx1ZSBpcyBhIG5vbi1udWxsIG9iamVjdFxyXG4gKi9cclxudXRpbC5pc09iamVjdCA9IGZ1bmN0aW9uIGlzT2JqZWN0KHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENoZWNrcyBpZiBhIHByb3BlcnR5IG9uIGEgbWVzc2FnZSBpcyBjb25zaWRlcmVkIHRvIGJlIHByZXNlbnQuXHJcbiAqIFRoaXMgaXMgYW4gYWxpYXMgb2Yge0BsaW5rIHV0aWwuaXNTZXR9LlxyXG4gKiBAZnVuY3Rpb25cclxuICogQHBhcmFtIHtPYmplY3R9IG9iaiBQbGFpbiBvYmplY3Qgb3IgbWVzc2FnZSBpbnN0YW5jZVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcHJvcCBQcm9wZXJ0eSBuYW1lXHJcbiAqIEByZXR1cm5zIHtib29sZWFufSBgdHJ1ZWAgaWYgY29uc2lkZXJlZCB0byBiZSBwcmVzZW50LCBvdGhlcndpc2UgYGZhbHNlYFxyXG4gKi9cclxudXRpbC5pc3NldCA9XHJcblxyXG4vKipcclxuICogQ2hlY2tzIGlmIGEgcHJvcGVydHkgb24gYSBtZXNzYWdlIGlzIGNvbnNpZGVyZWQgdG8gYmUgcHJlc2VudC5cclxuICogQHBhcmFtIHtPYmplY3R9IG9iaiBQbGFpbiBvYmplY3Qgb3IgbWVzc2FnZSBpbnN0YW5jZVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcHJvcCBQcm9wZXJ0eSBuYW1lXHJcbiAqIEByZXR1cm5zIHtib29sZWFufSBgdHJ1ZWAgaWYgY29uc2lkZXJlZCB0byBiZSBwcmVzZW50LCBvdGhlcndpc2UgYGZhbHNlYFxyXG4gKi9cclxudXRpbC5pc1NldCA9IGZ1bmN0aW9uIGlzU2V0KG9iaiwgcHJvcCkge1xyXG4gICAgdmFyIHZhbHVlID0gb2JqW3Byb3BdO1xyXG4gICAgaWYgKHZhbHVlICE9IG51bGwgJiYgb2JqLmhhc093blByb3BlcnR5KHByb3ApKSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGVxZXFlcSwgbm8tcHJvdG90eXBlLWJ1aWx0aW5zXHJcbiAgICAgICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSAhPT0gXCJvYmplY3RcIiB8fCAoQXJyYXkuaXNBcnJheSh2YWx1ZSkgPyB2YWx1ZS5sZW5ndGggOiBPYmplY3Qua2V5cyh2YWx1ZSkubGVuZ3RoKSA+IDA7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbn07XHJcblxyXG4vKipcclxuICogQW55IGNvbXBhdGlibGUgQnVmZmVyIGluc3RhbmNlLlxyXG4gKiBUaGlzIGlzIGEgbWluaW1hbCBzdGFuZC1hbG9uZSBkZWZpbml0aW9uIG9mIGEgQnVmZmVyIGluc3RhbmNlLiBUaGUgYWN0dWFsIHR5cGUgaXMgdGhhdCBleHBvcnRlZCBieSBub2RlJ3MgdHlwaW5ncy5cclxuICogQGludGVyZmFjZSBCdWZmZXJcclxuICogQGV4dGVuZHMgVWludDhBcnJheVxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBOb2RlJ3MgQnVmZmVyIGNsYXNzIGlmIGF2YWlsYWJsZS5cclxuICogQHR5cGUge0NvbnN0cnVjdG9yPEJ1ZmZlcj59XHJcbiAqL1xyXG51dGlsLkJ1ZmZlciA9IChmdW5jdGlvbigpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgdmFyIEJ1ZmZlciA9IHV0aWwuaW5xdWlyZShcImJ1ZmZlclwiKS5CdWZmZXI7XHJcbiAgICAgICAgLy8gcmVmdXNlIHRvIHVzZSBub24tbm9kZSBidWZmZXJzIGlmIG5vdCBleHBsaWNpdGx5IGFzc2lnbmVkIChwZXJmIHJlYXNvbnMpOlxyXG4gICAgICAgIHJldHVybiBCdWZmZXIucHJvdG90eXBlLnV0ZjhXcml0ZSA/IEJ1ZmZlciA6IC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovIG51bGw7XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxufSkoKTtcclxuXHJcbi8vIEludGVybmFsIGFsaWFzIG9mIG9yIHBvbHlmdWxsIGZvciBCdWZmZXIuZnJvbS5cclxudXRpbC5fQnVmZmVyX2Zyb20gPSBudWxsO1xyXG5cclxuLy8gSW50ZXJuYWwgYWxpYXMgb2Ygb3IgcG9seWZpbGwgZm9yIEJ1ZmZlci5hbGxvY1Vuc2FmZS5cclxudXRpbC5fQnVmZmVyX2FsbG9jVW5zYWZlID0gbnVsbDtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgbmV3IGJ1ZmZlciBvZiB3aGF0ZXZlciB0eXBlIHN1cHBvcnRlZCBieSB0aGUgZW52aXJvbm1lbnQuXHJcbiAqIEBwYXJhbSB7bnVtYmVyfG51bWJlcltdfSBbc2l6ZU9yQXJyYXk9MF0gQnVmZmVyIHNpemUgb3IgbnVtYmVyIGFycmF5XHJcbiAqIEByZXR1cm5zIHtVaW50OEFycmF5fEJ1ZmZlcn0gQnVmZmVyXHJcbiAqL1xyXG51dGlsLm5ld0J1ZmZlciA9IGZ1bmN0aW9uIG5ld0J1ZmZlcihzaXplT3JBcnJheSkge1xyXG4gICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgIHJldHVybiB0eXBlb2Ygc2l6ZU9yQXJyYXkgPT09IFwibnVtYmVyXCJcclxuICAgICAgICA/IHV0aWwuQnVmZmVyXHJcbiAgICAgICAgICAgID8gdXRpbC5fQnVmZmVyX2FsbG9jVW5zYWZlKHNpemVPckFycmF5KVxyXG4gICAgICAgICAgICA6IG5ldyB1dGlsLkFycmF5KHNpemVPckFycmF5KVxyXG4gICAgICAgIDogdXRpbC5CdWZmZXJcclxuICAgICAgICAgICAgPyB1dGlsLl9CdWZmZXJfZnJvbShzaXplT3JBcnJheSlcclxuICAgICAgICAgICAgOiB0eXBlb2YgVWludDhBcnJheSA9PT0gXCJ1bmRlZmluZWRcIlxyXG4gICAgICAgICAgICAgICAgPyBzaXplT3JBcnJheVxyXG4gICAgICAgICAgICAgICAgOiBuZXcgVWludDhBcnJheShzaXplT3JBcnJheSk7XHJcbn07XHJcblxyXG4vKipcclxuICogQXJyYXkgaW1wbGVtZW50YXRpb24gdXNlZCBpbiB0aGUgYnJvd3Nlci4gYFVpbnQ4QXJyYXlgIGlmIHN1cHBvcnRlZCwgb3RoZXJ3aXNlIGBBcnJheWAuXHJcbiAqIEB0eXBlIHtDb25zdHJ1Y3RvcjxVaW50OEFycmF5Pn1cclxuICovXHJcbnV0aWwuQXJyYXkgPSB0eXBlb2YgVWludDhBcnJheSAhPT0gXCJ1bmRlZmluZWRcIiA/IFVpbnQ4QXJyYXkgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi8gOiBBcnJheTtcclxuXHJcbi8qKlxyXG4gKiBBbnkgY29tcGF0aWJsZSBMb25nIGluc3RhbmNlLlxyXG4gKiBUaGlzIGlzIGEgbWluaW1hbCBzdGFuZC1hbG9uZSBkZWZpbml0aW9uIG9mIGEgTG9uZyBpbnN0YW5jZS4gVGhlIGFjdHVhbCB0eXBlIGlzIHRoYXQgZXhwb3J0ZWQgYnkgbG9uZy5qcy5cclxuICogQGludGVyZmFjZSBMb25nXHJcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBsb3cgTG93IGJpdHNcclxuICogQHByb3BlcnR5IHtudW1iZXJ9IGhpZ2ggSGlnaCBiaXRzXHJcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gdW5zaWduZWQgV2hldGhlciB1bnNpZ25lZCBvciBub3RcclxuICovXHJcblxyXG4vKipcclxuICogTG9uZy5qcydzIExvbmcgY2xhc3MgaWYgYXZhaWxhYmxlLlxyXG4gKiBAdHlwZSB7Q29uc3RydWN0b3I8TG9uZz59XHJcbiAqL1xyXG51dGlsLkxvbmcgPSAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqLyB1dGlsLmdsb2JhbC5kY29kZUlPICYmIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovIHV0aWwuZ2xvYmFsLmRjb2RlSU8uTG9uZ1xyXG4gICAgICAgICB8fCAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqLyB1dGlsLmdsb2JhbC5Mb25nXHJcbiAgICAgICAgIHx8IHV0aWwuaW5xdWlyZShcImxvbmdcIik7XHJcblxyXG4vKipcclxuICogUmVndWxhciBleHByZXNzaW9uIHVzZWQgdG8gdmVyaWZ5IDIgYml0IChgYm9vbGApIG1hcCBrZXlzLlxyXG4gKiBAdHlwZSB7UmVnRXhwfVxyXG4gKiBAY29uc3RcclxuICovXHJcbnV0aWwua2V5MlJlID0gL150cnVlfGZhbHNlfDB8MSQvO1xyXG5cclxuLyoqXHJcbiAqIFJlZ3VsYXIgZXhwcmVzc2lvbiB1c2VkIHRvIHZlcmlmeSAzMiBiaXQgKGBpbnQzMmAgZXRjLikgbWFwIGtleXMuXHJcbiAqIEB0eXBlIHtSZWdFeHB9XHJcbiAqIEBjb25zdFxyXG4gKi9cclxudXRpbC5rZXkzMlJlID0gL14tPyg/OjB8WzEtOV1bMC05XSopJC87XHJcblxyXG4vKipcclxuICogUmVndWxhciBleHByZXNzaW9uIHVzZWQgdG8gdmVyaWZ5IDY0IGJpdCAoYGludDY0YCBldGMuKSBtYXAga2V5cy5cclxuICogQHR5cGUge1JlZ0V4cH1cclxuICogQGNvbnN0XHJcbiAqL1xyXG51dGlsLmtleTY0UmUgPSAvXig/OltcXFxceDAwLVxcXFx4ZmZdezh9fC0/KD86MHxbMS05XVswLTldKikpJC87XHJcblxyXG4vKipcclxuICogQ29udmVydHMgYSBudW1iZXIgb3IgbG9uZyB0byBhbiA4IGNoYXJhY3RlcnMgbG9uZyBoYXNoIHN0cmluZy5cclxuICogQHBhcmFtIHtMb25nfG51bWJlcn0gdmFsdWUgVmFsdWUgdG8gY29udmVydFxyXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBIYXNoXHJcbiAqL1xyXG51dGlsLmxvbmdUb0hhc2ggPSBmdW5jdGlvbiBsb25nVG9IYXNoKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdmFsdWVcclxuICAgICAgICA/IHV0aWwuTG9uZ0JpdHMuZnJvbSh2YWx1ZSkudG9IYXNoKClcclxuICAgICAgICA6IHV0aWwuTG9uZ0JpdHMuemVyb0hhc2g7XHJcbn07XHJcblxyXG4vKipcclxuICogQ29udmVydHMgYW4gOCBjaGFyYWN0ZXJzIGxvbmcgaGFzaCBzdHJpbmcgdG8gYSBsb25nIG9yIG51bWJlci5cclxuICogQHBhcmFtIHtzdHJpbmd9IGhhc2ggSGFzaFxyXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFt1bnNpZ25lZD1mYWxzZV0gV2hldGhlciB1bnNpZ25lZCBvciBub3RcclxuICogQHJldHVybnMge0xvbmd8bnVtYmVyfSBPcmlnaW5hbCB2YWx1ZVxyXG4gKi9cclxudXRpbC5sb25nRnJvbUhhc2ggPSBmdW5jdGlvbiBsb25nRnJvbUhhc2goaGFzaCwgdW5zaWduZWQpIHtcclxuICAgIHZhciBiaXRzID0gdXRpbC5Mb25nQml0cy5mcm9tSGFzaChoYXNoKTtcclxuICAgIGlmICh1dGlsLkxvbmcpXHJcbiAgICAgICAgcmV0dXJuIHV0aWwuTG9uZy5mcm9tQml0cyhiaXRzLmxvLCBiaXRzLmhpLCB1bnNpZ25lZCk7XHJcbiAgICByZXR1cm4gYml0cy50b051bWJlcihCb29sZWFuKHVuc2lnbmVkKSk7XHJcbn07XHJcblxyXG4vKipcclxuICogTWVyZ2VzIHRoZSBwcm9wZXJ0aWVzIG9mIHRoZSBzb3VyY2Ugb2JqZWN0IGludG8gdGhlIGRlc3RpbmF0aW9uIG9iamVjdC5cclxuICogQG1lbWJlcm9mIHV0aWxcclxuICogQHBhcmFtIHtPYmplY3QuPHN0cmluZywqPn0gZHN0IERlc3RpbmF0aW9uIG9iamVjdFxyXG4gKiBAcGFyYW0ge09iamVjdC48c3RyaW5nLCo+fSBzcmMgU291cmNlIG9iamVjdFxyXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtpZk5vdFNldD1mYWxzZV0gTWVyZ2VzIG9ubHkgaWYgdGhlIGtleSBpcyBub3QgYWxyZWFkeSBzZXRcclxuICogQHJldHVybnMge09iamVjdC48c3RyaW5nLCo+fSBEZXN0aW5hdGlvbiBvYmplY3RcclxuICovXHJcbmZ1bmN0aW9uIG1lcmdlKGRzdCwgc3JjLCBpZk5vdFNldCkgeyAvLyB1c2VkIGJ5IGNvbnZlcnRlcnNcclxuICAgIGZvciAodmFyIGtleXMgPSBPYmplY3Qua2V5cyhzcmMpLCBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyArK2kpXHJcbiAgICAgICAgaWYgKGRzdFtrZXlzW2ldXSA9PT0gdW5kZWZpbmVkIHx8ICFpZk5vdFNldClcclxuICAgICAgICAgICAgZHN0W2tleXNbaV1dID0gc3JjW2tleXNbaV1dO1xyXG4gICAgcmV0dXJuIGRzdDtcclxufVxyXG5cclxudXRpbC5tZXJnZSA9IG1lcmdlO1xyXG5cclxuLyoqXHJcbiAqIENvbnZlcnRzIHRoZSBmaXJzdCBjaGFyYWN0ZXIgb2YgYSBzdHJpbmcgdG8gbG93ZXIgY2FzZS5cclxuICogQHBhcmFtIHtzdHJpbmd9IHN0ciBTdHJpbmcgdG8gY29udmVydFxyXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBDb252ZXJ0ZWQgc3RyaW5nXHJcbiAqL1xyXG51dGlsLmxjRmlyc3QgPSBmdW5jdGlvbiBsY0ZpcnN0KHN0cikge1xyXG4gICAgcmV0dXJuIHN0ci5jaGFyQXQoMCkudG9Mb3dlckNhc2UoKSArIHN0ci5zdWJzdHJpbmcoMSk7XHJcbn07XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIGN1c3RvbSBlcnJvciBjb25zdHJ1Y3Rvci5cclxuICogQG1lbWJlcm9mIHV0aWxcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgRXJyb3IgbmFtZVxyXG4gKiBAcmV0dXJucyB7Q29uc3RydWN0b3I8RXJyb3I+fSBDdXN0b20gZXJyb3IgY29uc3RydWN0b3JcclxuICovXHJcbmZ1bmN0aW9uIG5ld0Vycm9yKG5hbWUpIHtcclxuXHJcbiAgICBmdW5jdGlvbiBDdXN0b21FcnJvcihtZXNzYWdlLCBwcm9wZXJ0aWVzKSB7XHJcblxyXG4gICAgICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBDdXN0b21FcnJvcikpXHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgQ3VzdG9tRXJyb3IobWVzc2FnZSwgcHJvcGVydGllcyk7XHJcblxyXG4gICAgICAgIC8vIEVycm9yLmNhbGwodGhpcywgbWVzc2FnZSk7XHJcbiAgICAgICAgLy8gXiBqdXN0IHJldHVybnMgYSBuZXcgZXJyb3IgaW5zdGFuY2UgYmVjYXVzZSB0aGUgY3RvciBjYW4gYmUgY2FsbGVkIGFzIGEgZnVuY3Rpb25cclxuXHJcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwibWVzc2FnZVwiLCB7IGdldDogZnVuY3Rpb24oKSB7IHJldHVybiBtZXNzYWdlOyB9IH0pO1xyXG5cclxuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgICAgIGlmIChFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSkgLy8gbm9kZVxyXG4gICAgICAgICAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCBDdXN0b21FcnJvcik7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJzdGFja1wiLCB7IHZhbHVlOiAobmV3IEVycm9yKCkpLnN0YWNrIHx8IFwiXCIgfSk7XHJcblxyXG4gICAgICAgIGlmIChwcm9wZXJ0aWVzKVxyXG4gICAgICAgICAgICBtZXJnZSh0aGlzLCBwcm9wZXJ0aWVzKTtcclxuICAgIH1cclxuXHJcbiAgICAoQ3VzdG9tRXJyb3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShFcnJvci5wcm90b3R5cGUpKS5jb25zdHJ1Y3RvciA9IEN1c3RvbUVycm9yO1xyXG5cclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShDdXN0b21FcnJvci5wcm90b3R5cGUsIFwibmFtZVwiLCB7IGdldDogZnVuY3Rpb24oKSB7IHJldHVybiBuYW1lOyB9IH0pO1xyXG5cclxuICAgIEN1c3RvbUVycm9yLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm5hbWUgKyBcIjogXCIgKyB0aGlzLm1lc3NhZ2U7XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBDdXN0b21FcnJvcjtcclxufVxyXG5cclxudXRpbC5uZXdFcnJvciA9IG5ld0Vycm9yO1xyXG5cclxuLyoqXHJcbiAqIENvbnN0cnVjdHMgYSBuZXcgcHJvdG9jb2wgZXJyb3IuXHJcbiAqIEBjbGFzc2Rlc2MgRXJyb3Igc3ViY2xhc3MgaW5kaWNhdGluZyBhIHByb3RvY29sIHNwZWNpZmMgZXJyb3IuXHJcbiAqIEBtZW1iZXJvZiB1dGlsXHJcbiAqIEBleHRlbmRzIEVycm9yXHJcbiAqIEB0ZW1wbGF0ZSBUIGV4dGVuZHMgTWVzc2FnZTxUPlxyXG4gKiBAY29uc3RydWN0b3JcclxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgRXJyb3IgbWVzc2FnZVxyXG4gKiBAcGFyYW0ge09iamVjdC48c3RyaW5nLCo+fSBbcHJvcGVydGllc10gQWRkaXRpb25hbCBwcm9wZXJ0aWVzXHJcbiAqIEBleGFtcGxlXHJcbiAqIHRyeSB7XHJcbiAqICAgICBNeU1lc3NhZ2UuZGVjb2RlKHNvbWVCdWZmZXIpOyAvLyB0aHJvd3MgaWYgcmVxdWlyZWQgZmllbGRzIGFyZSBtaXNzaW5nXHJcbiAqIH0gY2F0Y2ggKGUpIHtcclxuICogICAgIGlmIChlIGluc3RhbmNlb2YgUHJvdG9jb2xFcnJvciAmJiBlLmluc3RhbmNlKVxyXG4gKiAgICAgICAgIGNvbnNvbGUubG9nKFwiZGVjb2RlZCBzbyBmYXI6IFwiICsgSlNPTi5zdHJpbmdpZnkoZS5pbnN0YW5jZSkpO1xyXG4gKiB9XHJcbiAqL1xyXG51dGlsLlByb3RvY29sRXJyb3IgPSBuZXdFcnJvcihcIlByb3RvY29sRXJyb3JcIik7XHJcblxyXG4vKipcclxuICogU28gZmFyIGRlY29kZWQgbWVzc2FnZSBpbnN0YW5jZS5cclxuICogQG5hbWUgdXRpbC5Qcm90b2NvbEVycm9yI2luc3RhbmNlXHJcbiAqIEB0eXBlIHtNZXNzYWdlPFQ+fVxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBBIE9uZU9mIGdldHRlciBhcyByZXR1cm5lZCBieSB7QGxpbmsgdXRpbC5vbmVPZkdldHRlcn0uXHJcbiAqIEB0eXBlZGVmIE9uZU9mR2V0dGVyXHJcbiAqIEB0eXBlIHtmdW5jdGlvbn1cclxuICogQHJldHVybnMge3N0cmluZ3x1bmRlZmluZWR9IFNldCBmaWVsZCBuYW1lLCBpZiBhbnlcclxuICovXHJcblxyXG4vKipcclxuICogQnVpbGRzIGEgZ2V0dGVyIGZvciBhIG9uZW9mJ3MgcHJlc2VudCBmaWVsZCBuYW1lLlxyXG4gKiBAcGFyYW0ge3N0cmluZ1tdfSBmaWVsZE5hbWVzIEZpZWxkIG5hbWVzXHJcbiAqIEByZXR1cm5zIHtPbmVPZkdldHRlcn0gVW5ib3VuZCBnZXR0ZXJcclxuICovXHJcbnV0aWwub25lT2ZHZXR0ZXIgPSBmdW5jdGlvbiBnZXRPbmVPZihmaWVsZE5hbWVzKSB7XHJcbiAgICB2YXIgZmllbGRNYXAgPSB7fTtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZmllbGROYW1lcy5sZW5ndGg7ICsraSlcclxuICAgICAgICBmaWVsZE1hcFtmaWVsZE5hbWVzW2ldXSA9IDE7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfHVuZGVmaW5lZH0gU2V0IGZpZWxkIG5hbWUsIGlmIGFueVxyXG4gICAgICogQHRoaXMgT2JqZWN0XHJcbiAgICAgKiBAaWdub3JlXHJcbiAgICAgKi9cclxuICAgIHJldHVybiBmdW5jdGlvbigpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBjb25zaXN0ZW50LXJldHVyblxyXG4gICAgICAgIGZvciAodmFyIGtleXMgPSBPYmplY3Qua2V5cyh0aGlzKSwgaSA9IGtleXMubGVuZ3RoIC0gMTsgaSA+IC0xOyAtLWkpXHJcbiAgICAgICAgICAgIGlmIChmaWVsZE1hcFtrZXlzW2ldXSA9PT0gMSAmJiB0aGlzW2tleXNbaV1dICE9PSB1bmRlZmluZWQgJiYgdGhpc1trZXlzW2ldXSAhPT0gbnVsbClcclxuICAgICAgICAgICAgICAgIHJldHVybiBrZXlzW2ldO1xyXG4gICAgfTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBBIE9uZU9mIHNldHRlciBhcyByZXR1cm5lZCBieSB7QGxpbmsgdXRpbC5vbmVPZlNldHRlcn0uXHJcbiAqIEB0eXBlZGVmIE9uZU9mU2V0dGVyXHJcbiAqIEB0eXBlIHtmdW5jdGlvbn1cclxuICogQHBhcmFtIHtzdHJpbmd8dW5kZWZpbmVkfSB2YWx1ZSBGaWVsZCBuYW1lXHJcbiAqIEByZXR1cm5zIHt1bmRlZmluZWR9XHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIEJ1aWxkcyBhIHNldHRlciBmb3IgYSBvbmVvZidzIHByZXNlbnQgZmllbGQgbmFtZS5cclxuICogQHBhcmFtIHtzdHJpbmdbXX0gZmllbGROYW1lcyBGaWVsZCBuYW1lc1xyXG4gKiBAcmV0dXJucyB7T25lT2ZTZXR0ZXJ9IFVuYm91bmQgc2V0dGVyXHJcbiAqL1xyXG51dGlsLm9uZU9mU2V0dGVyID0gZnVuY3Rpb24gc2V0T25lT2YoZmllbGROYW1lcykge1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgRmllbGQgbmFtZVxyXG4gICAgICogQHJldHVybnMge3VuZGVmaW5lZH1cclxuICAgICAqIEB0aGlzIE9iamVjdFxyXG4gICAgICogQGlnbm9yZVxyXG4gICAgICovXHJcbiAgICByZXR1cm4gZnVuY3Rpb24obmFtZSkge1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZmllbGROYW1lcy5sZW5ndGg7ICsraSlcclxuICAgICAgICAgICAgaWYgKGZpZWxkTmFtZXNbaV0gIT09IG5hbWUpXHJcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpc1tmaWVsZE5hbWVzW2ldXTtcclxuICAgIH07XHJcbn07XHJcblxyXG4vKipcclxuICogRGVmYXVsdCBjb252ZXJzaW9uIG9wdGlvbnMgdXNlZCBmb3Ige0BsaW5rIE1lc3NhZ2UjdG9KU09OfSBpbXBsZW1lbnRhdGlvbnMuXHJcbiAqXHJcbiAqIFRoZXNlIG9wdGlvbnMgYXJlIGNsb3NlIHRvIHByb3RvMydzIEpTT04gbWFwcGluZyB3aXRoIHRoZSBleGNlcHRpb24gdGhhdCBpbnRlcm5hbCB0eXBlcyBsaWtlIEFueSBhcmUgaGFuZGxlZCBqdXN0IGxpa2UgbWVzc2FnZXMuIE1vcmUgcHJlY2lzZWx5OlxyXG4gKlxyXG4gKiAtIExvbmdzIGJlY29tZSBzdHJpbmdzXHJcbiAqIC0gRW51bXMgYmVjb21lIHN0cmluZyBrZXlzXHJcbiAqIC0gQnl0ZXMgYmVjb21lIGJhc2U2NCBlbmNvZGVkIHN0cmluZ3NcclxuICogLSAoU3ViLSlNZXNzYWdlcyBiZWNvbWUgcGxhaW4gb2JqZWN0c1xyXG4gKiAtIE1hcHMgYmVjb21lIHBsYWluIG9iamVjdHMgd2l0aCBhbGwgc3RyaW5nIGtleXNcclxuICogLSBSZXBlYXRlZCBmaWVsZHMgYmVjb21lIGFycmF5c1xyXG4gKiAtIE5hTiBhbmQgSW5maW5pdHkgZm9yIGZsb2F0IGFuZCBkb3VibGUgZmllbGRzIGJlY29tZSBzdHJpbmdzXHJcbiAqXHJcbiAqIEB0eXBlIHtJQ29udmVyc2lvbk9wdGlvbnN9XHJcbiAqIEBzZWUgaHR0cHM6Ly9kZXZlbG9wZXJzLmdvb2dsZS5jb20vcHJvdG9jb2wtYnVmZmVycy9kb2NzL3Byb3RvMz9obD1lbiNqc29uXHJcbiAqL1xyXG51dGlsLnRvSlNPTk9wdGlvbnMgPSB7XHJcbiAgICBsb25nczogU3RyaW5nLFxyXG4gICAgZW51bXM6IFN0cmluZyxcclxuICAgIGJ5dGVzOiBTdHJpbmcsXHJcbiAgICBqc29uOiB0cnVlXHJcbn07XHJcblxyXG4vLyBTZXRzIHVwIGJ1ZmZlciB1dGlsaXR5IGFjY29yZGluZyB0byB0aGUgZW52aXJvbm1lbnQgKGNhbGxlZCBpbiBpbmRleC1taW5pbWFsKVxyXG51dGlsLl9jb25maWd1cmUgPSBmdW5jdGlvbigpIHtcclxuICAgIHZhciBCdWZmZXIgPSB1dGlsLkJ1ZmZlcjtcclxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xyXG4gICAgaWYgKCFCdWZmZXIpIHtcclxuICAgICAgICB1dGlsLl9CdWZmZXJfZnJvbSA9IHV0aWwuX0J1ZmZlcl9hbGxvY1Vuc2FmZSA9IG51bGw7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgLy8gYmVjYXVzZSBub2RlIDQueCBidWZmZXJzIGFyZSBpbmNvbXBhdGlibGUgJiBpbW11dGFibGVcclxuICAgIC8vIHNlZTogaHR0cHM6Ly9naXRodWIuY29tL2Rjb2RlSU8vcHJvdG9idWYuanMvcHVsbC82NjVcclxuICAgIHV0aWwuX0J1ZmZlcl9mcm9tID0gQnVmZmVyLmZyb20gIT09IFVpbnQ4QXJyYXkuZnJvbSAmJiBCdWZmZXIuZnJvbSB8fFxyXG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICAgICAgZnVuY3Rpb24gQnVmZmVyX2Zyb20odmFsdWUsIGVuY29kaW5nKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgQnVmZmVyKHZhbHVlLCBlbmNvZGluZyk7XHJcbiAgICAgICAgfTtcclxuICAgIHV0aWwuX0J1ZmZlcl9hbGxvY1Vuc2FmZSA9IEJ1ZmZlci5hbGxvY1Vuc2FmZSB8fFxyXG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICAgICAgZnVuY3Rpb24gQnVmZmVyX2FsbG9jVW5zYWZlKHNpemUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBCdWZmZXIoc2l6ZSk7XHJcbiAgICAgICAgfTtcclxufTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbm1vZHVsZS5leHBvcnRzID0gV3JpdGVyO1xyXG5cclxudmFyIHV0aWwgICAgICA9IHJlcXVpcmUoXCIuL3V0aWwvbWluaW1hbFwiKTtcclxuXHJcbnZhciBCdWZmZXJXcml0ZXI7IC8vIGN5Y2xpY1xyXG5cclxudmFyIExvbmdCaXRzICA9IHV0aWwuTG9uZ0JpdHMsXHJcbiAgICBiYXNlNjQgICAgPSB1dGlsLmJhc2U2NCxcclxuICAgIHV0ZjggICAgICA9IHV0aWwudXRmODtcclxuXHJcbi8qKlxyXG4gKiBDb25zdHJ1Y3RzIGEgbmV3IHdyaXRlciBvcGVyYXRpb24gaW5zdGFuY2UuXHJcbiAqIEBjbGFzc2Rlc2MgU2NoZWR1bGVkIHdyaXRlciBvcGVyYXRpb24uXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKCosIFVpbnQ4QXJyYXksIG51bWJlcil9IGZuIEZ1bmN0aW9uIHRvIGNhbGxcclxuICogQHBhcmFtIHtudW1iZXJ9IGxlbiBWYWx1ZSBieXRlIGxlbmd0aFxyXG4gKiBAcGFyYW0geyp9IHZhbCBWYWx1ZSB0byB3cml0ZVxyXG4gKiBAaWdub3JlXHJcbiAqL1xyXG5mdW5jdGlvbiBPcChmbiwgbGVuLCB2YWwpIHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEZ1bmN0aW9uIHRvIGNhbGwuXHJcbiAgICAgKiBAdHlwZSB7ZnVuY3Rpb24oVWludDhBcnJheSwgbnVtYmVyLCAqKX1cclxuICAgICAqL1xyXG4gICAgdGhpcy5mbiA9IGZuO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVmFsdWUgYnl0ZSBsZW5ndGguXHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICB0aGlzLmxlbiA9IGxlbjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIE5leHQgb3BlcmF0aW9uLlxyXG4gICAgICogQHR5cGUge1dyaXRlci5PcHx1bmRlZmluZWR9XHJcbiAgICAgKi9cclxuICAgIHRoaXMubmV4dCA9IHVuZGVmaW5lZDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFZhbHVlIHRvIHdyaXRlLlxyXG4gICAgICogQHR5cGUgeyp9XHJcbiAgICAgKi9cclxuICAgIHRoaXMudmFsID0gdmFsOyAvLyB0eXBlIHZhcmllc1xyXG59XHJcblxyXG4vKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG5mdW5jdGlvbiBub29wKCkge30gLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1lbXB0eS1mdW5jdGlvblxyXG5cclxuLyoqXHJcbiAqIENvbnN0cnVjdHMgYSBuZXcgd3JpdGVyIHN0YXRlIGluc3RhbmNlLlxyXG4gKiBAY2xhc3NkZXNjIENvcGllZCB3cml0ZXIgc3RhdGUuXHJcbiAqIEBtZW1iZXJvZiBXcml0ZXJcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqIEBwYXJhbSB7V3JpdGVyfSB3cml0ZXIgV3JpdGVyIHRvIGNvcHkgc3RhdGUgZnJvbVxyXG4gKiBAaWdub3JlXHJcbiAqL1xyXG5mdW5jdGlvbiBTdGF0ZSh3cml0ZXIpIHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEN1cnJlbnQgaGVhZC5cclxuICAgICAqIEB0eXBlIHtXcml0ZXIuT3B9XHJcbiAgICAgKi9cclxuICAgIHRoaXMuaGVhZCA9IHdyaXRlci5oZWFkO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ3VycmVudCB0YWlsLlxyXG4gICAgICogQHR5cGUge1dyaXRlci5PcH1cclxuICAgICAqL1xyXG4gICAgdGhpcy50YWlsID0gd3JpdGVyLnRhaWw7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDdXJyZW50IGJ1ZmZlciBsZW5ndGguXHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICB0aGlzLmxlbiA9IHdyaXRlci5sZW47XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBOZXh0IHN0YXRlLlxyXG4gICAgICogQHR5cGUge1N0YXRlfG51bGx9XHJcbiAgICAgKi9cclxuICAgIHRoaXMubmV4dCA9IHdyaXRlci5zdGF0ZXM7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDb25zdHJ1Y3RzIGEgbmV3IHdyaXRlciBpbnN0YW5jZS5cclxuICogQGNsYXNzZGVzYyBXaXJlIGZvcm1hdCB3cml0ZXIgdXNpbmcgYFVpbnQ4QXJyYXlgIGlmIGF2YWlsYWJsZSwgb3RoZXJ3aXNlIGBBcnJheWAuXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKi9cclxuZnVuY3Rpb24gV3JpdGVyKCkge1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ3VycmVudCBsZW5ndGguXHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICB0aGlzLmxlbiA9IDA7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBPcGVyYXRpb25zIGhlYWQuXHJcbiAgICAgKiBAdHlwZSB7T2JqZWN0fVxyXG4gICAgICovXHJcbiAgICB0aGlzLmhlYWQgPSBuZXcgT3Aobm9vcCwgMCwgMCk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBPcGVyYXRpb25zIHRhaWxcclxuICAgICAqIEB0eXBlIHtPYmplY3R9XHJcbiAgICAgKi9cclxuICAgIHRoaXMudGFpbCA9IHRoaXMuaGVhZDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIExpbmtlZCBmb3JrZWQgc3RhdGVzLlxyXG4gICAgICogQHR5cGUge09iamVjdHxudWxsfVxyXG4gICAgICovXHJcbiAgICB0aGlzLnN0YXRlcyA9IG51bGw7XHJcblxyXG4gICAgLy8gV2hlbiBhIHZhbHVlIGlzIHdyaXR0ZW4sIHRoZSB3cml0ZXIgY2FsY3VsYXRlcyBpdHMgYnl0ZSBsZW5ndGggYW5kIHB1dHMgaXQgaW50byBhIGxpbmtlZFxyXG4gICAgLy8gbGlzdCBvZiBvcGVyYXRpb25zIHRvIHBlcmZvcm0gd2hlbiBmaW5pc2goKSBpcyBjYWxsZWQuIFRoaXMgYm90aCBhbGxvd3MgdXMgdG8gYWxsb2NhdGVcclxuICAgIC8vIGJ1ZmZlcnMgb2YgdGhlIGV4YWN0IHJlcXVpcmVkIHNpemUgYW5kIHJlZHVjZXMgdGhlIGFtb3VudCBvZiB3b3JrIHdlIGhhdmUgdG8gZG8gY29tcGFyZWRcclxuICAgIC8vIHRvIGZpcnN0IGNhbGN1bGF0aW5nIG92ZXIgb2JqZWN0cyBhbmQgdGhlbiBlbmNvZGluZyBvdmVyIG9iamVjdHMuIEluIG91ciBjYXNlLCB0aGUgZW5jb2RpbmdcclxuICAgIC8vIHBhcnQgaXMganVzdCBhIGxpbmtlZCBsaXN0IHdhbGsgY2FsbGluZyBvcGVyYXRpb25zIHdpdGggYWxyZWFkeSBwcmVwYXJlZCB2YWx1ZXMuXHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgbmV3IHdyaXRlci5cclxuICogQGZ1bmN0aW9uXHJcbiAqIEByZXR1cm5zIHtCdWZmZXJXcml0ZXJ8V3JpdGVyfSBBIHtAbGluayBCdWZmZXJXcml0ZXJ9IHdoZW4gQnVmZmVycyBhcmUgc3VwcG9ydGVkLCBvdGhlcndpc2UgYSB7QGxpbmsgV3JpdGVyfVxyXG4gKi9cclxuV3JpdGVyLmNyZWF0ZSA9IHV0aWwuQnVmZmVyXHJcbiAgICA/IGZ1bmN0aW9uIGNyZWF0ZV9idWZmZXJfc2V0dXAoKSB7XHJcbiAgICAgICAgcmV0dXJuIChXcml0ZXIuY3JlYXRlID0gZnVuY3Rpb24gY3JlYXRlX2J1ZmZlcigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBCdWZmZXJXcml0ZXIoKTtcclxuICAgICAgICB9KSgpO1xyXG4gICAgfVxyXG4gICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgIDogZnVuY3Rpb24gY3JlYXRlX2FycmF5KCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgV3JpdGVyKCk7XHJcbiAgICB9O1xyXG5cclxuLyoqXHJcbiAqIEFsbG9jYXRlcyBhIGJ1ZmZlciBvZiB0aGUgc3BlY2lmaWVkIHNpemUuXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBzaXplIEJ1ZmZlciBzaXplXHJcbiAqIEByZXR1cm5zIHtVaW50OEFycmF5fSBCdWZmZXJcclxuICovXHJcbldyaXRlci5hbGxvYyA9IGZ1bmN0aW9uIGFsbG9jKHNpemUpIHtcclxuICAgIHJldHVybiBuZXcgdXRpbC5BcnJheShzaXplKTtcclxufTtcclxuXHJcbi8vIFVzZSBVaW50OEFycmF5IGJ1ZmZlciBwb29sIGluIHRoZSBicm93c2VyLCBqdXN0IGxpa2Ugbm9kZSBkb2VzIHdpdGggYnVmZmVyc1xyXG4vKiBpc3RhbmJ1bCBpZ25vcmUgZWxzZSAqL1xyXG5pZiAodXRpbC5BcnJheSAhPT0gQXJyYXkpXHJcbiAgICBXcml0ZXIuYWxsb2MgPSB1dGlsLnBvb2woV3JpdGVyLmFsbG9jLCB1dGlsLkFycmF5LnByb3RvdHlwZS5zdWJhcnJheSk7XHJcblxyXG4vKipcclxuICogUHVzaGVzIGEgbmV3IG9wZXJhdGlvbiB0byB0aGUgcXVldWUuXHJcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oVWludDhBcnJheSwgbnVtYmVyLCAqKX0gZm4gRnVuY3Rpb24gdG8gY2FsbFxyXG4gKiBAcGFyYW0ge251bWJlcn0gbGVuIFZhbHVlIGJ5dGUgbGVuZ3RoXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWwgVmFsdWUgdG8gd3JpdGVcclxuICogQHJldHVybnMge1dyaXRlcn0gYHRoaXNgXHJcbiAqIEBwcml2YXRlXHJcbiAqL1xyXG5Xcml0ZXIucHJvdG90eXBlLl9wdXNoID0gZnVuY3Rpb24gcHVzaChmbiwgbGVuLCB2YWwpIHtcclxuICAgIHRoaXMudGFpbCA9IHRoaXMudGFpbC5uZXh0ID0gbmV3IE9wKGZuLCBsZW4sIHZhbCk7XHJcbiAgICB0aGlzLmxlbiArPSBsZW47XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbmZ1bmN0aW9uIHdyaXRlQnl0ZSh2YWwsIGJ1ZiwgcG9zKSB7XHJcbiAgICBidWZbcG9zXSA9IHZhbCAmIDI1NTtcclxufVxyXG5cclxuZnVuY3Rpb24gd3JpdGVWYXJpbnQzMih2YWwsIGJ1ZiwgcG9zKSB7XHJcbiAgICB3aGlsZSAodmFsID4gMTI3KSB7XHJcbiAgICAgICAgYnVmW3BvcysrXSA9IHZhbCAmIDEyNyB8IDEyODtcclxuICAgICAgICB2YWwgPj4+PSA3O1xyXG4gICAgfVxyXG4gICAgYnVmW3Bvc10gPSB2YWw7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDb25zdHJ1Y3RzIGEgbmV3IHZhcmludCB3cml0ZXIgb3BlcmF0aW9uIGluc3RhbmNlLlxyXG4gKiBAY2xhc3NkZXNjIFNjaGVkdWxlZCB2YXJpbnQgd3JpdGVyIG9wZXJhdGlvbi5cclxuICogQGV4dGVuZHMgT3BcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBsZW4gVmFsdWUgYnl0ZSBsZW5ndGhcclxuICogQHBhcmFtIHtudW1iZXJ9IHZhbCBWYWx1ZSB0byB3cml0ZVxyXG4gKiBAaWdub3JlXHJcbiAqL1xyXG5mdW5jdGlvbiBWYXJpbnRPcChsZW4sIHZhbCkge1xyXG4gICAgdGhpcy5sZW4gPSBsZW47XHJcbiAgICB0aGlzLm5leHQgPSB1bmRlZmluZWQ7XHJcbiAgICB0aGlzLnZhbCA9IHZhbDtcclxufVxyXG5cclxuVmFyaW50T3AucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShPcC5wcm90b3R5cGUpO1xyXG5WYXJpbnRPcC5wcm90b3R5cGUuZm4gPSB3cml0ZVZhcmludDMyO1xyXG5cclxuLyoqXHJcbiAqIFdyaXRlcyBhbiB1bnNpZ25lZCAzMiBiaXQgdmFsdWUgYXMgYSB2YXJpbnQuXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSBWYWx1ZSB0byB3cml0ZVxyXG4gKiBAcmV0dXJucyB7V3JpdGVyfSBgdGhpc2BcclxuICovXHJcbldyaXRlci5wcm90b3R5cGUudWludDMyID0gZnVuY3Rpb24gd3JpdGVfdWludDMyKHZhbHVlKSB7XHJcbiAgICAvLyBoZXJlLCB0aGUgY2FsbCB0byB0aGlzLnB1c2ggaGFzIGJlZW4gaW5saW5lZCBhbmQgYSB2YXJpbnQgc3BlY2lmaWMgT3Agc3ViY2xhc3MgaXMgdXNlZC5cclxuICAgIC8vIHVpbnQzMiBpcyBieSBmYXIgdGhlIG1vc3QgZnJlcXVlbnRseSB1c2VkIG9wZXJhdGlvbiBhbmQgYmVuZWZpdHMgc2lnbmlmaWNhbnRseSBmcm9tIHRoaXMuXHJcbiAgICB0aGlzLmxlbiArPSAodGhpcy50YWlsID0gdGhpcy50YWlsLm5leHQgPSBuZXcgVmFyaW50T3AoXHJcbiAgICAgICAgKHZhbHVlID0gdmFsdWUgPj4+IDApXHJcbiAgICAgICAgICAgICAgICA8IDEyOCAgICAgICA/IDFcclxuICAgICAgICA6IHZhbHVlIDwgMTYzODQgICAgID8gMlxyXG4gICAgICAgIDogdmFsdWUgPCAyMDk3MTUyICAgPyAzXHJcbiAgICAgICAgOiB2YWx1ZSA8IDI2ODQzNTQ1NiA/IDRcclxuICAgICAgICA6ICAgICAgICAgICAgICAgICAgICAgNSxcclxuICAgIHZhbHVlKSkubGVuO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogV3JpdGVzIGEgc2lnbmVkIDMyIGJpdCB2YWx1ZSBhcyBhIHZhcmludC5cclxuICogQGZ1bmN0aW9uXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSBWYWx1ZSB0byB3cml0ZVxyXG4gKiBAcmV0dXJucyB7V3JpdGVyfSBgdGhpc2BcclxuICovXHJcbldyaXRlci5wcm90b3R5cGUuaW50MzIgPSBmdW5jdGlvbiB3cml0ZV9pbnQzMih2YWx1ZSkge1xyXG4gICAgcmV0dXJuIHZhbHVlIDwgMFxyXG4gICAgICAgID8gdGhpcy5fcHVzaCh3cml0ZVZhcmludDY0LCAxMCwgTG9uZ0JpdHMuZnJvbU51bWJlcih2YWx1ZSkpIC8vIDEwIGJ5dGVzIHBlciBzcGVjXHJcbiAgICAgICAgOiB0aGlzLnVpbnQzMih2YWx1ZSk7XHJcbn07XHJcblxyXG4vKipcclxuICogV3JpdGVzIGEgMzIgYml0IHZhbHVlIGFzIGEgdmFyaW50LCB6aWctemFnIGVuY29kZWQuXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSBWYWx1ZSB0byB3cml0ZVxyXG4gKiBAcmV0dXJucyB7V3JpdGVyfSBgdGhpc2BcclxuICovXHJcbldyaXRlci5wcm90b3R5cGUuc2ludDMyID0gZnVuY3Rpb24gd3JpdGVfc2ludDMyKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdGhpcy51aW50MzIoKHZhbHVlIDw8IDEgXiB2YWx1ZSA+PiAzMSkgPj4+IDApO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gd3JpdGVWYXJpbnQ2NCh2YWwsIGJ1ZiwgcG9zKSB7XHJcbiAgICB3aGlsZSAodmFsLmhpKSB7XHJcbiAgICAgICAgYnVmW3BvcysrXSA9IHZhbC5sbyAmIDEyNyB8IDEyODtcclxuICAgICAgICB2YWwubG8gPSAodmFsLmxvID4+PiA3IHwgdmFsLmhpIDw8IDI1KSA+Pj4gMDtcclxuICAgICAgICB2YWwuaGkgPj4+PSA3O1xyXG4gICAgfVxyXG4gICAgd2hpbGUgKHZhbC5sbyA+IDEyNykge1xyXG4gICAgICAgIGJ1Zltwb3MrK10gPSB2YWwubG8gJiAxMjcgfCAxMjg7XHJcbiAgICAgICAgdmFsLmxvID0gdmFsLmxvID4+PiA3O1xyXG4gICAgfVxyXG4gICAgYnVmW3BvcysrXSA9IHZhbC5sbztcclxufVxyXG5cclxuLyoqXHJcbiAqIFdyaXRlcyBhbiB1bnNpZ25lZCA2NCBiaXQgdmFsdWUgYXMgYSB2YXJpbnQuXHJcbiAqIEBwYXJhbSB7TG9uZ3xudW1iZXJ8c3RyaW5nfSB2YWx1ZSBWYWx1ZSB0byB3cml0ZVxyXG4gKiBAcmV0dXJucyB7V3JpdGVyfSBgdGhpc2BcclxuICogQHRocm93cyB7VHlwZUVycm9yfSBJZiBgdmFsdWVgIGlzIGEgc3RyaW5nIGFuZCBubyBsb25nIGxpYnJhcnkgaXMgcHJlc2VudC5cclxuICovXHJcbldyaXRlci5wcm90b3R5cGUudWludDY0ID0gZnVuY3Rpb24gd3JpdGVfdWludDY0KHZhbHVlKSB7XHJcbiAgICB2YXIgYml0cyA9IExvbmdCaXRzLmZyb20odmFsdWUpO1xyXG4gICAgcmV0dXJuIHRoaXMuX3B1c2god3JpdGVWYXJpbnQ2NCwgYml0cy5sZW5ndGgoKSwgYml0cyk7XHJcbn07XHJcblxyXG4vKipcclxuICogV3JpdGVzIGEgc2lnbmVkIDY0IGJpdCB2YWx1ZSBhcyBhIHZhcmludC5cclxuICogQGZ1bmN0aW9uXHJcbiAqIEBwYXJhbSB7TG9uZ3xudW1iZXJ8c3RyaW5nfSB2YWx1ZSBWYWx1ZSB0byB3cml0ZVxyXG4gKiBAcmV0dXJucyB7V3JpdGVyfSBgdGhpc2BcclxuICogQHRocm93cyB7VHlwZUVycm9yfSBJZiBgdmFsdWVgIGlzIGEgc3RyaW5nIGFuZCBubyBsb25nIGxpYnJhcnkgaXMgcHJlc2VudC5cclxuICovXHJcbldyaXRlci5wcm90b3R5cGUuaW50NjQgPSBXcml0ZXIucHJvdG90eXBlLnVpbnQ2NDtcclxuXHJcbi8qKlxyXG4gKiBXcml0ZXMgYSBzaWduZWQgNjQgYml0IHZhbHVlIGFzIGEgdmFyaW50LCB6aWctemFnIGVuY29kZWQuXHJcbiAqIEBwYXJhbSB7TG9uZ3xudW1iZXJ8c3RyaW5nfSB2YWx1ZSBWYWx1ZSB0byB3cml0ZVxyXG4gKiBAcmV0dXJucyB7V3JpdGVyfSBgdGhpc2BcclxuICogQHRocm93cyB7VHlwZUVycm9yfSBJZiBgdmFsdWVgIGlzIGEgc3RyaW5nIGFuZCBubyBsb25nIGxpYnJhcnkgaXMgcHJlc2VudC5cclxuICovXHJcbldyaXRlci5wcm90b3R5cGUuc2ludDY0ID0gZnVuY3Rpb24gd3JpdGVfc2ludDY0KHZhbHVlKSB7XHJcbiAgICB2YXIgYml0cyA9IExvbmdCaXRzLmZyb20odmFsdWUpLnp6RW5jb2RlKCk7XHJcbiAgICByZXR1cm4gdGhpcy5fcHVzaCh3cml0ZVZhcmludDY0LCBiaXRzLmxlbmd0aCgpLCBiaXRzKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBXcml0ZXMgYSBib29saXNoIHZhbHVlIGFzIGEgdmFyaW50LlxyXG4gKiBAcGFyYW0ge2Jvb2xlYW59IHZhbHVlIFZhbHVlIHRvIHdyaXRlXHJcbiAqIEByZXR1cm5zIHtXcml0ZXJ9IGB0aGlzYFxyXG4gKi9cclxuV3JpdGVyLnByb3RvdHlwZS5ib29sID0gZnVuY3Rpb24gd3JpdGVfYm9vbCh2YWx1ZSkge1xyXG4gICAgcmV0dXJuIHRoaXMuX3B1c2god3JpdGVCeXRlLCAxLCB2YWx1ZSA/IDEgOiAwKTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIHdyaXRlRml4ZWQzMih2YWwsIGJ1ZiwgcG9zKSB7XHJcbiAgICBidWZbcG9zICAgIF0gPSAgdmFsICAgICAgICAgJiAyNTU7XHJcbiAgICBidWZbcG9zICsgMV0gPSAgdmFsID4+PiA4ICAgJiAyNTU7XHJcbiAgICBidWZbcG9zICsgMl0gPSAgdmFsID4+PiAxNiAgJiAyNTU7XHJcbiAgICBidWZbcG9zICsgM10gPSAgdmFsID4+PiAyNDtcclxufVxyXG5cclxuLyoqXHJcbiAqIFdyaXRlcyBhbiB1bnNpZ25lZCAzMiBiaXQgdmFsdWUgYXMgZml4ZWQgMzIgYml0cy5cclxuICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlIFZhbHVlIHRvIHdyaXRlXHJcbiAqIEByZXR1cm5zIHtXcml0ZXJ9IGB0aGlzYFxyXG4gKi9cclxuV3JpdGVyLnByb3RvdHlwZS5maXhlZDMyID0gZnVuY3Rpb24gd3JpdGVfZml4ZWQzMih2YWx1ZSkge1xyXG4gICAgcmV0dXJuIHRoaXMuX3B1c2god3JpdGVGaXhlZDMyLCA0LCB2YWx1ZSA+Pj4gMCk7XHJcbn07XHJcblxyXG4vKipcclxuICogV3JpdGVzIGEgc2lnbmVkIDMyIGJpdCB2YWx1ZSBhcyBmaXhlZCAzMiBiaXRzLlxyXG4gKiBAZnVuY3Rpb25cclxuICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlIFZhbHVlIHRvIHdyaXRlXHJcbiAqIEByZXR1cm5zIHtXcml0ZXJ9IGB0aGlzYFxyXG4gKi9cclxuV3JpdGVyLnByb3RvdHlwZS5zZml4ZWQzMiA9IFdyaXRlci5wcm90b3R5cGUuZml4ZWQzMjtcclxuXHJcbi8qKlxyXG4gKiBXcml0ZXMgYW4gdW5zaWduZWQgNjQgYml0IHZhbHVlIGFzIGZpeGVkIDY0IGJpdHMuXHJcbiAqIEBwYXJhbSB7TG9uZ3xudW1iZXJ8c3RyaW5nfSB2YWx1ZSBWYWx1ZSB0byB3cml0ZVxyXG4gKiBAcmV0dXJucyB7V3JpdGVyfSBgdGhpc2BcclxuICogQHRocm93cyB7VHlwZUVycm9yfSBJZiBgdmFsdWVgIGlzIGEgc3RyaW5nIGFuZCBubyBsb25nIGxpYnJhcnkgaXMgcHJlc2VudC5cclxuICovXHJcbldyaXRlci5wcm90b3R5cGUuZml4ZWQ2NCA9IGZ1bmN0aW9uIHdyaXRlX2ZpeGVkNjQodmFsdWUpIHtcclxuICAgIHZhciBiaXRzID0gTG9uZ0JpdHMuZnJvbSh2YWx1ZSk7XHJcbiAgICByZXR1cm4gdGhpcy5fcHVzaCh3cml0ZUZpeGVkMzIsIDQsIGJpdHMubG8pLl9wdXNoKHdyaXRlRml4ZWQzMiwgNCwgYml0cy5oaSk7XHJcbn07XHJcblxyXG4vKipcclxuICogV3JpdGVzIGEgc2lnbmVkIDY0IGJpdCB2YWx1ZSBhcyBmaXhlZCA2NCBiaXRzLlxyXG4gKiBAZnVuY3Rpb25cclxuICogQHBhcmFtIHtMb25nfG51bWJlcnxzdHJpbmd9IHZhbHVlIFZhbHVlIHRvIHdyaXRlXHJcbiAqIEByZXR1cm5zIHtXcml0ZXJ9IGB0aGlzYFxyXG4gKiBAdGhyb3dzIHtUeXBlRXJyb3J9IElmIGB2YWx1ZWAgaXMgYSBzdHJpbmcgYW5kIG5vIGxvbmcgbGlicmFyeSBpcyBwcmVzZW50LlxyXG4gKi9cclxuV3JpdGVyLnByb3RvdHlwZS5zZml4ZWQ2NCA9IFdyaXRlci5wcm90b3R5cGUuZml4ZWQ2NDtcclxuXHJcbi8qKlxyXG4gKiBXcml0ZXMgYSBmbG9hdCAoMzIgYml0KS5cclxuICogQGZ1bmN0aW9uXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSBWYWx1ZSB0byB3cml0ZVxyXG4gKiBAcmV0dXJucyB7V3JpdGVyfSBgdGhpc2BcclxuICovXHJcbldyaXRlci5wcm90b3R5cGUuZmxvYXQgPSBmdW5jdGlvbiB3cml0ZV9mbG9hdCh2YWx1ZSkge1xyXG4gICAgcmV0dXJuIHRoaXMuX3B1c2godXRpbC5mbG9hdC53cml0ZUZsb2F0TEUsIDQsIHZhbHVlKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBXcml0ZXMgYSBkb3VibGUgKDY0IGJpdCBmbG9hdCkuXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcGFyYW0ge251bWJlcn0gdmFsdWUgVmFsdWUgdG8gd3JpdGVcclxuICogQHJldHVybnMge1dyaXRlcn0gYHRoaXNgXHJcbiAqL1xyXG5Xcml0ZXIucHJvdG90eXBlLmRvdWJsZSA9IGZ1bmN0aW9uIHdyaXRlX2RvdWJsZSh2YWx1ZSkge1xyXG4gICAgcmV0dXJuIHRoaXMuX3B1c2godXRpbC5mbG9hdC53cml0ZURvdWJsZUxFLCA4LCB2YWx1ZSk7XHJcbn07XHJcblxyXG52YXIgd3JpdGVCeXRlcyA9IHV0aWwuQXJyYXkucHJvdG90eXBlLnNldFxyXG4gICAgPyBmdW5jdGlvbiB3cml0ZUJ5dGVzX3NldCh2YWwsIGJ1ZiwgcG9zKSB7XHJcbiAgICAgICAgYnVmLnNldCh2YWwsIHBvcyk7IC8vIGFsc28gd29ya3MgZm9yIHBsYWluIGFycmF5IHZhbHVlc1xyXG4gICAgfVxyXG4gICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgIDogZnVuY3Rpb24gd3JpdGVCeXRlc19mb3IodmFsLCBidWYsIHBvcykge1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdmFsLmxlbmd0aDsgKytpKVxyXG4gICAgICAgICAgICBidWZbcG9zICsgaV0gPSB2YWxbaV07XHJcbiAgICB9O1xyXG5cclxuLyoqXHJcbiAqIFdyaXRlcyBhIHNlcXVlbmNlIG9mIGJ5dGVzLlxyXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl8c3RyaW5nfSB2YWx1ZSBCdWZmZXIgb3IgYmFzZTY0IGVuY29kZWQgc3RyaW5nIHRvIHdyaXRlXHJcbiAqIEByZXR1cm5zIHtXcml0ZXJ9IGB0aGlzYFxyXG4gKi9cclxuV3JpdGVyLnByb3RvdHlwZS5ieXRlcyA9IGZ1bmN0aW9uIHdyaXRlX2J5dGVzKHZhbHVlKSB7XHJcbiAgICB2YXIgbGVuID0gdmFsdWUubGVuZ3RoID4+PiAwO1xyXG4gICAgaWYgKCFsZW4pXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3B1c2god3JpdGVCeXRlLCAxLCAwKTtcclxuICAgIGlmICh1dGlsLmlzU3RyaW5nKHZhbHVlKSkge1xyXG4gICAgICAgIHZhciBidWYgPSBXcml0ZXIuYWxsb2MobGVuID0gYmFzZTY0Lmxlbmd0aCh2YWx1ZSkpO1xyXG4gICAgICAgIGJhc2U2NC5kZWNvZGUodmFsdWUsIGJ1ZiwgMCk7XHJcbiAgICAgICAgdmFsdWUgPSBidWY7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy51aW50MzIobGVuKS5fcHVzaCh3cml0ZUJ5dGVzLCBsZW4sIHZhbHVlKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBXcml0ZXMgYSBzdHJpbmcuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZSBWYWx1ZSB0byB3cml0ZVxyXG4gKiBAcmV0dXJucyB7V3JpdGVyfSBgdGhpc2BcclxuICovXHJcbldyaXRlci5wcm90b3R5cGUuc3RyaW5nID0gZnVuY3Rpb24gd3JpdGVfc3RyaW5nKHZhbHVlKSB7XHJcbiAgICB2YXIgbGVuID0gdXRmOC5sZW5ndGgodmFsdWUpO1xyXG4gICAgcmV0dXJuIGxlblxyXG4gICAgICAgID8gdGhpcy51aW50MzIobGVuKS5fcHVzaCh1dGY4LndyaXRlLCBsZW4sIHZhbHVlKVxyXG4gICAgICAgIDogdGhpcy5fcHVzaCh3cml0ZUJ5dGUsIDEsIDApO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEZvcmtzIHRoaXMgd3JpdGVyJ3Mgc3RhdGUgYnkgcHVzaGluZyBpdCB0byBhIHN0YWNrLlxyXG4gKiBDYWxsaW5nIHtAbGluayBXcml0ZXIjcmVzZXR8cmVzZXR9IG9yIHtAbGluayBXcml0ZXIjbGRlbGltfGxkZWxpbX0gcmVzZXRzIHRoZSB3cml0ZXIgdG8gdGhlIHByZXZpb3VzIHN0YXRlLlxyXG4gKiBAcmV0dXJucyB7V3JpdGVyfSBgdGhpc2BcclxuICovXHJcbldyaXRlci5wcm90b3R5cGUuZm9yayA9IGZ1bmN0aW9uIGZvcmsoKSB7XHJcbiAgICB0aGlzLnN0YXRlcyA9IG5ldyBTdGF0ZSh0aGlzKTtcclxuICAgIHRoaXMuaGVhZCA9IHRoaXMudGFpbCA9IG5ldyBPcChub29wLCAwLCAwKTtcclxuICAgIHRoaXMubGVuID0gMDtcclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlc2V0cyB0aGlzIGluc3RhbmNlIHRvIHRoZSBsYXN0IHN0YXRlLlxyXG4gKiBAcmV0dXJucyB7V3JpdGVyfSBgdGhpc2BcclxuICovXHJcbldyaXRlci5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiByZXNldCgpIHtcclxuICAgIGlmICh0aGlzLnN0YXRlcykge1xyXG4gICAgICAgIHRoaXMuaGVhZCAgID0gdGhpcy5zdGF0ZXMuaGVhZDtcclxuICAgICAgICB0aGlzLnRhaWwgICA9IHRoaXMuc3RhdGVzLnRhaWw7XHJcbiAgICAgICAgdGhpcy5sZW4gICAgPSB0aGlzLnN0YXRlcy5sZW47XHJcbiAgICAgICAgdGhpcy5zdGF0ZXMgPSB0aGlzLnN0YXRlcy5uZXh0O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmhlYWQgPSB0aGlzLnRhaWwgPSBuZXcgT3Aobm9vcCwgMCwgMCk7XHJcbiAgICAgICAgdGhpcy5sZW4gID0gMDtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlc2V0cyB0byB0aGUgbGFzdCBzdGF0ZSBhbmQgYXBwZW5kcyB0aGUgZm9yayBzdGF0ZSdzIGN1cnJlbnQgd3JpdGUgbGVuZ3RoIGFzIGEgdmFyaW50IGZvbGxvd2VkIGJ5IGl0cyBvcGVyYXRpb25zLlxyXG4gKiBAcmV0dXJucyB7V3JpdGVyfSBgdGhpc2BcclxuICovXHJcbldyaXRlci5wcm90b3R5cGUubGRlbGltID0gZnVuY3Rpb24gbGRlbGltKCkge1xyXG4gICAgdmFyIGhlYWQgPSB0aGlzLmhlYWQsXHJcbiAgICAgICAgdGFpbCA9IHRoaXMudGFpbCxcclxuICAgICAgICBsZW4gID0gdGhpcy5sZW47XHJcbiAgICB0aGlzLnJlc2V0KCkudWludDMyKGxlbik7XHJcbiAgICBpZiAobGVuKSB7XHJcbiAgICAgICAgdGhpcy50YWlsLm5leHQgPSBoZWFkLm5leHQ7IC8vIHNraXAgbm9vcFxyXG4gICAgICAgIHRoaXMudGFpbCA9IHRhaWw7XHJcbiAgICAgICAgdGhpcy5sZW4gKz0gbGVuO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogRmluaXNoZXMgdGhlIHdyaXRlIG9wZXJhdGlvbi5cclxuICogQHJldHVybnMge1VpbnQ4QXJyYXl9IEZpbmlzaGVkIGJ1ZmZlclxyXG4gKi9cclxuV3JpdGVyLnByb3RvdHlwZS5maW5pc2ggPSBmdW5jdGlvbiBmaW5pc2goKSB7XHJcbiAgICB2YXIgaGVhZCA9IHRoaXMuaGVhZC5uZXh0LCAvLyBza2lwIG5vb3BcclxuICAgICAgICBidWYgID0gdGhpcy5jb25zdHJ1Y3Rvci5hbGxvYyh0aGlzLmxlbiksXHJcbiAgICAgICAgcG9zICA9IDA7XHJcbiAgICB3aGlsZSAoaGVhZCkge1xyXG4gICAgICAgIGhlYWQuZm4oaGVhZC52YWwsIGJ1ZiwgcG9zKTtcclxuICAgICAgICBwb3MgKz0gaGVhZC5sZW47XHJcbiAgICAgICAgaGVhZCA9IGhlYWQubmV4dDtcclxuICAgIH1cclxuICAgIC8vIHRoaXMuaGVhZCA9IHRoaXMudGFpbCA9IG51bGw7XHJcbiAgICByZXR1cm4gYnVmO1xyXG59O1xyXG5cclxuV3JpdGVyLl9jb25maWd1cmUgPSBmdW5jdGlvbihCdWZmZXJXcml0ZXJfKSB7XHJcbiAgICBCdWZmZXJXcml0ZXIgPSBCdWZmZXJXcml0ZXJfO1xyXG59O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxubW9kdWxlLmV4cG9ydHMgPSBCdWZmZXJXcml0ZXI7XHJcblxyXG4vLyBleHRlbmRzIFdyaXRlclxyXG52YXIgV3JpdGVyID0gcmVxdWlyZShcIi4vd3JpdGVyXCIpO1xyXG4oQnVmZmVyV3JpdGVyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoV3JpdGVyLnByb3RvdHlwZSkpLmNvbnN0cnVjdG9yID0gQnVmZmVyV3JpdGVyO1xyXG5cclxudmFyIHV0aWwgPSByZXF1aXJlKFwiLi91dGlsL21pbmltYWxcIik7XHJcblxyXG52YXIgQnVmZmVyID0gdXRpbC5CdWZmZXI7XHJcblxyXG4vKipcclxuICogQ29uc3RydWN0cyBhIG5ldyBidWZmZXIgd3JpdGVyIGluc3RhbmNlLlxyXG4gKiBAY2xhc3NkZXNjIFdpcmUgZm9ybWF0IHdyaXRlciB1c2luZyBub2RlIGJ1ZmZlcnMuXHJcbiAqIEBleHRlbmRzIFdyaXRlclxyXG4gKiBAY29uc3RydWN0b3JcclxuICovXHJcbmZ1bmN0aW9uIEJ1ZmZlcldyaXRlcigpIHtcclxuICAgIFdyaXRlci5jYWxsKHRoaXMpO1xyXG59XHJcblxyXG4vKipcclxuICogQWxsb2NhdGVzIGEgYnVmZmVyIG9mIHRoZSBzcGVjaWZpZWQgc2l6ZS5cclxuICogQHBhcmFtIHtudW1iZXJ9IHNpemUgQnVmZmVyIHNpemVcclxuICogQHJldHVybnMge0J1ZmZlcn0gQnVmZmVyXHJcbiAqL1xyXG5CdWZmZXJXcml0ZXIuYWxsb2MgPSBmdW5jdGlvbiBhbGxvY19idWZmZXIoc2l6ZSkge1xyXG4gICAgcmV0dXJuIChCdWZmZXJXcml0ZXIuYWxsb2MgPSB1dGlsLl9CdWZmZXJfYWxsb2NVbnNhZmUpKHNpemUpO1xyXG59O1xyXG5cclxudmFyIHdyaXRlQnl0ZXNCdWZmZXIgPSBCdWZmZXIgJiYgQnVmZmVyLnByb3RvdHlwZSBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkgJiYgQnVmZmVyLnByb3RvdHlwZS5zZXQubmFtZSA9PT0gXCJzZXRcIlxyXG4gICAgPyBmdW5jdGlvbiB3cml0ZUJ5dGVzQnVmZmVyX3NldCh2YWwsIGJ1ZiwgcG9zKSB7XHJcbiAgICAgICAgYnVmLnNldCh2YWwsIHBvcyk7IC8vIGZhc3RlciB0aGFuIGNvcHkgKHJlcXVpcmVzIG5vZGUgPj0gNCB3aGVyZSBCdWZmZXJzIGV4dGVuZCBVaW50OEFycmF5IGFuZCBzZXQgaXMgcHJvcGVybHkgaW5oZXJpdGVkKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBhbHNvIHdvcmtzIGZvciBwbGFpbiBhcnJheSB2YWx1ZXNcclxuICAgIH1cclxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICA6IGZ1bmN0aW9uIHdyaXRlQnl0ZXNCdWZmZXJfY29weSh2YWwsIGJ1ZiwgcG9zKSB7XHJcbiAgICAgICAgaWYgKHZhbC5jb3B5KSAvLyBCdWZmZXIgdmFsdWVzXHJcbiAgICAgICAgICAgIHZhbC5jb3B5KGJ1ZiwgcG9zLCAwLCB2YWwubGVuZ3RoKTtcclxuICAgICAgICBlbHNlIGZvciAodmFyIGkgPSAwOyBpIDwgdmFsLmxlbmd0aDspIC8vIHBsYWluIGFycmF5IHZhbHVlc1xyXG4gICAgICAgICAgICBidWZbcG9zKytdID0gdmFsW2krK107XHJcbiAgICB9O1xyXG5cclxuLyoqXHJcbiAqIEBvdmVycmlkZVxyXG4gKi9cclxuQnVmZmVyV3JpdGVyLnByb3RvdHlwZS5ieXRlcyA9IGZ1bmN0aW9uIHdyaXRlX2J5dGVzX2J1ZmZlcih2YWx1ZSkge1xyXG4gICAgaWYgKHV0aWwuaXNTdHJpbmcodmFsdWUpKVxyXG4gICAgICAgIHZhbHVlID0gdXRpbC5fQnVmZmVyX2Zyb20odmFsdWUsIFwiYmFzZTY0XCIpO1xyXG4gICAgdmFyIGxlbiA9IHZhbHVlLmxlbmd0aCA+Pj4gMDtcclxuICAgIHRoaXMudWludDMyKGxlbik7XHJcbiAgICBpZiAobGVuKVxyXG4gICAgICAgIHRoaXMuX3B1c2god3JpdGVCeXRlc0J1ZmZlciwgbGVuLCB2YWx1ZSk7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbmZ1bmN0aW9uIHdyaXRlU3RyaW5nQnVmZmVyKHZhbCwgYnVmLCBwb3MpIHtcclxuICAgIGlmICh2YWwubGVuZ3RoIDwgNDApIC8vIHBsYWluIGpzIGlzIGZhc3RlciBmb3Igc2hvcnQgc3RyaW5ncyAocHJvYmFibHkgZHVlIHRvIHJlZHVuZGFudCBhc3NlcnRpb25zKVxyXG4gICAgICAgIHV0aWwudXRmOC53cml0ZSh2YWwsIGJ1ZiwgcG9zKTtcclxuICAgIGVsc2VcclxuICAgICAgICBidWYudXRmOFdyaXRlKHZhbCwgcG9zKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEBvdmVycmlkZVxyXG4gKi9cclxuQnVmZmVyV3JpdGVyLnByb3RvdHlwZS5zdHJpbmcgPSBmdW5jdGlvbiB3cml0ZV9zdHJpbmdfYnVmZmVyKHZhbHVlKSB7XHJcbiAgICB2YXIgbGVuID0gQnVmZmVyLmJ5dGVMZW5ndGgodmFsdWUpO1xyXG4gICAgdGhpcy51aW50MzIobGVuKTtcclxuICAgIGlmIChsZW4pXHJcbiAgICAgICAgdGhpcy5fcHVzaCh3cml0ZVN0cmluZ0J1ZmZlciwgbGVuLCB2YWx1ZSk7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcblxyXG4vKipcclxuICogRmluaXNoZXMgdGhlIHdyaXRlIG9wZXJhdGlvbi5cclxuICogQG5hbWUgQnVmZmVyV3JpdGVyI2ZpbmlzaFxyXG4gKiBAZnVuY3Rpb25cclxuICogQHJldHVybnMge0J1ZmZlcn0gRmluaXNoZWQgYnVmZmVyXHJcbiAqL1xyXG4iLCJ2YXIgcm9vdE1lc3NhZ2UgPSByZXF1aXJlKFwiLi90ZXN0bWVzc2FnZS5qc1wiKTtcclxuLy8gdmFyIGRlc2NyaXB0b3IgPSByZXF1aXJlKFwidGVzdF9tZXNzYWdlLmpzb25cIik7XHJcbnZhciB0ZXN0TWVzc2FnZSA9IHJvb3RNZXNzYWdlLlRlc3RNZXNzYWdlO1xyXG52YXIgdGVzdFJlcXVlc3QgPSByb290TWVzc2FnZS5UZXN0UmVxdWVzdDtcclxuZGVidWdnZXI7XHJcbnZhciB0ZXN0UmVxdWVzdE1lc3NhZ2UgPSB0ZXN0UmVxdWVzdC5jcmVhdGUoe1xyXG4gICAgS2V5IDogXCJrUjdVY3RCakU2UHRFZ2ZnVGVVZlkjJHRrKncrZzNka0AuTThLN0Uya2taVnFvM1Q0QncjPkw5eHVCNnBwPVt5XCIsXHJcbiAgICBNb2RlIDogMVxyXG59KTtcclxuY29uc29sZS5sb2codGVzdFJlcXVlc3QudmVyaWZ5KHtcclxuICAgIEtleSA6IFwia1I3VWN0QmpFNlB0RWdmZ1RlVWZZIyR0ayp3K2czZGtALk04SzdFMmtrWlZxbzNUNEJ3Iz5MOXh1QjZwcD1beVwiLFxyXG4gICAgTW9kZSA6IDFcclxufSkpO1xyXG52YXIgZW5jb2RlZFJlcXVlc3QgPSB0ZXN0UmVxdWVzdC5lbmNvZGUodGVzdFJlcXVlc3RNZXNzYWdlKS5maW5pc2goKTtcclxuXHJcbmNvbnNvbGUubG9nKHRlc3RSZXF1ZXN0LnRvT2JqZWN0KHRlc3RSZXF1ZXN0LmRlY29kZShlbmNvZGVkUmVxdWVzdCkpKTtcclxuLy8gZnVuY3Rpb24gZGVzZXJpYWxpemUoYnl0ZXMpIHtcclxuLy8gICAgIHZhciBkZXNQZXJzb24gPSBtZXNzYWdlcy5QZXJzb24uZGVzZXJpYWxpemVCaW5hcnkoYnl0ZXMpO1xyXG4gICAgXHJcbi8vICAgICB2YXIgbmFtZSA9IGRlc1BlcnNvbi5nZXROYW1lKCk7XHJcbi8vICAgICB2YXIgaWQgPSBkZXNQZXJzb24uZ2V0SWQoKTtcclxuLy8gICAgIHZhciBlbWFpbCA9IGRlc1BlcnNvbi5nZXRFbWFpbCgpO1xyXG4gICAgXHJcbi8vICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZHNfbmFtZScpLmlubmVySFRNTCA9IG5hbWU7XHJcbi8vICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZHNfaWQnKS5pbm5lckhUTUwgPSBpZDtcclxuLy8gICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkc19lbWFpbCcpLmlubmVySFRNTCA9IGVtYWlsO1xyXG4vLyB9XHJcblxyXG52YXIganNvbiA9IGZhbHNlO1xyXG5cclxuLy8gSlNPTiBTVFlMRVxyXG52YXIgb1JlcSA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xyXG5vUmVxLm9ubG9hZCA9IGZ1bmN0aW9uIChvRXZlbnQpIHtcclxuICAgIGRlYnVnZ2VyO1xyXG4gICAgY29uc29sZS5sb2coJ1hIUiByZXF1ZXN0IHN1Y2Nlc3MnKTtcclxuICAgIHZhciBhcnJheUJ1ZmZlciA9IG9SZXEucmVzcG9uc2U7IC8vIE5vdGU6IG5vdCBvUmVxLnJlc3BvbnNlVGV4dFxyXG4gICAgaWYgKGFycmF5QnVmZmVyKSB7XHJcbiAgICAgICAgdmFyIGJ5dGVBcnJheSA9IG5ldyBVaW50OEFycmF5KGFycmF5QnVmZmVyKTtcclxuICAgICAgICBkZWJ1Z2dlcjtcclxuICAgICAgICB2YXIgZGVjb2RlZCA9IHRlc3RNZXNzYWdlLmRlY29kZShieXRlQXJyYXkpO1xyXG4gICAgICAgIHZhciBvYmplY3QgPSB0ZXN0TWVzc2FnZS50b09iamVjdChkZWNvZGVkKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhvYmplY3QpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuaWYgKGpzb24pIHtcclxuICAgIG9SZXEub3BlbihcIlBPU1RcIiwgXCJodHRwOi8vbG9jYWxob3N0OjUwMDAvYmVuY2htYXJrXCIsIHRydWUpO1xyXG4gICAgb1JlcS5zZXRSZXF1ZXN0SGVhZGVyKFwiQ29udGVudC1UeXBlXCIsIFwiYXBwbGljYXRpb24vanNvblwiKTtcclxuICAgIG9SZXEucmVzcG9uc2VUeXBlID0gXCJhcnJheWJ1ZmZlclwiO1xyXG4gICAgXHJcbiAgICBvUmVxLnNlbmQoSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICAgIFwiS2V5XCI6IFwia1I3VWN0QmpFNlB0RWdmZ1RlVWZZIyR0ayp3K2czZGtALk04SzdFMmtrWlZxbzNUNEJ3Iz5MOXh1QjZwcD1beVwiLFxyXG4gICAgICAgIFwiTW9kZVwiOiAxXHJcbiAgICB9KSk7XHJcbn0gZWxzZSB7XHJcbiAgICBvUmVxLm9wZW4oXCJQT1NUXCIsIFwiaHR0cDovL2xvY2FsaG9zdDo1MDAwL2JlbmNobWFya1wiLCB0cnVlKTtcclxuICAgIG9SZXEuc2V0UmVxdWVzdEhlYWRlcihcIkNvbnRlbnQtVHlwZVwiLCBcImFwcGxpY2F0aW9uL29jdGV0LXN0cmVhbVwiKTtcclxuICAgIG9SZXEucmVzcG9uc2VUeXBlID0gXCJhcnJheWJ1ZmZlclwiO1xyXG4gICAgb1JlcS5zZW5kKGVuY29kZWRSZXF1ZXN0KTtcclxufSIsIi8qZXNsaW50LWRpc2FibGUgYmxvY2stc2NvcGVkLXZhciwgaWQtbGVuZ3RoLCBuby1jb250cm9sLXJlZ2V4LCBuby1tYWdpYy1udW1iZXJzLCBuby1wcm90b3R5cGUtYnVpbHRpbnMsIG5vLXJlZGVjbGFyZSwgbm8tc2hhZG93LCBuby12YXIsIHNvcnQtdmFycyovXG5cInVzZSBzdHJpY3RcIjtcblxudmFyICRwcm90b2J1ZiA9IHJlcXVpcmUoXCJwcm90b2J1ZmpzL21pbmltYWxcIik7XG5cbi8vIENvbW1vbiBhbGlhc2VzXG52YXIgJFJlYWRlciA9ICRwcm90b2J1Zi5SZWFkZXIsICRXcml0ZXIgPSAkcHJvdG9idWYuV3JpdGVyLCAkdXRpbCA9ICRwcm90b2J1Zi51dGlsO1xuXG4vLyBFeHBvcnRlZCByb290IG5hbWVzcGFjZVxudmFyICRyb290ID0gJHByb3RvYnVmLnJvb3RzW1wiZGVmYXVsdFwiXSB8fCAoJHByb3RvYnVmLnJvb3RzW1wiZGVmYXVsdFwiXSA9IHt9KTtcblxuJHJvb3QuVGVzdE1lc3NhZ2UgPSAoZnVuY3Rpb24oKSB7XG5cbiAgICAvKipcbiAgICAgKiBQcm9wZXJ0aWVzIG9mIGEgVGVzdE1lc3NhZ2UuXG4gICAgICogQGV4cG9ydHMgSVRlc3RNZXNzYWdlXG4gICAgICogQGludGVyZmFjZSBJVGVzdE1lc3NhZ2VcbiAgICAgKiBAcHJvcGVydHkge3N0cmluZ3xudWxsfSBbZXJyb3JdIFRlc3RNZXNzYWdlIGVycm9yXG4gICAgICovXG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RzIGEgbmV3IFRlc3RNZXNzYWdlLlxuICAgICAqIEBleHBvcnRzIFRlc3RNZXNzYWdlXG4gICAgICogQGNsYXNzZGVzYyBSZXByZXNlbnRzIGEgVGVzdE1lc3NhZ2UuXG4gICAgICogQGltcGxlbWVudHMgSVRlc3RNZXNzYWdlXG4gICAgICogQGNvbnN0cnVjdG9yXG4gICAgICogQHBhcmFtIHtJVGVzdE1lc3NhZ2U9fSBbcHJvcGVydGllc10gUHJvcGVydGllcyB0byBzZXRcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBUZXN0TWVzc2FnZShwcm9wZXJ0aWVzKSB7XG4gICAgICAgIGlmIChwcm9wZXJ0aWVzKVxuICAgICAgICAgICAgZm9yICh2YXIga2V5cyA9IE9iamVjdC5rZXlzKHByb3BlcnRpZXMpLCBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyArK2kpXG4gICAgICAgICAgICAgICAgaWYgKHByb3BlcnRpZXNba2V5c1tpXV0gIT0gbnVsbClcbiAgICAgICAgICAgICAgICAgICAgdGhpc1trZXlzW2ldXSA9IHByb3BlcnRpZXNba2V5c1tpXV07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGVzdE1lc3NhZ2UgZXJyb3IuXG4gICAgICogQG1lbWJlciB7c3RyaW5nfSBlcnJvclxuICAgICAqIEBtZW1iZXJvZiBUZXN0TWVzc2FnZVxuICAgICAqIEBpbnN0YW5jZVxuICAgICAqL1xuICAgIFRlc3RNZXNzYWdlLnByb3RvdHlwZS5lcnJvciA9IFwiXCI7XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgbmV3IFRlc3RNZXNzYWdlIGluc3RhbmNlIHVzaW5nIHRoZSBzcGVjaWZpZWQgcHJvcGVydGllcy5cbiAgICAgKiBAZnVuY3Rpb24gY3JlYXRlXG4gICAgICogQG1lbWJlcm9mIFRlc3RNZXNzYWdlXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBwYXJhbSB7SVRlc3RNZXNzYWdlPX0gW3Byb3BlcnRpZXNdIFByb3BlcnRpZXMgdG8gc2V0XG4gICAgICogQHJldHVybnMge1Rlc3RNZXNzYWdlfSBUZXN0TWVzc2FnZSBpbnN0YW5jZVxuICAgICAqL1xuICAgIFRlc3RNZXNzYWdlLmNyZWF0ZSA9IGZ1bmN0aW9uIGNyZWF0ZShwcm9wZXJ0aWVzKSB7XG4gICAgICAgIHJldHVybiBuZXcgVGVzdE1lc3NhZ2UocHJvcGVydGllcyk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEVuY29kZXMgdGhlIHNwZWNpZmllZCBUZXN0TWVzc2FnZSBtZXNzYWdlLiBEb2VzIG5vdCBpbXBsaWNpdGx5IHtAbGluayBUZXN0TWVzc2FnZS52ZXJpZnl8dmVyaWZ5fSBtZXNzYWdlcy5cbiAgICAgKiBAZnVuY3Rpb24gZW5jb2RlXG4gICAgICogQG1lbWJlcm9mIFRlc3RNZXNzYWdlXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBwYXJhbSB7SVRlc3RNZXNzYWdlfSBtZXNzYWdlIFRlc3RNZXNzYWdlIG1lc3NhZ2Ugb3IgcGxhaW4gb2JqZWN0IHRvIGVuY29kZVxuICAgICAqIEBwYXJhbSB7JHByb3RvYnVmLldyaXRlcn0gW3dyaXRlcl0gV3JpdGVyIHRvIGVuY29kZSB0b1xuICAgICAqIEByZXR1cm5zIHskcHJvdG9idWYuV3JpdGVyfSBXcml0ZXJcbiAgICAgKi9cbiAgICBUZXN0TWVzc2FnZS5lbmNvZGUgPSBmdW5jdGlvbiBlbmNvZGUobWVzc2FnZSwgd3JpdGVyKSB7XG4gICAgICAgIGlmICghd3JpdGVyKVxuICAgICAgICAgICAgd3JpdGVyID0gJFdyaXRlci5jcmVhdGUoKTtcbiAgICAgICAgaWYgKG1lc3NhZ2UuZXJyb3IgIT0gbnVsbCAmJiBtZXNzYWdlLmhhc093blByb3BlcnR5KFwiZXJyb3JcIikpXG4gICAgICAgICAgICB3cml0ZXIudWludDMyKC8qIGlkIDEsIHdpcmVUeXBlIDIgPSovMTApLnN0cmluZyhtZXNzYWdlLmVycm9yKTtcbiAgICAgICAgcmV0dXJuIHdyaXRlcjtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogRW5jb2RlcyB0aGUgc3BlY2lmaWVkIFRlc3RNZXNzYWdlIG1lc3NhZ2UsIGxlbmd0aCBkZWxpbWl0ZWQuIERvZXMgbm90IGltcGxpY2l0bHkge0BsaW5rIFRlc3RNZXNzYWdlLnZlcmlmeXx2ZXJpZnl9IG1lc3NhZ2VzLlxuICAgICAqIEBmdW5jdGlvbiBlbmNvZGVEZWxpbWl0ZWRcbiAgICAgKiBAbWVtYmVyb2YgVGVzdE1lc3NhZ2VcbiAgICAgKiBAc3RhdGljXG4gICAgICogQHBhcmFtIHtJVGVzdE1lc3NhZ2V9IG1lc3NhZ2UgVGVzdE1lc3NhZ2UgbWVzc2FnZSBvciBwbGFpbiBvYmplY3QgdG8gZW5jb2RlXG4gICAgICogQHBhcmFtIHskcHJvdG9idWYuV3JpdGVyfSBbd3JpdGVyXSBXcml0ZXIgdG8gZW5jb2RlIHRvXG4gICAgICogQHJldHVybnMgeyRwcm90b2J1Zi5Xcml0ZXJ9IFdyaXRlclxuICAgICAqL1xuICAgIFRlc3RNZXNzYWdlLmVuY29kZURlbGltaXRlZCA9IGZ1bmN0aW9uIGVuY29kZURlbGltaXRlZChtZXNzYWdlLCB3cml0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZW5jb2RlKG1lc3NhZ2UsIHdyaXRlcikubGRlbGltKCk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIERlY29kZXMgYSBUZXN0TWVzc2FnZSBtZXNzYWdlIGZyb20gdGhlIHNwZWNpZmllZCByZWFkZXIgb3IgYnVmZmVyLlxuICAgICAqIEBmdW5jdGlvbiBkZWNvZGVcbiAgICAgKiBAbWVtYmVyb2YgVGVzdE1lc3NhZ2VcbiAgICAgKiBAc3RhdGljXG4gICAgICogQHBhcmFtIHskcHJvdG9idWYuUmVhZGVyfFVpbnQ4QXJyYXl9IHJlYWRlciBSZWFkZXIgb3IgYnVmZmVyIHRvIGRlY29kZSBmcm9tXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtsZW5ndGhdIE1lc3NhZ2UgbGVuZ3RoIGlmIGtub3duIGJlZm9yZWhhbmRcbiAgICAgKiBAcmV0dXJucyB7VGVzdE1lc3NhZ2V9IFRlc3RNZXNzYWdlXG4gICAgICogQHRocm93cyB7RXJyb3J9IElmIHRoZSBwYXlsb2FkIGlzIG5vdCBhIHJlYWRlciBvciB2YWxpZCBidWZmZXJcbiAgICAgKiBAdGhyb3dzIHskcHJvdG9idWYudXRpbC5Qcm90b2NvbEVycm9yfSBJZiByZXF1aXJlZCBmaWVsZHMgYXJlIG1pc3NpbmdcbiAgICAgKi9cbiAgICBUZXN0TWVzc2FnZS5kZWNvZGUgPSBmdW5jdGlvbiBkZWNvZGUocmVhZGVyLCBsZW5ndGgpIHtcbiAgICAgICAgaWYgKCEocmVhZGVyIGluc3RhbmNlb2YgJFJlYWRlcikpXG4gICAgICAgICAgICByZWFkZXIgPSAkUmVhZGVyLmNyZWF0ZShyZWFkZXIpO1xuICAgICAgICB2YXIgZW5kID0gbGVuZ3RoID09PSB1bmRlZmluZWQgPyByZWFkZXIubGVuIDogcmVhZGVyLnBvcyArIGxlbmd0aCwgbWVzc2FnZSA9IG5ldyAkcm9vdC5UZXN0TWVzc2FnZSgpO1xuICAgICAgICB3aGlsZSAocmVhZGVyLnBvcyA8IGVuZCkge1xuICAgICAgICAgICAgdmFyIHRhZyA9IHJlYWRlci51aW50MzIoKTtcbiAgICAgICAgICAgIHN3aXRjaCAodGFnID4+PiAzKSB7XG4gICAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICAgICAgbWVzc2FnZS5lcnJvciA9IHJlYWRlci5zdHJpbmcoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgcmVhZGVyLnNraXBUeXBlKHRhZyAmIDcpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtZXNzYWdlO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBEZWNvZGVzIGEgVGVzdE1lc3NhZ2UgbWVzc2FnZSBmcm9tIHRoZSBzcGVjaWZpZWQgcmVhZGVyIG9yIGJ1ZmZlciwgbGVuZ3RoIGRlbGltaXRlZC5cbiAgICAgKiBAZnVuY3Rpb24gZGVjb2RlRGVsaW1pdGVkXG4gICAgICogQG1lbWJlcm9mIFRlc3RNZXNzYWdlXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBwYXJhbSB7JHByb3RvYnVmLlJlYWRlcnxVaW50OEFycmF5fSByZWFkZXIgUmVhZGVyIG9yIGJ1ZmZlciB0byBkZWNvZGUgZnJvbVxuICAgICAqIEByZXR1cm5zIHtUZXN0TWVzc2FnZX0gVGVzdE1lc3NhZ2VcbiAgICAgKiBAdGhyb3dzIHtFcnJvcn0gSWYgdGhlIHBheWxvYWQgaXMgbm90IGEgcmVhZGVyIG9yIHZhbGlkIGJ1ZmZlclxuICAgICAqIEB0aHJvd3MgeyRwcm90b2J1Zi51dGlsLlByb3RvY29sRXJyb3J9IElmIHJlcXVpcmVkIGZpZWxkcyBhcmUgbWlzc2luZ1xuICAgICAqL1xuICAgIFRlc3RNZXNzYWdlLmRlY29kZURlbGltaXRlZCA9IGZ1bmN0aW9uIGRlY29kZURlbGltaXRlZChyZWFkZXIpIHtcbiAgICAgICAgaWYgKCEocmVhZGVyIGluc3RhbmNlb2YgJFJlYWRlcikpXG4gICAgICAgICAgICByZWFkZXIgPSBuZXcgJFJlYWRlcihyZWFkZXIpO1xuICAgICAgICByZXR1cm4gdGhpcy5kZWNvZGUocmVhZGVyLCByZWFkZXIudWludDMyKCkpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBWZXJpZmllcyBhIFRlc3RNZXNzYWdlIG1lc3NhZ2UuXG4gICAgICogQGZ1bmN0aW9uIHZlcmlmeVxuICAgICAqIEBtZW1iZXJvZiBUZXN0TWVzc2FnZVxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAcGFyYW0ge09iamVjdC48c3RyaW5nLCo+fSBtZXNzYWdlIFBsYWluIG9iamVjdCB0byB2ZXJpZnlcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfG51bGx9IGBudWxsYCBpZiB2YWxpZCwgb3RoZXJ3aXNlIHRoZSByZWFzb24gd2h5IGl0IGlzIG5vdFxuICAgICAqL1xuICAgIFRlc3RNZXNzYWdlLnZlcmlmeSA9IGZ1bmN0aW9uIHZlcmlmeShtZXNzYWdlKSB7XG4gICAgICAgIGlmICh0eXBlb2YgbWVzc2FnZSAhPT0gXCJvYmplY3RcIiB8fCBtZXNzYWdlID09PSBudWxsKVxuICAgICAgICAgICAgcmV0dXJuIFwib2JqZWN0IGV4cGVjdGVkXCI7XG4gICAgICAgIGlmIChtZXNzYWdlLmVycm9yICE9IG51bGwgJiYgbWVzc2FnZS5oYXNPd25Qcm9wZXJ0eShcImVycm9yXCIpKVxuICAgICAgICAgICAgaWYgKCEkdXRpbC5pc1N0cmluZyhtZXNzYWdlLmVycm9yKSlcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJlcnJvcjogc3RyaW5nIGV4cGVjdGVkXCI7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgVGVzdE1lc3NhZ2UgbWVzc2FnZSBmcm9tIGEgcGxhaW4gb2JqZWN0LiBBbHNvIGNvbnZlcnRzIHZhbHVlcyB0byB0aGVpciByZXNwZWN0aXZlIGludGVybmFsIHR5cGVzLlxuICAgICAqIEBmdW5jdGlvbiBmcm9tT2JqZWN0XG4gICAgICogQG1lbWJlcm9mIFRlc3RNZXNzYWdlXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBwYXJhbSB7T2JqZWN0LjxzdHJpbmcsKj59IG9iamVjdCBQbGFpbiBvYmplY3RcbiAgICAgKiBAcmV0dXJucyB7VGVzdE1lc3NhZ2V9IFRlc3RNZXNzYWdlXG4gICAgICovXG4gICAgVGVzdE1lc3NhZ2UuZnJvbU9iamVjdCA9IGZ1bmN0aW9uIGZyb21PYmplY3Qob2JqZWN0KSB7XG4gICAgICAgIGlmIChvYmplY3QgaW5zdGFuY2VvZiAkcm9vdC5UZXN0TWVzc2FnZSlcbiAgICAgICAgICAgIHJldHVybiBvYmplY3Q7XG4gICAgICAgIHZhciBtZXNzYWdlID0gbmV3ICRyb290LlRlc3RNZXNzYWdlKCk7XG4gICAgICAgIGlmIChvYmplY3QuZXJyb3IgIT0gbnVsbClcbiAgICAgICAgICAgIG1lc3NhZ2UuZXJyb3IgPSBTdHJpbmcob2JqZWN0LmVycm9yKTtcbiAgICAgICAgcmV0dXJuIG1lc3NhZ2U7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBwbGFpbiBvYmplY3QgZnJvbSBhIFRlc3RNZXNzYWdlIG1lc3NhZ2UuIEFsc28gY29udmVydHMgdmFsdWVzIHRvIG90aGVyIHR5cGVzIGlmIHNwZWNpZmllZC5cbiAgICAgKiBAZnVuY3Rpb24gdG9PYmplY3RcbiAgICAgKiBAbWVtYmVyb2YgVGVzdE1lc3NhZ2VcbiAgICAgKiBAc3RhdGljXG4gICAgICogQHBhcmFtIHtUZXN0TWVzc2FnZX0gbWVzc2FnZSBUZXN0TWVzc2FnZVxuICAgICAqIEBwYXJhbSB7JHByb3RvYnVmLklDb252ZXJzaW9uT3B0aW9uc30gW29wdGlvbnNdIENvbnZlcnNpb24gb3B0aW9uc1xuICAgICAqIEByZXR1cm5zIHtPYmplY3QuPHN0cmluZywqPn0gUGxhaW4gb2JqZWN0XG4gICAgICovXG4gICAgVGVzdE1lc3NhZ2UudG9PYmplY3QgPSBmdW5jdGlvbiB0b09iamVjdChtZXNzYWdlLCBvcHRpb25zKSB7XG4gICAgICAgIGlmICghb3B0aW9ucylcbiAgICAgICAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICAgICAgdmFyIG9iamVjdCA9IHt9O1xuICAgICAgICBpZiAob3B0aW9ucy5kZWZhdWx0cylcbiAgICAgICAgICAgIG9iamVjdC5lcnJvciA9IFwiXCI7XG4gICAgICAgIGlmIChtZXNzYWdlLmVycm9yICE9IG51bGwgJiYgbWVzc2FnZS5oYXNPd25Qcm9wZXJ0eShcImVycm9yXCIpKVxuICAgICAgICAgICAgb2JqZWN0LmVycm9yID0gbWVzc2FnZS5lcnJvcjtcbiAgICAgICAgcmV0dXJuIG9iamVjdDtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQ29udmVydHMgdGhpcyBUZXN0TWVzc2FnZSB0byBKU09OLlxuICAgICAqIEBmdW5jdGlvbiB0b0pTT05cbiAgICAgKiBAbWVtYmVyb2YgVGVzdE1lc3NhZ2VcbiAgICAgKiBAaW5zdGFuY2VcbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0LjxzdHJpbmcsKj59IEpTT04gb2JqZWN0XG4gICAgICovXG4gICAgVGVzdE1lc3NhZ2UucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uIHRvSlNPTigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IudG9PYmplY3QodGhpcywgJHByb3RvYnVmLnV0aWwudG9KU09OT3B0aW9ucyk7XG4gICAgfTtcblxuICAgIHJldHVybiBUZXN0TWVzc2FnZTtcbn0pKCk7XG5cbiRyb290LlRlc3RSZXF1ZXN0ID0gKGZ1bmN0aW9uKCkge1xuXG4gICAgLyoqXG4gICAgICogUHJvcGVydGllcyBvZiBhIFRlc3RSZXF1ZXN0LlxuICAgICAqIEBleHBvcnRzIElUZXN0UmVxdWVzdFxuICAgICAqIEBpbnRlcmZhY2UgSVRlc3RSZXF1ZXN0XG4gICAgICogQHByb3BlcnR5IHtzdHJpbmd8bnVsbH0gW0tleV0gVGVzdFJlcXVlc3QgS2V5XG4gICAgICogQHByb3BlcnR5IHtCZW5jaG1hcmtNb2RlfG51bGx9IFtNb2RlXSBUZXN0UmVxdWVzdCBNb2RlXG4gICAgICovXG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RzIGEgbmV3IFRlc3RSZXF1ZXN0LlxuICAgICAqIEBleHBvcnRzIFRlc3RSZXF1ZXN0XG4gICAgICogQGNsYXNzZGVzYyBSZXByZXNlbnRzIGEgVGVzdFJlcXVlc3QuXG4gICAgICogQGltcGxlbWVudHMgSVRlc3RSZXF1ZXN0XG4gICAgICogQGNvbnN0cnVjdG9yXG4gICAgICogQHBhcmFtIHtJVGVzdFJlcXVlc3Q9fSBbcHJvcGVydGllc10gUHJvcGVydGllcyB0byBzZXRcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBUZXN0UmVxdWVzdChwcm9wZXJ0aWVzKSB7XG4gICAgICAgIGlmIChwcm9wZXJ0aWVzKVxuICAgICAgICAgICAgZm9yICh2YXIga2V5cyA9IE9iamVjdC5rZXlzKHByb3BlcnRpZXMpLCBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyArK2kpXG4gICAgICAgICAgICAgICAgaWYgKHByb3BlcnRpZXNba2V5c1tpXV0gIT0gbnVsbClcbiAgICAgICAgICAgICAgICAgICAgdGhpc1trZXlzW2ldXSA9IHByb3BlcnRpZXNba2V5c1tpXV07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGVzdFJlcXVlc3QgS2V5LlxuICAgICAqIEBtZW1iZXIge3N0cmluZ30gS2V5XG4gICAgICogQG1lbWJlcm9mIFRlc3RSZXF1ZXN0XG4gICAgICogQGluc3RhbmNlXG4gICAgICovXG4gICAgVGVzdFJlcXVlc3QucHJvdG90eXBlLktleSA9IFwiXCI7XG5cbiAgICAvKipcbiAgICAgKiBUZXN0UmVxdWVzdCBNb2RlLlxuICAgICAqIEBtZW1iZXIge0JlbmNobWFya01vZGV9IE1vZGVcbiAgICAgKiBAbWVtYmVyb2YgVGVzdFJlcXVlc3RcbiAgICAgKiBAaW5zdGFuY2VcbiAgICAgKi9cbiAgICBUZXN0UmVxdWVzdC5wcm90b3R5cGUuTW9kZSA9IDA7XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgbmV3IFRlc3RSZXF1ZXN0IGluc3RhbmNlIHVzaW5nIHRoZSBzcGVjaWZpZWQgcHJvcGVydGllcy5cbiAgICAgKiBAZnVuY3Rpb24gY3JlYXRlXG4gICAgICogQG1lbWJlcm9mIFRlc3RSZXF1ZXN0XG4gICAgICogQHN0YXRpY1xuICAgICAqIEBwYXJhbSB7SVRlc3RSZXF1ZXN0PX0gW3Byb3BlcnRpZXNdIFByb3BlcnRpZXMgdG8gc2V0XG4gICAgICogQHJldHVybnMge1Rlc3RSZXF1ZXN0fSBUZXN0UmVxdWVzdCBpbnN0YW5jZVxuICAgICAqL1xuICAgIFRlc3RSZXF1ZXN0LmNyZWF0ZSA9IGZ1bmN0aW9uIGNyZWF0ZShwcm9wZXJ0aWVzKSB7XG4gICAgICAgIHJldHVybiBuZXcgVGVzdFJlcXVlc3QocHJvcGVydGllcyk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEVuY29kZXMgdGhlIHNwZWNpZmllZCBUZXN0UmVxdWVzdCBtZXNzYWdlLiBEb2VzIG5vdCBpbXBsaWNpdGx5IHtAbGluayBUZXN0UmVxdWVzdC52ZXJpZnl8dmVyaWZ5fSBtZXNzYWdlcy5cbiAgICAgKiBAZnVuY3Rpb24gZW5jb2RlXG4gICAgICogQG1lbWJlcm9mIFRlc3RSZXF1ZXN0XG4gICAgICogQHN0YXRpY1xuICAgICAqIEBwYXJhbSB7SVRlc3RSZXF1ZXN0fSBtZXNzYWdlIFRlc3RSZXF1ZXN0IG1lc3NhZ2Ugb3IgcGxhaW4gb2JqZWN0IHRvIGVuY29kZVxuICAgICAqIEBwYXJhbSB7JHByb3RvYnVmLldyaXRlcn0gW3dyaXRlcl0gV3JpdGVyIHRvIGVuY29kZSB0b1xuICAgICAqIEByZXR1cm5zIHskcHJvdG9idWYuV3JpdGVyfSBXcml0ZXJcbiAgICAgKi9cbiAgICBUZXN0UmVxdWVzdC5lbmNvZGUgPSBmdW5jdGlvbiBlbmNvZGUobWVzc2FnZSwgd3JpdGVyKSB7XG4gICAgICAgIGlmICghd3JpdGVyKVxuICAgICAgICAgICAgd3JpdGVyID0gJFdyaXRlci5jcmVhdGUoKTtcbiAgICAgICAgaWYgKG1lc3NhZ2UuS2V5ICE9IG51bGwgJiYgbWVzc2FnZS5oYXNPd25Qcm9wZXJ0eShcIktleVwiKSlcbiAgICAgICAgICAgIHdyaXRlci51aW50MzIoLyogaWQgMjAsIHdpcmVUeXBlIDIgPSovMTYyKS5zdHJpbmcobWVzc2FnZS5LZXkpO1xuICAgICAgICBpZiAobWVzc2FnZS5Nb2RlICE9IG51bGwgJiYgbWVzc2FnZS5oYXNPd25Qcm9wZXJ0eShcIk1vZGVcIikpXG4gICAgICAgICAgICB3cml0ZXIudWludDMyKC8qIGlkIDIxLCB3aXJlVHlwZSAwID0qLzE2OCkuaW50MzIobWVzc2FnZS5Nb2RlKTtcbiAgICAgICAgcmV0dXJuIHdyaXRlcjtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogRW5jb2RlcyB0aGUgc3BlY2lmaWVkIFRlc3RSZXF1ZXN0IG1lc3NhZ2UsIGxlbmd0aCBkZWxpbWl0ZWQuIERvZXMgbm90IGltcGxpY2l0bHkge0BsaW5rIFRlc3RSZXF1ZXN0LnZlcmlmeXx2ZXJpZnl9IG1lc3NhZ2VzLlxuICAgICAqIEBmdW5jdGlvbiBlbmNvZGVEZWxpbWl0ZWRcbiAgICAgKiBAbWVtYmVyb2YgVGVzdFJlcXVlc3RcbiAgICAgKiBAc3RhdGljXG4gICAgICogQHBhcmFtIHtJVGVzdFJlcXVlc3R9IG1lc3NhZ2UgVGVzdFJlcXVlc3QgbWVzc2FnZSBvciBwbGFpbiBvYmplY3QgdG8gZW5jb2RlXG4gICAgICogQHBhcmFtIHskcHJvdG9idWYuV3JpdGVyfSBbd3JpdGVyXSBXcml0ZXIgdG8gZW5jb2RlIHRvXG4gICAgICogQHJldHVybnMgeyRwcm90b2J1Zi5Xcml0ZXJ9IFdyaXRlclxuICAgICAqL1xuICAgIFRlc3RSZXF1ZXN0LmVuY29kZURlbGltaXRlZCA9IGZ1bmN0aW9uIGVuY29kZURlbGltaXRlZChtZXNzYWdlLCB3cml0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZW5jb2RlKG1lc3NhZ2UsIHdyaXRlcikubGRlbGltKCk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIERlY29kZXMgYSBUZXN0UmVxdWVzdCBtZXNzYWdlIGZyb20gdGhlIHNwZWNpZmllZCByZWFkZXIgb3IgYnVmZmVyLlxuICAgICAqIEBmdW5jdGlvbiBkZWNvZGVcbiAgICAgKiBAbWVtYmVyb2YgVGVzdFJlcXVlc3RcbiAgICAgKiBAc3RhdGljXG4gICAgICogQHBhcmFtIHskcHJvdG9idWYuUmVhZGVyfFVpbnQ4QXJyYXl9IHJlYWRlciBSZWFkZXIgb3IgYnVmZmVyIHRvIGRlY29kZSBmcm9tXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtsZW5ndGhdIE1lc3NhZ2UgbGVuZ3RoIGlmIGtub3duIGJlZm9yZWhhbmRcbiAgICAgKiBAcmV0dXJucyB7VGVzdFJlcXVlc3R9IFRlc3RSZXF1ZXN0XG4gICAgICogQHRocm93cyB7RXJyb3J9IElmIHRoZSBwYXlsb2FkIGlzIG5vdCBhIHJlYWRlciBvciB2YWxpZCBidWZmZXJcbiAgICAgKiBAdGhyb3dzIHskcHJvdG9idWYudXRpbC5Qcm90b2NvbEVycm9yfSBJZiByZXF1aXJlZCBmaWVsZHMgYXJlIG1pc3NpbmdcbiAgICAgKi9cbiAgICBUZXN0UmVxdWVzdC5kZWNvZGUgPSBmdW5jdGlvbiBkZWNvZGUocmVhZGVyLCBsZW5ndGgpIHtcbiAgICAgICAgaWYgKCEocmVhZGVyIGluc3RhbmNlb2YgJFJlYWRlcikpXG4gICAgICAgICAgICByZWFkZXIgPSAkUmVhZGVyLmNyZWF0ZShyZWFkZXIpO1xuICAgICAgICB2YXIgZW5kID0gbGVuZ3RoID09PSB1bmRlZmluZWQgPyByZWFkZXIubGVuIDogcmVhZGVyLnBvcyArIGxlbmd0aCwgbWVzc2FnZSA9IG5ldyAkcm9vdC5UZXN0UmVxdWVzdCgpO1xuICAgICAgICB3aGlsZSAocmVhZGVyLnBvcyA8IGVuZCkge1xuICAgICAgICAgICAgdmFyIHRhZyA9IHJlYWRlci51aW50MzIoKTtcbiAgICAgICAgICAgIHN3aXRjaCAodGFnID4+PiAzKSB7XG4gICAgICAgICAgICBjYXNlIDIwOlxuICAgICAgICAgICAgICAgIG1lc3NhZ2UuS2V5ID0gcmVhZGVyLnN0cmluZygpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAyMTpcbiAgICAgICAgICAgICAgICBtZXNzYWdlLk1vZGUgPSByZWFkZXIuaW50MzIoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgcmVhZGVyLnNraXBUeXBlKHRhZyAmIDcpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtZXNzYWdlO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBEZWNvZGVzIGEgVGVzdFJlcXVlc3QgbWVzc2FnZSBmcm9tIHRoZSBzcGVjaWZpZWQgcmVhZGVyIG9yIGJ1ZmZlciwgbGVuZ3RoIGRlbGltaXRlZC5cbiAgICAgKiBAZnVuY3Rpb24gZGVjb2RlRGVsaW1pdGVkXG4gICAgICogQG1lbWJlcm9mIFRlc3RSZXF1ZXN0XG4gICAgICogQHN0YXRpY1xuICAgICAqIEBwYXJhbSB7JHByb3RvYnVmLlJlYWRlcnxVaW50OEFycmF5fSByZWFkZXIgUmVhZGVyIG9yIGJ1ZmZlciB0byBkZWNvZGUgZnJvbVxuICAgICAqIEByZXR1cm5zIHtUZXN0UmVxdWVzdH0gVGVzdFJlcXVlc3RcbiAgICAgKiBAdGhyb3dzIHtFcnJvcn0gSWYgdGhlIHBheWxvYWQgaXMgbm90IGEgcmVhZGVyIG9yIHZhbGlkIGJ1ZmZlclxuICAgICAqIEB0aHJvd3MgeyRwcm90b2J1Zi51dGlsLlByb3RvY29sRXJyb3J9IElmIHJlcXVpcmVkIGZpZWxkcyBhcmUgbWlzc2luZ1xuICAgICAqL1xuICAgIFRlc3RSZXF1ZXN0LmRlY29kZURlbGltaXRlZCA9IGZ1bmN0aW9uIGRlY29kZURlbGltaXRlZChyZWFkZXIpIHtcbiAgICAgICAgaWYgKCEocmVhZGVyIGluc3RhbmNlb2YgJFJlYWRlcikpXG4gICAgICAgICAgICByZWFkZXIgPSBuZXcgJFJlYWRlcihyZWFkZXIpO1xuICAgICAgICByZXR1cm4gdGhpcy5kZWNvZGUocmVhZGVyLCByZWFkZXIudWludDMyKCkpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBWZXJpZmllcyBhIFRlc3RSZXF1ZXN0IG1lc3NhZ2UuXG4gICAgICogQGZ1bmN0aW9uIHZlcmlmeVxuICAgICAqIEBtZW1iZXJvZiBUZXN0UmVxdWVzdFxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAcGFyYW0ge09iamVjdC48c3RyaW5nLCo+fSBtZXNzYWdlIFBsYWluIG9iamVjdCB0byB2ZXJpZnlcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfG51bGx9IGBudWxsYCBpZiB2YWxpZCwgb3RoZXJ3aXNlIHRoZSByZWFzb24gd2h5IGl0IGlzIG5vdFxuICAgICAqL1xuICAgIFRlc3RSZXF1ZXN0LnZlcmlmeSA9IGZ1bmN0aW9uIHZlcmlmeShtZXNzYWdlKSB7XG4gICAgICAgIGlmICh0eXBlb2YgbWVzc2FnZSAhPT0gXCJvYmplY3RcIiB8fCBtZXNzYWdlID09PSBudWxsKVxuICAgICAgICAgICAgcmV0dXJuIFwib2JqZWN0IGV4cGVjdGVkXCI7XG4gICAgICAgIGlmIChtZXNzYWdlLktleSAhPSBudWxsICYmIG1lc3NhZ2UuaGFzT3duUHJvcGVydHkoXCJLZXlcIikpXG4gICAgICAgICAgICBpZiAoISR1dGlsLmlzU3RyaW5nKG1lc3NhZ2UuS2V5KSlcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJLZXk6IHN0cmluZyBleHBlY3RlZFwiO1xuICAgICAgICBpZiAobWVzc2FnZS5Nb2RlICE9IG51bGwgJiYgbWVzc2FnZS5oYXNPd25Qcm9wZXJ0eShcIk1vZGVcIikpXG4gICAgICAgICAgICBzd2l0Y2ggKG1lc3NhZ2UuTW9kZSkge1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJNb2RlOiBlbnVtIHZhbHVlIGV4cGVjdGVkXCI7XG4gICAgICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgVGVzdFJlcXVlc3QgbWVzc2FnZSBmcm9tIGEgcGxhaW4gb2JqZWN0LiBBbHNvIGNvbnZlcnRzIHZhbHVlcyB0byB0aGVpciByZXNwZWN0aXZlIGludGVybmFsIHR5cGVzLlxuICAgICAqIEBmdW5jdGlvbiBmcm9tT2JqZWN0XG4gICAgICogQG1lbWJlcm9mIFRlc3RSZXF1ZXN0XG4gICAgICogQHN0YXRpY1xuICAgICAqIEBwYXJhbSB7T2JqZWN0LjxzdHJpbmcsKj59IG9iamVjdCBQbGFpbiBvYmplY3RcbiAgICAgKiBAcmV0dXJucyB7VGVzdFJlcXVlc3R9IFRlc3RSZXF1ZXN0XG4gICAgICovXG4gICAgVGVzdFJlcXVlc3QuZnJvbU9iamVjdCA9IGZ1bmN0aW9uIGZyb21PYmplY3Qob2JqZWN0KSB7XG4gICAgICAgIGlmIChvYmplY3QgaW5zdGFuY2VvZiAkcm9vdC5UZXN0UmVxdWVzdClcbiAgICAgICAgICAgIHJldHVybiBvYmplY3Q7XG4gICAgICAgIHZhciBtZXNzYWdlID0gbmV3ICRyb290LlRlc3RSZXF1ZXN0KCk7XG4gICAgICAgIGlmIChvYmplY3QuS2V5ICE9IG51bGwpXG4gICAgICAgICAgICBtZXNzYWdlLktleSA9IFN0cmluZyhvYmplY3QuS2V5KTtcbiAgICAgICAgc3dpdGNoIChvYmplY3QuTW9kZSkge1xuICAgICAgICBjYXNlIFwiQUxMXCI6XG4gICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgIG1lc3NhZ2UuTW9kZSA9IDA7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcIkdlb0xvY2F0ZVwiOlxuICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICBtZXNzYWdlLk1vZGUgPSAxO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJLaW5lc2lzU2VuZFwiOlxuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICBtZXNzYWdlLk1vZGUgPSAyO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJCcm93c2VyUGFyc2VyXCI6XG4gICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgIG1lc3NhZ2UuTW9kZSA9IDM7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWVzc2FnZTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIHBsYWluIG9iamVjdCBmcm9tIGEgVGVzdFJlcXVlc3QgbWVzc2FnZS4gQWxzbyBjb252ZXJ0cyB2YWx1ZXMgdG8gb3RoZXIgdHlwZXMgaWYgc3BlY2lmaWVkLlxuICAgICAqIEBmdW5jdGlvbiB0b09iamVjdFxuICAgICAqIEBtZW1iZXJvZiBUZXN0UmVxdWVzdFxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAcGFyYW0ge1Rlc3RSZXF1ZXN0fSBtZXNzYWdlIFRlc3RSZXF1ZXN0XG4gICAgICogQHBhcmFtIHskcHJvdG9idWYuSUNvbnZlcnNpb25PcHRpb25zfSBbb3B0aW9uc10gQ29udmVyc2lvbiBvcHRpb25zXG4gICAgICogQHJldHVybnMge09iamVjdC48c3RyaW5nLCo+fSBQbGFpbiBvYmplY3RcbiAgICAgKi9cbiAgICBUZXN0UmVxdWVzdC50b09iamVjdCA9IGZ1bmN0aW9uIHRvT2JqZWN0KG1lc3NhZ2UsIG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKCFvcHRpb25zKVxuICAgICAgICAgICAgb3B0aW9ucyA9IHt9O1xuICAgICAgICB2YXIgb2JqZWN0ID0ge307XG4gICAgICAgIGlmIChvcHRpb25zLmRlZmF1bHRzKSB7XG4gICAgICAgICAgICBvYmplY3QuS2V5ID0gXCJcIjtcbiAgICAgICAgICAgIG9iamVjdC5Nb2RlID0gb3B0aW9ucy5lbnVtcyA9PT0gU3RyaW5nID8gXCJBTExcIiA6IDA7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1lc3NhZ2UuS2V5ICE9IG51bGwgJiYgbWVzc2FnZS5oYXNPd25Qcm9wZXJ0eShcIktleVwiKSlcbiAgICAgICAgICAgIG9iamVjdC5LZXkgPSBtZXNzYWdlLktleTtcbiAgICAgICAgaWYgKG1lc3NhZ2UuTW9kZSAhPSBudWxsICYmIG1lc3NhZ2UuaGFzT3duUHJvcGVydHkoXCJNb2RlXCIpKVxuICAgICAgICAgICAgb2JqZWN0Lk1vZGUgPSBvcHRpb25zLmVudW1zID09PSBTdHJpbmcgPyAkcm9vdC5CZW5jaG1hcmtNb2RlW21lc3NhZ2UuTW9kZV0gOiBtZXNzYWdlLk1vZGU7XG4gICAgICAgIHJldHVybiBvYmplY3Q7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIENvbnZlcnRzIHRoaXMgVGVzdFJlcXVlc3QgdG8gSlNPTi5cbiAgICAgKiBAZnVuY3Rpb24gdG9KU09OXG4gICAgICogQG1lbWJlcm9mIFRlc3RSZXF1ZXN0XG4gICAgICogQGluc3RhbmNlXG4gICAgICogQHJldHVybnMge09iamVjdC48c3RyaW5nLCo+fSBKU09OIG9iamVjdFxuICAgICAqL1xuICAgIFRlc3RSZXF1ZXN0LnByb3RvdHlwZS50b0pTT04gPSBmdW5jdGlvbiB0b0pTT04oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLnRvT2JqZWN0KHRoaXMsICRwcm90b2J1Zi51dGlsLnRvSlNPTk9wdGlvbnMpO1xuICAgIH07XG5cbiAgICByZXR1cm4gVGVzdFJlcXVlc3Q7XG59KSgpO1xuXG4vKipcbiAqIEJlbmNobWFya01vZGUgZW51bS5cbiAqIEBleHBvcnRzIEJlbmNobWFya01vZGVcbiAqIEBlbnVtIHtzdHJpbmd9XG4gKiBAcHJvcGVydHkge251bWJlcn0gQUxMPTAgQUxMIHZhbHVlXG4gKiBAcHJvcGVydHkge251bWJlcn0gR2VvTG9jYXRlPTEgR2VvTG9jYXRlIHZhbHVlXG4gKiBAcHJvcGVydHkge251bWJlcn0gS2luZXNpc1NlbmQ9MiBLaW5lc2lzU2VuZCB2YWx1ZVxuICogQHByb3BlcnR5IHtudW1iZXJ9IEJyb3dzZXJQYXJzZXI9MyBCcm93c2VyUGFyc2VyIHZhbHVlXG4gKi9cbiRyb290LkJlbmNobWFya01vZGUgPSAoZnVuY3Rpb24oKSB7XG4gICAgdmFyIHZhbHVlc0J5SWQgPSB7fSwgdmFsdWVzID0gT2JqZWN0LmNyZWF0ZSh2YWx1ZXNCeUlkKTtcbiAgICB2YWx1ZXNbdmFsdWVzQnlJZFswXSA9IFwiQUxMXCJdID0gMDtcbiAgICB2YWx1ZXNbdmFsdWVzQnlJZFsxXSA9IFwiR2VvTG9jYXRlXCJdID0gMTtcbiAgICB2YWx1ZXNbdmFsdWVzQnlJZFsyXSA9IFwiS2luZXNpc1NlbmRcIl0gPSAyO1xuICAgIHZhbHVlc1t2YWx1ZXNCeUlkWzNdID0gXCJCcm93c2VyUGFyc2VyXCJdID0gMztcbiAgICByZXR1cm4gdmFsdWVzO1xufSkoKTtcblxubW9kdWxlLmV4cG9ydHMgPSAkcm9vdDtcbiJdfQ==
