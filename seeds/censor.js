
exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return Promise.all([
    knex('question').del()
    .then(function () {
      // Inserts seed entries
      return knex('question').insert([
        {id: 1, title: 'aaa', content:'bbb', author_id:1},
        {id: 2, title: 'test', content:'bbb', author_id:1},
        {id: 3, title: 'why', content:'bbb', author_id:1},
        {id: 4, title: '充值就送多的点点滴滴', content:'bbb', author_id:1},
        {id: 5, title: 'this isa  teset', content:'bbb', author_id:1},
        {id: 6, title: 'double', content:'bbb', author_id:1},
        {id: 7, title: 'why u are this', content:'bbb', author_id:1},
      ]);
    })
    ,
    knex('answer').del()
    .then(function () {
      // Inserts seed entries
      return knex('answer').insert([
        {id: 1, content:'bbb', author_id:1, question_id:1},
        {id: 2, content:'bbb', author_id:2, question_id:1},
        {id: 3, content:'bbb', author_id:1, question_id:2},
        {id: 4, content:'bbadwab', author_id:1, question_id:1},
        {id: 5, content:'bbb', author_id:1, question_id:3},
        {id: 6, content:'bbb', author_id:1, question_id:3},
        {id: 7, content:'bbb', author_id:1, question_id:1},
      ]);
    })
    ,
    // knex('user')
    // .then(function () {
    //   // Inserts seed entries
    //   return knex('user').insert([
    //     {id: 1, wx_id: 'wx1', name:'u1'},
    //     {id: 2, wx_id: 'wx2', name:'u2'},
    //   ]);
    // })
  ])

};
