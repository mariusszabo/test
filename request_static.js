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