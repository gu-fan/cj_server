const express = require('express')
const router = express.Router()
const moment = require('moment')

// app specific
const jwt = require('../common/jwt-auth')
const {ERR, MSG} = require('../code')

// help functions
const {wrap, delay} = require('../common/promise')
const isEmpty = require('lodash').isEmpty
const key = require('config').key
const auth = require('express-jwt')

const {Question, Answer, User}  = require('../models')

module.exports = router

//////////////////////////////////////////


async function getUserWithParentAccount(req){
  if (!req.user) throw ERR.NOT_LOGIN
  let user = await User.query()
                       .findById(req.user.sub)
                       .eager('[parent_account]')
  if (user == null) throw ERR.NOT_LOGIN
  return user
}

async function getMainAccount(user){
  let main
  if (user.is_parent) {
    main = user
  } else {
    if (user.parent_account) {
      main = user.parent_account
    } else {
      throw ERR.NO_RELATED_ACCOUNT
    }
  }
  return main
}

async function insertChild(id){

  let child = await User.query()
                        .insert({
                          parent_id: id,
                          is_parent: false,
                          r_type: 'child',
                        })
  return child
}


//////////////////////////////////////////


router.use('/.ping', jwt.auth(), wrap(async function(req, res, next) {
  let user = await getUserWithParentAccount(req)
  let main = await getMainAccount(user)
  main = await main.$query()
                   .eager('[child_accounts]')

  res.json({
    msg:'user accounts',
    main,
    is_child: user.id != main.id,
    code:0
  })
}))


// 这将始终在主账号下面建立子账号
// parent 
//      -> child_accounts
//      -> child_accounts
//      -> child_accounts
router.use('/create', jwt.auth(), wrap(async function(req, res, next) {

  let user = await getUserWithParentAccount(req)
  let main = await getMainAccount(user)
  main = await main.$query()
                   .eager('[child_accounts]')

  if (main.child_accounts.length >= 4) {
    throw ERR.MAX_ACCOUNT_EXCEEDS
  }
  let child = await insertChild(main.id)
  main = await main.$query()
                   .eager('[child_accounts]')


  res.json({
    msg:'user accounts created by main',
    main,
    code:0
  })

}))


// 登录子账号的id，
// 或者主账号的id
// 或者主账号下面的子账号的id
router.post('/login', jwt.auth(), wrap(async function(req, res, next) {

  let user = await getUserWithParentAccount(req)
  let main = await getMainAccount(user)

  let uid
  if (req.body.id == main.id) {
    uid = main.id
  } else {
    let child = await main
                      .$relatedQuery('child_accounts')
                      .findById(req.body.id)

    if (child == null)  throw ERR.NO_RELATED_ACCOUNT
    uid = child.id

  }

  let token = await jwt.signId(uid)

  res.json({
    code:0,
    t:token
  })

}))


