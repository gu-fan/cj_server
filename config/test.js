const path = require('path')

module.exports = {
  "key": "MY_DEV_KEY",
  // db:{
  //   client: 'sqlite3',
  //   connection: {
  //     filename: path.join(__dirname, '../data/' + process.env.TEST_DB +'.sqlite3')
  //   },
  //   useNullAsDefault: true
  // },
  db:{
    client: 'mysql',
    connection: {
      // host : '172.21.0.4',
      host : 'localhost', 
      database: 'test',
      user:     'root',
      password: 'root',
      port: '3408'
    },
    pool: {
      min: 0,
    },
    migrations: {
      tableName: 'knex_migrations'
    },
    useNullAsDefault: true
  }
}
