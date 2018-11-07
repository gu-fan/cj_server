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

      table.integer('total_answer_fandui').unsigned().defaultTo(0)
      table.integer('total_answer_zhichi').unsigned().defaultTo(0)
      table.integer('total_answer_thanks').unsigned().defaultTo(0)

      table.integer('total_points').unsigned().defaultTo(20)
      table.timestamp('checkpoint_at')

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

      table.integer('total_answers').unsigned().defaultTo(0)

      table
        .string('author_id')
        .references('id')
        .inTable('user');

      table.timestamps()
    })
    .createTable('answer', table=>{
      table.string('id').primary()

      table.string('content')

      table.integer('total_thanks').unsigned().defaultTo(0)
      table.integer('total_zhichi').unsigned().defaultTo(0)
      table.integer('total_fandui').unsigned().defaultTo(0)

      table.integer('total_comments').unsigned().defaultTo(0)

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
    .createTable('user_like_answer', table=>{
      table.string('id').primary()
      table.integer('num').defaultTo(0)
      table
        .string('uid')
        .references('id')
        .inTable('user')
        .onDelete('CASCADE');
      table
        .string('aid')
        .references('id')
        .inTable('answer')
        .onDelete('CASCADE');
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
        .string('reply_id')
        .references('id')
        .inTable('comment');

      table
        .string('author_id')
        .references('id')
        .inTable('user');

      table.timestamps()
    })
    .createTable('user_like_comment', table=>{
      table.increments('id').primary();

      table.integer('num').defaultTo(0)

      table
        .string('uid')
        .references('id')
        .inTable('user')
        .onDelete('CASCADE');
      table
        .string('cid')
        .references('id')
        .inTable('comment')
        .onDelete('CASCADE');
    })

    
  ])
  
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema
    .dropTableIfExists('user')
    .dropTableIfExists('question')
    .dropTableIfExists('answer')
    .dropTableIfExists('user_like_answer')
    .dropTableIfExists('comment')
    .dropTableIfExists('user_like_comment')
  ])
  
};