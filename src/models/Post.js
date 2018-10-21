const _ = require('lodash');
const { Model, mixin } = require('objection');

const timestamp = require('./mixin/timestamp')
const uid = require('./mixin/uid')

class Post extends mixin(Model, [timestamp,uid()]) {

  static get tableName(){
     return 'post'
  } 

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['content'],

      properties: {
        id: { type: 'string' },
        title: { type: 'string'},
        content: { type: 'string'},
        total_likes: { type: 'integer'},
      },
    };
  }

  static get relationMappings() {
    return {
      // liked_users: {
      //   relation: Model.ManyToManyRelation,
      //   modelClass: __dirname + '/User',
      //   join: {
      //     from: 'post.id',
      //     through: {
      //       from: 'user_like_post.pid',
      //       to: 'user_like_post.uid'
      //     },
      //     to: 'user.id'
      //   }
      // },
      // comments: {
      //   relation: Model.HasManyRelation,
      //   modelClass: __dirname + '/Comment',
      //   join: {
      //     from: 'post.id',
      //     to: 'comment.post_id'
      //   }
      // },
      author: {
        relation: Model.BelongsToOneRelation,
        modelClass: __dirname + '/User',
        join: {
          from: 'post.author_id',
          to: 'user.id'
        }
      },
      // group: {
      //   relation: Model.BelongsToOneRelation,
      //   modelClass: __dirname + '/Group',
      //   join: {
      //     from: 'post.group_id',
      //     to: 'group.id'
      //   }
      // }

    };
  }

};

module.exports = Post;
