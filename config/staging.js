const path = require('path')

module.exports = {
  "key": "MY_STAGING",
  db:{
    client: 'mysql',
    connection: {
      host : '172.21.0.4',
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
  }
}
