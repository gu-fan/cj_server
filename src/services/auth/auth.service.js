const router = require('express').Router()  // main

// model
const User = require('../../models/User')

// app specific
const jwt = require('../../common/jwt-auth')
const {ERR, MSG} = require('../../code')

// help functions
const {wrap, delay} = require('../../common/promise')
const isEmpty = require('lodash').isEmpty

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
    
    var token = await jwt.signId(k.id)
    res.json({msg:MSG.REGISTER_SUCCESS, code:0, t:token})

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
    res.json({msg:MSG.LOGIN_SUCCESS, code:0, t:token})
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

  res.json({code:0, msg:MSG.USER_VALID})
}))

module.exports = router
