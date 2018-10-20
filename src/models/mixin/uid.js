const {uid, slug} = require('./_uid');


module.exports = options => {
  options = Object.assign(
    {
      field: 'id',
      generateuid: (type) => type == 'slug' ? slug() : uid() 
    },
    options
  );

  return Model => {
    return class extends Model {

      async $beforeInsert(...args) {
        await super.$beforeInsert(...args);
        this[options.field] = options.generateuid(options.type)

      }
    };
  };
};

