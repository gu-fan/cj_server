const express = require('express')
const router = express.Router()

// model

// app specific
const jwt = require('../../common/jwt-auth')
const {ERR, MSG} = require('../../code')

// help functions
const {wrap, delay} = require('../../common/promise')
const isEmpty = require('lodash').isEmpty
const key = require('config').key
const auth = require('express-jwt')

const {Post, User}  = require('../../models')

router.use('/.ping', jwt.auth(), wrap(async function(req, res, next) {
  res.json({
    msg:'user valid',
    code:0
  })
}))

router.use('/:uid', jwt.auth(), wrap(async function(req, res, next) {
  var user = await User.query()
                        .findById(req.params.uid)
                        .eager('posts')
  
  res.json({
    msg:'user valid',
    user,
    code:0
  })
}))


module.exports = router
