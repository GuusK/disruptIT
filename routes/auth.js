var express = require('express');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('../model/User');


var router = express.Router();


passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


router.get('/login', function (req,res) {
  res.render('login');
});

router.post('/login', function (req, res, next) {
  passport.authenticate('local', {
    succesRedirect: req.session.lastPage || '/',
    failureRedirect: '/login',
    failureFlash: 'Invalid username or password.'
  })(req,res,next);
});

router.get('/signup', function (req, res) {
  res.render('signup');
});

router.post('/signup', function (req, res) {
  User.register(new User({ email: req.body.email }), req.body.password, function (err, user) {
    if (err) {
      req.flash('error', err);
      return res.redirect('/register');
    }
    req.login(user, function (err) {
      // TODO not sure if I should ignore this error or not.
      return res.redirect(req.session.lastPage || '/');
    });
  });
});


/// forgot password
router.get('/forgot', function (req, res) {
  res.render('forgot', { user: req.user });
});


router.get('/reset/:token', function (req, res) {
  // TODO reset password logic
});


module.exports = router;