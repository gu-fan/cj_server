const router = require('express').Router()
var jwt = require('express-jwt');
const config = require('config')

const auth = require('../services/auth/auth.service')
const user  = require('../services/user/user.service')
const post  = require('../services/post/post.service')

module.exports = app => {
  router.get('/', function(req, res, next) {
    res.json({msg:'welcome', code:0})
  })
  app.use(router)

  app.use('/auth', auth)

  app.use(jwt({secret: config.key}))

  app.use('/user', user)
  app.use('/post', post)

}

