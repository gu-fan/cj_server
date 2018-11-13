const _ = require('lodash');
const { Model, mixin } = require('objection');

const timestamp = require('./mixin/timestamp')
const uid = require('./mixin/uid')

const Question = require('./Question')

class Answer extends mixin(Model, [timestamp,uid()]) {

  static get tableName(){
     return 'answer'
  } 

  async $beforeInsert(queryContext) {
    await super.$beforeInsert(queryContext);
    await Question
      .query(queryContext.transaction)
      .increment('total_answers', 1)
      .where('id', this.question_id)

  }

  async $beforeDelete(queryContext) {
    await super.$beforeDelete(queryContext);
    await Question
      .query(queryContext.transaction)
      .decrement('total_answers', 1)
      .where('id', this.question_id)
  }


  static get jsonSchema() {
    return {
      type: 'object',
      required: ['content'],

      properties: {
        id: { type: 'string' },
        title: { type: 'string'},
        is_deleted: { type: 'boolean'},
        is_selected: { type: 'boolean'},
        content: { type: 'string'},
        total_zhichi: { type: 'integer'},
        total_thanks: { type: 'integer'},
        total_comments: { type: 'integer'},
        total_fandui: { type: 'integer'},

        verify: { type: 'string'},
      },
    }
  }

  static get relationMappings() {
    return {
      liked_users: {
        relation: Model.ManyToManyRelation,
        modelClass: __dirname + '/User',
        join: {
          from: 'answer.id',
          through: {
            from: 'user_like_answer.aid',
            extra: ["num"],
            to: 'user_like_answer.uid'
          },
          to: 'user.id'
        }
      },
      comments: {
        relation: Model.HasManyRelation,
        modelClass: __dirname + '/Comment',
        join: {
          from: 'answer.id',
          to: 'comment.answer_id'
        }
      },
      question: {
        relation: Model.BelongsToOneRelation,
        modelClass: __dirname + '/Question',
        join: {
          from: 'answer.question_id',
          to: 'question.id'
        }
      },
      author: {
        relation: Model.BelongsToOneRelation,
        modelClass: __dirname + '/User',
        join: {
          from: 'answer.author_id',
          to: 'user.id'
        }
      },

      tracks: {
        relation: Model.HasManyRelation,
        modelClass: __dirname + '/TrackA',
        join: {
          from: 'answer.id',
          to: 'track_a.answer_id'
        }
      },
      // group: {
      //   relation: Model.BelongsToOneRelation,
      //   modelClass: __dirname + '/Group',
      //   join: {
      //     from: 'answer.group_id',
      //     to: 'group.id'
      //   }
      // }

    };
  }

};

module.exports = Answer;
