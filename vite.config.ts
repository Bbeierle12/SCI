import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron/simple';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isDev = mode === 'development';
    
    return {
      server: {
        port: 3001,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        electron({
          main: {
            // Main process entry file
            entry: 'electron/main.js',
            vite: {
              build: {
                rollupOptions: {
                  external: ['electron'],
                },
              },
              define: {
                'process.env.VITE_DEV_SERVER_URL': isDev ? JSON.stringify('http://localhost:3001') : undefined,
              },
            },
          },
          preload: {
            // Preload script
            input: 'electron/preload.js',
          },
          // Enable hot reload for Electron
          renderer: isDev ? {} : undefined,
        }),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      // Electron requires base to be './' for file protocol
      base: './',
      build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
          external: ['electron']
        }
      }
    };
});
