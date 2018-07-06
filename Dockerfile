#FROM ubuntu:16.04
FROM node:alpine

RUN apk add --no-cache bash

# RUN apt-get update && apt-get install -y libcairo2-dev libjpeg8 libpango1.0.0 libgif-dev build-essential g++ build-essential
# RUN apt-get install -y curl
# RUN curl -sL https://deb.nodesource.com/setup_8.x | bash -
# RUN apt-get install -y nodejs

ADD singularIT /usr/src/app
RUN cd /usr/src/app
WORKDIR /usr/src/app
RUN npm install
RUN npm install gulp -g

EXPOSE 80 443

CMD ["npm", "start"]
