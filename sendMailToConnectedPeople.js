var debug	 = require('debug')('disruptit');
var fs       = require('fs');

var mustache = require('mustache');
var template = fs.readFileSync('connectbetteraftermail.mst').toString();

var mongoose = require('mongoose');
var User     = require('./models/User');

var config   = JSON.parse(fs.readFileSync('config.json'));
var speakerinfo = JSON.parse(fs.readFileSync('speakers.json'));

mongoose.connect("mongodb://mongodb/SNiC");
mongoose.Promise = require('q').Promise;

var nodemailer = require('nodemailer');
var mg = require('nodemailer-mailgun-transport');

async function processUser(user){
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

		console.log(mustache.render(template, {html: true, name: user.firstname, people: results}));
		var transport = nodemailer.createTransport(
			mg({auth : config.mailgun})
		)
		var mailOptions = {
			to: user.email,
			from: config.email.auth.user,
			subject: 'Connections made at DisruptIT',
			text: mustache.render(template, {html: false, name: user.firstname, people: results}),
			html: mustache.render(template, {html: true, name: user.firstname, people: results})
		};
		transport.sendMail(mailOptions, (error, info) => {
	        if (error) {
	            return console.log(error);
	        }
	        console.log(info);
	    });
	});
}

User.find({}).then(res => {
	res.forEach(user => {
		processUser(user);
	});
})