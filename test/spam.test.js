const ERR = require('../src/code').ERR_CODE

const _TEST_ = require('path').basename(__filename);
const { http, setupServer, closeServer } = require('./setup/server')(_TEST_)

const { signup, signupAndLogin } = require('./common')(http)

describe('spam tests', () => {
  beforeAll(async ()=>{
    await setupServer()
  })

  afterAll(async ()=>{
    await closeServer()
  })

  let clock
  let res

  let pid, cid
  test('create post', async () => {
    expect.assertions(7);

    try {
      

    await signupAndLogin(1)

    var post = {
      content: "1995年中共执政当局开始寻求强化法轮功的组织构架及与政府的关系。 中国政府的国家体委、公共健康部和气功科研会，访问李洪志，要求联合成立法轮功协会，但李洪志表示拒绝。 同年，气功科研会通过一项新规定，命令所有气功分会必须建立中国共产党党支部，但李洪志再次表示拒绝。 李洪志与中国气功科研会的关系在1996年持续恶化。 1996 年3月，法轮功因拒不接受中国气功协会新负责人在“气功团体内部收取会员费创收”和“成立中国共产党党支部组织”的要求， 主动申请退出中国气功协会和中国 气功科研会, 以独立非政府形式运作。 自此，李洪志及其法轮功脱离了中国气功协会中的人脉和利益交换，同时失去了功派在中国政府体制系统的保护。法轮功申请退出中国气功协会，是与中国政府对气功的态度产生变化相对应的；当时随气功激进反对者在政府部门中的影响力增加，中国政府开始控制和影响各气功组织。90年代中期，中国政府主管的媒体开始发表文章批评气功。 法轮功起初并没有受批评，但在1996年3月退出中国气功协会后，失去了政府体制的保护。"
    }
    try {
      res = await http.post('/p', post)
    } catch (e) {
      expect(e.response.data.code).toBe(ERR.IS_SPAM)
    }

    post = {
      content: "範長龍"
    }

    try {
      res = await http.post('/p', post)
    } catch (e) {
      expect(e.response.data.code).toBe(ERR.IS_SPAM)
    }

    post = {
      content: "fastscan 可以做到以迅雷不及掩耳的速度扫遍一幅 10w 字的长文，10w 大概就是一部中篇小说的长度了。如果你要扫百万字的长篇小说，那还是建议你分章分节来扫吧。\n内存占用也是需要考虑的点，内存对于 Node 程序来说本来就非常有限，如果因为敏感词树占据了太大的内存那是非常要不得的大问题。所以我也对内存占用进行了测试，下面是测试的结果看看"
    }
      
    res = await http.post('/p', post)
    pid = res.data.post.id
    expect(res.data.code).toBe(0)

    post = {
    }
    try {
      res = await http.post('/p', post)
    } catch (e) {
      expect(e.response.data.code).toBe(ERR.NEED_CONTENT)
    }

    post = {
      content: "faf新款jawef地址jaefajwefj"
    }

    try {
      res = await http.post('/p', post)
    } catch (e) {
      expect(e.response.data.code).toBe(ERR.IS_SPAM)
    }

    post = {
      content: "faf湿润jawef奶子jae小嘴fajwefj"
    }

    try {
      res = await http.post('/p', post)
      console.log(res.data)
    } catch (e) {
      expect(e.response.data.code).toBe(ERR.IS_SPAM)
    }

      try {
        res = await http.put(`/p/${pid}`, post)
      } catch (e) {
        expect(e.response.data.code).toBe(ERR.IS_SPAM)
      }
    } catch (e) {
      console.log(e.response? e.response.data : e)
      
    }

  }, 10000)


  test('create comment', async () => {
    expect.assertions(3);
    try {
      comment = {
        content: "faf湿润jawef嘴子",
        pid 
      }

      res = await http.post(`/c/`, comment)
      expect(res.data.code).toBe(0)
      cid = res.data.comment.id

      comment = {
        content: "faf湿润jawef奶子jae小嘴fajwefj",
        pid 
      }

      try {
        res = await http.post(`/c/`, comment)
      } catch (e) {
        expect(e.response.data.code).toBe(ERR.IS_SPAM)
      }

      comment = {
        content: "急需钱wwo 我哦哦哦",
        pid 
      }

      try {
        res = await http.put(`/c/${cid}`, comment)
      } catch (e) {
        expect(e.response.data.code).toBe(ERR.IS_SPAM)
      }
    } catch (e) {
      console.log(e.response ? e.response.data :e )
    }

  })

})
