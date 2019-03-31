const express = require('express')
const router = express.Router({mergeParams: true})
const {promisify, wrap, delay} = require('../common/promise')
const jwt = require('../common/jwt-auth')
const {ERR, MSG} = require('../code')

const { User, Banner,Tag,Post }  = require('../models')
const {getUserWithCount, getUserWithCensorCount} = require('../services/user')

module.exports = router

function removeUndefined(target) {

  Object.keys(target).map((key, index) => {
    if(target[key] === undefined) {
      delete target[key]
    }
  })

  return target
}

router.get('/.ping',  wrap(async function(req, res, next) {

  var count = await Banner.query()
                          .select('id')
                          .count()

  res.json({
      msg:"banner count",
      count:count[0]['count(*)'],
      code:0,
  })

}))

router.get('/', wrap(async function(req, res, next){

  let banners = await Banner.query()
                .where('is_deleted', false)
                .orderBy('index', 'desc')

  res.json({
      msg:"banner get",
      banners,
      code:0,
  })

}))

async function getLinkByTagPost(tagname, postname){
  let link, image
  
  if (tagname) {
    let tag = await Tag.query().findOne({name:tagname})
    if (tag==null) throw ERR.TAG_NOT_FOUND
    link = '/pages/tag/main?name=' + tag.name + '&t=' + tag.id
  } else if (postname){
    let post = await Post.query().findById(postname)
    if (post == null) throw ERR.NOT_FOUND
    link = '/pages/detail/main?p=' + post.id
    image = post.content_json.images[0]
  } else {
    throw ERR.NEED_ARGUMENT
  }
  return {link,image}
  
}
router.post('/',  jwt.auth(), wrap(async function(req, res, next) {

  if (req.body.title == '' || req.body.title == null)
      throw ERR.NEED_CONTENT

  if (!req.user) throw ERR.NOT_LOGIN
  let user = getUserWithCount(req.user.sub)
  if (!user.is_staff) throw ERR.NO_PERMISSION

  let {link, image}= await getLinkByTagPost(req.body.tag, req.body.post)


  image = req.body.image || image
  if (image == '' || image == null) throw ERR.NEED_IMAGE
  let banner = await Banner.query()
    .insert({
      title: req.body.title,
      image: image ,
      tag: req.body.tag,
      post:req.body.post,
      link: link,
      index: req.body.index || 10,
    })

  res.json({
      msg:"banner create",
      banner,
      code:0,
  })

}))

router.put('/:bid',  wrap(async function(req, res, next) {

  if (req.params.bid == null) throw ERR.NEED_ARGUMENT


  let {link,image} = await getLinkByTagPost(req.body.tag, req.body.post)

  var obj = removeUndefined({
      title: req.body.title,
      image: req.body.image || image,
      tag: req.body.tag,
      post: req.body.post,
      index: req.body.index,
      link: link,
  })


  var banner = await Banner.query()
        .patchAndFetchById(req.params.bid, obj)

  res.json({
      msg:"banner patch",
      banner,
      code:0,
  })

}))
router.delete('/:bid',  wrap(async function(req, res, next) {

  if (req.params.bid == null) throw ERR.NEED_ARGUMENT

  var banner = await Banner.query()
          .patchAndFetchById(req.params.bid, {
            is_deleted: true
          })

  res.json({
      msg:"banner delete",
      deleted:banner.is_deleted,
      code:0,
  })

}))
router.post('/:bid/toggle_show',  wrap(async function(req, res, next) {

  if (req.params.bid == null) throw ERR.NEED_ARGUMENT

  let banner = await Banner.query().findById(req.params.bid)

  if(banner==null) throw ERR.NOT_FOUND

  banner = await banner.$query()
          .patchAndFetch({
            is_show: !banner.is_show
          })

  res.json({
      msg:"banner toggle show",
      is_show:banner.is_show,
      code:0,
  })

}))
router.post('/:bid/index/add',  wrap(async function(req, res, next) {

  if (req.params.bid == null) throw ERR.NEED_ARGUMENT

  let banner = await Banner.query().findById(req.params.bid)

  if(banner==null) throw ERR.NOT_FOUND

  banner = await banner.$query()
          .patchAndFetch({
            index: banner.index + 10,
          })

  res.json({
      msg:"banner add index",
      index:banner.index,
      code:0,
  })

}))

router.post('/:bid/index/sub',  wrap(async function(req, res, next) {

  if (req.params.bid == null) throw ERR.NEED_ARGUMENT

  let banner = await Banner.query().findById(req.params.bid)

  if(banner==null) throw ERR.NOT_FOUND

  banner = await banner.$query()
          .patchAndFetch({
            index: banner.index - 10,
          })

  res.json({
      msg:"banner sub index",
      index:banner.index,
      code:0,
  })

}))


