const express = require('express')
const router = express.Router({mergeParams: true})
const STS = require('qcloud-cos-sts');

const {promisify, wrap, delay} = require('../common/promise')
const jwt = require('../common/jwt-auth')

var config = {
    secretId: 'AKID57g4HI3AFlAPW6tnx1ayA8yfCaljtnxv',
    secretKey: 'weJjukV7VrkPp34jFcnlUzRsBfyXu9B4',
    proxy: '',
    durationSeconds: 1800,
    bucket: 'xyd-1258191884',
    region: 'ap-guangzhou',
    allowPrefix: '*',
    // 简单上传和分片，需要以下的权限，其他权限列表请看 https://cloud.tencent.com/document/product/436/14048
    allowActions: [
        'name/cos:PutObject',
        'name/cos:PostObject',
        'name/cos:InitiateMultipartUpload',
        'name/cos:ListMultipartUploads',
        'name/cos:ListParts',
        'name/cos:UploadPart',
        'name/cos:CompleteMultipartUpload'
    ],
};

router.get('/cos', jwt.auth(), function(req, res, next) {


    // 获取临时密钥
    var LongBucketName = config.bucket;
    var ShortBucketName = LongBucketName.substr(0, LongBucketName.indexOf('-'));
    var AppId = LongBucketName.substr(LongBucketName.indexOf('-') + 1);
    var policy = {
        'version': '2.0',
        'statement': [{
            'action': config.allowActions,
            'effect': 'allow',
            'principal': {'qcs': ['*']},
            'resource': [
                'qcs::cos:' + config.region + ':uid/' + AppId + ':prefix//' + AppId + '/' + ShortBucketName + '/' + config.allowPrefix,
            ],
        }],
    };
  
    STS.getCredential({
        secretId: config.secretId,
        secretKey: config.secretKey,
        proxy: config.proxy,
        durationSeconds: config.durationSeconds,
        policy: policy,
    }, function (err, tempKeys) {
        if (err) {
          res.json(err)
        } else if (tempKeys == null ){
          res.json({code:1, msg:"got empty key"});
        } else {
          var result = tempKeys
          result.code = 0
          res.json(result);
        }
    });


})

module.exports = router
