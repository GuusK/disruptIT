var fs       = require('fs');
var mongoose = require('mongoose');
var Ticket   = require('./models/Ticket');
var async    = require('async');
var _        = require('underscore');

var config = JSON.parse(fs.readFileSync('config.json'));
mongoose.connect(config.mongodb.url);

function genTicket(cb) {
 return new Ticket({rev:2}).save(cb);
}
var tasks = [];

for (var i = 0; i < 100; i++) {
  tasks.push(genTicket);
}
async.parallel(tasks,function (err) {
  if (err) {
    console.log(err);
  }
});
