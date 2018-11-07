const _ = require('lodash');
const { Model, mixin } = require('objection');

const timestamp = require('./mixin/timestamp')
const uid = require('./mixin/uid')

// track the control history of answer
class TrackA extends mixin(Model, [timestamp, uid()]) {

  static get tableName(){
     return 'track_a'
  } 

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['content'],
      properties: {
        id: { type: 'string' },
        content: { type: 'string'},
        reason: { type: 'string'},
      },
    }
  }

  static get relationMappings() {

    return {

      answer: {
        relation: Model.BelongsToOneRelation,
        modelClass: __dirname + '/Answer',
        join: {
          from: 'track_a.answer_id',
          to: 'answer.id'
        }
      },

      setter: {
        relation: Model.BelongsToOneRelation,
        modelClass: __dirname + '/User',
        join: {
          from: 'track_a.setter_id',
          to: 'user.id'
        }
      },

    }
  }

}

module.exports = TrackA;
