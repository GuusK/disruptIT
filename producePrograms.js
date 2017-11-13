var fs       = require('fs');
var json2csv = require('json2csv')
var mongoose = require('mongoose');
var config = JSON.parse(fs.readFileSync('config.json'));
var speakerinfo = JSON.parse(fs.readFileSync('speakers.json'));
var matching = JSON.parse(fs.readFileSync('matching.json'));
var User     = require('./models/User');

mongoose.connect(config.mongodb.url);

var locations = ['Theater', 'Loading dock', 'Cortegaerdt zaal'];

var fields = ["ticketcode", "fullname", "association", "session1-speaker", "session1-subject", "session1-location","session2-time", "session2-speaker", "session2-subject", "session2-location","session3-speaker", "session3-subject", "session3-location","qrfile", "company1","company2","company3"];

function sessionInformation(user, session){
  var sessionContent = {};
  if(!user[session] || user[session] == '""'){
    return {};
  } else {
    var id = user[session];
    var speaker = speakerinfo.speakers.filter(session => session.id == id)[0];

    sessionContent[session + '-speaker'] = speaker.name.replace("</br>", "&");;
    sessionContent[session + '-subject'] = speaker.subject.split(" </br>")[0];;
    sessionContent[session + '-location'] = locations[speakerinfo.speakerids[session].indexOf(user[session])];
    if(session == 'session2'){
      if(user[session] == 'quintor'){
        sessionContent[session + '-time'] = '14:00';
      } else {
        sessionContent[session + '-time'] = '14:15';
      }
    }

    if(user[session] == 'nick'){
       sessionContent[session + '-speaker'] = 'Nick & Wouter';
    }

    if(user[session] == 'topicus'){
       sessionContent[session + '-speaker'] = 'Stefan & Michel';
    }

    if(user[session] == 'hackastory'){
       sessionContent[session + '-speaker'] = 'Hackastory';
    }

  }
  return sessionContent;
}

async function processUser(user, list){
  var badge = {}

  // Basic info
  badge.ticketcode = user.ticket;
  badge.fullname = user.firstname + " " + user.surname;
  badge.association = config.verenigingen[user.vereniging].name;
  
  // session info
  var session1 = sessionInformation(user, "session1");
  var session2 = sessionInformation(user, "session2");
  var session3 = sessionInformation(user, "session3");

  Object.assign(badge, session1, session2, session3);
  // Filelocation of qr code
  badge.qrfile = user.ticket + '.png';

  // Matchinginfo
  var companies = matching[user.ticket];
  badge.company1 = companies[0];
  badge.company2 = companies[1];
  badge.company3 = companies[2];
  list.push(badge);
}

attendeesPrograms = []
// User.find({type: {$ne: 'partner'}}).sort({'surname':1}).exec( function (err, results) {
User.find().where('type').eq('student').sort({'surname':1}).exec( function (err, results) {  
  if (err) { return err; }
  results.forEach(user => {
    processUser(user, attendeesPrograms);
  });
}).then(nothing => {
  var csv = json2csv({data:attendeesPrograms, fields: fields})
  fs.writeFile('attendeesPrograms.csv', csv, function(err){
    if (err) throw err;
    console.log('file saved');
  })
});

partnerPrograms = []
// User.find({type: "partner"}).sort({'surname':1}).exec( function (err, results) {
User.find().where('type').ne('student').sort({'surname':1}).exec( function (err, results) {  
  if (err) { return err; }
  results.forEach(user => {
    processUser(user, partnerPrograms);
  });
}).then(nothing => {
  var csv = json2csv({data:partnerPrograms, fields: fields})
  fs.writeFile('partnerPrograms.csv', csv, function(err){
    if (err) throw err;
    console.log('file saved');
  })
});
