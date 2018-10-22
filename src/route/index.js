const router = require('express').Router()
var jwt = require('express-jwt');
const config = require('config')

const auth = require('../services/auth')
const user  = require('../services/user')
const question  = require('../services/question')

module.exports = app => {
  router.get('/', function(req, res, next) {
    res.json({msg:'welcome', code:0})
  })
  app.use(router)

  app.use('/auth', auth)

  app.use(jwt({secret: config.key}))

  app.use('/user', user)
  app.use('/question', question)

}

