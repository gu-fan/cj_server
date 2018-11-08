const express = require('express')
const router = express.Router({mergeParams: true})
const {promisify, wrap, delay} = require('../common/promise')
const jwt = require('../common/jwt-auth')
const {ERR, MSG} = require('../code')

const {uid, slug}= require('../models/mixin/_uid')

const {Question, User, Answer}  = require('../models')

const commentRoute = require('./comment')

router.get('/', jwt.auth(), wrap(async function(req, res, next) {

  var count = await Answer.query()
                          .count()

  res.json({
      msg:"answers count",
      count:count[0]['count(*)'],
      code:0,
  })

}))

router.post('/', jwt.auth(), wrap(async function(req, res, next) {

  var question = await Question.query().findById(req.body.qid)

  if (question == undefined) throw ERR.NO_SUCH_TARGET
  if (question.lock_status == 'lock' ) {
     throw ERR.TARGET_LOCKED
  } else if ( question.censor_status == 'reject' || question.censor_status == undefined  ) {
     throw ERR.CENSOR_NOT_PASS
  }

  var answers = await Answer.query().insertGraph([{
    content: req.body.content, 
    question:{
      id: req.body.qid,
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

  if (req.query.t == 'edit') {
    var answer = await Answer.query()
                          .findById(req.params.aid)
                          .eager('question')

    if (answer == undefined) throw ERR.NO_SUCH_TARGET
    res.json({
        msg:"answer got",
        answer,
        code:0,
    })
  } else {
  var answer = await Answer.query()
                        .findById(req.params.aid)
                        // WORKS, but seems use modifyer is too heavy for loading the lists
                        // .select([
                        //     Answer.relatedQuery('comments')
                        //       .count()
                        //       .as('total_comment'),
                        // ])
                        // .eager('[author, question, comments(sort).[author, answer.question, reply_to.author, liked_users(byMe)]]',
                        // {
                        //   byMe: (builder)=>{
                        //       builder.where('uid', req.user.sub)
                        //   },
                        //   sort: (builder)=>{
                        //       builder.orderBy('created_at')
                        //   }
                              
                        // })
                        .eager('[author, question]')


  if (answer == undefined) throw ERR.NO_SUCH_TARGET
  var comments = await answer.$relatedQuery('comments')
                        .eager('[author, answer.question, reply_to.author, liked_users(byMe)]',         {
                          byMe: (builder)=>{
                              builder.where('uid', req.user.sub)
                          },
                        })
                        .orderBy('created_at', 'desc')
                        .page(req.query.page||0,5)

  // remap is_like by me
  comments.results.map((comment)=>{
    if (comment.liked_users.length>0) {
      comment.is_like = true
    } else {
      comment.is_like = false
    }
    delete comment.liked_users
  })

  // check zhichi and fandui by me
  var u = await answer.$relatedQuery('liked_users')
                  .findById(req.user.sub)

  answer.is_zhichi=false
  answer.is_fandui=false

  if (u==null || u==undefined) {
  } else {
    if (u.num== 1){
      answer.is_zhichi = true
    } else if (u.num== -1) {
      answer.is_fandui = true
    }
  }
  
  res.json({
      msg:"answer got",
      answer,
      comments,
      code:0,
  })
  }

}))

router.put('/:aid', jwt.auth(), wrap(async function(req, res, next) {

  console.log(1)
  var answer = await Answer.query()
                        .findById(req.params.aid)
  console.log(2)
  if (answer == undefined) throw ERR.NO_SUCH_TARGET
  if (req.user.sub != answer.author_id) throw ERR.NOT_AUTHOR
  
  console.log(3)
  var status 
  if (answer.censor_status == 'reject') {
      status = 'reject_review'
  } else {
      status = answer.censor_status
  }

  await answer.$relatedQuery('tracks')
       .insertAndFetch({content:'edit', setter_id:req.user.sub})
  console.log(4)

  answer = await Answer
    .query()
    .patchAndFetchById(req.params.aid, 
            {content:req.body.content, censor_status:status})
      .eager('author')

  res.json({
      msg:"answer patch",
      answer,
      code:0,
  })

}))

router.delete('/:aid', jwt.auth(), wrap(async function(req, res, next) {

  var answer = await Answer.query()
                        .findById(req.params.aid)
                        .eager('author')
  if (answer == undefined) throw ERR.NO_SUCH_TARGET
  
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
  if (answer == undefined) throw ERR.NO_SUCH_TARGET

  var u = await answer.$relatedQuery('liked_users')
                  .findById(req.user.sub)
  var is_zhichi=false, is_fandui=false
  if (u==null || u==undefined) {
  } else {
    if (u.num== 1){
      is_zhichi = true
    } else if (u.num== -1) {
      is_fandui = true
    }
  }

  
  // var liked_users = await answer.$relatedQuery('liked_users')

  res.json({
      msg:"answer like got",
      total_zhichi: answer.total_zhichi,
      total_fandui: answer.total_fandui,
      is_zhichi,
      is_fandui,
    
      // answer,
      // liked_users,
      code:0,
  })

}))
router.post('/:aid/like', jwt.auth(), wrap(async function(req, res, next) {

  var answer = await Answer.query()
                        .findById(req.params.aid)

  if (answer == undefined) throw ERR.NO_SUCH_TARGET

  var author = await User.query()
                        .findById(answer.author_id)

  var u = await answer
                  .$relatedQuery('liked_users')
                  .findById(req.user.sub)

  var is_zhichi=true, is_fandui=false

  if (u==null || u==undefined) {
    await answer.$relatedQuery('liked_users')
          .relate({
            id: req.user.sub,
            num: 1,
          });

    await answer.$query()
          .increment('total_zhichi', 1)
    await author.$query()
          .increment('total_answer_zhichi', 1)

  } else {
    if (u.num == -1) {
      await answer.$relatedQuery('liked_users')
        .update({num:0})
        .where('uid', req.user.sub);
      await answer.$query()
            .decrement('total_fandui', 1)
      await author.$query()
            .decrement('total_answer_fandui', 1)
      is_zhichi = false
    } else if (u.num == 1) {
      // do nothing
    } else {        // = 0

      await answer.$relatedQuery('liked_users')
        .update({num:1})
        .where('uid', req.user.sub);

      await answer.$query()
            .increment('total_zhichi', 1)

      await author.$query()
            .increment('total_answer_zhichi', 1)
    }
  }

  answer = await Answer.query()
                      .findById(req.params.aid)

  res.json({
      msg:"answer like set",
      total_zhichi: answer.total_zhichi,
      total_fandui: answer.total_fandui,
      is_zhichi,
      is_fandui,

      code:0,
  })

}))

router.post('/:aid/dislike', jwt.auth(), wrap(async function(req, res, next) {

  var answer = await Answer.query()
                        .findById(req.params.aid)

  if (answer == undefined || answer==null) throw ERR.NO_SUCH_TARGET

  var u = await answer.$relatedQuery('liked_users')
                  .findById(req.user.sub)
  var user
  var is_zhichi=false, is_fandui=true
  
  var author = await User.query()
                        .findById(answer.author_id)

  if (u==null || u==undefined) {
    await answer.$relatedQuery('liked_users')
    .relate({
      id: req.user.sub,
      num: -1,
    });
    await answer.$query()
          .increment('total_fandui', 1)
    await author.$query()
          .increment('total_answer_fandui', 1)

  } else {
    if (u.num == 1) {

      await answer.$relatedQuery('liked_users')
        .update({num:0})
        .where('uid', req.user.sub);

      await answer.$query()
            .decrement('total_zhichi', 1)

      await author.$query()
            .decrement('total_answer_zhichi', 1)

      is_fandui = false
      
    } else if (u.num == -1) {
      // do nothing
    } else {        // = 0

      await answer.$relatedQuery('liked_users')
        .update({num:-1})
        .where('uid', req.user.sub);
      await answer.$query()
            .increment('total_fandui', 1)
      await author.$query()
            .increment('total_answer_fandui', 1)
      
    }
  }

  // var liked_users = await answer.$relatedQuery('liked_users')

  answer = await Answer.query()
                      .findById(req.params.aid)
  
  res.json({
      msg:"answer dislike set",
      total_zhichi: answer.total_zhichi,
      total_fandui: answer.total_fandui,
      is_zhichi,
      is_fandui,

      // liked_users,
      code:0,
  })
  

}))

// router.use('/:aid/c', commentRoute);

module.exports = router

