const express = require('express')
const router = express.Router({mergeParams: true})
const {promisify, wrap, delay} = require('../common/promise')
const jwt = require('../common/jwt-auth')
const {ERR, MSG} = require('../code')

const moment = require('moment')

const {Post, User }  = require('../models')
const {relateTagNameWithPost,relateTagWithUser} = require('../services/tag')

// const commentRoute = require('./comment')

const { getUser } = require('../services/user')
const { getAnswer } = require('../services/answer')
const { getPost } = require('../services/post')

const { checkSpam, checkSpamExact } = require('../common/spam')
const { getCount } = require('../common')
const {encrypt, decrypt, generateKey, checkValid}  =require('../common/crypto')

router.get('/', jwt.auth(), wrap(async function(req, res, next) {

  var count = await Post.query()
                          .select('id')
                          .count()

  res.json({
      msg:"post count",
      count:count[0]['count(*)'],
      code:0,
  })

}))

router.post('/', jwt.auth(), wrap(async function(req, res, next) {

  if (req.body.content =='' || req.body.content == null) {
    if (req.body.content_json == null) throw ERR.NEED_CONTENT
    if (req.body.content_json.images == null) throw ERR.NEED_CONTENT
    if (req.body.content_json.images.length==0 ) throw ERR.NEED_CONTENT
  }

  if (checkSpam(req.body.content)) throw ERR.IS_SPAM

  let tags = req.body.content_json ? req.body.content_json.tags : null
  if (tags && tags.length > 3) throw ERR.POST_LIMIT_3_TAG

  let is_public =req.body.is_public
  if (is_public === undefined || is_public === null ) {
    is_public = true
  }
  is_public = !!is_public

  let post = await Post.query()
    .insert({
      content: req.body.content, 
      content_json: req.body.content_json, 
      weather: req.body.weather,
      country: req.body.country,
      city: req.body.city,
      lat: req.body.lat,
      lon: req.body.lon,
      author_id: req.user.sub,
      is_public: is_public,
      is_editor_choice: true,       // NOTE: this should change when user grows more
      censor_status: 'pass',
    })
    .eager('author(safe)');


  if (tags && tags.length>0) {
    for (let i in tags) {
      let tagname = tags[i]
      let {tag, is_unique} = await relateTagNameWithPost(tagname, post)
      await relateTagWithUser(tag.id, req.user.sub, is_unique)
    }
  }

  res.json({
      post,
      ...MSG.POST_SUCCESS
  })

}))

// the comment tree
//  root
//    child
//    child: reply_to
//    child
//    child
//  root
//    child
//    child

// when reply to a comment
// the target became the reply_to item

// and if target have no parent, 
// then it is a root comment, and current is not
//
//   current's root_id is target
//   current's reply_to_id is target
//
// when reply to a comment with root
// both have the parent as root
//
//   current's root_id is root
//   current's reply_to_id is target
//
// so the post will get
//
// comments: (which is the root array)
//
// child_comments: (which is the array of child array)
// limit with page
//
// child_comments have it's comment_reply_to, 
// indicates it's parent


router.get('/:pid', jwt.auth(), wrap(async function(req, res, next) {

  if (req.query.t == 'edit') {

    if (req.user.sub != post.author_id) throw ERR.NOT_AUTHOR

    var post = await Post.query()
                          .findById(req.params.pid)

    if (post == undefined) throw ERR.NO_SUCH_TARGET

    res.json({
        msg:"post got",
        post,
        code:0,
    })
  } else {

    var post = await Post.query()
                          .findById(req.params.pid)
                          .eager('[author(safe),tags]')

    if (post == undefined) throw ERR.NO_SUCH_TARGET

    // the share token
    // req.query.st
    // st = post.id + expire_time , sha with post.author.secrect
    // if st expire
    // share is expired

    // XXX
    // 如果我们这样设置，
    // 生成public posts时也需要生成
    //
    // XXX 
    // 因为小程序限制32个字符，暂时不用
    // if (!post.is_public) {
    //   if (req.query.st) {
    //     // if not valid, it will throw error
    //     checkValid(post.id, req.query.st)
    //   } else {
    //     if (req.user.sub != post.author_id) throw ERR.NOT_PUBLIC
    //   }
    // }
    // XXX
    // should check if it's expire over 7 day?
    // if (req.user.sub == post.author_id) {
    //   let st = generateKey(post.id)
    //   post.st = st
    // }

    var comments = await post
      .$relatedQuery('comments')
      .where('is_root', true)
      .naiveEager()     // XXX, this is slow, but can use 'limit'
      .eager(`[author(safe), 
                liked_by_users(byMe), 
                child_count(count),
                child_comments(limit5, timeDesc).[author(safe), comment_reply_to.author(safe)]]`, {
          byMe: builder=>{
            builder.where('uid', req.user.sub)
          }
        })
        .orderBy('created_at', 'desc')
        .page(req.query.page||0,5)

    // CHECK COMMENT IS LIKE BY ME
    // GET CHILD COUNT
    comments.results.map((comment)=>{
      if (comment.liked_by_users.length>0) {
        comment.is_like_by_me = true
      } else {
        comment.is_like_by_me = false
      }
      delete comment.liked_by_users

      comment.child_count = getCount(comment.child_count)

    })
    delete post.comments


    // CHECK POST IS LIKE BY ME
    var u = await post.$relatedQuery('liked_by_users')
                          .findById(req.user.sub)

    if (u==null || u==undefined) {
      post.is_like_by_me = false
    } else {
      post.is_like_by_me = true
    }
    delete post.liked_by_users


    if (post.is_deleted) {
      delete post.content
      delete post.content_json
    }
  
    res.json({
        msg:"post got",
        post,
        comments,
        code:0,
    })
  }

}))

router.put('/:pid', jwt.auth(), wrap(async function(req, res, next) {

  var post = await Post.query()
                        .findById(req.params.pid)
  if (post == undefined) throw ERR.NO_SUCH_TARGET
  if (req.user.sub != post.author_id) throw ERR.NOT_AUTHOR
  var spam_result =checkSpamExact(req.body.content)
  if (spam_result[1]) {
      throw ERR.IS_SPAM
      // return res.stauts(400).json({code:1, msg:spam_result[0]})
  }
  
  var status 
  if (post.censor_status == 'reject') {
      status = 'review'
  } else {
      status = post.censor_status
  }

  post = await Post
    .query()
    .patchAndFetchById(req.params.pid, 
      {
        content: req.body.content,
        content_json: req.body.content_json,
        censor_status: status,
        last_edit_at: moment().format(),
      })
      .eager('author')

  res.json({
      msg:"post edit",
      post,
      code:0,
  })

}))

router.delete('/:pid', jwt.auth(), wrap(async function(req, res, next) {

  var post = await getPost(req.params.pid)
  var user = await getUser(req.user.sub)

  if (post.is_deleted) throw ERR.ALREADY_DELETED

  if (!user.is_staff && req.user.sub != post.author_id) {
    if (req.user.sub != post.author_id) throw ERR.NOT_AUTHOR
    if (!user.is_staff) throw ERR.NO_PERMISSION
  }

  const deleted = await post 
          .$query()
          .patch({'is_deleted': true})

  res.json({
      msg:"post deleted",
      deleted,
      code:0,
  })

}))



router.post('/:pid/hide', jwt.auth(), wrap(async function(req, res, next) {

  var post = await Post.query()
                        .findById(req.params.pid)

  if (post== undefined) throw ERR.NO_SUCH_TARGET
  if (req.user.sub != post.author_id) throw ERR.NOT_AUTHOR

  post = await post.$query()
            .patchAndFetch({is_public: false})
    
  res.json({
      msg:"post hide",
      post,
      code:0,
  })


}))

router.post('/:pid/toggle_pick', jwt.auth(), wrap(async function(req, res, next) {

  var post = await Post.query()
                        .findById(req.params.pid)

  if (post== undefined) throw ERR.NO_SUCH_TARGET
  
  var user = await getUser(req.user.sub)
  if (!user.is_staff) throw ERR.NO_PERMISSION

  post = await post.$query()
            .patchAndFetch({is_editor_choice: !post.is_editor_choice})
    
  res.json({
      msg:"post pick",
      post,
      is_editor_choice: post.is_editor_choice,
      code:0,
  })


}))
router.get('/:pid/share', jwt.auth(), wrap(async function(req, res, next) {

  var post = await Post.query()
                        .findById(req.params.pid)

  if (post== undefined) throw ERR.NO_SUCH_TARGET
  await post.$query.increment('total_shares', 1)

  res.json({
      msg:"post share add",
      code:0,
  })


}))
router.get('/:pid/like', jwt.auth(), wrap(async function(req, res, next) {

  var post = await Post.query()
                        .findById(req.params.pid)
  if (post== undefined) throw ERR.NO_SUCH_TARGET

  var u = await post.$relatedQuery('liked_by_users')
                  .findById(req.user.sub)

  var is_like_by_me = false
  if (u==null || u==undefined) {
  } else {
    is_like_by_me = true
  }

  res.json({
      msg:"post like got",
      is_like_by_me,
      post,
      code:0,
  })


}))

router.post('/:pid/like', jwt.auth(), wrap(async function(req, res, next) {

  var post = await Post.query()
                        .findById(req.params.pid)

  if (post== undefined) throw ERR.NO_SUCH_TARGET

  var author = await User.query()
                        .findById(post.author_id)
                        .eager('detail')

  var u = await post
                  .$relatedQuery('liked_by_users')
                  .findById(req.user.sub)

  if (u==null || u==undefined) {
    await post.$relatedQuery('liked_by_users')
          .relate({
            id: req.user.sub,
            value: 1,
          });

    await post.$query()
          .increment('total_likes', 1)

    await author.detail.$query()
          .increment('total_post_likes', 1)

  } else {
    // do nothing, the value already 1
  }


  post = await Post.query()
                  .findById(req.params.pid)

  var is_like_by_me = true

  res.json({
      msg:"post like set",
      total_likes: post.total_likes,
      is_like_by_me,
      code:0,
  })

}))

router.post('/:pid/dislike', jwt.auth(), wrap(async function(req, res, next) {

  var post = await Post.query()
                        .findById(req.params.pid)

  if (post==undefined || post==null) throw ERR.NO_SUCH_TARGET

  var u = await post.$relatedQuery('liked_by_users')
                  .findById(req.user.sub)
  
  var author = await User.query()
                        .findById(post.author_id)
                        .eager('detail')

  if (u==null || u==undefined) {
    // do nothing

  } else {

      await post.$relatedQuery('liked_by_users')
            .unrelate()
            .where('uid', req.user.sub);

      await post.$query()
            .decrement('total_likes', 1)

      await author.detail.$query()
            .decrement('total_post_likes', 1)

  }

  var is_like_by_me = false

  post = await Post.query()
                  .findById(req.params.pid)
  
  res.json({
      msg:"post dislike set",
      total_likes: post.total_likes,
      is_like_by_me, 
      code:0,
  })
  

}))

router.get('/:pid/set_choice', jwt.auth(), wrap(async function(req, res, next) {

  var user = await getUser(req.user.sub)
  if (!user.is_staff) throw ERR.NO_PERMISSION

  var post = await Post.query()
          .patchAndFetchById(req.params.pid, 
            {is_editor_choice: true})


  res.json({
    msg:'post selected',
    post,
    code:0,
  })

}))

router.get('/:pid/unset_choice', jwt.auth(), wrap(async function(req, res, next) {

  var user = await getUser(req.user.sub)
  if (!user.is_staff) throw ERR.NO_PERMISSION

  var post = await Post.query()
    .patchAndFetchById(req.params.pid, 
    {is_editor_choice: false})


  res.json({
    msg:'post unselected',
    post,
    code:0,
  })

}))

router.get('/:pid/comments', jwt.auth(), wrap(async function(req, res, next) {

    var post = await Post.query()
                          .findById(req.params.pid)
                          .eager('[author(safe),tags]')

    if (post == undefined) throw ERR.NO_SUCH_TARGET

    if (!post.is_public) {
      if (req.user.sub != post.author_id) throw ERR.NOT_AUTHOR
    }

    var comments = await post
      .$relatedQuery('comments')
      .where('is_root', true)
      .naiveEager()     // XXX, this is slow, but can use 'limit'
      .eager(`[author(safe), 
                liked_by_users(byMe), 
                child_count(count),
                child_comments(limit5, timeDesc).[author(safe), comment_reply_to.author(safe)]]`, {
          byMe: builder=>{
            builder.where('uid', req.user.sub)
          }
        })
        .orderBy('created_at', 'desc')
        .page(req.query.page||0,5)

    // CHECK COMMENT IS LIKE BY ME
    // GET CHILD COUNT
    comments.results.map((comment)=>{
      if (comment.liked_by_users.length>0) {
        comment.is_like_by_me = true
      } else {
        comment.is_like_by_me = false
      }
      delete comment.liked_by_users

      comment.child_count = getCount(comment.child_count)

    })

  
    res.json({
        msg:"post comments got",
        comments,
        code:0,
    })

}))




module.exports = router

