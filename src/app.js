const express= require('express')

const helmet = require('helmet');
const compression = require('compression');

const cors = require('cors');
const logger = require('morgan')

const config = require('config')
const { init } = require('./models')

init(config.db)

const route = require('./route')
const code = require('./code')

const app = express()
const restc = require('restc');

app.use(logger('dev'))
app.use(helmet());
app.use(cors());

app.options('*', cors()) 
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(restc.express());

route(app)

app.use(code.NotFound);
app.use(code.Handler);

module.exports = app

