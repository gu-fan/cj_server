const {Question, Answer, User}  = require('../models')
const {ERR, MSG} = require('../code')

const knex = require('knex')
const moment = require('moment')


module.exports = {
  getQuestion(id){
    return new Promise((resolve, reject)=>{
      Question.query()
            .findById(id)
      .then((question)=>{
        if (question == undefined) reject(ERR.NO_SUCH_TARGET)
        else {
          resolve(question)
        }
      })
      .catch((e)=>{
        reject(e)
      })
    })
  }
}
