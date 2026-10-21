import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * shared/ is CommonJS because the Node backends require() it. This app lives
 * outside that package, so Vite serves those files to the browser as raw ESM
 * and does not rewrite `module.exports` / `require`. A static
 * `import { PERMISSIONS }` then throws during module evaluation — before
 * React mounts — which is a blank screen on every route.
 * Rewrite only the two modules the Super Admin UI actually imports.
 */
function sharedCjsForBrowser() {
  const targets = [
    /[/\\]shared[/\\]constants[/\\]roles\.js$/,
    /[/\\]shared[/\\]permissions[/\\]permissionMatrix\.js$/,
  ]

  return {
    name: 'shared-cjs-for-browser',
    enforce: 'pre',
    transform(code, id) {
      const file = id.split('?')[0]
      if (!targets.some((re) => re.test(file))) return null

      let next = code
      next = next.replace(
        /const\s*\{\s*ROLES\s*,\s*PERMISSIONS\s*\}\s*=\s*require\(\s*['"]\.\.\/constants\/roles['"]\s*\);/,
        "import { ROLES, PERMISSIONS } from '../constants/roles.js';",
      )
      next = next.replace(
        /module\.exports\s*=\s*\{\s*ROLES\s*,\s*PERMISSIONS\s*,?\s*\};?/,
        'export { ROLES, PERMISSIONS };',
      )
      next = next.replace(
        /module\.exports\s*=\s*\{\s*ROLE_PERMISSIONS\s*,\s*hasPermission\s*,\s*hasPermissionAsync\s*,?\s*\};?/,
        'export { ROLE_PERMISSIONS, hasPermission, hasPermissionAsync };',
      )

      if (next === code) return null
      return { code: next, map: null }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [sharedCjsForBrowser(), react(), tailwindcss()],
  resolve: {
    alias: {
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      'react-router-dom': path.resolve(__dirname, 'node_modules/react-router-dom'),
      'lucide-react': path.resolve(__dirname, 'node_modules/lucide-react'),
    }
  },
  server: {
    port: 5173,
    strictPort: true,
  },
})
