ssh fzbbsh "cd /home/ubuntu/repos/fzbb_server && git pull && yarn && yarn migrate && pm2 restart 0"
