exports.up = function(knex, Promise) {
  return Promise.all([

    knex.schema
    .table('tag', function (table) {
      table.boolean('is_public').defaultTo(true)
    })

  ])
  
};

exports.down = function(knex, Promise) {
  return Promise.all([

    knex.schema
      .table('tag', function (table) {
        table.dropColumn('is_public')
      })

  ])
  
};
