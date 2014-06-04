var express = require('express');
var router = express.Router();

router.get('/login', function (req,res) {
  res.render('login');
});

router.post('/login', function (req, res) {
  // TODO login logic.
});

router.get('/signup', function (req, res) {
  res.render('signup');
});

router.post('/signup', function (req, res) {
  // TODO signup logic.
  );


/// forgot password
router.get('/forgot', function (req, res) {
  res.render('forgot', { user: req.user });
});


router.get('/reset/:token', function (req, res) {
  // TODO reset password logic
});


module.exports = router;