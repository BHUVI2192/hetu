import './globals.css'

export const metadata = {
  title: '404 AI — Causal Intelligence Platform',
  description: 'Find the decisive step. See what broke. Replay the fix.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Silkscreen:wght@400;700&family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#f4f4fa] text-[#0a0a0a] antialiased selection:bg-[#6e4aff] selection:text-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}