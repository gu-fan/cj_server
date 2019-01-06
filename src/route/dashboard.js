const router = require('express').Router()
const fly=require("flyio")
const knex = require('knex')
const config = require('config')

const moment = require('moment')
// const dayjs = require('dayjs')

const _ = require('lodash')

const jwt = require('../common/jwt-auth')
const {ERR, MSG} = require('../code')
const {wrap, delay} = require('../common/promise')

const {hasPermission} = require('../common/permission')
const {User, Staff, Question, Answer}= require('../models')

// console.log(dayjs('2018-3-3'))
// console.log(dayjs().set({'hour':7,'minute':0}).format())

/** Auth with token
 * @get /auth/check
 *
 * @authorize user
 *
 * @return 0
 * @throw AUTH_COMMON_ERROR
 * @throw NO_SUCH_USER
 */

  // moment:sunday is 0 mysql:sunday is 6
  // moment:monday is 1 mysql:monday is 0
  function momentWeek(i){
    return i==0 ? 6 : i-1
  }
function normalizeWeekCount(count){

  var c = _.reduce(count,
      // (acc, { weekday, total, datetime}) => ({ ...acc, [weekday]: {total, datetime}}),
      (acc, { weekday, total, datetime}) => ({ ...acc, [weekday]: total}),
      {}
  )

  // loop a week to check if any is empty
  _.range(7).forEach(i=>{
    if (c[i] == null) {
      var time 
      if (moment().day() == 0) {
         time = moment().day(-7)
      } else {
         time = moment()
      }
      c[i] = 0
      // c[i] =  {
      //   total:0,
      //   datetime: time.day(i).format('YYYY-MM-DD')
      // }
    }
  })

  var d = Object.keys(c).map(i=>{
    return c[i]
  })
  return d
}
var getThisWeek = function(queryBuilder, knex) {
    queryBuilder.select(knex.raw('count(*) as total, DATE_FORMAT(created_at,"%Y-%m-%d") as datetime, DATE_FORMAT(created_at,"%w") as weekday'))
        .having(knex.raw('datetime >= curdate() - INTERVAL DAYOFWEEK(curdate())+6 DAY AND datetime < curdate() - INTERVAL DAYOFWEEK(curdate()) DAY'))
        .groupByRaw('datetime')
};
var getLastWeek = function(queryBuilder, knex) {
    queryBuilder.select(knex.raw('count(*) as total, DATE_FORMAT(created_at,"%Y-%m-%d") as datetime, DATE_FORMAT(created_at,"%w") as weekday'))
        .having(knex.raw('datetime >= curdate() - INTERVAL DAYOFWEEK(curdate())+13 DAY AND datetime < curdate() - INTERVAL DAYOFWEEK(curdate())+6 DAY'))
        .groupByRaw('datetime')

};

router.get('/.ping', jwt.auth(), wrap(async function(req, res, next) {

  // https://stackoverflow.com/questions/6089960/mysql-query-to-select-data-from-last-week 

  var userThisWeek = await User.query().modify(getThisWeek, req.knex)
  var userLastWeek = await User.query().modify(getLastWeek, req.knex)

  var questionThisWeek = await Question.query().modify(getThisWeek, req.knex)
  var questionLastWeek = await Question.query().modify(getLastWeek, req.knex)

  var answerThisWeek = await Answer.query().modify(getThisWeek, req.knex)
  var answerLastWeek = await Answer.query().modify(getLastWeek, req.knex)

  var bindingThisWeek = await User.query().whereNotNull('avatar').modify(getThisWeek, req.knex)
  var bindingLastWeek = await User.query().whereNotNull('avatar').modify(getLastWeek, req.knex)

  res.json({
    ChartData:{
      UserNew: {
        thisWeekData: normalizeWeekCount(userLastWeek),
        lastWeekData: normalizeWeekCount(userThisWeek),
      },
      Bindings: {
        thisWeekData: normalizeWeekCount(bindingThisWeek),
        lastWeekData: normalizeWeekCount(bindingLastWeek),
      },
      Questions: {
        thisWeekData: normalizeWeekCount(questionThisWeek),
        lastWeekData: normalizeWeekCount(questionLastWeek),
      },
      Answers: {
        thisWeekData: normalizeWeekCount(answerThisWeek),
        lastWeekData: normalizeWeekCount(answerLastWeek),
      },
    },
    ...MSG.STAFF_VALID
  })

}))


module.exports = router

