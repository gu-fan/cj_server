const router = require('express').Router()
var jwt = require('express-jwt');
const config = require('config')

const wx_sign = require('./wx_sign')
const auth = require('./auth')
const pub  = require('./public')
const user  = require('./user')
const question  = require('./question')
const answer  = require('./answer')
const comment  = require('./comment')
const censor  = require('./censor')

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
  app.use('/censor', censor)


}

