exports.up = function(knex, Promise) {
  return Promise.all([

    knex.schema
    .createTable('staff', table=>{

      table.string('id', 50).primary()

      table.string('permission')    
      table.string('username', 50) 
      table.string('phone', 50) 
      table.string('email', 50) 
      table.string('password')    

      table.unique('username')
      table.unique('phone')
      table.unique('email')

      table.timestamps()

    })

  ])
  
};

exports.down = function(knex, Promise) {
  return Promise.all([

    knex.schema
      .dropTableIfExists('staff')

  ])
  
};
