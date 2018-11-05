const _ = require('lodash');
const { Model, mixin } = require('objection');

const timestamp = require('./mixin/timestamp')
const uid = require('./mixin/uid')

// track the control history of question
class ControlQ extends mixin(Model, [timestamp, uid()]) {

  static get tableName(){
     return 'control_q'
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

      question: {
        relation: Model.BelongsToOneRelation,
        modelClass: __dirname + '/Question',
        join: {
          from: 'control_q.question_id',
          to: 'question.id'
        }
      },

      setter: {
        relation: Model.BelongsToOneRelation,
        modelClass: __dirname + '/User',
        join: {
          from: 'control_q.setter_id',
          to: 'user.id'
        }
      },

    }
  }

}

module.exports = Comment;
