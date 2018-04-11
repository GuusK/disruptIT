var mongoose = require('mongoose');
var Schema = mongoose.Schema
var plm = require('passport-local-mongoose');

var User = new mongoose.Schema({
  resetPasswordToken:   String,
  resetPasswordExpires: Date,
  firstname:            { type: String,  required: true     },
  surname:              { type: String,  required: true     },
  shareEmail:           Boolean,
  linkedin:             { type: String, default: ''         },
  phonenumber:          { type: String, default: ''         },
  vereniging:           { type: String,  required: true     },
  bus:                  { type: Boolean, default: true      },
  vegetarian:           { type: Boolean, required: true     },
  specialNeeds:         { type: String                      },
  ticket:               { type: String,  ref: 'Ticket'      },
  aanwezig:             { type: Boolean, default: false     },
  admin:                { type: Boolean, default: false     },
  type:                 { type: String,  default: 'student' },
  company:              { type: String                      },
  sprekers:             { type: [String],required: false    },
  session1:              { type: String,  required: false    },
  session2:              { type: String,  required: false    },
  session3:              { type: String,  required: false    },
  connectlist:          [String],
  matchingterms:        [String]
});

User.plugin(plm, {
  usernameField: 'email',
  usernameLowerCase: true,
  incorrectPasswordError: 'Verkeerd wachtwoord gegeven',
  incorrectUsernameError: 'Dit e-mailadres is niet bij ons bekend: ',
  missingUsernameError: 'Geen e-mail gegeven',
  missingPasswordError: 'Geen wachtwoord gegeven',
  userExistsError: 'Een gebruiker met het volgende e-mail adres bestaat al:'
});

module.exports = mongoose.model('User', User);
