const express = require('express')
const router = express.Router({mergeParams: true})
const {promisify, wrap, delay} = require('../common/promise')
const jwt = require('../common/jwt-auth')
const {ERR, MSG} = require('../code')

const {uid, slug}= require('../models/mixin/_uid')

const {Question, User, Answer}  = require('../models')

const commentRoute = require('./comment')

router.get('/', jwt.auth(), wrap(async function(req, res, next) {

  var question = await Question.query()
                        .findById(req.params.pid)
                        .eager('[author, answers]')

  if (question == undefined) throw ERR.NO_SUCH_NOTE


  var answers = question.answers


  res.json({
      msg:"answers got",
      answers,
      code:0,
  })

}))

router.post('/', jwt.auth(), wrap(async function(req, res, next) {

  var answers = await Answer.query().insertGraph([{
    content: req.body.content, 
    question:{
      id: req.params.pid,
    },
    author: {
      id: req.user.sub,
    },
  }], {
    relate: true
  })
    .eager('[author, question]');

  var newAnswer = answers[0]

  res.json({
      msg:"answer create",
      answer:newAnswer,
      code:0,
  })

}))

router.get('/:aid', jwt.auth(), wrap(async function(req, res, next) {

  var answer = await Answer.query()
                        .findById(req.params.aid)
                        .eager('[author, question, comments.[author,answer.question, reply_to.author]]')

  if (answer == undefined) throw ERR.NO_SUCH_NOTE
  
  res.json({
      msg:"answer got",
      answer,
      code:0,
  })

}))

router.put('/:aid', jwt.auth(), wrap(async function(req, res, next) {

  var answer = await Answer.query()
                        .findById(req.params.aid)
                        .eager('author')
  if (answer == undefined) throw ERR.NO_SUCH_NOTE
  const updatedAnswer = await Answer
    .query()
    .patchAndFetchById(req.params.aid, {content:req.body.content});
    

  res.json({
      msg:"answer patch",
      updatedAnswer,
      code:0,
  })

}))

router.delete('/:aid', jwt.auth(), wrap(async function(req, res, next) {

  var answer = await Answer.query()
                        .findById(req.params.aid)
                        .eager('author')
  if (answer == undefined) throw ERR.NO_SUCH_NOTE
  
  const numberOfDeletedRows = await Answer 
    .query()
    .deleteById(req.params.aid)

  res.json({
      msg:"answer delete",
      numberOfDeletedRows,
      code:0,
  })

}))

router.get('/:aid/like', jwt.auth(), wrap(async function(req, res, next) {

  var answer = await Answer.query()
                        .findById(req.params.aid)
  if (answer == undefined) throw ERR.NO_SUCH_NOTE

  var u = await answer.$relatedQuery('liked_users')
                  .findById(req.user.sub)
  var liked = 0
  if (u==null) {
    liked = 0
  } else {
    liked = u.num
  }
  // check if user is liked
  var liked_users = await answer.$relatedQuery('liked_users')

  
  res.json({
      msg:"answer like got",
      answer,
      liked,
      liked_users,
      code:0,
  })

}))
router.post('/:aid/like', jwt.auth(), wrap(async function(req, res, next) {

  var answer = await Answer.query()
                        .findById(req.params.aid)

  if (answer == undefined) throw ERR.NO_SUCH_NOTE

  var u = await answer.$relatedQuery('liked_users')
                  .findById(req.user.sub)
  if (u==null) {
    await answer.$relatedQuery('liked_users')
    .relate({
      id: req.user.sub,
      num: 1,
    });
    await answer.$query()
          .increment('total_zhichi', 1)
  } else {
    if (u.num == -1) {
      await answer.$relatedQuery('liked_users')
        .update({num:0})
        .where('uid', req.user.sub);
      await answer.$query()
            .decrement('total_fandui', 1)
      await answer.$query()
            .increment('total_zhichi', 1)
    } else if (u.num == 1) {
      // do nothing
    } else {        // = 0
      await answer.$relatedQuery('liked_users')
        .update({num:1})
        .where('uid', req.user.sub);
      await answer.$query()
            .increment('total_zhichi', 1)
    }
  }

  var liked_users = await answer.$relatedQuery('liked_users')
  answer = await Answer.query()
                      .findById(req.params.aid)

  res.json({
      msg:"answer like set",
      answer,
      liked_users,
      code:0,
  })

}))

router.post('/:aid/dislike', jwt.auth(), wrap(async function(req, res, next) {

  var answer = await Answer.query()
                        .findById(req.params.aid)

  if (answer == undefined) throw ERR.NO_SUCH_NOTE

  var u = await answer.$relatedQuery('liked_users')
                  .findById(req.user.sub)
  var user
  if (u==null) {
    await answer.$relatedQuery('liked_users')
    .relate({
      id: req.user.sub,
      num: -1,
    });
    await answer.$query()
          .increment('total_fandui', 1)
  } else {
    if (u.num == 1) {
      await answer.$relatedQuery('liked_users')
        .update({num:0})
        .where('uid', req.user.sub);
      await answer.$query()
            .increment('total_fandui', 1)
      await answer.$query()
            .decrement('total_zhichi', 1)

      
    } else if (u.num == -1) {
      // do nothing
    } else {        // = 0
      await answer.$relatedQuery('liked_users')
        .update({num:-1})
        .where('uid', req.user.sub);
      await answer.$query()
            .increment('total_fandui', 1)
      
    }
  }

  var liked_users = await answer.$relatedQuery('liked_users')

  answer = await Answer.query()
                      .findById(req.params.aid)
  
  res.json({
      msg:"answer dislike set",
      user,
      answer,
      liked_users,
      code:0,
  })

}))

router.use('/:aid/c', commentRoute);

module.exports = router

