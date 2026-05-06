import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  if (mode === 'production' && !env.VITE_API_URL) {
    throw new Error('[vite] VITE_API_URL é obrigatória para builds de produção.')
  }
  return {
    plugins: [react(), tailwindcss()],
  }
})
