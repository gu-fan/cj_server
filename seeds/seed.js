const _ = require('lodash')
const mt = require('moment')

const { doc } = require('./loader')
const { uid, slug } = require('../src/models/mixin/_uid')
const { Staff, model, Post, } = require('../src/models')

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

var users=[], posts=[], answers=[]
function createUser(idx){
  var id = uid()
  users.push(id)
  return {
    id: id,
    wechat_id: 'wx_' + uid(),
    name: slug(),
    created_at: times[idx] ? times[idx].format() : addMoreTime().format(),
    r_type: "web"
  }
}

function createPost(idx){
    var c_at  = times[idx].add(_.random(100,2500),'m')
    var qid = uid()
    times_q.push(c_at)       // track for answer
    posts.push(qid)

    var content = doc[idx].content||doc[idx].title
    return {
      id: qid,
      author_id: doc[idx].by_admin ? users[0] : (idx > 11 ? users[_.random(1,10)] :   users[_.random(1, idx+1)] ) ,
      content: content.replace(/\n/g,'\n\n'),
      created_at: c_at.format(),
      censor_status:'pass',
      total_comments: 1,
    }
}


function createStaff() {

    return {
      id: uid(), 
      username :'xydd',
      password:'xydd',
      permission: 'superadmin',
    }
  
}

exports.seed = function(knex, Promise) {
  console.log("SEEDING...")
  return Promise.all([
    knex('post').del(),
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
    knex('post')
    .then(function () {
      return knex('post').insert(_.range(TOTAL_COUNT).map(createPost))
    })
  ])

};
