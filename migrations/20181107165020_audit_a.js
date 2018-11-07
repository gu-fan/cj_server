exports.up = function(knex, Promise) {

  return Promise.all([
    knex.schema
    .createTable('track_a', table=>{

      table.string('id').primary()

      table.string('content')    // pass, check, tag, lock
      table.string('reason')     // not enough words

      table
        .string('answer_id')
        .references('id')
        .inTable('answer');

      table
        .string('setter_id')
        .references('id')
        .inTable('user');

      table.timestamps()

    })

    .table('answer', function (table) {

      table.string('censor_status') // pass, avoid, avoid recheck, none
      table.string('lock_status')   // lock, unlock(null)

    })
  ])
  
};

exports.down = function(knex, Promise) {

  return Promise.all([

    knex.schema
      .dropTableIfExists('track_a')
      .table('answer', function (table) {
        table.dropColumn('censor_status');
        table.dropColumn('lock_status');
      })

  ])

};
