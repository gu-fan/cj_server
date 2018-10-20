class APIError extends Error {
  constructor(msg, name, status, errors){
    super(msg)
    this.name = name;
    this.status = status || 500;
    this.code = name ;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this);
    } else {
      this.stack = (new Error()).stack;
    }
    this.errors = errors || {}
  }
}

module.exports = APIError
