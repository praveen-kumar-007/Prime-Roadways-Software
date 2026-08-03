import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Prime Roadways',
        short_name: 'PrimeRoadways',
        description: 'Prime Roadways Logistics Management Platform',
        theme_color: '#7c3aed',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/IMG-20260803-WA0000.jpg',
            sizes: '192x192',
            type: 'image/jpeg'
          },
          {
            src: '/IMG-20260803-WA0000.jpg',
            sizes: '512x512',
            type: 'image/jpeg'
          },
          {
            src: '/IMG-20260803-WA0000.jpg',
            sizes: '512x512',
            type: 'image/jpeg',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
