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
  wrap: fn => (...args) =>
  {
        fn(...args).catch(args[2])
  }
}
