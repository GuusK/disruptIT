var mongoose = require('mongoose');
var shortId = require('shortid');

var Ticket = new mongoose.Schema({
  _id: {
    type: String,
    unique: true,
    'default': shortId.generate
  },
  ownedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }
});


var model = mongoose.model('Ticket', Ticket);


module.exports = model;