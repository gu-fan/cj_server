const _ = require('lodash');
const { mixin, Model, ref } = require('objection')
const timestamp = require('./mixin/timestamp')
const uid = require('./mixin/uid')
const password = require('./mixin/password')

class Staff extends mixin(Model, [
    timestamp,
    password(),
    uid(),
]) {

  static get tableName() {
    return 'staff';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['username', 'password'],
      properties: {
        id: { type: 'string' },
        username: { type: 'string'},
        password: { type: 'string'},
        permission: { type:[ 'string', 'null']},
        avatar: { type:[ 'string', 'null']},
        phone: { type:[ 'string', 'null']},
        email: { type:[ 'string', 'null']},
      },
    };
  }

  static get relationMappings() {
    return {
    };
  }

};

module.exports = Staff;
