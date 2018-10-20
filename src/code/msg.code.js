const MSG_CODE = {
  REGISTER_SUCCESS: {text:"注册成功"},
  LOGIN_SUCCESS: {text:"登录成功"},
  USER_VALID: {text:"用户正常"},


  // USER_DISABLED_7: {text:"用户被封禁7天"},
  // USER_DISABLED_INF: {text:"用户被永久封禁"},
  // USER_BANNED_7: {text:"用户被禁言7天"},
  // USER_BANNED_INF: {text:"用户被永久禁言"},
  //
  POST_SUCCESS: {text:"成功发布文章"},
  COMMENT_SUCCESS: {text:"成功发布评论"},
}

const MSG = Object.keys(MSG_CODE).map((name)=>{
  return {
    name:name,
    text:MSG_CODE[name].text
  }
}).reduce((res,item,idx)=>{
  res[item.name] = item.text
  return res
}, {})


module.exports = {
  MSG_CODE,
  MSG,
}

