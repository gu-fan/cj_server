module.exports = function(http){

  async function getRes(cb){
    try {
      res = await cb
    } catch (e) {
      res = e.response
    }
    return res
  }

  async function staffSignup (id) {
      var p ='a10000'+id 
      var res = await http.post('/sa/signup', {username: p, password: 'pass'})
      var token = res.data.t
      http.defaults.headers.common['Authorization'] ='Bearer '+ token
      return res
  }

  async function staffLogin(id){
    var p = 'a10000' + id
    var res = await http.post('/sa/login', {username: p, password: 'pass'})
    var token = res.data.t
    http.defaults.headers.common['Authorization'] ='Bearer '+ token
    return res
  }

  async function signup (id) {
      var p ='s10000'+id 
      var res = await http.post('/auth/signup', {phone: p, password: 'password'})
      return res
  }


  async function signupAndLogin(idx){
    var phone = 'sl20000' + idx
    var res = await http.post('/auth/signup', {phone: phone , password: 'test123'})
    var token = res.data.t
    http.defaults.headers.common['Authorization'] ='Bearer '+ token
    return res
  }
  async function login(idx){
    var phone = 'sl20000' + idx
    var res = await http.post('/auth/login', {phone: phone , password: 'test123'})
    var token = res.data.t
    http.defaults.headers.common['Authorization'] ='Bearer '+ token
    return res
  }

  return {
    getRes,
    signup,
    login,
    signupAndLogin,
    staffSignup,
    staffLogin,
  }
}
