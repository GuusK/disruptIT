var mongoose = require('mongoose');
var shortId = require('shortid');

//User different characters to prevent confusion I and l
shortId.characters("123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyzO0+~-_");

var Ticket = new mongoose.Schema({
  _id: {
    type: String,
    unique: true,
    'default': shortId.generate
  },
  rev : { type: Number, required: false},
  ownedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
});


var model = mongoose.model('Ticket', Ticket);


module.exports = model;
