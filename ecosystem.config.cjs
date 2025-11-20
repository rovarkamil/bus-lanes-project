module.exports = {
  apps: [
    {
      name: "bus-interactive-map-system",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      },
      error_file: "logs/err.log",
      out_file: "logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      min_uptime: "5000",
      max_restarts: 5,
      restart_delay: 4000,
    },
  ],
};
