exports.up = function(knex, Promise) {
  return Promise.all([

    knex.schema
    .table('user', function (table) {
      table.integer('r_type').defaultTo(0)       // registry type
      // 0. wechat
      // 1. dashboard           
    })

  ])
  
};

exports.down = function(knex, Promise) {

  return Promise.all([
    knex.schema
    .table('user', function (table) {
      table.dropColumn('r_type');
    })

  ])
  
};
