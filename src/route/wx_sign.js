const express = require('express')
const router = express.Router()
var fly=require("flyio")

const {ERR, MSG} = require('../code')
const User = require('../models/User')
const isEmpty = require('lodash').isEmpty
const jwt = require('../common/jwt-auth')

// help functions
const {wrap, delay} = require('../common/promise')
const APPID='wx40ff346e15e8d454'
const SECRECT='c68cb819032df23248de5278015a4c77'

router.use('/bind', jwt.auth(), 
  wrap(async function(req, res, next) {

  var u = await User.query().findOne({id:req.user.sub})
  if (u == null) throw ERR.NO_SUCH_USER

  if (isEmpty(req.body.userInfo)) {
      res.json({code:1, msg:"NEED_USER_AUTH"})
  } else {
    const updateUser = await User
      .query()
      .patchAndFetchById(req.user.sub, {avatar: req.body.userInfo.avatarUrl,name:req.body.userInfo.nickName});

    res.json({code:0, user:updateUser, msg:'updated'})

  }

}))


module.exports = router
