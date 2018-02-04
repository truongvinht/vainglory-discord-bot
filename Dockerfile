FROM alpine:3.6
MAINTAINER Vinh

# install dependencies
RUN apk update && apk add \
  bash \
  nodejs \
  nodejs-npm 
  
# remove default content
RUN rm -R /var/www/*

# create directory structure
RUN mkdir -p /etc/nginx
RUN mkdir -p /run/nginx
RUN mkdir -p /etc/nginx/global
RUN mkdir -p /var/www/html


# install vhost config
ADD ./config/vhost.conf /etc/nginx/conf.d/default.conf

# install webroot files
ADD ./ /var/www/html/

RUN mkdir /var/www
ADD bot.js /var/www/bot.js

CMD ["/usr/bin/node", "/var/www/bot.js"] 