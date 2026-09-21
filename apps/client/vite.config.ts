// vite.config.ts
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// Environment lives in the repository root so the client and server share one
// .env file.
const envDir = path.resolve(import.meta.dirname, '../../')

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, envDir, '')
  const apiTarget = env.VITE_DEV_API_TARGET || 'http://localhost:3001'

  return {
    envDir,
    plugins: [
      tailwindcss(),
      // '@tanstack/router-plugin' must be passed before '@vitejs/plugin-react'
      tanstackRouter({
        target: 'react',
        autoCodeSplitting: true,
      }),
      react(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/graphql': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
