const express = require('express')
const router = express.Router({mergeParams: true})
const {promisify, wrap, delay} = require('../common/promise')
const jwt = require('../common/jwt-auth')
const {ERR, MSG} = require('../code')

const {uid, slug} = require('../models/mixin/_uid')

const {Post,  User, Comment} = require('../models')
const {getUser} = require('../services/user')

const { checkSpam } = require('../common/spam')

router.get('/', jwt.auth(), wrap(async function(req, res, next) {

  var count = await Comment.query()
                          .count()

  res.json({
      msg:"comments count",
      count:count[0]['count(*)'],
      code:0,
  })


}))

router.post('/', jwt.auth(), wrap(async function(req, res, next) {


  if (req.body.pid == null || req.body.pid == '') throw ERR.NEED_ARGUMENT
  var post = await Post.query().findById(req.body.pid)

  if (req.body.content.length < 4) throw ERR.CONTENT_MIN_4

  if (post.censor_status == 'lock' ) {
     throw ERR.TARGET_LOCKED
  }

  if (checkSpam(req.body.content)) throw ERR.IS_SPAM

  var cmt_reply_to, root_id, is_root = true, reply_to_id
  if (req.body.reply_to_id != null) {
      cmt_reply_to = await Comment.query().findById(req.body.reply_to_id)
      if (cmt_reply_to == null) throw ERR.NOT_FOUND

      // the child reply to root have no reply_to_id
      // for display convenience
      if (cmt_reply_to.is_root) {
        root_id = cmt_reply_to.id
        reply_to_id = null
      } else {
        root_id = cmt_reply_to.root_id
        reply_to_id = cmt_reply_to.id
      }
      is_root = false
  }

  var comment = await Comment.query().insertAndFetch({
      content: req.body.content, 
      root_id,
      reply_to_id,
      is_root, 
      post_id : req.body.pid,
      author_id: req.user.sub,
      censor_status: 'pass',
    })
    .eager('[author, post]');

  res.json({
      msg:"comment create",
      comment,
      code:0,
  })

}))

router.get('/:cid', jwt.auth(), wrap(async function(req, res, next) {

  var comment = await Comment.query()
                        .findById(req.params.cid)
                        .eager('[author, post]')

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

  if (comment == undefined) throw ERR.NO_SUCH_TARGET
  if (req.user.sub != comment.author_id) throw ERR.NOT_AUTHOR
  if (checkSpam(req.body.content)) throw ERR.IS_SPAM

  comment = await Comment
    .query()
    .patchAndFetchById(req.params.cid, {
      content:req.body.content
    });
    
  res.json({
      msg:"comment patch",
      comment,
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

  var u = await comment.$relatedQuery('liked_by_users')
                  .findById(req.user.sub)

  // check if user is liked
  var is_like_by_me = false
  if (u==null) {
    is_like_by_me = false
  } else {
    is_like_by_me = true
  }

  res.json({
      msg:"answer like got",
      total_likes: comment.total_likes,
      is_like_by_me,
      code:0,
  })

}))
router.post('/:cid/like', jwt.auth(), wrap(async function(req, res, next) {

  var comment = await Comment.query()
                        .findById(req.params.cid)

  if (comment == undefined) throw ERR.NO_SUCH_TARGET

  var u = await comment.$relatedQuery('liked_by_users')
                            .findById(req.user.sub)
  var is_like_by_me = true
  
  if (u==null) {
    await comment.$relatedQuery('liked_by_users')
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

  res.json({
      msg:"comment like set",
      total_likes: comment.total_likes,
      is_like_by_me,
      code:0,
  })

}))

router.post('/:cid/dislike', jwt.auth(), wrap(async function(req, res, next) {

  var comment = await Comment.query()
                        .findById(req.params.cid)

  if (comment == undefined) throw ERR.NO_SUCH_TARGET

  var u = await comment.$relatedQuery('liked_by_users')
                        .findById(req.user.sub)
  var is_like_by_me = false
  if (u==null) {
    // do nothing
  } else {
      await comment.$relatedQuery('liked_by_users')
                   .unrelate()
                   .where('uid', req.user.sub);
      await comment.$query()
            .decrement('total_likes', 1)

      comment = await Comment.query()
                          .findById(req.params.cid)
  }

  res.json({
      msg:"comment like set",
      total_likes: comment.total_likes,
      is_like_by_me,
      code:0,
  })


}))



module.exports = router

