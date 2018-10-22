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
    .createTable('question', table=>{
      table.string('id').primary()

      table.string('title')
      table.string('content')

      table.integer('total_likes').unsigned().defaultTo(0)

      table
        .string('author_id')
        .references('id')
        .inTable('user');

      table.timestamps()
    })
    .createTable('answer', table=>{
      table.string('id').primary()

      table.string('content')

      table.integer('total_zhichi').unsigned().defaultTo(0)
      table.integer('total_fandui').unsigned().defaultTo(0)

      table
        .string('question_id')
        .references('id')
        .inTable('question');

      table
        .string('author_id')
        .references('id')
        .inTable('user');

      table.timestamps()

    })
    .createTable('comment', table=>{
      table.string('id').primary()

      table.string('content')

      table.integer('total_likes').unsigned().defaultTo(0)

      table
        .string('answer_id')
        .references('id')
        .inTable('answer');

      table
        .string('author_id')
        .references('id')
        .inTable('user');

      table.timestamps()
    })
    
  ])
  
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema
    .dropTableIfExists('user')
    .dropTableIfExists('question')
  ])
  
};
