
exports.up = function(knex, Promise) {
  return Promise.all([

    knex.schema
    .table('answer', function (table) {
      table.text('content_json')
    })

  ])
  
};

exports.down = function(knex, Promise) {
  return Promise.all([

    knex.schema
      .table('answer', function (table) {
        table.dropColumn('content_json')
      })

  ])
  
};
