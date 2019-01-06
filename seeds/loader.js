const fs   = require('fs');
const path = require("path");
const file = fs.readFileSync(path.resolve(__dirname, "./q.yml"));

const yaml = require('js-yaml');

var doc
try {
  doc = yaml.safeLoad(file);
  // console.log(doc);
} catch (e) {
  console.log(e);
  doc = []
}

exports.doc = doc
exports.seed = function(){
  
}

