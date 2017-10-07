# Config

Configuration files are not included in this repository. You will need to add a file named `config.json` to the root folder with the following structure:
```javascript
{
  "mongodb": {
    // When using the provided docker-compose file, this is fine. Otherwise change address. Port is optional
    // You can optionally set username and pass using URI: mongodb://user:password@localhost/SNiC
    "url": "mongodb://mongodb/SNiC"
  },

  "mailchimp": {
    "id": "id of the list can be found on the page of defaults of the list. Lists > DisruptIT > Settings > List name and campaign defaults > ListID on page (don't take form URL",
    "key": "Generate this yourself at your account page"
  },
  "mailgun":{
      "domain": "Domain you provided or the sandbox url",
      "api_key": "Mention on the information page of the domain"
  },

  "email": {
    // Not unified because this allows for easier use when implementing mailchimp
    "auth": {
      "user": "default SMTP login on the domain page",
      "pass": "default password on the domain page"
    }
  },
  "session": {
    // Session secret. Should be better when running in production.
    "secret": "abc123"
  },
  // List of associations that take part.
  // List used to create the dropdown options when registering, therefore partner
  // bus indicates whether or not that association gets a bus
  "verenigingen": [
    {
      "name": "Cover",
      "bus": true
    },
    {
      "name": "A-eskwadraat",
      "bus": true
    },
    {
      "name": "CognAC",
      "bus": true
    },
    {
      "name": "De Leidsche Flesch",
      "bus": true
    },
    {
      "name": "GEWIS",
      "bus": true
    },
    {
      "name": "Inter-Actief",
      "bus": true
    },
    {
      "name": "Sticky",
      "bus": true
    },
    {
      "name": "Thalia",
      "bus": true
    },
    {
      "name": "via",
      "bus": true
    },
    {
      "name": "Partner",
      "bus": false
    }
  ],
  "ticketSaleStarts": "2015-08-01T00:00:00.001Z", // From when to register
  "providePreferences": false,     // If people can signup for sessions.
  "hideMenu": false,               // Not used in disruptIT
  // Used for matching
  // Choices are automatically generated based on order of this list.
  // Works although the order is not guaranteed by JSON standard.
  "matchingterms": [
    "Programmer",
    "Code witcher"
  ]
}
```

The speaker.json is used to generate the speaker page and for the enrollment tool. It is is structered in the following way

```javascript
{
  // list of ids of speakers per session. Used to generate the speakers page
  "speakerids": {
    "session1": ["ses1.1", "ses1.2"], // for parallel sessions
    "closing": "closing" // for single sessions
  },
  // List of all data needed to display a session
  "speakers": [
    {
      "name" : "Name of speaker",
      "id": "closing",  // ID listed in speakerids
      "limit": 9001     // Limit of a session, used for enroll tool. Can be set to null (or left out) to ignore
      "company" : "",   // if you want to mention the company in the session piece
      "image": "/link/to/speaker.jpg", // preferably the speakre
      "subject": "Subject of the talk",
      "talk" : [
        "list of various paragraphs",
        "that can be used to describe the session"
      ],
      "bio": [
        "list of various paragraphs",
        "to give some background on the speakers"
      ],
      "hidden": false   // whether or not you want to display this speaker
    }
    ...
  ],
  "presenters": [
    // list of the same type of object as speakers
  ]
}


```

# Creating an admin user
The easiest way is to log in to mongo-express and change the boolean of a user to true

# Generating tickets

To generate tickets run `node generate-tickets.js <number-of-tickets>'. To produce tickets non-default types, run `node generate-tickets.js <number-of-tickets> partner', where partner is the type of the ticket.

# Running the system
The easiest way to run the whole website is, in Guus's opinion, to use docker. This runs on many systems and allows you to run VM-like containers which can be hidden from the normal network (therefore increasing security, by a lot). Furthermore, problems like: "BUT IT WORKS ON MY MACHINE!" are no longer happening. Every instance of every container should be running the same.

* Install [Docker](https://docs.docker.com/engine/installation/) and [Docker Compose](https://docs.docker.com/compose/install/).
* To create the images needed to run the website run the `build.sh` script in the `Dockerfile`-folder.
* [Optional] Copy the `docker-compose.yml` and `nginx.conf` to outside of the repositoy.
* Edit the `docker-compose.yml` to provide the nginx container with the right certificates. Keep in mind that symlinks break most of the time since not the whole filesystem is linked (and you don't want that either).
* edit `nginx.conf` to use the proper certificates
* run `docker-compose up` to have it in the foreground and be able to read the logs directly. `docker-compose start` to run it in the background.
