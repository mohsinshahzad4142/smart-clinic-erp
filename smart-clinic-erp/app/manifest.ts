import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Smart Clinic & Diagnostics',
    short_name: 'Smart Clinic',
    description: 'Premium Multi-tenant Clinic ERP Suite & Diagnostics System',
    start_url: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#0f172a',
    theme_color: '#0f172a',
    icons: [
      {
        src: 'https://cdn-icons-png.flaticon.com/192/192/192401.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: 'https://cdn-icons-png.flaticon.com/512/512/512401.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      }
    ]
  }
}