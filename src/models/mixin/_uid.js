/**
 * Combine cuid and uid2
 */


var crypto = require('crypto');
var UIDCHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';

function tostr(bytes) {
  var chars, r, i;

  r = [];
  for (i = 0; i < bytes.length; i++) {
    r.push(UIDCHARS[bytes[i] % UIDCHARS.length]);
  }

  return r.join('');
}

function uid2(length, cb) {

  if (typeof cb === 'undefined') {
    return tostr(crypto.pseudoRandomBytes(length));
  } else {
    crypto.pseudoRandomBytes(length, function(err, bytes) {
       if (err) return cb(err);
       cb(null, tostr(bytes));
    })
  }
}

function shortime(){
  var d = new Date()
  var timestamp =pad((d.getTime()&0xFFFFFF).toString(36), 5)
  return timestamp
}
function longtime(){
  var d = new Date()
  var timestamp =pad((d.getTime()&0xFFFFFFFF).toString(36), 8)
  return timestamp
}

var c = 0,
  blockSize = 4,
  base = 36,
  discreteValues = Math.pow(base, blockSize)

function counter(){
    var counter = pad(safeCounter().toString(base), 2)
    return counter
}
function pad (num, size) {
  var s = '000000000' + num;
  return s.substr(s.length - size);
};
function safeCounter () {
  c = c < discreteValues ? c : 0;
  c++; // this is not subliminal
  return c - 1;
}

var os = require('os')
function fingerprint () {
    var padding = 1,
    pid = pad(process.pid.toString(36), padding),
    hostname = os.hostname(),
    length = hostname.length,
    hostId = pad(hostname
      .split('')
      .reduce(function (prev, char) {
        return +prev + char.charCodeAt(0);
      }, +length + 36)
      .toString(36),
    padding);
  
  return pid + hostId;
};


function uid(){
  return uid2(1) + shortime() + fingerprint() + counter() + uid2(4)
}

function uid_time(){
  return longtime() +  uid2(1) + fingerprint() + counter() + uid2(4)
}
function slug(){
  return shortime().slice(-2) + fingerprint().slice(-1) +  safeCounter().toString(36).slice(-4) + uid2(3)
}

module.exports = {uid, uid_time, slug};
