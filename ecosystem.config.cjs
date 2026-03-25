/**
 * PM2 config for running Next.js in production (VPS / Node server).
 * Usage: pm2 start ecosystem.config.cjs
 */
module.exports = {
  apps: [
    {
      name: 'doddapaneni-group',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -H 0.0.0.0',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
