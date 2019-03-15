const _ = require('lodash');
const { mixin, Model, ref } = require('objection')
const timestamp = require('./mixin/timestamp')
const uid = require('./mixin/uid')

class UserDetail extends mixin(Model, [
    timestamp,
    uid(),
]) {

  static get tableName() {
    return 'user_detail';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      // required: ['name'],

      properties: {
        id: { type: 'string' },

        total_post_likes: { type: 'integer'},
        total_user_likes: { type: 'integer'},

        total_points: { type: 'integer'},
        last_checkin_at: { type:[ 'string', 'null']},


        censor_status: { type:[ 'string', 'null']},
        censor_detail: { type:[ 'string', 'null']},

      },
    };
  }


};

module.exports = UserDetail;
