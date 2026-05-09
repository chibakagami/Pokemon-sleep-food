import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/Pokemon-sleep-food/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Pokémon Sleep 料理助手',
        short_name: '料理助手',
        description: 'Pokémon Sleep 料理製作輔助工具',
        theme_color: '#2d7a4f',
        background_color: '#f5f0e8',
        display: 'standalone',
        lang: 'zh-TW',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,json}']
      }
    })
  ]
})
