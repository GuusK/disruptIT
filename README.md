# Config

Configuration files are not included in this repository. You will need to add a file named `config.json` to the root folder with the following structure:

    {
        "mongodb": {
            "url": "<the URL to your mongodb>"
        },
        "session": {
            "secret": "<A session secret. we advice you to change this every once i na while>"
        }
    }