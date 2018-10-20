const {ERR, ERR_CODE } = require('./error.code')
const {MSG, MSG_CODE } = require('./msg.code')
const APIError = require('./api.error')


module.exports = {
  NotFound: function(req, res, next){
    next(ERR.NOT_FOUND);
  },
  Handler: function(err, req, res, next) {
    var message = err.message;
    res.locals.error = req.app.get('env') === 'development' || req.app.get('env') === 'test' ? err : {};
    var stat = err.status || 500

    if (err.code == "SQLITE_CONSTRAINT") {
      message = "已存在相同内容"
    }

    res.status(stat);
    res.json({
      code: err.code || stat,
      msg: message,
      stack: res.locals.error.stack || undefined,
    });
  },
  APIError,
  ERR_CODE,
  ERR,
  MSG_CODE,
  MSG,
}
