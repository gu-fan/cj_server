module.exports = {
  isEmpty: function(val) {
    return val == "" || val == null || val == undefined
  },
  getCount(object){
      return (object && object.length) ? object[0]['count(*)'] : 0 
  }
}
