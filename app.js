// extreme comment
var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var flash = require('express-flash');
var mongoose = require('mongoose');
var i18n = require('i18n');
var fs = require('fs');
var sass = require('node-sass');
var passport = require('passport');
var locale = require('./locale');

/// load configuration
var config = JSON.parse(fs.readFileSync('config.json'));

/// configure database
mongoose.connect(config.mongodb.url);

/// configure translations
i18n.configure({
  locales: ['en', 'nl'],
  defaultLocale: 'nl',
  directory: path.join(__dirname, 'locales'),
  cookie: 'locale',
  indent: '  '
});


var routes = require('./routes/index');
var auth = require('./routes/auth')(config);

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(session({ secret: config.session.secret }));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(i18n.init);
app.use(locale);

app.use(sass.middleware({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  debug: true,
  outputStyle: 'compressed',
  prefix:  '/'
}));

app.use(express.static(path.join(__dirname, 'public')));


// set up locals that we use in every template
app.use(function(req,res,next){
  res.locals.path = req.path;
  res.locals.user = req.user;
  next()
  ;
})

app.use('/', routes);
app.use('/', auth);


var Barc = require('barc');
var barc = new Barc();
app.get('/barcode/:num', function(req,res) {
  res.set('Content-Type','image/png');
  res.send(barc.code128('yo',300,200));
});



/// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
