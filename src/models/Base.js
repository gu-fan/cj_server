const { mixin, Model } = require('objection')

const timestamp = require('./mixin/timestamp')
const uid = require('./mixin/uid')


class Base extends mixin(Model, [timestamp,uid()]) {

  static get namedFilters() {
    return {
      timeDesc: (builder) => {
        builder.orderBy('created_at', 'desc');
      },
      limit5: (builder) => {
        builder.limit(5)
      },
      limit10: (builder) => {
        builder.limit(10)
      },
    };
  }

}
module.exports = Base
