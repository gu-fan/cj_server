DATABASE
========

User

   id

   name
   wx_id
   avatar

   phone
   password

   following
   follower

   questions
   total_answers_to_me

   answers
   total_zhichi
   total_fandui
   total_thanks

   points
   point_tracks

   status

   badges

point_track

   id
   from
   to
   point

Badge
   id
   name

Question

   id
   author
   title
   content
   tag

   
   answers
   total_zhichi_to_q
   total_answers_to_q

Answer

   id
   author
   content

   question

   comments
   total_comments

Comment

   id
   author
   content

Message

   id
   from
   to
   content

Tag

   id
   name

Chat
   type: (friend, group, tmp)
   Channel

Staff

   id
   username
   password


APIS
====

auth/signup
auth/login

user/.ping
user/:uid

post/new
post/:pid
post/:pid/delete
post/:pid/update



secrects
========
AppID(小程序ID) wx40ff346e15e8d454
AppSecret(小程序密钥) c68cb819032df23248de5278015a4c77 复制


