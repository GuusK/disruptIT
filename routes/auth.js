module.exports = function (config) {
  var express = require('express');
  var passport = require('passport');
  var crypto = require('crypto');
  var async = require('async');
  var nodemailer = require('nodemailer');
  var i18n = require('i18n');
  var LocalStrategy = require('passport-local').Strategy;
  var User = require('../model/User');


  var router = express.Router();

  passport.use(User.createStrategy());
  passport.serializeUser(User.serializeUser());
  passport.deserializeUser(User.deserializeUser());

  router.get('/login', function (req,res) {
    res.render('login');
  });

  router.post('/login', 
    passport.authenticate('local', {
      successRedirect: '/',
      failureRedirect: '/login',
      failureFlash: 'Invalid username or password.'
    })
  );


  router.get('/logout', function(req,res) {
    req.logout();
    res.redirect('/');
  })

  router.get('/signup', function (req, res) {
    res.render('signup');
  });

  router.post('/signup', function (req, res) {
    User.register(new User({ email: req.body.email }), req.body.password, function (err, user) {
      if (err) {
        req.flash('error', err.message);
        return res.redirect('/signup');
      }
      req.login(user, function (err) {
        // TODO not sure if I should ignore this error or not.
        return res.redirect(req.session.lastPage || '/');
      });
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
        })
      },
      function (token, done) {
        User.findOne({ email: req.body.email}, function (err, user) {
          if (!user) {
            req.flash('error', i18n.__('There seems to be no user with the email address %s in our system.', req.email));
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
          subject: i18n.__('Password reset'),
          text: i18n.__('You have received this mail because you (or someone else) has requested a password reset. \n\n' +
                        'Click on the following link or paste it in the address bar of your browser to complete the process: %s://%s/reset/%s \n\n' +
                        'If it wasn\'t you who requested this password reset, please ignore this email and your password won\'t be changed.\n\n', req.protocol, req.get('host'), token)
        };

        transport.sendMail(mailOptions, function (err) {
          req.flash('info', i18n.__('An email has been sent to %s with instructions on how to reset your password.', user.email));
          done(err, 'done');
        })
      }
    ], function (err) {
      if (err) return next(err);
      res.redirect('/forgot');
    });
  });


  router.get('/reset/:token', function (req, res) {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: {$gt : Date.now() } }, function (err, user) {
      if (!user) {
        req.flash('error', i18n.__('Password reset token is invalid or has expired.'));
        return res.redirect('/forgot');
      }
    });
    res.render('reset', { user: req.user });
  });

  router.post('/reset/:token', function (req, res) {
    async.waterfall([
      function (done) {
        User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
          if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('back');
          }
          user.password = req.body.password;
          user.resetPasswordToken = undefined;
          user.resetPasswordExpires = undefined;

          user.save(function (err) {
            req.login(user, function (err) {
              done(err, user);
            });
          })
        });
      },
      function (user, done) {
        var mailOptions = {
          to: user.email,
          from: config.email.auth.user,
          subject: i18n.__('You password has been changed'),
          text: i18n.__('Hello,\n\n This is a confirmation that the password for your account %s has been changed.\n', user.email),        
        };
        transport.sendMail(mailOptions, function (err) {
          req.flash('success', 'Your passwod has been changed.');
          done(err);
        });
      }
    ], function (err) {
      if (err) return next(err);
      res.redirect('/forgot');   
    });
  });

  return router;
};