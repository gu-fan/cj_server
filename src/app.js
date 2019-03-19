const express= require('express')

const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const logger = require('morgan')
const restc = require('restc');
const path = require('path')
const config = require('config')

const app = express()

if (app.get('env')!='test') {
  app.use(logger('dev'))
}

app.use(helmet());
app.use(cors());

app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (app.get('env')=='development') {
  app.use('/tmp',  express.static(config.tmp_path))
}
app.use(restc.express());


const { model } = require('./models')
const route = require('./route')
const code = require('./code')

app.use(model.init(config.db))

route(app)

app.use(code.NotFound);
app.use(code.Handler);

module.exports = app
