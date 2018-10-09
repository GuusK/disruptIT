var mongoose = require('mongoose');
var moment = require('moment');

var SpeedDateTimeSlot = new mongoose.Schema({
  startTime:    { type: Date, required: true },
  endTime:      { type: Date, required: true },
  capacity:     { type: Number, min: 1, required: true },
});

SpeedDateTimeSlot.virtual('name').get(function () {
  return moment(this.startTime).format('HH:mm') + ' - ' + moment(this.endTime).format('HH:mm');
});


module.exports = mongoose.model('SpeedDateTimeSlot', SpeedDateTimeSlot);
