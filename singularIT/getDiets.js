var fs       = require('fs');
var mongoose = require('mongoose');
var config = JSON.parse(fs.readFileSync('config.json'));
var speakerinfo = JSON.parse(fs.readFileSync('speakers.json'));
var User     = require('./models/User');

mongoose.connect(config.mongodb.url);

User.find({$or: [{'specialNeeds': {$ne: ""}}, {'vegetarian': true}]}).sort({'vereniging':1,'firstname':1}).exec( function (err, results) {
  if (err) { return err; }
  results.forEach(user=>{
    var description = '"' + user.firstname + " " + user.surname + '",';
    if (user.vegetarian){
      description += '"vegetarisch"'
    } 
    description += ','
    if(user.specialNeeds && user.specialNeeds != ''){
      description += '"' + user.specialNeeds + '"';
    }
    console.log(description);
  });
  // res.render('diet',{users:results, verenigingen:config.verenigingen});
});