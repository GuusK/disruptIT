var fs       = require('fs');
var mongoose = require('mongoose');
mongoose.Promise = require('q').Promise;
var Ticket   = require('./models/Ticket');
var async    = require('async');
var _        = require('underscore');

var config = JSON.parse(fs.readFileSync('config.json'));
mongoose.connect(config.mongodb.url);

function genTicket(cb, params) {
  var params;
  if (process.argv[3]){
    params = {type: process.argv[3], rev:1};
  } else {
    params = {rev:1};
  }
  var ticket = new Ticket(params);
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
