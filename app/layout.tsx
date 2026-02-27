import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Shadowball',
  description: 'OpenClaw Agent Monitor',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-gray-950 text-white antialiased">{children}</body>
    </html>
  )
}
