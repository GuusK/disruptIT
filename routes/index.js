var express = require('express');
var i18n = require('i18n');
var Barc = require('barcode-generator');
var Ticket = require('../models/Ticket');
var User   = require('../models/User');

module.exports = function (config) {
var router = express.Router();


function auth(req, res, next) {
  if (!req.user) {
    req.session.lastPage = req.path;
    req.flash('info', i18n.__('Je moet inloggen om de pagina %s te bezoeken.', req.path));
    return res.redirect('/login');
  }
  next();
}

function adminAuth(req, res, next) {
  if (!req.user || !req.user.admin) {
    req.session.lastPage = req.path;
    req.flash('info', i18n.__('Je moet als admin inloggen om de pagina %s te bezoeken.', req.path));
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
  res.render('partners/'+ req.params.partner, {title: 'Partners - ' + req.params.partner, path: '/partners'});
});

router.get('/profile', auth, function (req, res) {
  User.findOne({email:req.session.passport.user}, function (err,user) {
    if (!err && user)
    {
      res.render('profile', {isbus_quickhack: config.verenigingen[user.vereniging].bus});
    }
    else
    {
      req.flash('error', 'lolwtf');
      res.redirect('/profile');
    }
  });
});

router.post('/profile', auth, function (req, res) {
  req.sanitize('vegetarian').toBoolean();
  req.sanitize('bus').toBoolean();
  console.log(req.session);
  User.findOne({email:req.session.passport.user}, function (err, user) {
    if (!err)
    {
      user.vegetarian = req.body.vegetarian ? true : false;
      user.bus        = req.body.bus ? true : false;
      user.specialNeeds = req.body.specialNeeds;
      console.log(user.specialNeeds);
      user.save();
      req.flash('success', 'Profiel aangepast');
      res.redirect('/profile');
    }
    else
    {
      console.log(err);
      req.flash('error', 'er ging iets mis');
      res.redirect('/profile');
    }
  });

});

router.get('/location', function (req, res) {
  res.render('location', {title:i18n.__('Locatie')});
});

router.get('/speakers', function (req, res) {
  res.render('speakers', {title:i18n.__('Programma')});
});

router.get('/speakers/:speaker', function (req, res) {
  res.render('speakers/'+ req.params.speaker, {path: '/speakers'});
});


router.get('/partners/:partner', function (req, res) {
  res.render('partners/'+ req.params.partner, {title: 'Partners - ' + req.params.partner, path: '/partners'});
});

router.get('/organisation', function (req, res) {
  res.render('organisation', {title:i18n.__('Organisatie')});
});

router.get('/contact', function (req, res) {
  res.render('contact', {title:i18n.__('Contact')});
});

router.get('/mailing', function (req,res) {
  res.render('mailing');
});

router.get('/programme', function (req,res) {
  res.render('programme', {title:'Programma'});
});


var barc = new Barc();


router.get('/tickets', adminAuth, function (req, res, next) {
  Ticket.find({}, function (err, tickets) {
    if (err) { return next(err); }
    res.render('tickets', {tickets: tickets});
  });
});

router.get('/users', adminAuth, function (req, res, next) {
  User.find({}, function (err, users) {

  });
});

router.get('/tickets/:id', function (req, res, next) {
  Ticket.findById(req.params.id).populate('ownedBy').exec(function (err, ticket) {
    if (err) { err.code = 403; return next(err); }
    if (!ticket || !ticket.ownedBy || ticket.ownedBy.email !== req.session.passport.user) {
      var error = new Error("Forbidden");
      error.code =403;
      return next(error);
    }
    res.render('tickets/ticket', ticket);
  });
});

router.get('/tickets/:id/barcode', function (req, res) {
  res.set('Content-Type', 'image/png');
  res.send(barc.code128(req.params.id, 250, 80));
});

 return router;
};
