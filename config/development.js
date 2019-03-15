const path = require('path')

module.exports = {
  "key": "MY_DEV_KEY",
  db:{
    client: 'sqlite3',
    connection: {
      filename: path.join(__dirname, '../data/dev.sqlite3')
    },
    useNullAsDefault: true
  },
  // db:{
  //   client: 'mysql',
  //   connection: {
  //     // host : '172.21.0.4',
  //     host : 'mysql-db', 
  //     database: 'dev',
  //     user:     'root',
  //     password: 'root'
  //   },
  //   pool: {
  //     min: 2,
  //     max: 10
  //   },
  //   migrations: {
  //     tableName: 'knex_migrations'
  //   },
  //   useNullAsDefault: true
  // }
}
