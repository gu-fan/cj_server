FROM node:10.8.0

RUN mkdir -p /opt/app

RUN mkdir -p /opt/tmp

RUN apt-get -q update && apt-get -qy install netcat


WORKDIR /opt
COPY package.json  ./
RUN yarn && yarn cache clean --force
RUN yarn add bcrypt
RUN yarn global add nodemon
ENV PATH /opt/node_modules/.bin:$PATH

WORKDIR /opt/app
COPY . /opt/app

# we should make sure wait-for is +x in host dir
RUN ["chmod", "+x", "./script/wait-for.sh"]
CMD sh -c './script/wait-for.sh mysql-db:3306 -- ../node_modules/knex/bin/cli.js migrate:latest && nodemon bin/www'

EXPOSE 8090

