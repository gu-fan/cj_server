const path = require('path')

module.exports = {
  "key": "MY_DEV_KEY",
  db:{
    client: 'sqlite3',
    connection: {
      filename: path.join(__dirname, '../data/' + process.env.TEST_DB +'.sqlite3')
    },
    useNullAsDefault: true
  }
}
