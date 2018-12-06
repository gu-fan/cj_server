const yaml = require('js-yaml');
const fs   = require('fs');
const path = require("path");
const file = fs.readFileSync(path.resolve(__dirname, "./q.yml"));
const _ = require('lodash')
const mmt = require('moment')
 
var doc
try {
  doc = yaml.safeLoad(file);
  console.log(doc);
} catch (e) {
  doc = []
  console.log(e);
}

var time = mmt("2018-11-20T00:00:00+08:00")

var tmp = mmt(time)
var times = _.range(30).map(function(idx){
  tmp = mmt(tmp).add(_.random(1,15), 'h').add(_.random(1000), 's')
  return tmp
})
var times2 = [], times3 = []
var TOTAL_COUNT = doc.length

exports.seed = function(knex, Promise) {
  return Promise.all([
    knex('user').del()
    .then(function () {
      return knex('user').insert([
        {id:0, wx_id:'wx_fiaoweh081zk', name:'彬彬有法',created_at:times[0].format(), avatar:'/static/wx_avatar/admin.jpg', total_answer_zhichi: 8, total_answer_thanks: 3 },
        {id:1, wx_id:'wx_a0d9aejlmvlz1', name:'青葱岁月',created_at:times[1].format(), avatar:'/static/wx_avatar/1.jpg'},
        {id:2, wx_id:'wx_g0zaj2zlfawe0', name:'笑说再见',created_at:times[2].format(), avatar:'/static/wx_avatar/2.jpg', total_answer_zhichi: 2,},
        {id:3, wx_id:'wx_gha9uwfy982hz', name:'alf01j8',created_at: times[3].format()},
        {id:4, wx_id:'wx_a0f9k234f0kjf', name:'君子好逑～',created_at:times[4].format(), avatar:'/static/wx_avatar/4.jpg', total_answer_zhichi: 1,},
        {id:5, wx_id:'wx_zvm8342rjojzo', name:'lmf10z1',created_at:times[5].format()},
        {id:6, wx_id:'wx_z90fe01091304', name:'明明很困',created_at:times[6].format(), avatar:'/static/wx_avatar/6.jpg', total_answer_zhichi: 3,},
        {id:7, wx_id:'wx_kgjrgif0e9fua', name:'Angel、浮熙', created_at:times[7].format(),avatar:'/static/wx_avatar/7.jpg'},
        {id:8, wx_id:'wx_0fwaflemalej1', name:'知道长啥样', created_at:times[8].format(),avatar:'/static/wx_avatar/8.jpg'},
        {id:9, wx_id:'wx_09aewlfmzaalk1', name:'Rencontre',created_at:times[9].format(), avatar:'/static/wx_avatar/9.jpg', total_answer_zhichi: 4,},
        {id:10, wx_id:'wx_09aewlfmzalk1', name:'单独等待',created_at:times[10].format(), avatar:'/static/wx_avatar/10.jpg'},
        {id:11, wx_id:'wx_1fa8fajzlkjql', name:'张林远', created_at:times[11].format(), avatar:'/static/wx_avatar/11.jpg', total_answer_thanks: 2, }
      ]);
    })
    ,
    knex('question').del()
    .then(function () {
      var time = mmt("2018-11-13T23:10:10+08:00")
      var questions = _.range(TOTAL_COUNT).map(function(idx){
        var c_at  = times[idx].add(_.random(2,1500),'m')
        times2.push(c_at)
        var content = doc[idx].content||doc[idx].title
        return {
          id: idx,
          title: doc[idx].title,
          content: content.replace(/\n/g,'\n\n'),
          author_id: doc[idx].by_admin ? 0 : (idx > 11 ? _.random(1,10) :   _.random(1, idx+1) ) ,
          created_at: c_at.format(),
          censor_status:'pass',
          total_answers: 1,
        }
      })
      return knex('question').insert(questions);
    })
    ,
    knex('answer').del()
    .then(function () {
      var time = mmt("2018-11-14T10:10:10+08:00")
      var answers = _.range(TOTAL_COUNT).map(function(idx){
        var c_at  = times2[idx].add(_.random(2,1500),'m')
        var content = doc[idx].answer
        times3.push(c_at)
        return {
          id: idx, 
          content: content.replace(/\n/g,'\n\n'),
          author_id: 
          doc[idx].by_admin ? 0 : (
              _.random(0,4) > 2 ? 0 : _.random(2,10)
          ), 
          question_id: idx,
          created_at:c_at.format(),
          censor_status: 'pass',
          total_zhichi: _.random(0,12), 
          total_thanks: _.random(0,2), 
          is_selected: _.random(0,5) > 3
        }
      })

      return knex('answer').insert(answers);
    })
  ])

};
