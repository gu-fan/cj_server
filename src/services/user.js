const {Question, Answer, User}  = require('../models')
const {ERR, MSG} = require('../code')

function getCount(object){
    return (object && object.length) ? object[0]['count(*)'] : 0 
}
function normalizeUser(user){
    user.total_posts = getCount(user.posts)

    user.is_staff = /censor/.test(user.permission)
    user.is_admin = /admin/.test(user.permission)

    delete user.posts

    return user
}

const SAFE_COLUMN = ['id', 'name','avatar','background','created_at','posts','permission','tags','detail','count','content']

const EAGER_MOD = {
  limit3: builder=>builder.limit(3),
  countDesc: (builder)=>{
    builder.orderBy('count', 'desc')
  }
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
        .eager('[posts(count), detail, tags(countDesc,limit3)]', EAGER_MOD)
        .pick(SAFE_COLUMN)
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
          .eager('[posts(count_pass), detail, tags(countDesc,limit3)]', EAGER_MOD)
        .pick(SAFE_COLUMN)
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
