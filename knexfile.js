// Update with your config settings.
var config = require('config')

module.exports = {

  development: config.db,
  test: config.db,

  staging: config.db,
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
