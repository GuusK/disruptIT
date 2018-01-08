var debug	 = require('debug')('disruptit');
var fs       = require('fs');

var mongoose = require('mongoose');
var User     = require('./models/User');

var config   = JSON.parse(fs.readFileSync('config.json'));
var speakerinfo = JSON.parse(fs.readFileSync('speakers.json'));

mongoose.connect(config.mongodb.url);
mongoose.Promise = require('q').Promise;

var user;

if (process.argv[2].indexOf('@') < 0){
	console.log('finding on ticketcode');
	user = User.findOne({ticket:process.argv[2]});
} else {
	console.log('finding on email using: ' + process.argv[2]);
	user = User.findOne({email:process.argv[2]});
}

user.then(user => {
	if(!user.connectlist){
		debug("no connectlist found");
		return;
	}

	// Filter out the user itself
	user.connectlist = user.connectlist.filter(ticket => ticket != user.ticket);

	if(user.connectlist.length == 0){
		// Stop if connected with no-one (except maybe itself)
		debug("connectlist minus self has length of zero");
		return;
	}

	jobs = []
	user.connectlist.forEach(ticket=>{
		jobs.push(User.findOne({ticket:ticket}));
	});

	Promise.all(jobs).then(results => {
		results.forEach(user => {
			user.linkedin = decodeURIComponent(user.linkedin);
			user.phonenumber = decodeURIComponent(user.phonenumber);
		})
		results.forEach(user => {
			description = [user.firstname, user.surname].join(' ') + ' ';
			description += user.shareEmail? user.email + ' '  : '';
			description += user.linkedin ? user.linkedin + ' '  : '';
			description += user.phonenumber ? user.phonenumber + ' '  : '';
			console.log(description);
		});
	});
});


