# Config

Configuration files are not included in this repository. You will need to add a file named `config.json` to the root folder with the following structure:

    {
      "mongodb": {
        "url": "mongodb://localhost/anonymit"
      },

      "mailchimp": {
        "id": "list id (list > settings)"
        "key": "api key onder account"
      },

      "email": {
        "auth": {
          "user": "mailgun-user",
          "pass": "mailgun-api-key"
        }
      },
      "session": {
        "secret": "abc123"
      },
      "verenigingen": [
        {
          "name": "GEWIS",
          "bus": false
        }
      ],
      "ticketSaleStarts": "2015-08-01T00:00:00.001Z",
      "hideMenu": false,
      "speakers": [
        {
          "name": "Douwe Schmidt",
          "company": "Greenhost",
          "image": "/images/dosch.jpg",
          "talk": "Team Human",
          "hidden": false
        }
      ]
    }

mongodb is the url to the mongodb server

you can optionally set username and pass using URI

"mongodb://user:password@localhost/db"


# Creating an admin user

# Generating tickets

To generate tickets run `node generate-tickets.js <number-of-tickets>'

You can then view tickets under http://localhost/tickets under an admin account

