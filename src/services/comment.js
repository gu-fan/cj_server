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
    reply_id: req.body.reply_id,
    answer:{
      id: req.params.aid,
    },
    author: {
      id: req.user.sub,
    },
  }], {
    relate: true
  })
    .eager('[author, answer, reply_to]');

  var comment = comments[0]

  res.json({
      msg:"comment create",
      comment,
      code:0,
  })

}))

router.get('/:cid', jwt.auth(), wrap(async function(req, res, next) {

  var comment = await Comment.query()
                        .findById(req.params.cid)
                        .eager('[author, reply_to, comments, answer.question]')

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


router.get('/:cid/like', jwt.auth(), wrap(async function(req, res, next) {

  var comment = await Comment.query()
                        .findById(req.params.cid)
  if (comment == undefined) throw ERR.NO_SUCH_NOTE

  var u = await comment.$relatedQuery('liked_users')
                  .findById(req.user.sub)
  var liked = 0
  if (u==null) {
    liked = 0
  } else {
    liked = 1
  }
  // check if user is liked
  var liked_users = await comment.$relatedQuery('liked_users')
  
  res.json({
      msg:"answer like got",
      comment,
      liked,
      liked_users,
      code:0,
  })

}))
router.post('/:cid/like', jwt.auth(), wrap(async function(req, res, next) {

  var comment = await Comment.query()
                        .findById(req.params.cid)

  if (comment == undefined) throw ERR.NO_SUCH_NOTE

  var u = await comment.$relatedQuery('liked_users')
                        .findById(req.user.sub)
  if (u==null) {
    await comment.$relatedQuery('liked_users')
    .relate({
      id: req.user.sub,
    });
    await comment.$query()
          .increment('total_likes', 1)

    comment = await Comment.query()
                        .findById(req.params.cid)
  } else {
    // do nothing
  }

  var liked_users = await comment.$relatedQuery('liked_users')

  res.json({
      msg:"comment like set",
      comment,
      liked_users,
      code:0,
  })

}))

router.post('/:cid/dislike', jwt.auth(), wrap(async function(req, res, next) {

  var comment = await Comment.query()
                        .findById(req.params.cid)

  if (comment == undefined) throw ERR.NO_SUCH_NOTE

  var u = await comment.$relatedQuery('liked_users')
                        .findById(req.user.sub)

  if (u==null) {
    // do nothing
  } else {
      await comment.$relatedQuery('liked_users')
        .unrelate()
        .where('uid', req.user.sub);
      await comment.$query()
            .decrement('total_likes', 1)
      comment = await Comment.query()
                          .findById(req.params.cid)
  }

  var liked_users = await comment.$relatedQuery('liked_users')

  res.json({
      msg:"comment like set",
      comment,
      liked_users,
      code:0,
  })


}))












module.exports = router

