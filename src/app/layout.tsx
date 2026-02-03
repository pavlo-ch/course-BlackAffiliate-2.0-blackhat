import type { Metadata } from 'next'
import './globals.css'
import { ClientAuthProvider } from '@/components/ClientAuthProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import AdminButton from '@/components/AdminButton'
import { PaymentTicker } from '@/components/PaymentTicker'

const geologica = {
  className: 'font-geologica'
}

export const metadata: Metadata = {
  title: 'Training program - BlackAffiliate 2.0',
  description: 'Master the art of affiliate marketing with our comprehensive training program',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/img/favicon.webp" type="image/webp" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Geologica:wght@100..900&display=swap" rel="stylesheet" />
      </head>
      <body className={`${geologica.className} bg-background text-foreground`} suppressHydrationWarning>
        <ErrorBoundary>
          <ClientAuthProvider>
            <PaymentTicker />
            {children}
            <AdminButton />
          </ClientAuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}