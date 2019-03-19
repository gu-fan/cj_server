const _ = require('lodash');
const { Model, mixin } = require('objection');

const timestamp = require('./mixin/timestamp')
const uid = require('./mixin/uid')

const Base = require('./Base')

class Tag extends Base {

  static get tableName(){
     return 'tag'
  } 

  // TODO:
  // ADD: background image
  // ADD: is_verified tag, only verified can be searched
  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name'],
      properties: {
        id: { type: 'string' },

        name: { type: 'string'},
        total_posts: { type: 'integer'},
        is_verified: {type: 'boolean'},
        is_blocked: {type: 'boolean'},

      },
    }
  }

  static get relationMappings() {

    return {
      posts: {
        relation: Model.ManyToManyRelation,
        modelClass: __dirname + '/Post',
        join: {
          from: 'tag.id',
          through: {
            from: 'post_with_tag.tid',
            to: 'post_with_tag.pid',
          },
          to: 'post.id',
        }
      },
      topics: {
        relation: Model.ManyToManyRelation,
        modelClass: __dirname + '/TagTopic',
        join: {
          from: 'tag.id',
          through: {
            from: 'tag_of_topic.tgid',
            to: 'tag_of_topic.tpid',
          },
          to: 'tag_topic.id',
        }
      },

    }
  }

}

module.exports = Tag;
