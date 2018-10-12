var fs = require('fs');
const exec = require('child_process').exec;
var mongoose = require('mongoose');
var config = JSON.parse(fs.readFileSync('config.json'));
var speakerinfo = JSON.parse(fs.readFileSync('speakers.json'));

var attendees = (JSON.parse(fs.readFileSync('attendees.json'))).tickets;

function createQRcode(ticket){
	var url = '"https://disrupt-it.nl/connect/' + ticket + '" ';
	var opts = '-m 0 -l m -o qrcodes/' + ticket + '.png';
	var command = 'qrencode ' + url + opts;
    exec(command, {cwd: process.cwd()});
    console.log("Produced QR code for " + ticket);
}

attendees.forEach(ticket => createQRcode(ticket));