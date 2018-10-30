const express = require('express')
const router = express.Router({mergeParams: true})
const {promisify, wrap, delay} = require('../common/promise')
const jwt = require('../common/jwt-auth')
const {ERR, MSG} = require('../code')

const {uid, slug}= require('../models/mixin/_uid')

const {Question, User, Answer, Comment}  = require('../models')

router.get('/', jwt.auth(), wrap(async function(req, res, next) {

  var answer = await Answer.query()
                        .findById(req.params.aid)
                        .eager('[author, comments]')

  console.log(req.params.aid)
  if (answer == undefined) throw ERR.NO_SUCH_NOTE

  var comments = answer.comments

  res.json({
      msg:"comments got",
      comments,
      code:0,
  })

}))

router.post('/', jwt.auth(), wrap(async function(req, res, next) {

  var comments = await Comment.query().insertGraph([{
    content: req.body.content, 
    answer:{
      id: req.params.aid,
    },
    author: {
      id: req.user.sub,
    },
  }], {
    relate: true
  })
    .eager('[author, answer]');

  var newComment = comments[0]

  res.json({
      msg:"comment create",
      newComment,
      code:0,
  })

}))

router.get('/:cid', jwt.auth(), wrap(async function(req, res, next) {

  var comment = await Comment.query()
                        .findById(req.params.cid)
                        .eager('[author, question]')

  if (comment == undefined) throw ERR.NO_SUCH_NOTE
  
  res.json({
      msg:"comment got",
      comment,
      code:0,
  })

}))

router.put('/:cid', jwt.auth(), wrap(async function(req, res, next) {

  var comment = await Comment.query()
                        .findById(req.params.cid)
                        .eager('author')
  if (comment == undefined) throw ERR.NO_SUCH_NOTE
  const updatedComment = await Comment
    .query()
    .patchAndFetchById(req.params.cid, {content:req.body.content});
    

  res.json({
      msg:"comment patch",
      updatedComment,
      code:0,
  })

}))

router.delete('/:cid', jwt.auth(), wrap(async function(req, res, next) {

  var comment = await Comment.query()
                        .findById(req.params.cid)
                        .eager('author')
  if (comment == undefined) throw ERR.NO_SUCH_NOTE
  
  const numberOfDeletedRows = await Comment 
    .query()
    .deleteById(req.params.cid)

  res.json({
      msg:"comment delete",
      numberOfDeletedRows,
      code:0,
  })

}))


module.exports = router

