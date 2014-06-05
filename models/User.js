var mongoose = require('mongoose');
var plm = require('passport-local-mongoose');

var User = new mongoose.Schema({
  resetPasswordToken: String,
  resetPasswordExpires: Date
});

User.plugin(plm, {
  usernameField: 'email',
  usernameLowerCase: true
});

module.exports = mongoose.model('User', User);