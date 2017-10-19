/**
 * Migrates the first argument provided on the commandline as an interest to the second one provided on the commandline
 */
var fs = require('fs');
var config = JSON.parse(fs.readFileSync('config.json'));

var mongoose = require('mongoose');
var User     = require('./models/User');
mongoose.connect(config.mongodb.url);
mongoose.Promise = require('q').Promise;

if (process.argv.length < 4){
	console.log("Not enough parameters found. Exiting...");
	process.exit(1);
}

console.log('Changing : "' + process.argv[2] + '" to "' + process.argv[3] +'"');

User.find({matchingterms: process.argv[2]}, function (err, docs) {
	// Checking for errors
	if(err){
		console.log("Errors found. Exiting...");
		console.log(err);
		process.exit(1);
	}
	// Check all documents
	for (var i = docs.length - 1; i >= 0; i--) {
		// Check if which index is the interest to be changed and replace it
		for (var j = docs[i].matchingterms.length - 1; j >= 0; j--) {
			if(docs[i].matchingterms[j] == process.argv[2]){
				docs[i].matchingterms[j] = process.argv[3];
				break;
			}
		}
	}

	for (var i = docs.length - 1; i >= 0; i--) {
		console.log(docs[i]);
		User.update({ ticket : docs[i].ticket}, {$set: {matchingterms: docs[i].matchingterms}}, function (err, doc) {
		  if (err) return console.log(err);
		});
	}
	console.log("Updated " + docs.length + " users");
	process.exit(1);
});

console.log("No records were found")
process.exit(1);