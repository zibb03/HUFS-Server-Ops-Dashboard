import type { Metadata } from 'next'
import { Manrope, Inter } from 'next/font/google'
import AppShell from '@/components/AppShell'
import { getCurrentUser } from '@/lib/session'
import './globals.css'

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap' })
const inter  = Inter ({  subsets: ['latin'], variable: '--font-inter',    display: 'swap' })

export const metadata: Metadata = {
  title: '한국외국어대학교 서버종합상황실',
  description: 'HUFS Server Operations Center Dashboard',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  return (
    <html lang="ko" className={`${manrope.variable} ${inter.variable}`}>
      <body className="antialiased">
        <AppShell user={user}>{children}</AppShell>
      </body>
    </html>
  )
}
