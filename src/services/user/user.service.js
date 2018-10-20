const express = require('express')
const router = express.Router()

// model
const User = require('../../models/User')

// app specific
const jwt = require('../../common/jwt-auth')
const {ERR, MSG} = require('../../code')

// help functions
const {wrap, delay} = require('../../common/promise')
const isEmpty = require('lodash').isEmpty
const key = require('config').key
const auth = require('express-jwt')

router.use('/.ping', jwt.auth(), wrap(async function(req, res, next) {
  res.json({
    msg:'user valid',
    code:0
  })
}))

module.exports = router
