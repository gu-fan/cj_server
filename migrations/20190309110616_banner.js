exports.up = function(knex, Promise) {
  
  return Promise.all([
    knex.schema
    .createTable('banner', table=>{

      table.string('id', 50).primary()

      table.string('title')
      table.boolean('show_title') // show title or not

      table.integer('index').unsigned().defaultTo(0)   // sort with index first, greater index show first
      table.boolean('is_show')   // show or hide

      table.string('image')

      table.string('link')      // /post/xxx
                                // /tag/xxx

      table.timestamps()

    })
    
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema
    .dropTableIfExists('banner')
  ])
  
};
