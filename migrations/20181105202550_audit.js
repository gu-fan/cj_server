exports.up = function(knex, Promise) {

  return Promise.all([
    knex.schema
    .createTable('control_q', table=>{

      table.string('id').primary()

      table.string('content')    // pass, check, tag, lock
      table.string('reason')     // not enough words

      table
        .string('question_id')
        .references('id')
        .inTable('question');

      table
        .string('setter_id')
        .references('id')
        .inTable('user');

      table.timestamps()

    })

    .table('question', function (table) {

      table.string('audit_status') // pass, check

    })
  ])
  
};

exports.down = function(knex, Promise) {

  return Promise.all([

    knex.schema
      .dropTableIfExists('control_q')
      .table('question', function (table) {
        table.dropColumn('audit_status');
      })

  ])

};
