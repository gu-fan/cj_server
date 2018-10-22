const _ = require('lodash');
const { mixin, Model, ref } = require('objection')
const timestamp = require('./mixin/timestamp')
const uid = require('./mixin/uid')
const password = require('./mixin/password')

class User extends mixin(Model, [
    timestamp,
    password(),
    uid(),
    uid({field:'name', type:'slug'}),
]) {
  static get tableName() {
    return 'user';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      // required: ['name'],

      properties: {
        id: { type: 'string' },
        name: { type: 'string'},
        avatar: { type:[ 'string', 'null']},
        phone: { type:[ 'string', 'null']},
        password: { type: 'string'},
        wx_id: { type:[ 'string', 'null']},
        created_at: { type:[ 'string', 'null']},

      },
    };
  }

  static get relationMappings() {
    return {
      questions: {
        relation: Model.HasManyRelation,
        modelClass: __dirname + '/Question',
        join: {
          from: 'user.id',
          to: 'question.author_id'
        }
      },
      // answers: {
      //   relation: Model.HasManyRelation,
      //   modelClass: __dirname + '/Answer',
      //   join: {
      //     from: 'user.id',
      //     to: 'answer.author_id'
      //   }
      // },
      // following: {
      //   relation: Model.ManyToManyRelation,
      //   modelClass: __dirname + '/User',
      //   join: {
      //     from: 'user.id',
      //     through: {
      //       from: 'user_follow.from_id',
      //       to: 'user_follow.to_id'
      //     },
      //     to: 'user.id'
      //   }
      // },
      // follower: {
      //   relation: Model.ManyToManyRelation,
      //   modelClass: __dirname + '/User',
      //   join: {
      //     from: 'user.id',
      //     through: {
      //       from: 'user_follow.to_id',
      //       to: 'user_follow.from_id'
      //     },
      //     to: 'user.id'
      //   }
      // },
      // point_tracks are -from and +to
      // point_tracks_from: {
      //   relation: Model.HasManyRelation,
      //   modelClass: __dirname + '/PointTrack',
      //   join: {
      //     from: 'user.id',
      //     to: 'point_track.from_id'
      //   }
      // },
      // point_tracks_to: {
      //   relation: Model.HasManyRelation,
      //   modelClass: __dirname + '/PointTrack',
      //   join: {
      //     from: 'user.id',
      //     to: 'point_track.to_id'
      //   }
      // },
    };
  }

};

module.exports = User;
