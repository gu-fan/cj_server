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
            .dropTableIfExists('banner')
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

  }
}

module.exports = Session;
