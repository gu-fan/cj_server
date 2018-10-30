const express = require('express')
const router = express.Router()

// model

// app specific
const jwt = require('../common/jwt-auth')
const {ERR, MSG} = require('../code')

// help functions
const {wrap, delay} = require('../common/promise')
const isEmpty = require('lodash').isEmpty
const key = require('config').key
const auth = require('express-jwt')

const {Question, User}  = require('../models')

router.use('/.ping', jwt.auth(), wrap(async function(req, res, next) {
  res.json({
    msg:'user valid',
    code:0
  })
}))

router.get('/:uid', jwt.auth(), wrap(async function(req, res, next) {
  var user = await User.query()
                .findById(req.params.uid)
  
  res.json({
    msg:'user valid',
    user,
    code:0
  })
}))
router.delete('/:uid', jwt.auth(), wrap(async function(req, res, next) {
  var user = await User.query()
                .findById(req.params.uid)
  const numberOfDeletedRows = await User  
          .query()
          .deleteById(req.params.uid)

  res.json({
      msg:"user delete",
      numberOfDeletedRows,
      code:0,
  })
  
}))


module.exports = router
