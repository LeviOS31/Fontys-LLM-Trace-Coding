import { defineConfig } from 'vitest/config';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import dotenv from 'dotenv';
import path from 'node:path';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  dotenv.config({
    path: path.resolve(__dirname, mode === 'lighthouse' ? '.env.lighthouse' : '.env'),
    override: mode === 'lighthouse',
  });

  return {
    plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
    test: {
      globals: true,
      environment: 'happy-dom',
    },
  };
});
