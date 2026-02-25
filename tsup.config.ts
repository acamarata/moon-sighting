import { defineConfig } from 'tsup'

export default defineConfig([
  // Library build (CJS + ESM)
  {
    entry: { index: 'src/index.ts' },
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
    outDir: 'dist',
    splitting: false,
    sourcemap: true,
    target: 'es2020',
    platform: 'node',
    outExtension({ format }) {
      return { js: format === 'cjs' ? '.cjs' : '.mjs' }
    },
  },
  // CLI build (CJS only, with shebang)
  {
    entry: { 'cli/index': 'src/cli/index.ts' },
    format: ['cjs'],
    dts: false,
    outDir: 'dist',
    splitting: false,
    sourcemap: false,
    target: 'es2020',
    platform: 'node',
    banner: {
      js: '#!/usr/bin/env node',
    },
    outExtension() {
      return { js: '.cjs' }
    },
  },
])
