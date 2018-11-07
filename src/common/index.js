function getCount(object){
    return (object && object.length) ? object[0]['count(*)'] : 0 
}
module.exports = {
  getCount,
  normalizeUser(user){
    user.total_questions = getCount(user.questions)
    user.total_answers = getCount(user.answers)

    user.is_staff = /censor/.test(user.permission)

    delete user.password
    delete user.permission

    delete user.questions
    delete user.answers

    return user
  }

}
