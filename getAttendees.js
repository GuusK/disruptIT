var fs       = require('fs');
var mongoose = require('mongoose');
var config = JSON.parse(fs.readFileSync('config.json'));
var speakerinfo = JSON.parse(fs.readFileSync('speakers.json'));
var User     = require('./models/User');

mongoose.connect(config.mongodb.url);

User.find({}).sort({'vereniging':1,'firstname':1}).exec( function (err, results) {
  if (err) { return err; }
  results.forEach(user=>{
    console.log(user.firstname + ' ' + user.surname + ' ' + config.verenigingen[user.vereniging].name);
  });
});