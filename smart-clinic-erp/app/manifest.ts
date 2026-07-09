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
        src: 'https://img.icons8.com/fluency/192/hospital-room.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: 'https://img.icons8.com/fluency/512/hospital-room.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      }
    ]
  }
}