import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Shadowball',
  description: 'OpenClaw Agent Monitor',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Zen+Serif:wght@400;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-gray-950 text-white antialiased" style={{ fontFamily: "'Zen Serif', serif" }}>{children}</body>
    </html>
  )
}
