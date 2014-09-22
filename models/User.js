var mongoose = require('mongoose');
var plm = require('passport-local-mongoose');
var i18n = require('i18n');

var User = new mongoose.Schema({
  resetPasswordToken:   String,
  resetPasswordExpires: Date,
  firstname:            { type: String,  required: true   },
  surname:              { type: String,  required: true   },
  vereniging:           { type: String,  required: true   },
  bus:                  { type: Boolean, required: true   },
  vegetarian:           { type: Boolean, required: true   },
  specialNeeds:         { type: String                    },
  ticket:               { type: String,  ref: 'Ticket'    },
  aanwezig:             { type: Boolean, 'default': false },
  admin:                { type: Boolean, 'default': false },
  sprekers:             { type: [String], required: false }
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