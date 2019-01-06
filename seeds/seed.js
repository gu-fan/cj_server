const _ = require('lodash')
const mt = require('moment')

const { doc } = require('./loader')
const { uid, slug } = require('../src/models/mixin/_uid')
const { Staff, model } = require('../src/models')

const knex = model.bareInit(require('config').db)


// create 100 user
// create 200 question
// create 400 answer

var time = mt("2018-12-10")
var tmp = time.clone()

// +2~15h to tmp
function addMoreTime(){
  tmp = tmp.clone()
            .add(_.random(18, 35), 'h')
            .add(_.random(500), 's')
  return tmp
}

var times = _.range(50).map(addMoreTime)


var times_q = [], times3 = []
var TOTAL_COUNT = doc.length

var users=[], questions=[], answers=[]
function createUser(idx){
  var id = uid()
  users.push(id)
  return {
    id: id,
    wx_id: 'wx_' + uid(),
    name: slug(),
    created_at: times[idx] ? times[idx].format() : addMoreTime().format(),
    total_answer_zhichi: _.random(1, 10),
    total_answer_thanks: _.random(0, 5),
    r_type: 1 
  }
}

function createQuestion(idx){
    var c_at  = times[idx].add(_.random(100,2500),'m')
    var qid = uid()
    times_q.push(c_at)       // track for answer
    questions.push(qid)
    console.log(doc[idx].title)

    var content = doc[idx].content||doc[idx].title
    return {
      id: qid,
      author_id: doc[idx].by_admin ? users[0] : (idx > 11 ? users[_.random(1,10)] :   users[_.random(1, idx+1)] ) ,
      content: content.replace(/\n/g,'\n\n'),
      // content: 'question',
      title: doc[idx].title,
      created_at: c_at.format(),
      censor_status:'pass',
      total_answers: 1,
    }
}

function createAnswer(idx) {

    var c_at  = times_q[idx].add(_.random(100, 2500),'m')
    var content = doc[idx].answer

    return {
      id: uid(), 
      content: content.replace(/\n/g,'\n\n'),
      // content: 'answer',
      author_id: doc[idx].by_admin ? users[0] : (
          _.random(0,4) > 2 ? users[0] : users[_.random(2,10)]
      ), 
      question_id: questions[idx],
      created_at:c_at.format(),
      censor_status: 'pass',
      total_zhichi: _.random(0,6), 
      total_thanks: _.random(0,2), 
      is_selected: _.random(0, 5) > 3
    }
}

function createRndAnswer() {

    var idx = _.random(0, TOTAL_COUNT-1)
    var c_at  = times_q[idx].add(_.random(100, 2500),'m')

    return {
      id: uid(), 
      content: slug(),
      author_id: users[_.random(1, 99)], 
      question_id: questions[idx],
      created_at: c_at.format(),
      censor_status: 'pass',
      total_zhichi: _.random(0,1), 
      total_thanks: _.random(0,1), 
      is_selected: 0,
    }

}

function createStaff() {

    return {
      id: uid(), 
      username :'fzbb',
      password:'fzbb',
      permission: 'superadmin',
    }
  
}

exports.seed = function(knex, Promise) {
  console.log("SEEDING...")
  return Promise.all([
    knex('answer').del(),
    knex('question').del(),
    knex('user').del(),
    knex('staff').del()
    .then(function () {
      // return knex('staff').insert(createStaff())
      return Staff.query().insert(createStaff())
    }),
    knex('user')
    .then(function () {
      return knex('user').insert(_.range(100).map(createUser))
    }),
    knex('question')
    .then(function () {
      return knex('question').insert(_.range(TOTAL_COUNT).map(createQuestion))
    })
    .then(()=>{
      Promise.all([
        knex('answer').insert(_.range(TOTAL_COUNT).map(createAnswer)),
        knex('answer').insert(_.range(100).map(createRndAnswer))
      ])
    })
  ])

};
