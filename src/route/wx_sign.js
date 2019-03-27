const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs')
const http = require("flyio")

const {ERR, MSG} = require('../code')
const User = require('../models/User')
const isEmpty = require('lodash').isEmpty
const jwt = require('../common/jwt-auth')
const {uid_time} = require('../models/mixin/_uid')
const config = require('config')

// help functions
const {wrap, delay} = require('../common/promise')
const APPID='wxa8b52e8c2ba72a84'
const SECRET='6fc9000524b18f8e68397f85bf7c4863'

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

var ACCESS_TOKEN
router.post('/mini_code', jwt.auth(), wrap(async function(req, res, next) {

  let resp = await http.get(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${SECRET}`)

  if (resp.data.access_token) {
    ACCESS_TOKEN = resp.data.access_token
  } else {
    throw new Error(resp.data.errcode + resp.data.errmsg)
  }

  resp = await http.post(`https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${ACCESS_TOKEN}`,{scene:req.body.path||'/pages/index/main'}, {
	responseType:"stream"
  })

  if (resp.headers['content-type']=='image/jpeg') {
    let _pth = uid_time() + '.png'
    fs.writeFileSync(config.tmp_path+_pth, resp.data);
    
    res.json({
      code:0,
      mini_code: '/tmp/'+_pth,
      msg:'got code',
    })
  } else {
    let data = JSON.parse(resp.data.toString('utf8'))
    throw new Error(data.errcode + ":" + data.errmsg)
  }


}))


module.exports = router
