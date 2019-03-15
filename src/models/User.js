const _ = require('lodash');
const { mixin, Model, ref } = require('objection')
const timestamp = require('./mixin/timestamp')
const uid = require('./mixin/uid')
const password = require('./mixin/password')

const UserDetail = require('./UserDetail')

class User extends mixin(Model, [
    timestamp,
    password(),
    uid(),
    uid({field:'name', type:'slug'}),
]) {

  static get tableName() {
    return 'user';
  }

  async $afterInsert(queryContext) {
    await super.$afterInsert(queryContext);
    await UserDetail
            .query(queryContext.transaction)
            .insert({user_id: this.id});
  }

  static get namedFilters() {
    return {
      safe: builder => builder.select('id','name','words','avatar','background','wechat_id')
    }
  }

  static get jsonSchema() {
    return {
      type: 'object',
      // required: ['name'],

      properties: {
        id: { type: 'string' },

        name: { type: 'string'},
        words: { type: 'string'},

        avatar: { type:[ 'string', 'null']},
        background: { type:[ 'string', 'null']},

        phone: { type:[ 'string', 'null']},
        password: { type:[ 'string', 'null']},
        wechat_id: { type:[ 'string', 'null']},

        r_type: {type:'string'}, 

        is_deleted: { type: 'boolean'},

        permission: { type:[ 'string', 'null']},

      },
    };
  }

  static get relationMappings() {
    return {
      // XXX: tags 
      posts: {
        relation: Model.HasManyRelation,
        modelClass: __dirname + '/Post',
        join: {
          from: 'user.id',
          to: 'post.author_id'
        }
      },
      tags: {
        relation: Model.ManyToManyRelation,
        modelClass: __dirname + '/Tag',
        join: {
          from: 'tag.id',
          through: {
            from: 'tag_of_user.tid',
            to: 'tag_of_user.uid',
            extra: ["count"],
          },
          to: 'user.id'
        }
      },
      detail: {
        relation: Model.HasOneRelation,
        modelClass: __dirname + '/UserDetail',
        join: {
          from: 'user.id',
          to: 'user_detail.user_id'
        }
      },
    };
  }

};

module.exports = User;
