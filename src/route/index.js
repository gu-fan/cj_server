const router = require('express').Router()
var jwt = require('express-jwt');
const config = require('config')

const wx_sign = require('../services/wx_sign')
const auth = require('../services/auth')
const user  = require('../services/user')
const question  = require('../services/question')
const pub  = require('../services/public')

module.exports = app => {
  router.get('/.ping', function(req, res, next) {
    res.json({msg:'welcome', code:0})
  })
  app.use(router)

  app.use('/auth', auth)
  app.use('/public', pub)

  app.use(jwt({secret: config.key}))

  app.use('/wx_sign', wx_sign)


  app.use('/user', user)
  app.use('/question', question)

}

