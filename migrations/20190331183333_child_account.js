exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema
    .table('user', function (table) {
      table
        .string('parent_id', 50)
        .references('id')
        .inTable('user')
        .onDelete('NO ACTION')
      table.boolean('is_parent').defaultTo(true)
    })
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema
      .table('user', function (table) {
        table.dropForeign('parent_id');
        table.dropColumn('parent_id')
        table.dropColumn('is_parent')
      })
  ])
};
