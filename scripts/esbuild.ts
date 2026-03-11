import esbuild from 'esbuild'

esbuild
  .build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: 'node',
    target: ['node18'],
    outfile: 'build/app.cjs',
    format: 'cjs',
    sourcemap: false,
    legalComments: 'none',
    external: ['bcrypt', 'oracledb'],
    logLevel: 'info',
  })
  .catch(() => process.exit(1))
