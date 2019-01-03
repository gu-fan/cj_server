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
    // console.log(Object.keys(hits))
    return Object.keys(hits).length > 0
  } catch (e) {
    console.log(e)
    return false
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

    var k = ad_words.some(re=>{
      return re.test(content)
    })

    return k

  } catch (e) {
    console.log(e)
    return false
    
  }

}

function check_spamPornRegExp(content){
  try {

    var k = porn_words.some(re=>{
      return re.test(content)
    })

    return k

  } catch (e) {
    console.log(e)
    return false
    
  }
}

function checkSpam(content){
  if (content == '' || content == null) return false
  if (check_spamADRegExp(content) || check_spamPornRegExp(content) || check_spamFast(content)) {
    return true
  } else {
    return false
  }
}

module.exports = {
  checkSpam,
  check_spamFast,
  check_spamRegExp,
  check_spamIndex,
  check_spamADRegExp,
  check_spamPornRegExp
}
