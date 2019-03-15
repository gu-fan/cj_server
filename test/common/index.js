function setupToken(http, t) {
  http.defaults.headers.common['Authorization'] = 'Bearer ' + t
}

module.exports = function(http){

  async function staffSignup(id) {
      var res = await http.post('/sa/signup',
        {
          username: 'STAFF_'+id,
          password: 'password'
        })
      setupToken(http, res.data.t)
      return res
  }

  async function staffLogin(id){
    var res = await http.post('/sa/login',
      {
        username: 'STAFF_'+id,
        password: 'password'
      }
    )
    setupToken(http, res.data.t)
    return res
  }

  async function signup (id) {
    var res = await http.post('/auth/signup', {
      phone: 'p20000_'+id,
      password: 'password'
    })
    return res
  }

  async function login(id) {
    var res = await http.post('/auth/login', {
      phone: 'p20000_'+id,
      password: 'password'
    })
    setupToken(http, res.data.t)
    return res
  }

  async function signupAndLogin(idx){
    var res = await http.post('/auth/signup',
      {
        phone: 'p20000_'+idx,
        password: 'password'
      })
    setupToken(http, res.data.t)
    return res
  }

  async function signupAndLoginWX(idx){
    var wechat_id= 'wx_20000' + idx
    var res = await http.post('/auth/wx_code_fake', {wechat_id})
    setupToken(http, res.data.t)
    return res
  }

  async function bindUserWX(idx){
    var nickName = 'wx' + idx
    var res = await http.post('/wx/bind', {userInfo:{avatarUrl:'http://xxxxxx',nickName}})
    return res
  }

  return {
    signup,
    login,
    signupAndLogin,
    signupAndLoginWX,
    staffSignup,
    staffLogin,
    bindUserWX,
  }
}
