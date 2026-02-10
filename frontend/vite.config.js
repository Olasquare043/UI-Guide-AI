import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const VENDOR_RE = /node_modules\//
const REACT_RE = /node_modules\/(react|react-dom|scheduler)\//
const ROUTER_RE = /node_modules\/(react-router|react-router-dom)\//
const MARKDOWN_RE = /node_modules\/(react-markdown|remark|rehype)\//
const UI_RE = /node_modules\/(lucide-react|@headlessui)\//
const FORMS_RE = /node_modules\/(react-hook-form|zod)\//
const HTTP_RE = /node_modules\/axios\//

const vendorChunks = (id) => {
  if (!VENDOR_RE.test(id)) return undefined

  if (ROUTER_RE.test(id)) return 'router'
  if (REACT_RE.test(id)) return 'react'
  if (MARKDOWN_RE.test(id)) return 'markdown'
  if (UI_RE.test(id)) return 'ui'
  if (FORMS_RE.test(id)) return 'forms'
  if (HTTP_RE.test(id)) return 'http'

  return 'vendor'
}

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: vendorChunks,
      },
    },
  },
})
