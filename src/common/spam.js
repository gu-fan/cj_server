const FastScanner= require('fastscan')

const fs = require('fs')
const file = fs.readFileSync('./spams/words.txt','utf8')
// const file = fs.readFileSync('./spams/test.txt','utf8')
const filter_plain = file.split('\n').filter(item=>item!='')
const filter_words = file.split('\n').filter(item=>item!='')
  .map(word=>{
      word = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
      return new RegExp(word)
  })

const ad_file = fs.readFileSync('./spams/ad.txt','utf8')
const ad_words = ad_file.split('\n').filter(item=>item!='')
  .map(word=>{
      word = word.replace(/[.*+?^${}()[\]\\]/g, '\\$&'); // $& means the whole matched string
      word = word.replace(/[|]/g, '.*')
    
      return new RegExp(word)
  })

const porn_file = fs.readFileSync('./spams/porn.txt','utf8')
const porn_words = porn_file.split('\n').filter(item=>item!='')
  .map(word=>{
      word = word.replace(/[.*+?^${}()[\]\\]/g, '\\$&'); // $& means the whole matched string
      word = word.replace(/[|]/g, '.*')
    
      return new RegExp(word)
  })

function check_spamIndex(content){

  var k = filter_words.some(word=>{
    if (content.indexOf(word)!=-1) {
      return true
    } else {
      return false
    }
  })
  console.log(k)

}


var scanner = new FastScanner(filter_plain)
function check_spamFast(content){

  try {
    // console.log("===========START")
    // console.log(content)
    var hits = scanner.hits(content,{quick:true})
    // console.log("===========")
    // console.log(content)
    // console.log(hits)
    return [Object.keys(hits), Object.keys(hits).length > 0]
  } catch (e) {
    console.log(e)
    return [null, false]
  }

}


function check_spamRegExp(content){
  try {

    var k = filter_words.some(re=>{
      // var match = content.match(re)
      // if (match) (console.log(match))

      return re.test(content)
    })

    return k

  } catch (e) {
    console.log(e)
    return false
    
  }

}

function check_spamADRegExp(content){
  try {
    var word = null
    var k = ad_words.some(re=>{
      if (re.test(content)) {
        word = re
        return true
      } else {
        return false
      }
    })

    return [word, k]

  } catch (e) {
    console.log(e)
    return [null, false]
  }
}

function check_spamPornRegExp(content){
  try {
    var word = null
    var k = porn_words.some(re=>{
      if (re.test(content)) {
        word = re
        return true
      } else {
        return false
      }
    })

    return [word, k]

  } catch (e) {
    console.log(e)
    return [null, false]
  }

}

function checkSpam(content){
  if (content == '' || content == null) return false
  if (check_spamADRegExp(content)[1] || check_spamPornRegExp(content)[1] || check_spamFast(content)[1]) {
    return true
  } else {
    return false
  }
}
function checkSpamExact(content){
  if (content == '' || content == null) return false

  var result1 =check_spamADRegExp(content) 
  if (result1[1]) {
    return result1
  } else {
    var result2 = check_spamPornRegExp(content) 
    if (result2[1]) {
      return result2
    } else {
      var result3 = check_spamFast(content) 
      if (result3[1]) {
        return result3
      } else {
        return [null, false]
      }
    }
    return [null, false]
  }
}

module.exports = {
  checkSpam,
  checkSpamExact,
}
