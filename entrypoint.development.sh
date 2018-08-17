#!/bin/bash

set -e

cd app

npm link gulp

gulp sass
gulp js
nodemon ./bin/www
