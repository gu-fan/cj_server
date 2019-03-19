const _ = require('lodash');
const { Model, mixin } = require('objection');

const timestamp = require('./mixin/timestamp')
const uid = require('./mixin/uid')

const Base = require('./Base')

// track the control history of question
class TagTopic extends Base {

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
          from: 'tag_topic.id',
          through: {
            to: 'tag_of_topic.tgid',
            from: 'tag_of_topic.tpid',
          },
          to: 'tag.id',
        }
      },
    }
  }

}

module.exports = TagTopic;
