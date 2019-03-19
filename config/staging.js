const path = require('path')

module.exports = {
  "key": "MY_STAGING",
  tmp_path: '/home/ubuntu/public/tmp/',
  db:{
    client: 'mysql',
    connection: {
      host : '172.16.0.17',     // shanghai
      database: 'api',
      user:     'root',
      password: 'xyd12345'
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
