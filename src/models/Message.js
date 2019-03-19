const _ = require('lodash');
const { Model, mixin } = require('objection');

const timestamp = require('./mixin/timestamp')
const uid = require('./mixin/uid')
const Base = require('./Base')

// track the control history of answer
class Message extends Base {

  static get tableName(){
     return 'message'
  } 

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['content'],
      properties: {
        id: { type: 'string' },

        content: { type: 'string'},
        type: { type: 'string'},

        have_read: { type: 'boolean'},
        is_deleted: { type: 'boolean'},
        
      },
    }
  }

  static get relationMappings() {

    return {

      from: {
        relation: Model.BelongsToOneRelation,
        modelClass: __dirname + '/User',
        join: {
          from: 'message.from_id',
          to: 'user.id'
        }
      },
      to: {
        relation: Model.BelongsToOneRelation,
        modelClass: __dirname + '/User',
        join: {
          from: 'message.to_id',
          to: 'user.id'
        }
      },

    }
  }

}

module.exports = Message;
