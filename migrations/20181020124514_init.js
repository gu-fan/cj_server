exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema

    // USER
    .createTable('user', table=>{
      table.string('id').primary()
      table.string('name')
      table.string('avatar')
      table.string('phone')
      table.string('password')
      table.string('wx_id')

      table.unique('wx_id')
      table.unique('phone')
      table.timestamps()
    })
    // POST
    .createTable('post', table=>{
      table.string('id').primary()

      table.string('title')
      table.string('content')

      table.integer('total_likes').unsigned().defaultTo(0)

      table
        .string('author_id')
        .references('id')
        .inTable('user');

      table
        .string('group_id')
        .references('id')
        .inTable('group');

      table.timestamps()
    })
  ])
  
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema
    .dropTableIfExists('user')
  ])
  
};
