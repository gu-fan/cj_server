function getCount(object){
    return object.length ? object[0]['count(*)'] : 0 
}
module.exports = {
  getCount,
  normalizeUser(user){
    user.total_questions = getCount(user.questions)
    user.total_answers = getCount(user.answers)
    delete user.questions
    delete user.answers
    return user
  }

}
