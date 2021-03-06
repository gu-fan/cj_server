const {promisify}= require('./promise')

const auth = require('express-jwt')
const sign = promisify(require('jsonwebtoken').sign)
const verify = promisify(require('jsonwebtoken').verify)

const config = require('config')
const key = config.key

module.exports = {
  auth: ()=>auth({
          secret:key,
          credentialsRequired: false
        }),     // sync middleware
  auth_only: ()=>auth({
          secret:key,
          credentialsRequired: true
        }),     // sync middleware
  sign: (pay,opt)=>sign(pay, key, opt),  // async 
  signId: (id, opt) => sign({sub:id},key,{expiresIn:"15d"}),
  verify: token=>verify(token, key),     // async
}
