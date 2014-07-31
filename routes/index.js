var express = require('express');
var i18n = require('i18n');
var router = express.Router();

function auth(req, res, next) {
  if (!req.user) {
    req.session.lastPage = req.path;
    req.flash('info', i18n.__('Je moet inloggen om de pagina %s te bezoeken.', req.path));
    return res.redirect('/login');
  }
  next();
}
/* GET home page. */
router.get('/', function (req, res) {
  res.render('index', { title: 'AnonymIT' });
});


router.get('/about', function (req,res) {
  res.render('about', {title: 'About'});
});


router.get('/partners', function (req,res) {
  res.render('partners',{title:'Partners'});
});

router.get('/partners/:partner', function (req, res) {
  res.render('partners/'+req.params.partner, {title: 'Partners - ' + req.params.partner});
});
module.exports = router;
