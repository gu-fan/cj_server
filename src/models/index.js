const Knex = require('knex')
const { Model } = require('objection')

const User = require('./User')
const Post = require('./Post')

module.exports = {
  User,
  Post,
  init: function(config){
    const knex = Knex(config)
    Model.knex(knex)
  }
}
