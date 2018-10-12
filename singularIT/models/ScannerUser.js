var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var plm = require('passport-local-mongoose');

var ScannerUser = new mongoose.Schema({
    username:       {   type: String, required: true,
                        lowercase: true,
                        index: { unique : true }},
    display_name:   {   type: String, required: true }
});

ScannerUser.plugin(plm, {
    usernameField: 'username',
    usernameLowerCase: true
});

module.exports = mongoose.model('ScannerUser', ScannerUser);
