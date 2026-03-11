module.exports = {
  apps: [
    {
      name: 'nucleo-taller-server',
      script: 'build/app.cjs',
      cwd: __dirname,
      exec_mode: 'fork',
      instances: 1,
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
}
