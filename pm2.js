module.exports = {
  apps : [
      {
        name: "xyd_server",
        script: "./bin/www",
        watch: true,
        env: {
          "NODE_ENV": "staging",
        }
      }
  ]
}
