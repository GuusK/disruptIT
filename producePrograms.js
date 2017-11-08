var fs       = require('fs');
var mongoose = require('mongoose');
const exec = require('child_process').exec;
var config = JSON.parse(fs.readFileSync('config.json'));
var speakerinfo = JSON.parse(fs.readFileSync('speakers.json'));
var User     = require('./models/User');

mongoose.connect(config.mongodb.url);

var locations = ['Theatre', 'Loading dock', 'Cortegaerdt zaal'];

function sessionInformation(user, description, session){
  if(!user[session] || user[session] == '""'){
    description += ',"","",""';
  } else {
    if(session == 'session2'){
      if(user[session] == 'quintor'){
        description += ',"14:00"';
      } else {
        description += ',"14:15"';
      }
    }
    var id = user[session];
    var speaker = speakerinfo.speakers.filter(session => session.id == id)[0];
    var speakername = speaker.name.replace("</br>", "&");
    var speakersubject = speaker.subject.split(" </br>")[0];
    description += ',"' + speakername + '"' + ',"' + speakersubject + '"' + ',"' + locations[speakerinfo.speakerids[session].indexOf(user[session])] + '"';
  }
  return description
}
// Header
console.log('"Full name","vereniging","session1-speaker", "session1-subject", "session1-location","session2-time", "session2-speaker", "session2-subject", "session2-location","session3-speaker", "session3-subject", "session3-location","qr-filename", "company1","company2","company3"');
User.find({}).sort({'surname':1}).exec( function (err, results) {
  if (err) { return err; }
  results.forEach(user=>{
    // Basic info
    var description = '"' + user.firstname + " " + user.surname + '",' + '"' + config.verenigingen[user.vereniging].name + '"';
    
    // session info
    description = sessionInformation(user, description, "session1");
    description = sessionInformation(user, description, "session2");
    description = sessionInformation(user, description, "session3");

    // Filelocation of qr code
    description += ',"' + user.ticket + '.png"';

    // Matchinginfo
    description ++ ',"","",""'
    console.log(description);
  });
});