const Knex = require('knex')
const { Model } = require('objection')

const User = require('./User')
const Staff = require('./Staff')
const Question = require('./Question')
const Answer = require('./Answer')
const Comment = require('./Comment')
const TrackQ = require('./TrackQ')
const TrackA = require('./TrackA')

module.exports = {
  User,
  Staff,
  Question,
  Answer,
  TrackQ,
  TrackA,
  Comment,
  init: function(config){
    const knex = Knex(config)
    Model.knex(knex)
  }
}
