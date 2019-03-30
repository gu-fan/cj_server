
exports.up = function(knex, Promise) {
  return Promise.all([

    knex.schema
    .table('banner', function (table) {
      table.boolean('is_deleted').defaultTo(false)
      table.string('tag')
      table.string('post')
    })

  ])
  
};

exports.down = function(knex, Promise) {
  return Promise.all([

    knex.schema
      .table('banner', function (table) {
        table.dropColumn('is_deleted')
        table.dropColumn('tag')
        table.dropColumn('post')
      })

  ])
  
};
