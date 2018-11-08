module.exports = {
  apps : [
      {
        name: "fzbb_ask",
        script: "./bin/www",
        watch: true,
        env: {
          "NODE_ENV": "staging",
        }
      }
  ]
}
