const _ = require('lodash');
const Knex = require('knex');

class Session {
  constructor(config) {
    const knex = Knex(config);
    this.knex = knex;

  }

  async createTables() {
    const { knex } = this;

    await knex.schema
            .dropTableIfExists('knex_migrations')
            .dropTableIfExists('knex_migrations_lock')

            .dropTableIfExists('user')
            .dropTableIfExists('question')
            .dropTableIfExists('answer')
            .dropTableIfExists('comment')

    await knex.migrate.latest()

  }
}

module.exports = Session;
