FROM node:10.8.0

RUN mkdir -p /opt/app

RUN apt-get -q update && apt-get -qy install netcat
RUN npm i npm@latest -g


WORKDIR /opt
COPY package.json  ./
RUN npm install && npm cache clean --force
ENV PATH /opt/node_modules/.bin:$PATH

WORKDIR /opt/app
COPY . /opt/app


RUN chmod +x ./script/wait-for.sh
CMD sh -c './script/wait-for.sh mysql-db:3306 -- ./node_modules/knex/bin/cli.js migrate:latest && nodemon bin/www'

EXPOSE 8090

