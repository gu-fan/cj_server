const express = require('express')
const router = express.Router({mergeParams: true})
const {promisify, wrap, delay} = require('../common/promise')
const jwt = require('../common/jwt-auth')
const {ERR, MSG} = require('../code')

const { Banner }  = require('../models')

module.exports = router

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

router.post('/',  wrap(async function(req, res, next) {

  if (req.body.title == '' || req.body.title == null) 
    throw ERR.NEED_CONTENT

  var banner = await Banner.query()
    .insert({
      title: req.body.title,
      image: req.body.image,
      link: req.body.link,
      index: req.body.index || 0,
    })

  res.json({
      msg:"banner create",
      banner,
      code:0,
  })

}))

  function removeUndefined(target) {

    Object.keys(target).map((key, index) => {
      if(target[key] === undefined) {
        delete target[key]
      }
    })

    return target
  }
router.patch('/:bid',  wrap(async function(req, res, next) {

  if (req.params.bid == null) throw ERR.NEED_ARGUMENT

  var obj = removeUndefined({
      title: req.body.title,
      image: req.body.image,
      link: req.body.link,
      index: req.body.index,
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

  var deleted = await Banner.query()
    .deleteById(req.params.bid)

  res.json({
      msg:"banner delete",
      deleted,
      code:0,
  })

}))

