const {Question, Answer, User}  = require('../models')
const {ERR, MSG} = require('../code')

function getCount(object){
    return (object && object.length) ? object[0]['count(*)'] : 0 
}
function normalizeUser(user){
    user.total_posts = getCount(user.posts)

    user.is_staff = /censor/.test(user.permission)
    user.is_admin = /admin/.test(user.permission)

    delete user.password
    // delete user.permission

    delete user.posts

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
            .eager('[posts(count), detail, tags(byCount)]', {
          byCount: (builder)=>{
            builder.orderBy('count', 'desc')
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
        .eager('[posts(count_pass), detail, tags(byCount)]', {
          byCount: (builder)=>{
            builder.orderBy('count', 'desc')
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
