const {Question, Answer, User}  = require('../models')
const {ERR, MSG} = require('../code')

function getCount(object){
    return (object && object.length) ? object[0]['count(*)'] : 0 
}
function normalizeUser(user){
    user.total_questions = getCount(user.questions)
    user.total_answers = getCount(user.answers)

    user.is_staff = /censor/.test(user.permission)
    user.is_admin = /admin/.test(user.permission)

    delete user.password
    // delete user.permission

    delete user.questions
    delete user.answers

    return user
}
module.exports = {
  normalizeUser,
  getUser(id){
    return new Promise((resolve, reject)=>{
      User.query()
            .findById(id)
      .then((user)=>{
        if (user == undefined) reject(ERR.NO_SUCH_TARGET)
        else {
          resolve(normalizeUser(user))
        }
      })
      .catch((e)=>{
        reject(e)
      })
    })
  },
  getUserWithCount(id){
    return new Promise((resolve, reject)=>{
      User.query()
            .findById(id)
            .eager('[questions(count), answers(count)]',{
              count:(builder)=>{
                  builder.count()
              }
            })
      .then((user)=>{
        if (user == undefined) reject(ERR.NO_SUCH_TARGET)
        else {
          resolve(normalizeUser(user))
        }
      })
      .catch((e)=>{
        reject(e)
      })
    })
  },
  getUserWithCensorCount(id){
    return new Promise((resolve, reject)=>{
      User.query()
            .findById(id)
            .eager('[questions(count), answers(count)]',{
              count:(builder)=>{
                  builder
                    .where('censor_status', 'pass')
                    .count()
              }
            })
      .then((user)=>{
        if (user == undefined) reject(ERR.NO_SUCH_TARGET)
        else {
          resolve(normalizeUser(user))
        }
      })
      .catch((e)=>{
        reject(e)
      })
    })
  }
}
