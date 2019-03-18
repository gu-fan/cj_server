const {ERR, ERR_CODE } = require('./error.code')
const {MSG, MSG_CODE } = require('./msg.code')
const APIError = require('./api.error')

const { 
    NotNullViolationError,
    UniqueViolationError,
    ConstraintViolationError,
    ForeignKeyViolationError,
    CheckViolationError,
    DataError
  } = require('objection-db-errors');

module.exports = {
  NotFound: function(req, res, next){
    next(ERR.NOT_FOUND);
  },
  Handler: function(err, req, res, next) {
    err = err || { message:"undefined error", status:500}
    var message = err.message;
    var errcode = err.code

    res.locals.error = req.app.get('env') === 'development' || req.app.get('env') === 'test' ? err : {};
    var stat = err.status || 500

    if (err instanceof UniqueViolationError ) {
      message = "已存在相同内容"
      errcode = 'unique_violation'
    } else if (err instanceof NotNullViolationError) {
      message = "内容不能为空"
      errcode = 'not_null_violation'
    } else if (err instanceof ConstraintViolationError) {
      message = "不符合限制条件"
      errcode = 'contraint_violation'
    } else if (err instanceof ForeignKeyViolationError) {
      message = "外键出现错误"
      errcode = 'foreign_key_violation'
    } else if (err instanceof CheckViolationError) {
      message = "检查出现错误"
      errcode = 'check_violation'
    } else if (err instanceof DataError) {
      message = "内容类型出错"
      errcode = 'data_error'
    } else if (err.code == "SQLITE_CONSTRAINT") {
      message = "已存在相同内容"
    } else if (err.message == "jwt malformed") {
      message = "登录不成功"
      errcode = 'token_invalid'
    } else if (err.message == "jwt expired") {
      message = "登录已过期"
      errcode = 'token_expired'
    } else if (err.message == "invalid token") {
      message = "登录错误"
      errcode = 'invalid_token'
    }
    
    res.status(stat);

    res.json({
      code: errcode ||  stat,
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
