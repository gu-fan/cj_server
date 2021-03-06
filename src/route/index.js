const router = require('express').Router()
const config = require('config')
const jwt = require('express-jwt');

const wx_sign = require('./wx_sign')
const auth = require('./auth')
const pub  = require('./public')
const user  = require('./user')
const staff_auth  = require('./staff_auth')
const staff_stat  = require('./staff_stat')
// const question  = require('./question')
// const answer  = require('./answer')
const post  = require('./post')
const tag = require('./tag')
const comment  = require('./comment')
const banner  = require('./banner')
const censor  = require('./censor')
const kpass  = require('./kpass')
const dashboard  = require('./dashboard')
const user_account  = require('./user_account')

module.exports = app => {

  router.get('/.ping', function(req, res, next) {
    res.json({msg:'welcome', code:0})
  })

  app.use(router)

  app.use('/auth', auth)
  app.use('/sa', staff_auth)
  app.use('/pub', pub)

  // app.use(jwt({secret: config.key, credentialsRequired:false}))

  app.use('/sas', staff_stat)
  app.use('/dashboard', dashboard)

  app.use('/wx', wx_sign)

  app.use('/kpass', kpass)      // qcloud cos

  app.use('/u', user)
  app.use('/account', user_account)
  app.use('/p', post)
  app.use('/t', tag)

  // app.use('/q', question)
  // app.use('/a', answer)
  app.use('/c', comment)
  app.use('/censor', censor)
  app.use('/banner', banner)

}
