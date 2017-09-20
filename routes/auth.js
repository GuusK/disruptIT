module.exports = function (config) {
  var debug = require('debug')
  var express = require('express');
  var passport = require('passport');
  var crypto = require('crypto');
  var async = require('async');
  var nodemailer = require('nodemailer');
  var mg = require('nodemailer-mailgun-transport');
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

  router.post('/login', function (req, res) {
      return passport.authenticate('local', {
        successRedirect: req.session.lastPage || '/profile',
        failureRedirect: '/login',
        failureFlash: 'Incorrect e-mail or password' })(req,res);
    }
  );


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

    req.checkBody('code',      'Activation code is not provided.').notEmpty();
    req.checkBody('firstname', 'First name is not provided.').notEmpty();
    req.checkBody('surname',   'Surname is not provided.').notEmpty();
    req.checkBody('email',     'Emailaddress is not provided.').notEmpty();
    req.checkBody('email',     'Emailaddress is not valid.').isEmail();
    req.checkBody('password',  'Password needs to be atleast 6 characters long.').len(6);
    req.checkBody('password',  'Passwords are not equal.').equals(req.body.confirm);
    req.checkBody('vereniging','No association provided.').notEmpty();
    req.checkBody('vereniging','No valid association provided.').isIn(Object.keys(config.verenigingen));

    req.body.bus = req.body.bus || false;
    req.body.vegetarian = req.body.vegetarian || false;
    req.body.subscribe = req.body.subscribe || false;
    req.sanitize('bus').toBoolean();
    req.sanitize('vegetarian').toBoolean();
    req.sanitize('subscribe').toBoolean();

    req.body.lezing1 = req.body.lezing2 = "";
    debug(req.body.lezing2);
    
    var errors = req.validationErrors();

    if (errors) {
      var msg = '';
      errors.forEach(function (err) {
        req.flash('error', err.msg);
      });
      req.session.body = req.body;
      return res.redirect('/register');
    }

    if(req.body.lezing1 !== "" && req.body.lezing1 !== null &&req.body.lezing1 !== 'laurenz-eveleens' && req.body.lezing1 !== 'jan-smits'){
      req.flash('error', 'Something went wrong!');
      return res.redirect('/register');
    }
    if(req.body.lezing2 !== "" && req.body.lezing2 !== null &&req.body.lezing2 !== 'mark-bakker' && req.body.lezing2 !== 'emile-nijssen'){
      req.flash('error', 'Something went wrong!');
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
      lezing2: req.body.lezing2
    });

    async.waterfall([
      function (next) {
        Ticket.findById(req.body.code).populate('ownedBy').exec(next);
      },
      function (ticket, next) {
        if (ticket) {
          if(ticket.ownedBy) {
            next(new Error('Ticket has already been activated!'));
          } else {
            console.log(ticket);
            user.ticket = ticket;
            user.type = ticket.type;
            User.register(user, req.body.password, function (err, user) {
              next(err, ticket, user);
            });
          }
        } else {
          next(new Error('No valid activation code provided!'));
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
        req.flash('success', "You've succesfully registered");
        return res.redirect('/profile');
      }
    });
  });

  var transport = nodemailer.createTransport(
  mg({auth : config.mailgun}));

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
            req.flash('error', 'There does not appear to be a ticket used with this emailaddress.');
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
          subject: 'Reset password',
          text: "You have received this email because you (or someone else) asked to reset your password for Disrupt-IT \n\n" +
                "Click on the following link, or copy it into your browser, to complete the reset: https://www.disrupt-it.nl/reset/"+token+"\n\n"+
                "If you did not request to reset your password, you can ignore this email and your password will remain the same"
        };

        transport.sendMail(mailOptions, function (err) {
          req.flash('info', 'An email has been sent to ' + user.email + ' with instructions on how to change your password');
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
          req.flash('error', 'Password reset token is invalid.');
          return res.redirect('/forgot');
        } else {
          res.render('reset', { user: req.user });
        }
    });

  });

  router.post('/reset/:token', function (req, res, next) {
    async.waterfall([
      function (done) {
        User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
          if (!user) {
            req.flash('error', 'Password reset token is invalid.');
            return res.redirect('back');
          }

          req.checkBody('password',  'Passwords needs to be atleast 6 characters long').len(6);
          req.checkBody('password',  'Passwords are not equal.').equals(req.body.confirm);
          var errors = req.getValidationResult();

          if (errors) {
            var msg = '';
            errors.forEach(function (err) {
              req.flash('error', err.msg);
            });
            req.session.body = req.body;
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
      }/*,
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
      }*/
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
