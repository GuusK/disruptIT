var express = require('express');
var Barc = require('barcode-generator');
var Ticket = require('../models/Ticket');
var User   = require('../models/User');
var _      = require('underscore');
var async  = require('async');

module.exports = function (config) {
var router = express.Router();


function auth(req, res, next) {
  if (!req.user) {
    req.session.lastPage = req.path;
    req.flash('info', 'Je moet inloggen om de pagina ' + req.path + ' te bezoeken');
    return res.redirect('/login');
  }
  next();
}

function adminAuth(req, res, next) {
  if (!req.user || !req.user.admin) {
    req.session.lastPage = req.path;
    req.flash('info', 'Je moet als admin inloggen om de pagina ' + req.path + ' te bezoeken.');
    return res.redirect('/login');
  }
  next();
}

/* GET home page. */
router.get('/', function (req, res) {
  res.render('index', { title: 'AutonomIT', ticketSaleStarts:config.ticketSaleStarts });
});


/*router.get('/about', function (req,res) {
  res.render('about', {title: 'About'});
});*/


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

router.get('/opensource',function (req,res) {
  res.render('opensource', {title:'Help het internet helpen'});
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
      user.lezing1 = req.body.lezing1;
      user.lezing2 = req.body.lezing2;
      user.lezing3 = req.body.lezing3;
      console.log(user.specialNeeds);
      user.save();
      req.flash('success', 'Profiel aangepast');
      res.redirect('/profile');
    }
    else
    {
      console.log(err);
      req.flash('error', 'Er ging iets mis!');
      res.redirect('/profile');
    }
  });

});

/*router.get('/location', function (req, res) {
  res.render('location', {title: 'Locatie'});
});*/

router.get('/busses', function (req, res) {
  res.render('busses', {title: 'Bussen'});
});

router.get('/speakers', function (req, res) {
  res.render('speakers', {title: 'Programma'});
});

router.get('/speakers/:speaker', function (req, res) {
  res.render('speakers/'+ req.params.speaker, {path: '/speakers'});
});


router.get('/partners/:partner', function (req, res) {
  res.render('partners/'+ req.params.partner, {title: 'Partners - ' + req.params.partner, path: '/partners'});
});

router.get('/organisation', function (req, res) {
  res.render('organisation', {title: 'Organisatie'});
});

router.get('/contact', function (req, res) {
  res.render('contact', {title: 'Contact'});
});

router.get('/mailing', function (req,res) {
  res.render('mailing');
});

router.get('/programme', function (req,res) {
  res.render('programme', {title:'Programma'});
});


router.get('/users', adminAuth, function (req,res,next) {
  var query = {};


  if (req.query.firstname) {
    query.firstname = { $regex: new RegExp(req.query.firstname, 'i') };
  }
  if (req.query.surname) {
    query.surname = { $regex: new RegExp(req.query.surname, 'i') };
  }
  if (req.query.vereniging) {
    query.vereniging = { $regex: new RegExp(req.query.vereniging, 'i') };
  }
  if (req.query.ticket) {
    query.ticket = { $regex: new RegExp(req.query.ticket, 'i') };
  }
  if (req.query.aanwezig) {
    query.aanwezig = { $regex: new RegExp(req.query.aanwezig, 'i') };
  }

  User.find(query).sort({'vereniging':1,'firstname':1}).exec( function (err, results) {
    if (err) { return next(err); }
    //res.json(results);
    res.render('users',{users:results, verenigingen:config.verenigingen});
  });
});


router.get('/users/:id', adminAuth, function (req,res,next) {
  User.findOne({_id:req.params.id}, function (err, result) {
    if (err) { return next(err); }
    res.render('users/edit', {user:result});
  });
});

router.post('/users/:id', adminAuth, function (req,res,next) {
  User.findOne({_id:req.params.id}, function (err, result) {
    if (err) { return next(err); }
    result.aanwezig = req.body.aanwezig;
    result.save(function(err) {
      if (err) {return next(err); }
      req.flash('success', 'Gebruiker aangepast!');
      return res.redirect('/users/'+req.params.id);
    });
  });
});

router.post('/aanmelden', adminAuth, function (req,res,next) {
  var ticket = req.body.ticket;
  User.findOne({ticket:ticket}, function (err, result) {
    if (err) {
      req.flash('error', 'Iets is er misgegaan. Zoek Dennis');
      return res.redirect('/users');
    }

    if (!result) {
      req.flash('error',  'Dit ticket is niet geactiveerd. Probeer handmatig zoeken?');
      return res.redirect('/users');
    }
    if (result.aanwezig) {
      req.flash('error', 'Ticket al aangemeld!');
      return res.redirect('/users');
    }
    result.aanwezig = true;
    result.save(function (err) {
      if (err) { req.flash('error', 'Iets is er misgegaan. Zoek Dennis'); return res.redirect('/users'); }
      req.flash('success', 'Ticket aangemeld');
      res.redirect('/users');
    });
  });
});
var barc = new Barc({
  hri: false
});

/**
 * Output alle tickets die nog niet geownt zijn door gebruikers
 */
router.get('/tickets', adminAuth, function (req, res, next) {
  Ticket.find({rev:2, ownedBy:undefined}, function (err, tickets) {
    if (err) { return next(err); }
    res.render('tickets', {tickets: tickets});
  });
});

/**
 * Aanwezigheidslijst per vereniging
 */
router.get('/aanwezigen', adminAuth, function (req,res,next) {
  var namen = _.keys(config.verenigingen);

  var findTickets = function (naam,cb) {
    User.find({vereniging:naam},{firstname:1,surname:1,email:1,bus:1},function(err, results) {
      if (err) { return cb(err); }

      cb(null, {name:naam, rows:results});
    });
  };
  async.map(namen, findTickets, function (err, result) {
    if (err) { return next(err); }
    res.render('vn', { tables : result });
  });
});


router.get('/translate', adminAuth, function (req, res, next) {
  res.render('webtranslate');
});

router.get('/tickets/:id', function (req, res, next) {
  Ticket.findById(req.params.id).populate('ownedBy').exec(function (err, ticket) {
    if (err) { err.code = 403; return next(err); }
    if (!ticket || !ticket.ownedBy || ticket.ownedBy.email !== req.session.passport.user) {
      var error = new Error("Forbidden");
      error.code = 403;
      return next(error);
    }
    res.render('tickets/ticket', {ticket: ticket});
  });
});

router.get('/tickets/:id/barcode', function (req, res) {
  res.set('Content-Type', 'image/png');
  res.send(barc.code128(req.params.id, 500, 160));
});

 return router;
};
