// extreme comment
var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var flash = require('express-flash');
var mongoose = require('mongoose');
var fs = require('fs');
var passport = require('passport');
var expressValidator = require('express-validator');

var MongoStore = require('connect-mongo')(session);

/// load configuration
var config = JSON.parse(fs.readFileSync('config.json'));

/// configure database
mongoose.connect(config.mongodb.url);

var routes = require('./routes/index')(config);
var auth = require('./routes/auth')(config);


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');


app.use(favicon());
app.use(morgan('default'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(expressValidator());
app.use(cookieParser());
app.use(session({
  secret: config.session.secret,
  store: new MongoStore({url: config.mongodb.url })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

/*app.use(sass.middleware({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  debug: true,
  outputStyle: 'compressed',
  prefix:  '/'
}));*/

app.use(express.static(path.join(__dirname, 'public')));


// set up locals that we use in every template
app.use(function(req,res,next){
  res.locals.path = req.path;
  res.locals.user = req.user;
  next()
  ;
});


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


process.on('message', function(message) {
 if (message === 'shutdown') {
   mongoose.disconnect();
   process.exit(0);
 }
});

module.exports = app;
