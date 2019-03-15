const _ = require('lodash');
const { Model, mixin } = require('objection');

const timestamp = require('./mixin/timestamp')
const uid = require('./mixin/uid')

// track the control history of question
class TagTopic extends mixin(Model, [timestamp, uid()]) {

  static get tableName(){
     return 'tag_topic'
  } 

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name'],
      properties: {
        id: { type: 'string' },

        name: { type: 'string'},

      },
    }
  }

  static get relationMappings() {

    return {

      tags: {
        relation: Model.HasManyRelation,
        modelClass: __dirname + '/Tag',
        join: {
          from: 'tag_topic.id',
          to: 'tag.tag_topic_id'
        }
      },

    }
  }

}

module.exports = TagTopic;
