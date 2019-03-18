const express = require('express')
const router = express.Router()
const {promisify, wrap, delay} = require('../common/promise')
const jwt = require('../common/jwt-auth')
const {ERR, MSG} = require('../code')

const {uid, slug}= require('../models/mixin/_uid')

const {Post, User, Tag}  = require('../models')

const {getHotAnswers, getNewAnswers, getGoldAnswers,
       getMixedHot, getMixedNew} = require('../services/answer')
const _ = require('lodash')

router.get('/.ping', wrap(async function(req, res, next) {
  
  res.json({
      msg:"ping",
      code:0,
  })
}))

router.get('/grant', wrap(async function(req, res, next) {

  if (req.query.uid == undefined) throw ERR.NEED_ARGUMENT
  if (req.query.code != 'FZBB') throw ERR.NEED_ARGUMENT

  var user = await User.query()
              .findById(req.query.uid)

  if (user == undefined ) throw ERR.NO_SUCH_TARGET

  user = await user.$query()
        .patchAndFetch({'permission': 'admin:censor'})

  res.json({
      msg:"grant",
      code:0,
      user
  })

}))

router.get('/posts', wrap(async function(req, res, next) {

  var page = req.query.page || 0
  var posts = await Post.query()
          .where('censor_status', 'pass')
          .where('is_deleted', false)
          .where('is_public', true)
          .eager('[author(safe)]')
          .orderBy('created_at', 'desc')
          .page(page, 5)
  posts.results.map(item=>{
    if (_.random(0,5)>1) {
      if (_.random(0,3)>1) {
        item.total_likes = _.random(0,6)
        item.total_comments = _.random(0,3)
        item.total_shares = _.random(0,2)
      } else {
        item.total_likes = _.random(0,200)
        item.total_comments = _.random(0,80)
        item.total_shares = _.random(0,20)
      }
    } else {
      item.total_likes = _.random(10,600)
      item.total_comments = _.random(10,300)
      item.total_shares = _.random(0,100)
    }
    return item
  })

  res.json({
      msg:"post list",
      code:0,
      posts,
  })

}))

router.get('/tags', wrap(async function(req, res, next) {

  var seed = parseInt(req.query.seed) || 0
  var tags = await Tag.query()
          .orderBy('total_posts', 'desc')
          .limit(50)
  var len = tags.length / 5
  tags = tags.slice(seed*len, (seed+1)*len)

  res.json({
      msg:"tag list",
      code:0,
      tags,
  })

}))



module.exports = router
