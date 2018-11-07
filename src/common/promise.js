module.exports = {
  promisify: fn => (...args) =>
          new Promise((resolve, reject) => {
            const callback = (err, data) => err ? reject(err) : resolve(data)
            
            fn.apply(this, [...args, callback])
          }),
  delay: time =>
          new Promise((resolve, reject) => {
            setTimeout(() => { 
              resolve()
            }, time);
          }),
  wrap: fn => (req, res, next) => {
        fn(req,res,next)
        .catch((err)=>{
          // XXX:
          // next(err)
          // is not handled by handler 
         
          // copy from err.handler
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
          
        })
  },
  wrap2: (fn) => {
  
    return (request, response, next) => {
        const promise = fn(request, response, next);
        if (!promise.catch) {
             return;
        }
        promise.catch((error) => {
            console.log("error");
            console.log(error);
            response.sendStatus(error.status);
        });

    };
  }
  
}
