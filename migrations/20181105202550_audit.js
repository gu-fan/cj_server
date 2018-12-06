exports.up = function(knex, Promise) {

  return Promise.all([
    knex.schema
    .createTable('track_q', table=>{

      table.string('id', 50).primary()

      table.string('content')    // pass, check, tag, lock
      table.string('reason')     // not enough words

      table
        .string('question_id', 50)
        .references('id')
        .inTable('question');

      table
        .string('setter_id', 50)
        .references('id')
        .inTable('user');

      table.timestamps()

    })

    .table('question', function (table) {

      table.string('censor_status') // pass, avoid, avoid recheck, none
      table.string('lock_status')   // lock, unlock(null)

    })

    .table('user', function (table) {
      table.string('permission');
    })
  ])
  
};

exports.down = function(knex, Promise) {

  return Promise.all([

    knex.schema
      .dropTableIfExists('track_q')
      .table('question', function (table) {
        table.dropColumn('censor_status');
        table.dropColumn('lock_status');
      })
      .table('user', function (table) {
        table.dropColumn('permission');
      })

  ])

};
