function PostQueryBuilder(day_before){
  return builder=>{
    builder
      .where('censor_status', 'pass')
      .where('is_deleted', false)
      .where('is_public', true)
      .where('created_at', '>', day_before)
  }
}

function setupItemLikeByMe(items){
  items.results.forEach((item)=>{
    if (item.liked_by_users.length>0) {
      item.is_like_by_me = true
    } else {
      item.is_like_by_me = false
    }
    delete item.liked_by_users
  })

}

module.exports = {
  setupItemLikeByMe,
  PostQueryBuilder,
}
