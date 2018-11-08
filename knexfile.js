// Update with your config settings.
var config = require('config')

module.exports = {

  development: config.db,
  test: config.db,

  staging: {
    client: '172.21.0.4',
    connection: {
      database: 'test',
      user:     'root',
      password: 'lk123456'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },

  production: {
    client: 'postgresql',
    connection: {
      database: 'production',
      user:     'graphql',
      password: 'graphql'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  }

};
