const {Post, Tag, User}  = require('../models')
const {ERR, MSG} = require('../code')

const { UniqueViolationError } = require('objection-db-errors');

// function relateTagWithPost(tid, pid, knex){
//     return knex('post_with_tag')
//             .insert({tid, pid})
//             .catch(e=>{
//               if (e.code == 'SQLITE_CONSTRAINT') {
//                   console.log(e)
//               }
//             })
// 
// }
// 
// async function relateTagNameWithPost2(tagname, pid, knex){
//     var tag = await Tag.query()
//                         .findOne({name: tagname})
//     if (tag == null) {
//       tag = await Tag.query()
//         .insertAndFetch({
//           name: tagname
//         })
//     }
//     await relateTagWithPost(tag.id, pid, knex)
//     await tag.$query().increment('total_posts', 1)
// 
//     return tag
// }
async function relateTagNameWithPost(tagname, post){
  if (tagname.length > 15) {
    throw ERR.TAG_EXCEED_LIMIT_15
  }
  var tag = await Tag.query()
                      .findOne({name: tagname})

  var need_increment = true
  if (tag == null) {
    tag = await Tag.query()
      .insertAndFetch({
        name: tagname,
        total_posts: 1,
      })
    need_increment = false
  }

  var is_unique = true
  try {
    await post.$relatedQuery('tags')
      .relate({
        id: tag.id,
      })

    // if it's unique
  } catch (e) {
    if (e instanceof UniqueViolationError) {
      // XXX: FIXED
      // we should also skip the user tag count!
      // use is_unique
      is_unique = false

      need_increment = false

    } else {
      throw e
    }
    
  }

  if (need_increment) {
    tag = await tag.$query()
          .patchAndFetch({total_posts:tag.total_posts+1})
  }

  return {tag, is_unique}

}
async function relateTagWithUser(tid, uid, is_unique){
  var user = await User.query().findById(uid)
  var u_tag = await user.$relatedQuery('tags')
                        .findById(tid)

  if (u_tag != null)  {
    // XXX: FIXED
    // can not use u_tag.$query() which return Tag model
    // should use $relateQuery() that use the through model
    if (is_unique) {
      await user.$relatedQuery('tags')
        .findById(tid)
        .patch({count:u_tag.count+1})
    } else {
      // console.log('skip')
    }
  } else {
    let tag = await Tag.query()
                        .findById(tid)

    await user.$relatedQuery('tags')
        .relate({
          id: tid,
          count: 1,
        })
  }

}

module.exports = {
  relateTagNameWithPost,
  relateTagWithUser,
}
