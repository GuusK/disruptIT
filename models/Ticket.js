var mongoose = require('mongoose');
var shortId = require('shortid');

//User different characters to prevent confusion I and l
// shortId.characters("123456789ABCDEFGHIJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz");

chars = "123456789ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz";

function generateID(){
  str = [];
  for(var i = 0; i < 10; ++i){
      str[i] = chars[Math.floor(Math.random() * chars.length)];
  }
  return str.join("");
}

var Ticket = new mongoose.Schema({
  _id: {type: String, unique: true, 'default': generateID},
  type :   { type: String, required: true, enum: ['student', 'partner'], 'default': 'student'},
  rev :    { type: Number, required: false },
  ownedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }
});


var model = mongoose.model('Ticket', Ticket);


module.exports = model;
