// var messages = require('./proto3_test_pb');
var messages = require('./contacts_pb.js');


function deserialize(bytes) {
    var desPerson = messages.Person.deserializeBinary(bytes);
    
    var name = desPerson.getName();
    var id = desPerson.getId();
    var email = desPerson.getEmail();
    
    document.getElementById('ds_name').innerHTML = name;
    document.getElementById('ds_id').innerHTML = id;
    document.getElementById('ds_email').innerHTML = email;
}

var oReq = new XMLHttpRequest();
oReq.open("GET", "./contacts.bin", true);
oReq.responseType = "arraybuffer";

oReq.onload = function (oEvent) {
    debugger;
    console.log('XHR request success');
    var arrayBuffer = oReq.response; // Note: not oReq.responseText
    if (arrayBuffer) {
    var byteArray = new Uint8Array(arrayBuffer);
    deserialize(byteArray);
}
};

oReq.send(null);