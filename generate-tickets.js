var fs       = require('fs');
var mongoose = require('mongoose');
var Ticket   = require('./models/Ticket');
var async    = require('async');
var _        = require('underscore');

var config = JSON.parse(fs.readFileSync('config.json'));
mongoose.connect(config.mongodb.url);

function genTicket(cb) {
  var ticket = new Ticket({rev:1});
  console.log('New ticket: '+ticket._id);

  return ticket.save(cb);
}
var tasks = [];

var n = + process.argv[2];

for (var i = 0; i < n; i++) {
  tasks.push(genTicket);
}
async.parallel(tasks, function(err) {
  if (err) {
    console.log(err);
  }
  console.log(n + ' tickets generated!');
  process.exit();
});
