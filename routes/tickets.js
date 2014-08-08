var express = require('express');
var router = express.Router();
var Barc = require('barcode-generator');
var barc = new Barc();

var Ticket = require('../models/Ticket');


router.get('/:id', function (req, res, next) {
  Ticket.findById(req.params.id, function (err, ticket) {
    if (err || !ticket) { return next(err); }
    res.render('tickets/ticket', ticket);
  });
});

router.get('/:id/barcode', function (req, res) {
  res.set('Content-Type', 'image/png');
  res.send(barc.code128(req.params.id, 360, 160));
});


module.exports = router;