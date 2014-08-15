module.exports = function (config) {
  var express = require('express');
  var passport = require('passport');
  var crypto = require('crypto');
  var async = require('async');
  var nodemailer = require('nodemailer');
  var i18n = require('i18n');
  var mcapi = require('mailchimp-api');

  var mc = new mcapi.Mailchimp(config.mailchimp.key);

  var User = require('../models/User');
  var Ticket = require('../models/Ticket');

  var _ = require('underscore');

  var router = express.Router();

  passport.use(User.createStrategy());
  passport.serializeUser(User.serializeUser());
  passport.deserializeUser(User.deserializeUser());

  router.get('/login', function (req,res) {
    res.render('login');
  });

  router.post('/login',  function (req, res) {
    return passport.authenticate('local', {
      successRedirect: req.session.lastPage,
      failureRedirect: '/login',
      failureFlash: i18n.__('Incorrect e-mail of wachtwoord')
    })(req,res);
  });


  router.get('/logout', function(req,res) {
    req.logout();
    res.redirect('/');
  });

  router.get('/register', function (req, res) {
    res.render('register', {verenigingen: config.verenigingen, body:req.session.body || {}});
  });

  router.post('/register', function (req, res, next) {

    // #AssumeTheWorst

    // if (req.body.email === undefined || !req.body.email.match(/@/i)) {
    //   req.flash('error', i18n.__('Geen geldig e-mailadres gegeven!'));
    //   return res.redirect('/login');
    // }

    // if (req.body.password === undefined ||
    //     req.body.confirm  === undefined ||
    //     (req.body.password !== req.body.confirm)) {
    //   req.flash('error', i18n.__('De wachtwoorden kwamen niet overeen!'));
    //   return res.redirect('/login');
    // }

    // if (req.body.firstname === undefined || )

    req.checkBody('code',      i18n.__('Geen activatiecode gegeven.')).notEmpty();
    req.checkBody('firstname', i18n.__('Geen voornaam gegeven.')).notEmpty();
    req.checkBody('surname',   i18n.__('Geen achternaam gegeven.')).notEmpty();
    req.checkBody('email',     i18n.__('Geen e-mailadres gegeven.')).notEmpty();
    req.checkBody('email',     i18n.__('Geen valide e-mailadres gegeven.')).isEmail();
    req.checkBody('password',  i18n.__('Wachtwoord moet minstens 5 karakters lang zijn')).len(5);
    req.checkBody('password',  i18n.__('Wachtwoordden verschillen.')).equals(req.body.confirm);
     req.checkBody('vereniging',i18n.__('Geen vereniging gegeven.')).notEmpty();
    req.checkBody('vereniging',i18n.__('Geen valide vereniging gegeven.')).isIn(Object.keys(config.verenigingen));

    req.body.bus = req.body.bus || false;
    req.body.vegetarian = req.body.vegetarian || false;
    req.body.subscribe = req.body.subscribe || false;
    req.sanitize('bus').toBoolean();
    req.sanitize('vegetarian').toBoolean();
    req.sanitize('subscribe').toBoolean();


    console.log(req.body);
    var errors = req.validationErrors();


    if (errors) {

      var msg = '';
      errors.forEach(function (err) {
        req.flash('error', err.msg);
      });
      req.session.body = req.body;
      return res.redirect('/register');
    }


    var user = new User({
      firstname: req.body.firstname,
      surname: req.body.surname,
      vereniging: req.body.vereniging,
      email: req.body.email,
      bus: req.body.bus,
      vegetarian: req.body.vegetarian,
      specialNeeds: req.body.specialNeeds
    });

    function subscribe(conf, cb) {
      mc.lists.subscribe(conf, function () { return cb(); }, function (err) { return cb(err); });
    }
    async.waterfall([
      function (next) {
        Ticket.findById(req.body.code, next).populate('ownedBy').exec(next);
      },
      function (ticket, next) {
        if (ticket) {
          if(ticket.ownedBy) {
            next(new Error(i18n.__('Dit ticket is al geactiveerd!')));
          } else {
            user.ticket = ticket;
            User.register(user, req.body.password, function (err, user) {
              next(err, ticket, user);
            });
          }
        } else {
          next(new Error(i18n.__('Geen geldige activatiecode gegeven!')));
        }
      },
      function (ticket,user, next) {
        ticket.ownedBy = user;
        ticket.save(function (err, ticket, numAffected) {
          next(err,user);
        });
      },
      function (user,next) {
        req.login(user,next); 
      },
      function (next) {
        if (req.body.subscribe) {
          subscribe({id:config.mailchimp.id, email:{emaik:req.body.email}}, next);
        } else {
          next();
        }
      }
    ], function (err) {
      if (err) {
        req.flash('error', err.message);
        console.log(err.stack);
        req.session.body = req.body;
        return res.redirect('/register');
      } else {
        req.flash('success', i18n.__('Je bent succesvol geregistreerd!'));
        return res.redirect('/profile');
      }
    });
  });

var transport = nodemailer.createTransport('SMTP', {
    resolveHostname: true,
    host: config.email.host,
    secureConnection: true,
    port: config.email.port,
    auth: {
      user: config.email.auth.user,
      pass: config.email.auth.pass
    },
  });
  
  router.get('/forgot', function(req, res) {
    res.render('forgot', {
      user: req.user
    });
  });

  /// forgot password
  router.post('/forgot', function (req, res, next) {
    async.waterfall([
      function (done) {
        crypto.randomBytes(20, function (err, buf) {
          done(err, buf.toString('hex'));         
        });
      },
      function (token, done) {
        User.findOne({ email: req.body.email}, function (err, user) {
          if (!user) {
            req.flash('error', i18n.__('Er lijkt geen gebruiker met dit e-mail adres in ons systeem te zijn.', req.email));
            return res.redirect('/forgot');
          }
          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000;
          user.save(function (err) {
            done(err, token, user);
          });
        });
      },
      function (token, user, done) {
        var mailOptions = {
          to: user.email,
          from: config.email.auth.user,
          subject: i18n.__('Wachtwoord resetten'),
          text: i18n.__('Je hebt deze e-mail ontvangen omdat jij (of ieman anders) een wachtwoordreset hebt aangevraagd. \n\n' +
                        'Klik op de volgende link of plak hem in de adresbalk van je browser om het proces te voltooien: %s://%s/reset/%s\n\n'+
                        'Als jij deze wachtwoordreset niet hebt aangevraagd, negeer dan deze e-mail en je wachtwoord zal onveranderd blijven.\n\n',
                        req.protocol, req.get('host'), token)
        };

        transport.sendMail(mailOptions, function (err) {
          req.flash('info', i18n.__('Een e-mail is gestuurd naar %s met verdere instructies om je wachtwoord te resetten', user.email));
          done(err, 'done');
        });
      }
    ], function (err) {
      if (err) {
        return next(err);
      }
      res.redirect('/forgot');
    });
  });


  router.get('/reset/:token', function (req, res) {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: {$gt : Date.now() } }, function (err, user) {
      if (!user) {
        req.flash('error', i18n.__('Wachtwoord reset token is invalid.'));
        return res.redirect('/forgot');
      }
    });
    res.render('reset', { user: req.user });
  });

  router.post('/reset/:token', function (req, res, next) {
    async.waterfall([
      function (done) {
        User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
          if (!user) {
            req.flash('error', 'Wachtwoord reset token is invalid.');
            return res.redirect('back');
          }
          user.setPassword(req.body.password, function(err, user) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function (err) {
              if (err) { return done(err); }
              req.login(user, function (err) {
                console.log(err);
                done(err, user);
              });
            });
          });
        });
      },
      function (user, done) {
        var mailOptions = {
          to: user.email,
          from: config.email.auth.user,
          subject: i18n.__('Je wachtwoord is veranderd!'),
          text: i18n.__('Hallo,\n\n Dit is een bevestiging dat he wacthwoord voor %s is veranerd.\n', user.email),        
        };
        transport.sendMail(mailOptions, function (err) {
          req.flash('success', 'Je wachtwoord is veranderd.');
          done(err);
        });
      }
    ], function (err) {
      if (err) {
        return next(err);
      }
      res.redirect('/forgot');   
    });
  });

  return router;
};