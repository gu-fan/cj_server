const {Question, Answer, User}  = require('../models')
const {ERR, MSG} = require('../code')

const knex = require('knex')
const moment = require('moment')
const _ = require('lodash')

function normContent(item){
  item.results = item.results.map((it)=>{
    it.content = it.content.substring(0, 500)
    return it
  })
  return item
}

module.exports = {
  normContent,
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
  getMixedNew(page){
    return new Promise((resolve, reject)=>{
      var day_before = moment().subtract(30, 'day').format()
      Answer.query()
          .eager('[author, question]')
          .where('censor_status', 'pass')
          .where('is_deleted', false)
          .orderBy('created_at', 'desc')
          .where('created_at', '>', day_before)
          .page(page, 8)
      .then((answers)=>{

          Question.query()
              .eager('[author]')
              .where('censor_status', 'pass')
              .where('is_deleted', false)
              .orderBy('created_at', 'desc')
              .where('created_at', '>', day_before)
              .page(page, 2)
          .then((questions)=>{

              var n_a = normContent(answers)
              var n_q = normContent(questions)

              n_a.results = n_a.results.map(it=>{
                  it.type='answer'
                  return it
              })
              n_q.results = n_q.results.map(it=>{
                  it.type='question'
                  return it
              })

              console.log(n_a.results)
              if (n_a.results.length >6 && n_q.results.length ==2 ){
                n_a.results.splice(1, 0, n_q.results[0])
                n_a.results.splice(6, 0, n_q.results[1])
              } else {
                n_a.results = [].concat(n_a.results, n_q.results)
              }

              resolve({results:n_a.results, total:n_a.total+n_q.total})


            })
            .catch(reject)

      })
      .catch(reject)
    })
  },
  
  getMixedHot(page){
    return new Promise((resolve, reject)=>{
      var day_before = moment().subtract(25, 'day').format()
      Answer.query()
          .eager('[author, question]')
          .where('censor_status', 'pass')
          .where('is_deleted', false)
          .orderBy('total_zhichi', 'desc')
          .orderBy('created_at', 'desc')
          .where('created_at', '>', day_before)
          .page(page, 8)
      .then((answers)=>{

          Question.query()
              .eager('[author]')
              .where('censor_status', 'pass')
              .where('is_deleted', false)
              .orderBy('total_answers', 'desc')
              .where('created_at', '>', day_before)
              .page(page, 2)
          .then((questions)=>{

              var n_a = normContent(answers)
              var n_q = normContent(questions)

              n_a.results = n_a.results.map(it=>{
                  it.type='answer'
                  return it
              })
              n_q.results = n_q.results.map(it=>{
                  it.type='question'
                  return it
              })

              console.log(n_a.results)
              if (n_a.results.length >6 && n_q.results.length ==2 ){
                n_a.results.splice(2, 0, n_q.results[0])
                n_a.results.splice(6, 0, n_q.results[1])
              } else {
                n_a.results = [].concat(n_a.results, n_q.results)
              }

              resolve({results:n_a.results, total:n_a.total+n_q.total})

            })
            .catch((e)=>{
              reject(e)
            })

      })
      .catch((e)=>{
        reject(e)
      })
    })
  },
  getHotAnswers(page){
    return new Promise((resolve, reject)=>{
      var day_before = moment().subtract(10, 'day').format()
      var day_mid = moment().subtract(30, 'day').format()
      Answer.query()
          .eager('[author, question]')
          .where('censor_status', 'pass')
          .where('is_deleted', false)
          .orderBy('total_zhichi', 'desc')
          .orderBy('created_at', 'desc')
          .where('created_at', '>', day_before)
          .page(page, 6)
      .then((answers)=>{
          Answer.query()
              .eager('[author, question]')
              .where('censor_status', 'pass')
              .where('is_deleted', false)
              .orderBy('total_zhichi', 'desc')
              .orderBy('created_at', 'desc')
              .where('created_at', '<', day_before)
              .where('created_at', '>', day_mid)
              .page(page, 4)
          .then((answers2)=>{
            var a1 = normContent(answers)
            var a2 = normContent(answers2)
            resolve({
              results:[].concat(a1.results,a2.results),
              total:a1.total+a2.total
            })
          })
          .catch(reject)

      })
      .catch(e=>reject(e))
    })
  },
  getNewAnswers(page){
    return new Promise((resolve, reject)=>{
      Answer.query()
          .eager('[author, question]')
          .where('censor_status', 'pass')
          .where('is_deleted', false)

          .orderBy('created_at', 'desc')
          .page(page, 10)
      .then((answers)=>{
          resolve(normContent(answers))
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
          // .select('*')
          // .select(knex.raw('substring(content,1, 500) as content'))

          .orderBy('created_at', 'desc')
          .page(page, 5)
      .then((answers)=>{
          resolve(normContent(answers))
      })
      .catch((e)=>{
        reject(e)
      })
    })
  }
}
