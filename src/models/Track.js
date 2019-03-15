const _ = require('lodash');
const { Model, mixin } = require('objection');

const timestamp = require('./mixin/timestamp')
const uid = require('./mixin/uid')

// track the control history of question
class Track extends mixin(Model, [timestamp, uid()]) {

  static get tableName(){
     return 'track'
  } 

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['content'],
      properties: {
        id: { type: 'string' },
        content: { type: 'string'},
        topic: { type: 'string'},
      },
    }
  }

  static get relationMappings() {

    return {

      operator: {
        relation: Model.BelongsToOneRelation,
        modelClass: __dirname + '/User',
        join: {
          from: 'track.operator_id',
          to: 'user.id'
        }
      },

    }
  }

}

module.exports = Track;
