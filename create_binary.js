// var messages = require('./proto3_test_pb');
var messages = require('protobufjs');

// Function to save the byte array
var saveByteArray = (function () {
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    return function (data, name) {
        var blob = new Blob(data, {type: "octet/stream"}),
            url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = name;
        a.click();
        window.URL.revokeObjectURL(url);
    };
}());
////////////////////////




var person = new messages.Person();

person.setName("Szabo Marius");
person.setId("1");
person.setEmail("marius.szabo@connatix.com");

document.getElementById('ns_name').innerHTML = person.getName();
document.getElementById('ns_id').innerHTML = person.getId();
document.getElementById('ns_email').innerHTML = person.getEmail();


var bytes = person.serializeBinary();
debugger;
console.log('hello');

saveByteArray(bytes, 'contacts.bin');

var desPerson = messages.Person.deserializeBinary(bytes);

var name = desPerson.getName();
var id = desPerson.getId();
var email = desPerson.getEmail();

document.getElementById('ds_name').innerHTML = name;
document.getElementById('ds_id').innerHTML = id;
document.getElementById('ds_email').innerHTML = email;