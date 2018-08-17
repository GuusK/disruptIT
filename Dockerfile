FROM node:alpine AS base

RUN apk add --no-cache bash
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/

RUN npm install gulp -g

COPY idle.sh /usr/src/
COPY entrypoint.development.sh entrypoint.production.sh /usr/src/


EXPOSE 3000

# Development image
FROM base AS development

RUN npm install nodemon -g

# Production image
FROM base AS production
ADD singularIT /usr/src/app

WORKDIR /usr/src/app/

RUN npm install
RUN npm link gulp
RUN gulp sass
RUN gulp js

WORKDIR /usr/src/
