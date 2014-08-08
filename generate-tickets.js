var fs       = require('fs');
var mongoose = require('mongoose');
var Ticket   = require('./models/Ticket');
var crypto   = require('crypto');
var async    = require('async');
var _        = require('underscore');

var config = JSON.parse(fs.readFileSync('config.json'));
mongoose.connect(config.mongodb.url);

function genTicket(cb) {
 return new Ticket().save(cb);
}
var tasks = [];

for (var i = 0; i < 10; i++) {
  tasks.push(genTicket);
}
async.parallel(tasks,function (err) {
  if (err) {
    console.log(err);
  }
});