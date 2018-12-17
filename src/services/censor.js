function checkValidPermission(id){
  return new Promise((resolve, reject)=>{
    User.query()
        .findById(id)
        .then(user=>{

          if (user == null ) {
              Staff.query().findById(id)
              .then(staff=>{
                 if (staff == null) {
                   reject(ERR.NO_SUCH_TARGET)
                 } else if (!/censor|admin/.test(staff.permission)) {
                   reject(ERR.NO_PERMISSION)
                 } else {
                   resolve(true)
                 }
              })
              .catch(err=>reject(err))
          } else if (!/censor|admin/.test(user.permission)) {
             reject(ERR.NO_PERMISSION)
          } else {
            resolve(true)
          }

        })
        .catch(err=>reject(err))
  })
}


module.exports = {
  checkValidPermission
}
