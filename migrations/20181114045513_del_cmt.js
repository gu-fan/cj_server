exports.up = function(knex, Promise) {

  return Promise.all([
    knex.schema
    .table('comment', function (table) {
      table.boolean('is_deleted').defaultTo(false)   // true / false
    })
  ])

};

exports.down = function(knex, Promise) {

  return Promise.all([
    knex.schema
    .table('comment', function (table) {
      table.dropColumn('is_deleted');
    })

  ])

};
