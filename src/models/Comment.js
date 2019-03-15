const _ = require('lodash');
const { Model, mixin } = require('objection');

const timestamp = require('./mixin/timestamp')
const uid = require('./mixin/uid')
const Base = require('./Base')

const Post = require('./Post')

class Comment extends Base {

  static get tableName(){
     return 'comment'
  } 

  async $beforeInsert(queryContext) {
    await super.$beforeInsert(queryContext);
    await Post
      .query(queryContext.transaction)
      .increment('total_comments', 1)
      .where('id', this.post_id)
  }

  async $beforeDelete(queryContext) {
    await super.$beforeDelete(queryContext);
    await Post
      .query(queryContext.transaction)
      .decrement('total_comments', 1)
      .where('id', this.post_id)
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['content'],
      properties: {
        id: { type: 'string' },

        type: { type: 'string'},
        content: { type: 'string'},

        total_likes: { type: 'integer'},
        
        censor_status: { type: 'string'},
        censor_detail: { type: 'string'},

        is_deleted: { type: 'boolean'},

        is_root: { type: 'boolean'},
        
      },
    }
  }

  static get relationMappings() {
    return {
      liked_by_users: {
        relation: Model.ManyToManyRelation,
        modelClass: __dirname + '/User',
        join: {
          from: 'comment.id',
          through: {
            from: 'user_like_comment.cid',
            extra: ["value"],
            to: 'user_like_comment.uid'
          },
          to: 'user.id'
        }
      },
      comment_reply_to: {
        relation: Model.HasOneRelation,
        modelClass: __dirname + '/Comment',
        join: {
          from: 'comment.reply_to_id',
          to: 'comment.id'
        }
      },
      // same as child_comments,
      // to get count in eager
      child_count: {
        relation: Model.HasManyRelation,
        modelClass: __dirname + '/Comment',
        join: {
          from: 'comment.id',
          to: 'comment.root_id'
        }
      },
      child_comments: {
        relation: Model.HasManyRelation,
        modelClass: __dirname + '/Comment',
        join: {
          from: 'comment.id',
          to: 'comment.root_id'
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
      post: {
        relation: Model.BelongsToOneRelation,
        modelClass: __dirname + '/Post',
        join: {
          from: 'comment.post_id',
          to: 'post.id'
        }
      }

    }
  }

}

module.exports = Comment;
