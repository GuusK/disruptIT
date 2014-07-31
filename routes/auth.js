module.exports = function (config) {
  var express = require('express');
  var passport = require('passport');
  var crypto = require('crypto');
  var async = require('async');
  var nodemailer = require('nodemailer');
  var i18n = require('i18n');

  var User = require('../models/User');


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
      failureFlash: i18n.__('Incorrect e-mail of wachtwoord')
    })
  );


  router.get('/logout', function(req,res) {
    req.logout();
    res.redirect('/');
  });

  router.get('/signup', function (req, res) {
    res.render('signup');
  });

  router.post('/signup', function (req, res, next) {

    // you should also check this clientside.
    if (!req.body.email.match(/@/i)) {
      req.flash('error', i18n.__('Geen geldig e-mailadres gegeven!'));
      return res.redirect('/login');
    }

    if (req.body.password !== req.body.confirm) {
      req.flash('error', i18n.__('De wachtwoorden kwamen niet overeen!'));
      return res.redirect('/login');
    }


    User.register(new User({ email: req.body.email }), req.body.password, function (err, user) {
      if (err) {
        req.flash('error', err.message);
        return res.redirect('/login');
      }
      req.login(user, function (err) {
        if (err) { return next(err); }
        req.flash('success', i18n.__('Je bent succesvol geregistreerd!'));
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
              console.log(user.password);
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