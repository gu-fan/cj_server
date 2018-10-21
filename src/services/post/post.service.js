const express = require('express')
const router = express.Router()
const {promisify, wrap, delay} = require('../../common/promise')
const jwt = require('../../common/jwt-auth')
const {ERR, MSG} = require('../../code')

const {uid, slug}= require('../../models/mixin/_uid')

const {Post, User}  = require('../../models')

router.use('/new', jwt.auth(), wrap(async function(req, res, next) {

  // var post = {
  //   author: req.user.sub,
  //   title: req.body.title,
  //   content: req.body.content,
  // }

  // post = await Post.query().insert(post)
  var post = await Post.query().insertGraph([{
    title: req.body.title,
    content: req.body.content, 
    author: {
      id: req.user.sub,
    },
    // author_id: req.user.sub,
  }], {
    relate: true
  })
    .eager('author');
  post = post[0]

  res.json({
      msg:"post created",
      post,
      code:0,
  })

}))

router.use('/:pid', jwt.auth(), wrap(async function(req, res, next) {

  var post = await Post.query()
                        .findById(req.params.pid)
                        .eager('author')
  if (post == undefined) throw ERR.NO_SUCH_NOTE
  

  res.json({
      msg:"post got",
      post,
      code:0,
  })

}))

module.exports = router
