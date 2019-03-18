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

      },
    }
  }

  static get relationMappings() {

    return {
      topics: {
        relation: Model.ManyToManyRelation,
        modelClass: __dirname + '/TagTopic',
        join: {
          from: 'tag_topic.id',
          through: {
            from: 'tag_of_topic.tpid',
            to: 'tag_of_topic.tgid',
          },
          to: 'tag.id',
        }
      },

    }
  }

}

module.exports = Tag;
