import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'url'

const resolveLocal = (p) => fileURLToPath(new URL(p, import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // shared/ (used for cross-portal components like UnifiedLoginPage) lives outside
    // this frontend's own node_modules tree and isn't npm-workspaced with it, so plain
    // Node resolution of "react"/"react-dom" from a file under shared/ walks up past
    // the repo root and fails during a production build (dev's pre-bundler is more
    // lenient, which is why only `vite build` — not `vite`/`vite dev` — hit this).
    // Pinning both to this frontend's own copy also guarantees a single React instance.
    alias: {
      react: resolveLocal('./node_modules/react'),
      'react-dom': resolveLocal('./node_modules/react-dom'),
      'react-router-dom': resolveLocal('./node_modules/react-router-dom'),
      'lucide-react': resolveLocal('./node_modules/lucide-react'),
    },
  },
  server: {
    port: 5174,
    strictPort: true,
  },
})
