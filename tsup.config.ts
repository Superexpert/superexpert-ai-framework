// tsup.config.ts  (place at the workspace root)
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts',  'src/server.ts'],
  format: ['esm', 'cjs'],   // dual-output
  dts: true,                // generate dist/index.d.ts
  outDir: 'dist',
  /** ⬇️  All deps that should stay external go here */
  external: ['@prisma/client', 'react'],
  clean: true,
  target: 'es2019',
});