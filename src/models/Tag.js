const _ = require('lodash');
const { Model, mixin } = require('objection');

const timestamp = require('./mixin/timestamp')
const uid = require('./mixin/uid')

// track the control history of question
class Tag extends mixin(Model, [timestamp, uid()]) {

  static get tableName(){
     return 'tag'
  } 

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

      topic: {
        relation: Model.BelongsToOneRelation,
        modelClass: __dirname + '/TagTopic',
        join: {
          from: 'tag.tag_topic_id',
          to: 'tag_topic.id'
        }
      },

    }
  }

}

module.exports = Tag;
