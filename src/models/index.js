const Knex = require('knex')
const { Model } = require('objection')

const User = require('./User')
const UserDetail = require('./UserDetail')
const Staff = require('./Staff')
const Post = require('./Post')
const Comment = require('./Comment')
const Message = require('./Message')
const Track = require('./Track')
const Tag = require('./Tag')
const Banner = require('./Banner')
const TagTopic = require('./TagTopic')

module.exports = {
  User,
  UserDetail,
  Banner,
  Staff,
  Post,
  Comment,
  Message,
  Track,
  Tag,
  TagTopic,
  model :{
    bareInit: function(config){
      const knex = Knex(config)
      Model.knex(knex)
      return knex
    },
    init: function(config){
      const knex = Knex(config)
      Model.knex(knex)
      return (req, res, next)=>{
        req.knex = knex
        next()
      }
    },
  }
}
