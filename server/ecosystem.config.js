module.exports = {
  apps: [
    {
      name: "frontend",
      script: "/root/.nvm/versions/node/v18.20.8/lib/node_modules/serve/build/main.js",
      exec_interpreter: "/root/.nvm/versions/node/v18.20.8/bin/node",
      args: "-s /root/web/dist -l tcp://0.0.0.0:3000",
      exec_mode: "fork"
    }
  ]
};
