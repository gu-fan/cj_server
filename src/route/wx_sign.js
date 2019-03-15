const express = require('express')
const router = express.Router()
var fly=require("flyio")

const {ERR, MSG} = require('../code')
const User = require('../models/User')
const isEmpty = require('lodash').isEmpty
const jwt = require('../common/jwt-auth')

// help functions
const {wrap, delay} = require('../common/promise')
const APPID='wxa8b52e8c2ba72a84'
const SECRECT='6fc9000524b18f8e68397f85bf7c4863'

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
