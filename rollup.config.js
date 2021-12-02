import { defineConfig } from 'rollup';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

export default defineConfig({
  input: 'src/index.ts',
  output: {
    dir: 'dist',
    format: 'commonjs',
    exports: 'named',
    sourcemap: false,
  },
  plugins: [
    commonjs(),
    resolve(),
    typescript({
      exclude: ['*.test.ts'],
      module: 'esnext',
    }),
  ],
});
