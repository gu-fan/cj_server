const router = require('express').Router()  // main
var fly=require("flyio")

// model
const User = require('../models/User')

// app specific
const jwt = require('../common/jwt-auth')
const {ERR, MSG} = require('../code')

// help functions
const {wrap, delay} = require('../common/promise')
const isEmpty = require('lodash').isEmpty
const {normalizeUser} =require('../services/user')

// const { logTime } = require('../../test/common/util')

/** Signup
 * @post /auth/signup
 *
 * @params phone
 * @params password
 *
 * @return t:jwt_token
 * @throw NEED_PHONE, NEED_PASSWORD
 * @throw PHONE_REGISTERED
 */
// http POST localhost:8090/auth/signup phone=12345 password=12345
router.post('/signup', wrap(async function(req, res, next) {

  if (isEmpty(req.body.phone)) throw ERR.NEED_PHONE
  if (isEmpty(req.body.password)) throw ERR.NEED_PASSWORD

  try {
    const k = await User
      .query()
      .insert({
         phone: req.body.phone,
         password: req.body.password,
      })
    // 300 ms, on generate hash, which should be slow
    // logTime('insert')
    
    var token = await jwt.signId(k.id)
    // logTime('sign')
   
    res.json({...MSG.REGISTER_SUCCESS, t:token})

  } catch (e) {
    if (e.name === 'Error' && e.code === 'SQLITE_CONSTRAINT') {
      throw ERR.PHONE_REGISTERED
    } else if (e.name === 'error' && e.code === '23505') {
      throw ERR.PHONE_REGISTERED
    } else {
      throw e
    }
  }

}))

/** Login
 * @post /auth/login
 *
 * @params phone
 * @params password
 *
 * @return t:jwt_token
 * @throw NEED_PHONE, NEED_PASSWORD
 * @throw NO_SUCH_USER
 * @throw PASSWORD_MISMATCH
 */
router.post('/login', wrap(async function(req, res, next) {

  if (isEmpty(req.body.password)) throw ERR.NEED_PASSWORD
  if (isEmpty(req.body.phone)) throw ERR.NEED_PHONE

  var u = await User.query().findOne({phone:req.body.phone})
  // if (u == null) throw ERR.NO_SUCH_USER          // NOTE: avoid spam
  if (u == null) throw ERR.PASSWORD_MISMATCH

  var isMatch = await u.verifyPassword(req.body.password)

  if (isMatch) {
    var token = await jwt.signId(u.id)
    // Object.assign({}, MSG.LOGIN_SUCCESS,t:token)
    res.json({...MSG.LOGIN_SUCCESS, t:token})
  } else {
    throw ERR.PASSWORD_MISMATCH
  }

}))

/** Auth with token
 * @get /auth/check
 *
 * @authorize user
 *
 * @return 0
 * @throw AUTH_COMMON_ERROR
 * @throw NO_SUCH_USER
 */
router.get('/check', jwt.auth(), wrap(async function(req, res, next) {
  var u = await User.query().findOne({id:req.user.sub})
  if (u == null) throw ERR.NO_SUCH_USER

  res.json({...MSG.USER_VALID})
}))


const APPID='wx40ff346e15e8d454'
const SECRECT='c68cb819032df23248de5278015a4c77'
router.use('/wx_code', wrap(async function(req, res, next) {
  fly.get(`https://api.weixin.qq.com/sns/jscode2session?appid=${APPID}&secret=${SECRECT}&js_code=${req.query.code}&grant_type=authorization_code`
  )
    .then(async response=>{
      var data = JSON.parse(response.data)
      console.log(data)
      if (data.openid) {

        // get user from database
        // if has user info, use it.
        // else ask user to bind it.
        //   id:data.openid,
        //   ss:data.session_key,

        var u = await User.query().findOne({wx_id:data.openid})
                  .eager('[questions(count), answers(count)]',{
                    count:(builder)=>{
                        builder.count()
                    }
                  })
        
        console.log(0)

        if (u == null) {
          u = await User
            .query()
            .insert({
              wx_id: data.openid
            })
          console.log(1)

          var t = await jwt.signId(u.id)
          res.json({
            need_profile: true,
            user: u,
            t,
            code: 0
          })
        } else {

          var user = normalizeUser(u)
          
          var t = await jwt.signId(u.id)
          console.log(2)
          if (isEmpty(u.avatar)) {  
            // no user info as no avatar
            res.json({
              need_profile: true,
              t,
              user,
              code: 0
            })

          } else {
            // got the user info
            res.json({
              need_profile: false,
              t,
              user,
              code: 0
            })
          }
        }

      } else {
        console.log(3)
        res.json({
          msg: data.errMsg,
          code:data.errcode
        })
      }
    })
    .catch(e=>{
      console.log(e)
      res.json(e)
    })
}))


router.use('/wx_code_fake', wrap(async function(req, res, next) {
      var u = await User.query().findOne({wx_id:req.body.wx_id})
                .eager('[questions(count), answers(count)]',{
                  count:(builder)=>{
                      builder.count()
                  }
                })
      if (u == null) {
        u = await User
          .query()
          .insert({
            wx_id: req.body.wx_id
          })

        var t = await jwt.signId(u.id)
        res.json({
          need_profile: true,
          user: u,
          t,
          code: 0
        })
      } else {
        var t = await jwt.signId(u.id)

        var user = normalizeUser(u)

        if (isEmpty(u.avatar)) {  
          // no user info as no avatar
          res.json({
            need_profile: true,
            t,
            user,
            code: 0
          })
        } else {
          // got the user info
          res.json({
            need_profile: false,
            t,
            user,
            code: 0
          })
        }
      }

}))

module.exports = router

