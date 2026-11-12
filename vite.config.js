import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `base` is the GitHub Pages sub-path: the site is served from /<repo-name>/.
export default defineConfig({
  plugins: [react()],
  base: '/portfolio-2027/',
  server: { port: 3000, strictPort: true },
  preview: { port: 3000, strictPort: true },
})
