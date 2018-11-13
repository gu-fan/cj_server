const _ = require('lodash');
const { Model, mixin } = require('objection');

const timestamp = require('./mixin/timestamp')
const uid = require('./mixin/uid')

class Question extends mixin(Model, [timestamp,uid()]) {

  static get tableName(){
     return 'question'
  } 

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['content'],

      properties: {
        id: { type: 'string' },
        title: { type: 'string'},
        is_deleted: { type: 'boolean'},
        content: { type: 'string'},
        total_answers: { type: 'integer'},
        total_likes: { type: 'integer'},

        verify: { type: 'string'},

      },
    };
  }

  static get relationMappings() {
    return {
      // liked_users: {
      //   relation: Model.ManyToManyRelation,
      //   modelClass: __dirname + '/User',
      //   join: {
      //     from: 'question.id',
      //     through: {
      //       from: 'user_like_question.pid',
      //       to: 'user_like_question.uid'
      //     },
      //     to: 'user.id'
      //   }
      // },
      answers: {
        relation: Model.HasManyRelation,
        modelClass: __dirname + '/Answer',
        join: {
          from: 'question.id',
          to: 'answer.question_id'
        }
      },

      author: {
        relation: Model.BelongsToOneRelation,
        modelClass: __dirname + '/User',
        join: {
          from: 'question.author_id',
          to: 'user.id'
        }
      },

      tracks: {
        relation: Model.HasManyRelation,
        modelClass: __dirname + '/TrackQ',
        join: {
          from: 'question.id',
          to: 'track_q.question_id'
        }
      },
      // group: {
      //   relation: Model.BelongsToOneRelation,
      //   modelClass: __dirname + '/Group',
      //   join: {
      //     from: 'question.group_id',
      //     to: 'group.id'
      //   }
      // }

    };
  }

};

module.exports = Question;
