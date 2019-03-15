const _ = require('lodash');
const { Model, mixin } = require('objection');

const timestamp = require('./mixin/timestamp')
const uid = require('./mixin/uid')
const Base = require('./Base')

class Post extends Base {

  static get tableName(){
     return 'post'
  } 

  static get jsonSchema() {
    return {
      type: 'object',
      // required: ['content'],     //content && content_json

      properties: {
        id: { type: 'string' },

        title: { type:[ 'string', 'null']},

        type: { type: 'string'},

        content: { type: 'string'},
        content_json: {
          type: 'object',
        },

        weather: { type: 'string'},

        country: { type: 'string'},
        city: { type: 'string'},
        lat: { type: 'float'},
        lon: { type: 'float'},

        total_comments: { type: 'integer'},
        total_likes: { type: 'integer'},

        total_tags: { type: 'integer'},

        censor_status: { type: 'string'},
        censor_detail: { type: 'string'},

        is_editor_choice: { type: 'boolean'},
        is_deleted: { type: 'boolean'},


      },
    };
  }

  static get relationMappings() {
    return {
      comments: {
        relation: Model.HasManyRelation,
        modelClass: __dirname + '/Comment',
        join: {
          from: 'post.id',
          to: 'comment.post_id'
        }
      },
      author: {
        relation: Model.BelongsToOneRelation,
        modelClass: __dirname + '/User',
        join: {
          from: 'post.author_id',
          to: 'user.id'
        }
      },
      tags: {
        relation: Model.ManyToManyRelation,
        modelClass: __dirname + '/Tag',
        join: {
          from: 'post.id',
          through: {
            from: 'post_with_tag.pid',
            to: 'post_with_tag.tid'
          },
          to: 'tag.id'
        }
      },
      liked_by_users: {
        relation: Model.ManyToManyRelation,
        modelClass: __dirname + '/User',
        join: {
          from: 'post.id',
          through: {
            from: 'user_like_post.pid',
            extra: ["value"],
            to: 'user_like_post.uid'
          },
          to: 'user.id'
        }
      },

    };
  }

};

module.exports = Post;
