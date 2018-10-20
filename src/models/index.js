const Knex = require('knex')
const { Model } = require('objection')

const User = require('./User')

module.exports = {
  User,
  init: function(config){
    const knex = Knex(config);
    Model.knex(knex)
  }
}
