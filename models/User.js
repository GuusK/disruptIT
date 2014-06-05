var mongoose = require('mongoose');
var plm = require('passport-local-mongoose');
var i18n = require('i18n');
var User = new mongoose.Schema({
  resetPasswordToken: String,
  resetPasswordExpires: Date
});

User.plugin(plm, {
  usernameField: 'email',
  usernameLowerCase: true,
  incorrectPasswordError: i18n.__('Incorrecte e-mail'),
  incorrectUsernameError: i18n.__('Incorrect wachtwoord'),
});

module.exports = mongoose.model('User', User);