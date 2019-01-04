const router = require('express').Router()
var fly=require("flyio")
const knex = require('knex')


const jwt = require('../common/jwt-auth')
const {ERR, MSG} = require('../code')
const {wrap, delay} = require('../common/promise')

const {hasPermission} = require('../common/permission')

const {User, Staff}= require('../models')


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

  // var a = await req.knex.raw('SELECT name, Date(created_at) as day FROM user WHERE avatar IS NULL GROUP BY DATE(user.created_at)')

  var a = await req.knex.raw(`
SELECT @cdate := DATE_ADD(@cdate, INTERVAL +1 DAY) cday
  FROM( SELECT @cdate := DATE_ADD('2018-01-10', INTERVAL -1 DAY) FROM data_t limit 15) t0
  WHERE date(@cdate) <= DATE_ADD('2018-01-20', INTERVAL -1 DAY)
    `)
  // var a = await req.knex.raw(`
  //   SELECT count(name) as total, Date(created_at) as day 
  //   FROM user 
  //   GROUP BY DATE(created_at) 
  //   ORDER BY DATE(created_at) DESC
  //   `)

  
  console.log(a)


  res.json({a, ...MSG.STAFF_VALID})
}))




module.exports = router

