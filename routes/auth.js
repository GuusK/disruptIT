module.exports = function (config) {
  var express = require('express');
  var passport = require('passport');
  var crypto = require('crypto');
  var async = require('async');
  var nodemailer = require('nodemailer');
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
    res.render('login', {ticketSaleStarts:config.ticketSaleStarts});
  });

  router.post('/login',  function (req, res) {
    return passport.authenticate('local', {
      successRedirect: req.session.lastPage,
      failureRedirect: '/login',
      failureFlash: 'Incorrect e-mail of wachtwoord'
    })(req,res);
  });


  router.get('/logout', function(req,res) {
    req.logout();
    res.redirect('/');
  });

  router.get('/register', function (req, res) {
    res.render('register', {verenigingen: config.verenigingen, ticketSaleStarts:config.ticketSaleStarts, body:req.session.body || {}});
  });

  function subscribe(conf, cb) {
    mc.lists.subscribe(conf, function () { return cb(null); }, function (err) { return cb(err); });
  }

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

    req.checkBody('code',      'Geen activatiecode gegeven.').notEmpty();
    req.checkBody('firstname', 'Geen voornaam gegeven.').notEmpty();
    req.checkBody('surname',   'Geen achternaam gegeven.').notEmpty();
    req.checkBody('email',     'Geen e-mailadres gegeven.').notEmpty();
    req.checkBody('email',     'Geen valide e-mailadres gegeven.').isEmail();
    req.checkBody('password',  'Wachtwoord moet minstens 5 karakters lang zijn').len(5);
    req.checkBody('password',  'Wachtwoordden verschillen.').equals(req.body.confirm);
    req.checkBody('vereniging','Geen vereniging gegeven.').notEmpty();
    req.checkBody('vereniging','Geen valide vereniging gegeven.').isIn(Object.keys(config.verenigingen));

    req.body.bus = req.body.bus || false;
    req.body.vegetarian = req.body.vegetarian || false;
    req.body.subscribe = req.body.subscribe || false;
    req.sanitize('bus').toBoolean();
    req.sanitize('vegetarian').toBoolean();
    req.sanitize('subscribe').toBoolean();

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
      specialNeeds: req.body.specialNeeds,
      lezing1: req.body.lezing1,
      lezing2: req.body.lezing2,
      lezing3: req.body.lezing3
    });

    async.waterfall([
      function (next) {
        Ticket.findById(req.body.code).populate('ownedBy').exec(next);
      },
      function (ticket, next) {
        if (ticket) {
          if(ticket.ownedBy) {
            next(new Error('Dit ticket is al geactiveerd!'));
          } else {
            user.ticket = ticket;
            User.register(user, req.body.password, function (err, user) {
              next(err, ticket, user);
            });
          }
        } else {
          next(new Error('Geen geldige activatiecode gegeven!'));
        }
      },
      function (ticket,user, next) {
        ticket.ownedBy = user;
        ticket.save(function (err, ticket, numAffected) {
          next(err,user);
        });
      },
      function (user,next) {
        req.login(user, next); 
      },
      function (next) {
        if (req.body.subscribe) {
          subscribe({id:config.mailchimp.id, email:{email:req.body.email}, merge_vars : {FNAME:req.body.firstname, LNAME:req.body.surname}, double_optin: false, send_welcome: false}, next);
        } else {
          next(null);
        }
      }
    ], function (err) {
      if (err) {
        req.flash('error', err.message || err.error || 'Error');
        console.log(err.stack);
        req.session.body = req.body;
        return res.redirect('/register');
      } else {
        req.flash('success', 'Je bent succesvol geregistreerd!');
        return res.redirect('/profile');
      }
    });
  });

 var transport = nodemailer.createTransport('SMTP', {
   service: 'Mailgun',
   auth: config.email.auth
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
            req.flash('error', 'Er lijkt geen gebruiker met dit e-mail adres in ons systeem te zijn.');
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
          subject: 'Wachtwoord resetten',
          text: 'Je hebt deze e-mail ontvangen omdat jij (of iemand anders) een wachtwoordreset hebt aangevraagd. \n\n' +
                        'Klik op de volgende link of plak hem in de adresbalk van je browser om het proces te voltooien: '+req.protocol+'://'+req.get('host')+'/reset/'+token+'\n\n'+
                        'Als jij deze wachtwoordreset niet hebt aangevraagd, negeer dan deze e-mail en je wachtwoord zal onveranderd blijven.\n\n'
        };

        transport.sendMail(mailOptions, function (err) {
          req.flash('info', 'Een e-mail is gestuurd naar '+user.email + ' met verdere instructies om je wachtwoord te resetten');
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
        req.flash('error', 'Wachtwoord reset token is invalid.');
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
          subject: 'Je wachtwoord is veranderd!',
          text: 'Hallo,\n\n Dit is een bevestiging dat het wachtwoord voor '+ user.email + ' is veranderd.\n'
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
      res.redirect('/login');   
    });
  });

  router.post('/mailing', function (req,res) {
    subscribe({id:config.mailchimp.id, email:{email:req.body.email}}, function (err) {
      if (err) {
        req.flash('error', 'Registration failed.');
      } else {
        req.flash('success',  'Success!');
      }
      res.redirect('/mailing');
    });
  });
  return router;
};
