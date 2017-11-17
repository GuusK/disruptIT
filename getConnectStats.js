var fs       = require('fs');
var mongoose = require('mongoose');
mongoose.Promise = require('q').Promise;
var config = JSON.parse(fs.readFileSync('config.json'));
var User     = require('./models/User');

mongoose.connect(config.mongodb.url);

var connectCount = 0;

User.find({}).exec( function (err, results) {
  if (err) { return err; }
  results.forEach(user=>{
    connectCount += user.connectlist.length;
  });
}).then(nothing => {
  console.log(connectCount);
});