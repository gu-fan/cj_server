const router = require('express').Router()  // main
var fly=require("flyio")

// model
const Staff = require('../models/Staff')

// app specific
const jwt = require('../common/jwt-auth')
const {ERR, MSG} = require('../code')

const {hasPermission} = require('../common/permission')

// help functions
const {wrap, delay} = require('../common/promise')
const isEmpty = require('lodash').isEmpty

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

  console.log("PING")
  console.log(req.user.sub)

  try {
    var u = await Staff.query().findOne({id:req.user.sub})
  } catch (e) {
    console.log(e)
  }

  if (u == null) throw ERR.NO_SUCH_USER

  res.json({code:0, u, msg:MSG.STAFF_VALID})
}))


router.post('/logout', jwt.auth(), wrap(async function(req, res, next) {
  // revoke the token?
  
  res.json({code:0,msg:'success'})
}))

router.get('/all', jwt.auth(), wrap(async function(req, res, next) {

  var staffs = await Staff.query().page(10)
  
  res.json({code:0,msg:'success', staffs})
}))

router.post('/set_permission', jwt.auth(),
  hasPermission('censor'),
  wrap(async function(req, res, next) {

  var u = await Staff.query().findOne({id:req.user.sub})
  if (u == null) throw ERR.NO_SUCH_USER
  if (!/admin/.test(u.permission)) {
    throw ERR.NO_PERMISSION
  }

  var s = await Staff.query().findById(req.body.id)
  if (s == null) throw ERR.NO_SUCH_USER

  if (!/superadmin/.test(s.permission)) {
    throw ERR.NOT_CHANGEABLE
  }

  var staff = await Staff.query()
          .patchAndFetchById(req.body.id, 
            {permission:req.body.permission})
  
  res.json({code:0,msg:'success', staff})

}))



module.exports = router

