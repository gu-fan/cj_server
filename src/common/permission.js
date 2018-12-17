const { User, Staff}  = require('../models')
const {ERR, MSG} = require('../code')

function hasPermission(match){
  return function(req, res, next){
    var type = new RegExp(match)
    User.query()
        .findById(req.user.sub)
        .then(user=>{
          if (user == null ) {
              Staff.query().findById(req.user.sub)
              .then(staff=>{
                 if (staff == null) {
                   next(ERR.NO_SUCH_TARGET)
                 } else if (!type.test(staff.permission) && !/admin/.test(staff.permission)) {
                   next(ERR.NO_PERMISSION)
                 } else {
                   next()
                 }
              })
              .catch(err=>next(err))
          } else if (!type.test(user.permission) && !/admin/.test(user.permission)) {
             next(ERR.NO_PERMISSION)
          } else {
            next()
          }

        })
        .catch(err=>next(err))

  }
}

module.exports = {
  hasPermission
}
