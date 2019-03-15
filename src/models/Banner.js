const _ = require('lodash');
const { Model, mixin } = require('objection');

const timestamp = require('./mixin/timestamp')
const uid = require('./mixin/uid')

const Base = require('./Base')

// track the control history of question
class Banner extends Base {

  static get tableName(){
     return 'banner'
  } 

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['title'],
      properties: {

        id: { type: 'string' },

        title: { type: 'string'},
        image: {type: 'string'},
        link: {type:'string'},

        index: {type: 'integer'},
        show_title: {type: 'boolean'},
        is_show: {type: 'boolean'},

      },
    }
  }


}

module.exports = Banner;
