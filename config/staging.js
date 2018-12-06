const path = require('path')

module.exports = {
  "key": "MY_STAGING",
  db:{
    client: 'mysql',
    connection: {
      // host : '172.21.0.4',   // beijing
      host : '172.17.0.14',     // shanghai
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
