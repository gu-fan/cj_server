
exports.up = function(knex, Promise) {

  return Promise.all([
    knex.schema
    .table('answer', function (table) {
      table.string('verify');
    })
    .table('question', function (table) {
      table.string('verify');
    })
    .table('user', function (table) {
      table.string('permission');
    })
  ])
  
};

exports.down = function(knex, Promise) {

  return Promise.all([
    knex.schema
    .table('answer', function (table) {
      table.dropColumn('verify');
    })
    .table('question', function (table) {
      table.dropColumn('verify');
    })
    .table('user', function (table) {
      table.dropColumn('permission');
    })
  ])

};
