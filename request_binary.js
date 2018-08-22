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