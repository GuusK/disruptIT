var fs       = require('fs');
var async = require('async');
var _ = require('underscore');
var mongoose = require('mongoose');
var ScannerUser = require('./models/ScannerUser');

var config = JSON.parse(fs.readFileSync('config.json'));
mongoose.Promise = require('q').Promise;
mongoose.connect(config.mongodb.url);


function addScannerUser(user_info, cb) {
    console.log("Creating " + user_info.username +
        " with password " + user_info.password);

    var user = new ScannerUser({
        display_name: user_info.display_name,
        username: user_info.username
    });

    ScannerUser.register(user, user_info.password, cb);
}

var scanner_users = JSON.parse(fs.readFileSync('scanner_users.json'));
var tasks = [];

for (var i = 0; i < scanner_users.length; i++) {
    tasks.push(async.apply(addScannerUser, scanner_users[i]));
}


async.parallel(tasks, function (err) {
    if (err) {
        console.log("An error occurred:");
        console.log(err);
    } else {
        console.log("Done!");
    }

    process.exit();
});
