const _ = require('lodash');
const { Model, mixin } = require('objection');

const timestamp = require('./mixin/timestamp')
const uid = require('./mixin/uid')

const Answer = require('./Answer')

class Comment extends mixin(Model, [timestamp,uid()]) {

  static get tableName(){
     return 'comment'
  } 

  async $beforeInsert(queryContext) {
    await super.$beforeInsert(queryContext);
    await Answer
      .query(queryContext.transaction)
      .increment('total_comments', 1)
      .where('id', this.answer_id)
  }

  async $beforeDelete(queryContext) {
    await super.$beforeDelete(queryContext);
    await Answer
      .query(queryContext.transaction)
      .decrement('total_comments', 1)
      .where('id', this.answer_id)
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['content'],
      properties: {
        id: { type: 'string' },
        is_deleted: { type: 'boolean'},
        title: { type: 'string'},
        content: { type: 'string'},
        total_likes: { type: 'integer'},
      },
    }
  }

  static get relationMappings() {
    return {
      liked_users: {
        relation: Model.ManyToManyRelation,
        modelClass: __dirname + '/User',
        join: {
          from: 'comment.id',
          through: {
            from: 'user_like_comment.cid',
            extra: ["num"],
            to: 'user_like_comment.uid'
          },
          to: 'user.id'
        }
      },
      reply_to: {
        relation: Model.BelongsToOneRelation,
        modelClass: __dirname + '/Comment',
        join: {
          from: 'comment.reply_id',
          to: 'comment.id',
        }
      },
      comments: {
        relation: Model.HasManyRelation,
        modelClass: __dirname + '/Comment',
        join: {
          from: 'comment.id',
          to: 'comment.reply_id'
        }
      },
      author: {
        relation: Model.BelongsToOneRelation,
        modelClass: __dirname + '/User',
        join: {
          from: 'comment.author_id',
          to: 'user.id'
        }
      },
      answer: {
        relation: Model.BelongsToOneRelation,
        modelClass: __dirname + '/Answer',
        join: {
          from: 'comment.answer_id',
          to: 'answer.id'
        }
      }

    }
  }

}

module.exports = Comment;
