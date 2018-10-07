var fs       = require('fs');
var async = require('async');
var mongoose = require('mongoose');

var SpeedDateTimeSlot = require('./models/SpeedDateTimeSlot');

var config = JSON.parse(fs.readFileSync('config.json'));
mongoose.Promise = require('q').Promise;
mongoose.connect(config.mongodb.url);


function addTimeSlot(timeslot, cb) {
  console.log('Creating ' + timeslot.start + '-' + timeslot.end);

  var ts = new SpeedDateTimeSlot({
    startTime: '2018-01-01T' + timeslot.start,
    endTime: '2018-01-01T' + timeslot.end,
    capacity: timeslot.capacity
  });

  return ts.save(cb);
}

var timeslots = JSON.parse(fs.readFileSync('speeddate-timeslots.json'));
var tasks = [];

for (var i = 0; i < timeslots.length; i++) {
  tasks.push(async.apply(addTimeSlot, timeslots[i]));
}


async.parallel(tasks, function (err) {
  if (err) {
    console.log("An error occurred:");
    console.log(err);
  } else {
    console.log("Done!");
  }

  process.exit();
});
