const _ = require('lodash');
const Knex = require('knex');

class Session {
  constructor(config) {
    const knex = Knex(config);
    this.knex = knex;
  }

  async createTables() {
    const { knex } = this;

    await knex.migrate.latest()
  }

  async clearTables(){
    const { knex } = this;
    await knex.schema
            .dropTableIfExists('knex_migrations')
            .dropTableIfExists('knex_migrations_lock')
            .dropTableIfExists('user')
            .dropTableIfExists('question')
            .dropTableIfExists('answer')
            .dropTableIfExists('comment')
            .dropTableIfExists('user_like_comment')
            .dropTableIfExists('user_like_answer')
            .dropTableIfExists('track_q')
            .dropTableIfExists('track_a')
            .dropTableIfExists('staff')
  }
}

module.exports = Session;
