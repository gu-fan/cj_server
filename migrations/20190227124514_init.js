exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema

    .createTable('user', table=>{

      table.string('id', 50).primary()
      table.string('name', 50)
      table.string('words')     // the signature words

      table.string('avatar', 500)
      table.string('background', 500)

      table.string('phone', 50).nullable()
      table.string('password', 500).nullable()

      table.string('wechat_id', 50).nullable()

      table.string('r_type', 50).defaultTo('wechat') 
      // create from dashboard / wechat /  web /weibo

      table.boolean('is_deleted').defaultTo(false)

      table.string('permission')    

      table.unique('wechat_id')
      table.unique('phone')
      table.timestamps()


    })
    .createTable('user_detail', table=>{
      table.string('id', 50).primary()

      table.integer('total_post_likes').unsigned().defaultTo(0)
      table.integer('total_user_likes').unsigned().defaultTo(0)
      table.integer('total_points').unsigned().defaultTo(100)
      table.timestamp('last_checkin_at')

      // lock
      table.string('censor_status', 50)
      table.string('censor_detail')


      table
        .string('user_id', 50)
        .references('id')
        .inTable('user')
        .onDelete('CASCADE')

      table.timestamps()

    })
    .createTable('post', table=>{
      table.string('id', 50).primary()

      table.string('title')
      table.string('type', 50)
      table.string('content', 1000)
      table.text('content_json')    // json
      // { v:0 }
      // images: [{url:xxx},{url:xxx}]
      // schedule:{start,end,daily,content}
      // video: {cover, url}
      // gif: {}
      // emotion: {}
      // todos: [{name, status}]

      table.string('weather', 30)

      // location
      table.string('country')
      table.string('city')
      table.float('lat')
      table.float('lon')

      table.boolean('is_public').defaultTo(true)

      table.integer('total_likes').unsigned().defaultTo(0)
      table.integer('total_comments').unsigned().defaultTo(0)
      table.integer('total_shares').unsigned().defaultTo(0)

      // private, for validation tag < 3
      table.integer('total_tags').unsigned().defaultTo(0)

      table
          .string('author_id', 50)
          .references('id')
          .inTable('user')
          .onDelete('NO ACTION')

      // censor_status
      // waiting,  (created)
      // pass,  
      // reject, (wait for user edit)
      // review, (after edit)
      // lock
      table.string('censor_status', 50)
      table.string('censor_detail')

      // 精选
      table.boolean('is_editor_choice').defaultTo(false)
      table.boolean('is_deleted').defaultTo(false)

      table.timestamp('last_edit_at').defaultTo(knex.fn.now());

      table.timestamps()

    })
    .createTable('user_like_post', table=>{
      table.increments('id').primary();
      
      table.integer('value').defaultTo(0)
      table
        .string('uid', 50)
        .references('id')
        .inTable('user')
        .onDelete('CASCADE')
      table
        .string('pid', 50)
        .references('id')
        .inTable('post')
        .onDelete('CASCADE')
    })
    .createTable('tag_topic', table=>{
      // tag of tag
      table.string('id', 50).primary()
      // table.increments('id').primary()
      
      table.string('name', 50)
      table.unique('name')

      table.timestamps()

    })
    .createTable('tag', table=>{
      table.string('id', 50).primary()
      // table.increments('id').primary()
      
      table.string('name', 50)
      table.timestamps()
      table.unique('name')

      // NOTE
      // this should be updated by timed script
      table.integer('total_posts').unsigned().defaultTo(0)

    })
    .createTable('tag_of_topic', table=>{
      table.increments('id').primary();

      table.unique(['tgid', 'tpid'])

      table
        .string('tgid', 50)
        .references('id')
        .inTable('tag')
        .onDelete('CASCADE');

      table
        .string('tpid', 50)
        .references('id')
        .inTable('tag_topic')
        .onDelete('CASCADE');

    })
    .createTable('post_with_tag', table=>{
      table.increments('id').primary();

      table.unique(['tid', 'pid'])

      table
        .string('tid', 50)
        .references('id')
        .inTable('tag')
        .onDelete('CASCADE');

      table
        .string('pid', 50)
        .references('id')
        .inTable('post')
        .onDelete('CASCADE');

    })

    .createTable('tag_of_user', table=>{
      table.increments('id').primary();

      table.unique(['tid', 'uid'])

      table.integer('count').defaultTo(0)

      table
        .string('tid', 50)
        .references('id')
        .inTable('tag')
        .onDelete('CASCADE');

      table
        .string('uid', 50)
        .references('id')
        .inTable('user')
        .onDelete('CASCADE');

    })
    .createTable('comment', table=>{
      table.string('id', 50).primary()

      table.string('type', 50)
      table.string('content', 1000)

      table.integer('total_likes').unsigned().defaultTo(0)

      table.string('censor_status', 50)
      table.string('censor_detail')

      table.boolean('is_deleted').defaultTo(false)



      // the comment tree
      //  root
      //    child
      //    child: reply_to
      //    child
      //    child
      //  root
      //    child
      //    child

      // when reply to a comment
      // the target became the reply_to item

      // and if target have no parent, 
      // then it is a root comment, and current is not
      //
      //   current's root_id is target
      //   current's reply_to_id is target
      //
      // when reply to a comment with root
      // both have the parent as root
      //
      //   current's root_id is root
      //   current's reply_to_id is target
      //
    
      table
        .string('reply_to_id', 50)
        .references('id')
        .inTable('comment')
        .onDelete('NO ACTION')
      table
        .string('root_id', 50)
        .references('id')
        .inTable('comment')
        .onDelete('NO ACTION')
      table.boolean('is_root').defaultTo(true)


      table
        .string('author_id', 50)
        .references('id')
        .inTable('user')
        .onDelete('NO ACTION')

      table
        .string('post_id', 50)
        .references('id')
        .inTable('post')
        .onDelete('NO ACTION')

      table.timestamps()

    })

    .createTable('user_like_comment', table=>{
      table.increments('id').primary();

      table.integer('value').defaultTo(0)

      table
        .string('uid', 50)
        .references('id')
        .inTable('user')
        .onDelete('CASCADE');

      table
        .string('cid', 50)
        .references('id')
        .inTable('comment')
        .onDelete('CASCADE');

    })

    .createTable('message', table=>{
      table.string('id', 50).primary()

      table.string('content', 500)
      table.string('type', 50)

      table.boolean('have_read').defaultTo(false)
      table.boolean('is_deleted').defaultTo(false)

      // we create special id for system
      // 10000
      table
        .string('from_id', 50)
        .references('id')
        .inTable('user')
        .onDelete('NO ACTION');

      table
        .string('to_id', 50)
        .references('id')
        .inTable('user')
        .onDelete('NO ACTION');

      table.timestamps()

    })
    .createTable('track', table=>{
      table.string('id', 50).primary()

      table.string('topic')
      table.string('content', 500)

      table
        .string('operator_id', 50)
        .nullable()
        .references('id')
        .inTable('user')
        .onDelete('NO ACTION');

      table.timestamps()

    })

    .createTable('staff', table=>{

      table.string('id', 50).primary()

      table.string('username', 50) 
      table.string('password')    
      table.string('phone', 50) 
      table.string('email', 50) 

      table.string('avatar')    

      table.string('permission')    

      table.unique('username')

      table.timestamps()

    })
    
  ])
  
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema
    .dropTableIfExists('tag')
    .dropTableIfExists('tag_topic')
    .dropTableIfExists('post_with_tag')
    .dropTableIfExists('tag_of_topic')
    .dropTableIfExists('tag_of_user')
    .dropTableIfExists('message')
    .dropTableIfExists('track')
    .dropTableIfExists('staff')
    .dropTableIfExists('user_like_comment')
    .dropTableIfExists('user_like_post')
    .dropTableIfExists('comment')
    .dropTableIfExists('post')
    .dropTableIfExists('user_detail')
    .dropTableIfExists('user')
  ])
  
};
