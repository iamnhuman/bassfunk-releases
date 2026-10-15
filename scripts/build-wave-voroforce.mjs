import { build } from 'esbuild'

await build({
  entryPoints: ['scripts/wave-voroforce.js'],
  bundle: true,
  format: 'iife',
  globalName: 'BassfunkWaveVoroforce',
  target: ['es2020'],
  outfile: 'scripts/wave-voroforce.bundle.js',
  plugins: [
    {
      name: 'skip-voroforce-devtools',
      setup(build) {
        build.onResolve({ filter: /common\/dev-tools$/ }, () => ({
          path: 'voroforce-devtools-stub',
          namespace: 'stub',
        }))
        build.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({
          contents: 'export default class DevTools { dispose() {} }',
          loader: 'js',
        }))
      },
    },
  ],
  loader: {
    '.frag': 'text',
    '.vert': 'text',
  },
  logLevel: 'info',
})
