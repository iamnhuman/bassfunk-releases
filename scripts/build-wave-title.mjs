import { build } from 'esbuild';

// Reuse the gallery's existing Three.js r160 instance and renderer classes.
// Bundling another copy would add weight and create incompatible class identities.
const names = ['Texture', 'LinearFilter', 'Color', 'InstancedBufferGeometry', 'Sphere', 'Box3',
  'InstancedBufferAttribute', 'PlaneGeometry', 'Vector2', 'Vector4', 'Matrix3', 'Mesh',
  'MeshBasicMaterial', 'DoubleSide', 'Matrix4', 'Vector3', 'DataTexture', 'RGBAFormat',
  'FloatType', 'DynamicDrawUsage', 'MeshDepthMaterial', 'MeshDistanceMaterial',
  'RGBADepthPacking', 'UniformsUtils', 'ShaderChunk', 'ShaderLib', 'CylinderGeometry', 'MeshStandardMaterial'];
await build({
  entryPoints: ['scripts/wave-title-3d.js'], bundle: true, format: 'iife', target: ['es2020'],
  outfile: 'scripts/wave-title-3d.bundle.js', minify: true, logLevel: 'info',
  plugins: [{ name: 'existing-three', setup(build) {
    build.onResolve({filter: /^three$/}, () => ({path: 'three', namespace: 'gallery-three'}));
    build.onLoad({filter: /.*/, namespace: 'gallery-three'}, () => ({
      contents: `export const {${names.join(',')}} = window.THREE;`, loader: 'js'
    }));
  }}]
});
