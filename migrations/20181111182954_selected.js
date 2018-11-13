exports.up = function(knex, Promise) {

  return Promise.all([
    knex.schema
    .table('question', function (table) {
      table.boolean('is_deleted').defaultTo(false)   // true / false
    })
    .table('answer', function (table) {
      table.boolean('is_selected').defaultTo(false)  // true / false
      table.boolean('is_deleted').defaultTo(false)   // true / false

    })
  ])

};

exports.down = function(knex, Promise) {

  return Promise.all([
    knex.schema
    .table('answer', function (table) {
      table.dropColumn('is_selected');
      table.dropColumn('is_deleted');
    })
    .table('question', function (table) {
      table.dropColumn('is_deleted');
    })

  ])

};
