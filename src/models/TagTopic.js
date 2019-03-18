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
        relation: Model.ManyToManyRelation,
        modelClass: __dirname + '/Tag',
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

module.exports = TagTopic;
