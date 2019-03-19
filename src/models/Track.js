const _ = require('lodash');
const { Model, mixin } = require('objection');

const timestamp = require('./mixin/timestamp')
const uid = require('./mixin/uid')

const Base = require('./Base')
// track the control history of question
class Track extends Base {

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
