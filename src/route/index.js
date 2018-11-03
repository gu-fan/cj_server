const router = require('express').Router()
var jwt = require('express-jwt');
const config = require('config')

const wx_sign = require('../services/wx_sign')
const auth = require('../services/auth')
const pub  = require('../services/public')
const user  = require('../services/user')
const question  = require('../services/question')
const answer  = require('../services/answer')
const comment  = require('../services/comment')

module.exports = app => {

  router.get('/.ping', function(req, res, next) {
    res.json({msg:'welcome', code:0})
  })

  app.use(router)

  app.use('/auth', auth)
  app.use('/pub', pub)

  app.use(jwt({secret: config.key}))

  app.use('/wx', wx_sign)


  app.use('/u', user)
  app.use('/q', question)
  app.use('/a', answer)
  app.use('/c', comment)


}

