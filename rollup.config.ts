// See: https://rollupjs.org/introduction/

import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'

const config = {
  input: 'src/index.ts',
  output: {
    file: 'dist/index.js',
    format: 'cjs',
    sourcemap: true
  },
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
      compilerOptions: {
        module: 'ESNext',
        moduleResolution: 'Bundler'
      }
    }),
    nodeResolve({ preferBuiltins: true }),
    commonjs()
  ]
}

export default config
