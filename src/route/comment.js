const express = require('express')
const router = express.Router({mergeParams: true})
const {promisify, wrap, delay} = require('../common/promise')
const jwt = require('../common/jwt-auth')
const {ERR, MSG} = require('../code')

const {uid, slug} = require('../models/mixin/_uid')

const {Question, User, Answer, Comment} = require('../models')
const {getUser} = require('../services/user')

const { checkSpam } = require('../common/spam')

router.get('/', jwt.auth(), wrap(async function(req, res, next) {

  var count = await Comment.query()
                          .count()

  res.json({
      msg:"answers count",
      count:count[0]['count(*)'],
      code:0,
  })


}))

router.post('/', jwt.auth(), wrap(async function(req, res, next) {


  if (req.body.aid == null || req.body.aid == '') throw ERR.NEED_ARGUMENT
  var answer = await Answer.query().findById(req.body.aid)

  
  if (answer.lock_status == 'lock' ) {
     throw ERR.TARGET_LOCKED
  // } else if (answer.censor_status == 'reject' || answer.censor_status == undefined) {
  //    throw ERR.CENSOR_NOT_PASS
  }

  if (checkSpam(req.body.content)) throw ERR.IS_SPAM

  var comments = await Comment.query().insertGraph([{
      content: req.body.content, 
      reply_id: req.body.reply_id,
      answer:{
        id: req.body.aid,
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

  if (comment == undefined) throw ERR.NO_SUCH_TARGET
  
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
  if (comment == undefined) throw ERR.NO_SUCH_TARGET
  if (checkSpam(req.body.content)) throw ERR.IS_SPAM

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
  var user = await getUser(req.user.sub)

  if (comment.is_deleted) throw ERR.ALREADY_DELETED

  if (!user.is_staff && req.user.sub != answer.author_id) {
    if (req.user.sub != comment.author_id) throw ERR.NOT_AUTHOR
    if (!user.is_staff) throw ERR.NO_PERMISSION
  }

    // await Answer
    //   .query()
    //   .decrement('total_comments', 1)
    //   .where('id', comment.answer_id)

  const deleted = await comment
          .$query()
          .patch({'is_deleted': true})

  comment.is_deleted = 1

  res.json({
      msg:"comment delete",
      deleted,
      comment,
      code:0,
  })

}))


router.get('/:cid/like', jwt.auth(), wrap(async function(req, res, next) {

  var comment = await Comment.query()
                        .findById(req.params.cid)
  if (comment == undefined) throw ERR.NO_SUCH_TARGET

  var u = await comment.$relatedQuery('liked_users')
                  .findById(req.user.sub)

  // check if user is liked
  var is_like = false
  if (u==null) {
    is_like = false
  } else {
    is_like = true
  }
  // var liked_users = await comment.$relatedQuery('liked_users')
  
  res.json({
      msg:"answer like got",
      total_likes: comment.total_likes,
      is_like,
      // liked_users,
      code:0,
  })

}))
router.post('/:cid/like', jwt.auth(), wrap(async function(req, res, next) {

  var comment = await Comment.query()
                        .findById(req.params.cid)

  if (comment == undefined) throw ERR.NO_SUCH_TARGET

  var u = await comment.$relatedQuery('liked_users')
                        .findById(req.user.sub)
  var is_like = true
  
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
      total_likes: comment.total_likes,
      is_like,
      code:0,
  })

}))

router.post('/:cid/dislike', jwt.auth(), wrap(async function(req, res, next) {

  var comment = await Comment.query()
                        .findById(req.params.cid)

  if (comment == undefined) throw ERR.NO_SUCH_TARGET

  var u = await comment.$relatedQuery('liked_users')
                        .findById(req.user.sub)
  var is_like = false
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
      total_likes: comment.total_likes,
      is_like,
      code:0,
  })


}))



module.exports = router

