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
