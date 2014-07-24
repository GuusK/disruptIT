var i18n = require('i18n');


module.exports = function (req, res, next) {
  res.locals.locales = Object.keys(i18n.getCatalog());
  if (req.query.locale) {
    res.cookie('locale', req.query.locale);
    res.setLocale(req.query.locale);
    res.locals.locale = req.query.locale;
  }
  next();
}
