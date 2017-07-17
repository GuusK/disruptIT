// extreme comment
var compress = require('compression');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');

// serve fast
var app = express();
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var flash = require('express-flash');
var mongoose = require('mongoose');
var fs = require('fs');
var passport = require('passport');
// var i18n = require("i18next");
var expressValidator = require('express-validator');

var MongoStore = require('connect-mongo')(session);

/// load configuration
var config = JSON.parse(fs.readFileSync('config.json'));

/// configure database
mongoose.connect(config.mongodb.url);
mongoose.Promise = require('q').Promise;

var routes = require('./routes/index')(config);
var auth = require('./routes/auth')(config);

// i18n.init({
//   saveMissing: true,
//   ignoreRoutes: ['images/', 'fonts/', 'flags/', 'css/', 'js/'],
//   debug: true,
//   detectLngFromPath: 0,
//   forceDetectLngFromPath: true,
//   fallbackLng: 'nl'
// });
// i18n.addPostProcessor("pug", function(val, key, opts) {
//   return require("pug").compile(val, opts)();
// });

// view engine setup
// app.use(i18n.handle);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(compress({
  filter: function(req, res) {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return /json|text|javascript|dart|image\/svg\+xml|application\/x-font-ttf|application\/vnd\.ms-opentype|application\/vnd\.ms-fontobject/.test(res.getHeader('Content-Type'));
  }
}));

//CORS middleware
var allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', 'http://autonom.it:1337');

  next();
};

// app.use(favicon());
app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
})); // Because default for lower versions
app.use(expressValidator());
app.use(cookieParser());
app.use(allowCrossDomain);
app.use(session({
  secret: config.session.secret,
  store: new MongoStore({
    url: config.mongodb.url
  }),
  saveUninitialized: true,
  resave: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());


// i18n.registerAppHelper(app)
//   .serveClientScript(app)
//   .serveDynamicResources(app)
//   .serveMissingKeyRoute(app)
//   .serveChangeKeyRoute(app)
//   .serveRemoveKeyRoute(app);
/*app.use(sass.middleware({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  debug: true,
  outputStyle: 'compressed',
  prefix:  '/'
}));*/

app.use(express.static(path.join(__dirname, 'public')));

//localization
// app.use(function(req, res, next) {
//   var lang = req.url.substring(1, 3);

//   if (['nl', 'en'].indexOf(lang) !== -1) {
//     i18n.setLng(lang, function(err, t) {
//       req.path = req.url = req.url.slice(3);
//     });
//   }
//   next();
// });

// set up locals that we use in every template
// app.use(function(req, res, next) {
//   res.locals.path = req.path;
//   res.locals.user = req.user;
//   res.locals.verenigingen = config.verenigingen;
//   res.locals.hideMenu = config.hideMenu;
//   res.locals.ucfirst = function(value) {
//     return value.charAt(0).toUpperCase() + value.slice(1);
//   };
//   res.locals.hypenate = function(value) {
//     return value.replace(/\s/g, '-').replace('?', '').replace(':', '').replace('!', '').toLowerCase();
//   };

//   next();
// });


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