module.exports = function (config) {
  var debug = require('debug')
  var express = require('express');
  var passport = require('passport');
  var crypto = require('crypto');
  var async = require('async');
  var nodemailer = require('nodemailer');
  var mg = require('nodemailer-mailgun-transport');

  var Mailchimp = require('mailchimp-api-v3')
  // var mc = new Mailchimp(config.mailchimp.key, true);
  // don't ever use MD5 seriously. The only reason it's used is because
  // mailchimp wants an md5 hash of the emailaddress when you PUT it in the list
  var md5 = require('md5');

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

  function subscribe(email, cb) {
    // mc.put('/lists/' + config.mailchimp.id + '/members/' + md5(email.toLowerCase()), {
    //   email_address : email,
    //   status : 'subscribed'
    // }).then(function (res) {
    //   cb();
    // }).catch(function (err) {
    //   console.log("SOME ERROR HAS OCCURED. NOTICE ME SENPAI!");
    //   console.log(err);
    //   cb(err);
    // });
  }

  router.post('/register', function (req, res, next) {
    req.checkBody('code',      'Activation code is not provided.').notEmpty();
    req.checkBody('firstname', 'First name is not provided.').notEmpty();
    req.checkBody('surname',   'Surname is not provided.').notEmpty();
    req.checkBody('email',     'Emailaddress is not provided.').notEmpty();
    req.checkBody('email',     'Emailaddress is not valid.').isEmail();
    req.checkBody('password',  'Password needs to be atleast 6 characters long.').len(6);
    req.checkBody('password',  'Passwords are not equal.').equals(req.body.confirm);
    req.checkBody('vereniging','No association provided.').notEmpty();
    req.checkBody('vereniging','No valid association provided.').isIn(Object.keys(config.verenigingen));

    req.body.bus = req.body.bus || (req.body.vereniging !== 'partner');
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
          subscribe(req.body.email, next);
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
    mg({auth : config.mailgun})
  )

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
            req.flash('error', 'There does not appear to be a ticket used with this email address.');
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
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }).exec()
    .then(function(user) {
      if (!user) {
        req.flash('error', 'Password reset token is invalid.');
        throw 'error';
      }

      req.checkBody('password',  'Passwords needs to be atleast 6 characters long').len(6);
      req.checkBody('password',  'Passwords are not equal.').equals(req.body.confirm);
      return req.getValidationResult().then(function (errors){
        if ( !errors.isEmpty()) {
          errors.array().forEach(function (err) {
            req.flash('error', err.msg);
          });
          throw errors;
        }
        user.setPassword(req.body.password, function(err, user) {
          // user.resetPasswordToken = undefined;
          // user.resetPasswordExpires = undefined;

          user.save(function (err) {
            if (err) {
              console.log('reset, within save: ' + err);
              throw err;
            }
            req.flash('success', 'Password changed. Please log in with your new password');
            return res.redirect('/login');
          });
        });
      }).catch(function (error){
        console.log("error of validationresults: " + error);
        return res.redirect('back');
      });
    }).catch(function (error){
      console.log("error of get user: " + error);
      return res.redirect('back');
    });
  });

  router.post('/mailing', function (req,res) {
    subscribe(req.body.email, function (err) {
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
