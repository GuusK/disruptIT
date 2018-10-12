var fs       = require('fs');
var config = JSON.parse(fs.readFileSync('config.json'));
var speakers = JSON.parse(fs.readFileSync('sprekers.json'));

var mongoose = require('mongoose');
var User = require('./models/User');
var Ticket = require('./models/Ticket');

mongoose.connect(config.mongodb.url);

for (var i = speakers.length - 1; i >= 0; i--) {
	var speaker = speakers[i];
	console.log(speaker);
	var user = new User({
		firstname: speaker.firstname,
		surname: speaker.surname,
		vereniging: 'partner',
		email: speaker.email,
		vegetarian: false,
		ticket: speaker.ticketcode,
	});
	console.log(user);
	user.save();

	Ticket.findById(speaker.ticketcode).then(ticket =>{
		ticket.ownedBy = user;
		ticket.save();
	})
}
