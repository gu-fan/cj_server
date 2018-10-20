module.exports = function(Model){

  return class extends Model {
    async $beforeInsert(...args) {
      await super.$beforeInsert(...args);
      this.created_at = new Date().toISOString();
      // this.created_at = Date.now().toString()
    }

    async $beforeUpdate(...args) {
      await super.$beforeUpdate(...args);
      this.updated_at = new Date().toISOString();
      // this.updated_at = Date.now().toString()
    }
  }

}
