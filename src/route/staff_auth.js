const router = require('express').Router()  // main
var fly=require("flyio")

// model
const Staff = require('../models/Staff')

// app specific
const jwt = require('../common/jwt-auth')
const {ERR, MSG} = require('../code')
const { UniqueViolationError} = require('objection-db-errors');

// help functions
const {wrap, delay} = require('../common/promise')
const isEmpty = require('../common').isEmpty

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
//
var count = 0
router.post('/signup', wrap(async function(req, res, next) {

  if (isEmpty(req.body.username)) throw ERR.NEED_USERNAME
  if (isEmpty(req.body.password)) throw ERR.NEED_PASSWORD

  if (count == 0) {
    count = await Staff.query().count()
    count = count[0]['count(*)']
  }

  try {
    var k
    if (count == 0) {

      k = await Staff
        .query()
        .insert({
         username: req.body.username,
         password: req.body.password,
         permission: 'superadmin',
        })

    } else {

      k = await Staff
        .query()
        .insert({
         username: req.body.username,
         password: req.body.password,
        })
    }
    
    var token = await jwt.signId(k.id)
    res.json({...MSG.REGISTER_SUCCESS, t:token})

  } catch (e) {
    if (e instanceof UniqueViolationError) {
      throw ERR.NAME_REGISTERED
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
  if (isEmpty(req.body.username )) throw ERR.NEED_USERNAME

  var u = await Staff.query().findOne({username:req.body.username})
  if (u == null) throw ERR.NO_SUCH_USER // NOTE: avoid spam
  // if (u == null) throw ERR.PASSWORD_MISMATCH

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
router.get('/.ping', jwt.auth(), wrap(async function(req, res, next) {
    
  var u = await Staff.query().findOne({id:req.user.sub})
  if (u == null) throw ERR.NO_SUCH_USER

  res.json({u, ...MSG.STAFF_VALID})
}))






module.exports = router

