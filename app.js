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
var passport = require('passport');

/// load configuration
var config = JSON.parse(fs.readFileSync('config.json'));

/// configure database
mongoose.connect(config.mongodb.url);

/// configure translations
i18n.configure({
  locales: ['nl', 'en'],
  defaultLocale: 'en',
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
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/', auth);

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
