FROM ubuntu:16.04

RUN apt-get update && apt-get install -y libcairo2-dev libjpeg8 libpango1.0.0 libgif-dev build-essential g++ build-essential
RUN apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_8.x | bash -
RUN apt-get install -y nodejs

EXPOSE 80 443

CMD ["npm", "start"]
