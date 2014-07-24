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
  incorrectPasswordError: i18n.__('Verkeerd wachtwoord gegeven'),
  incorrectUsernameError: i18n.__('Dit e-mailadres is niet bij ons bekend: '),
  missingUsernameError: i18n.__('Geen e-mail gegeven'),
  missingPasswordError: i18n.__('Geen wachtwoord gegeven'),
  userExistsError: i18n.__('Een gebruiker met het volgende e-mail adres bestaat al:')
});

module.exports = mongoose.model('User', User);