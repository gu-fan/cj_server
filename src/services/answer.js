const {Question, Answer, User}  = require('../models')
const {ERR, MSG} = require('../code')

const knex = require('knex')
const moment = require('moment')


module.exports = {
  getAnswer(id){
    return new Promise((resolve, reject)=>{
      Answer.query()
            .findById(id)
      .then((answer)=>{
        if (answer == undefined) reject(ERR.NO_SUCH_TARGET)
        else {
          resolve(answer)
        }
      })
      .catch((e)=>{
        reject(e)
      })
    })
  },
  getHotAnswers(page){
    return new Promise((resolve, reject)=>{
      var day_before = moment().subtract(7, 'day').format()
      Answer.query()
          .eager('[author, question]')
          .where('censor_status', 'pass')
          .where('is_deleted', false)
          .select('*')
          .select(knex.raw('substr(content,1, 500) as content'))
          .orderBy('total_zhichi', 'desc')
          .orderBy('created_at', 'desc')
          .where('created_at', '>', day_before)
          .page(page, 10)
      .then((answers)=>{
          resolve(answers)
      })
      .catch((e)=>{
        reject(e)
      })
    })
  },
  getNewAnswers(page){
    return new Promise((resolve, reject)=>{
      Answer.query()
          .eager('[author, question]')
          .where('censor_status', 'pass')
          .where('is_deleted', false)
          .select('*')
          .select(knex.raw('substring(content,1, 500) as content'))

          .orderBy('created_at', 'desc')
          .page(page, 10)
      .then((answers)=>{
          resolve(answers)
      })
      .catch((e)=>{
        reject(e)
      })
    })
  },
  getGoldAnswers(page){
    return new Promise((resolve, reject)=>{
      Answer.query()
          .eager('[author, question]')
          .where('censor_status', 'pass')
          .where('is_deleted', false)
          .where('is_selected', true)
          .select('*')
          .select(knex.raw('substring(content,1, 500) as content'))

          .orderBy('created_at', 'desc')
          .page(page, 5)
      .then((answers)=>{
          resolve(answers)
      })
      .catch((e)=>{
        reject(e)
      })
    })
  }
}
