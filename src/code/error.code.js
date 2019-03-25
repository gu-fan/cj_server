const APIError = require('./api.error')
const RAW_CODE = {
  NOT_FOUND: {text:"没有找到目标", http: 404},
  NOT_LOGIN: {text:"没有登录", http: 403},
  ALREADY_GOT_PERM: {text:"已拥有权限", http: 403},
  ALREADY_DELETED: {text:"已被删除", http: 400},
  CENSOR_NOT_PASS: {text:"目标未审核", http: 403},
  TARGET_LOCKED: {text:"目标已锁定", http: 400},
  NEED_ARGUMENT: {text:"需要参数", http: 400},
  BAD_ARGUMENT: {text:"参数错误", http: 400},
  NO_PERMISSION: {text:"没有权限", http: 403},
  EXCEED_RANGE: {text:"超出范围", http: 400},
  NO_SUCH_USER: {text:"没有找到用户", http: 400},
  PHONE_REGISTERED: {text:"手机号已注册", http:400},
  NAME_REGISTERED: {text:"用户名已注册", http:400},
  PASSWORD_MISMATCH: {text:'用户名或密码错误',http:400},
  CREDENTIALS_REQUIRED: {text:"缺少校验凭证", http: 400},
  NO_SUCH_TARGET: {text:"没有找到目标", http: 400},
  NOT_CHANGEABLE: {text:"不能进行改变", http: 400},
  NEED_TITLE: {text:"标题不能为空", http: 400},
  NEED_CONTENT: {text:"内容不能为空", http: 400},
  NEED_PHONE: {text:"请输入手机号", http: 400},
  NEED_USERNAME: {text:"请输入用户名", http: 400},
  NEED_PASSWORD: {text:"请输入密码", http: 400},
  NOT_AUTHOR: {text:"当前登录不是作者", http: 400},
  DUPLICATED_CONTENT: {text:"内容重复", http: 400},
  NO_SUCH_GROUP: {text:"没有找到群组", http: 400},
  NO_GROUP_ID: {text:"没有群组ID", http:400},
  ALREADY_IN_GROUP: {text:"已经加入该群组", http: 400},
  ALREADY_CHECKED: {text:"今天已经完成签到了", http: 400},
  IS_SPAM: {text:"请不要包含色情或敏感内容", http: 400},
  NOT_RELATED: {text:"并没有关联", http: 400},
  TAG_EXCEED_LIMIT_15: {text:"标签不能大于15个字", http: 400},
  NAME_EXCEED_LIMIT_15: {text:"名字不能大于15个字", http: 400},
  POST_LIMIT_3_TAG: {text:"动态不能超过3个标签", http: 400},
  CONTENT_MIN_4: {text:"内容不能少于4个字", http: 400},
  CONTENT_MIN_1: {text:"内容不能少于1个字", http: 400},
  SHARE_EXPIRED: {text:"分享内容已过期", http: 400},
}

const ERR = Object.keys(RAW_CODE).map((name)=>{
  return {
    name:name,
    text:RAW_CODE[name].text,
    http:RAW_CODE[name].http,
  }
}).reduce((res,item,idx)=>{
  Object.defineProperty(res, item.name, {
    get() { 
      return new APIError(item.text, item.name, item.http)
    },
  })
  return res
}, {})

const ERR_CODE = Object.keys(RAW_CODE).map((name)=>{
  return name
}).reduce((res,item,idx)=>{
  res[item] = item
  return res
}, {})

module.exports = { ERR, ERR_CODE }
