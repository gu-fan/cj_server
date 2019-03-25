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
    function generateKey(id){
      // 3 day
      let expire = Date.now() + 3600 * 24 * 1000 * 3
      let key = encrypt(id+':'+expire)
      return key
    }

    function checkValid(id, st){
      let out=''
      try {
         out = decrypt(st)
      } catch (e) {
        if (e.message=='Bad input string'){
          throw ERR.BAD_ARGUMENT
        } else {
          throw e
        }
      }
      let arr = out.split(':')
      if (arr.length == 0) {
        throw ERR.BAD_ARGUMENT
      }
      let _id = arr[0]
      let expire = arr[1]

      if (_id != id ) {
        throw ERR.BAD_ARGUMENT
      }

      if (expire < Date.now()) {
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
