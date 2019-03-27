const {ERR, MSG} = require('../code')

// Nodejs encryption with CTR
var crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    password = 'XYDXYD123';

function encrypt(text){
  var cipher = crypto.createCipher(algorithm,password)
  var crypted = cipher.update(text,'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}
 
function decrypt(text){
    var decipher = crypto.createDecipher(algorithm,password)
    var dec = decipher.update(text,'hex','utf8')
    dec += decipher.final('utf8');
  return dec;
}
// XXX
// use the simplest encrypt
// as minicode max is 32
    function generateKey(id){
      // 3 day
      let expire = Date.now() / 1000 + 3600 * 24  * 3
      // let key = encrypt(id+':'+expire)
      let key = id.slice(1,3) +':'+ expire.toString(16) 
      return key
    }

    function checkValid(id, st){
      let out=''
      try {
         // out = decrypt(st)
         out = st
      } catch (e) {
        if (e.message=='Bad input string'){
          throw ERR.BAD_ARGUMENT
        } else {
          throw e
        }
      }
      let arr = out.split(':')
      if (arr.length != 2) {
        throw ERR.BAD_ARGUMENT
      }
      let _id = arr[0]
      let expire = parseInt(arr[1], 16)

      if (_id != id.slice(1,3) ) {
        throw ERR.BAD_ARGUMENT
      }

      if (expire < (Date.now() /1000)) {
        throw ERR.SHARE_EXPIRED
      } else {
        return true
      }

    } 
module.exports = {
  encrypt,
  decrypt,
  generateKey,
  checkValid,
}
