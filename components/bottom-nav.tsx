'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, Home, Map, User } from 'lucide-react'

const ITEMS = [
  { href: '/', label: 'Home', icon: Home, match: (p: string) => p === '/' },
  {
    href: '/brand-profile',
    label: 'Hồ sơ',
    icon: User,
    match: (p: string) => p.startsWith('/brand-profile'),
  },
  {
    href: '/roadmap',
    label: 'Lộ trình',
    icon: Map,
    match: (p: string) => p.startsWith('/roadmap'),
  },
  {
    href: '/drafts',
    label: 'Duyệt',
    icon: FileText,
    match: (p: string) => p.startsWith('/drafts'),
  },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-card/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      aria-label="Điều hướng chính"
    >
      <ul className="mx-auto flex h-14 max-w-lg items-stretch justify-around px-1">
        {ITEMS.map((item) => {
          const active = item.match(pathname)
          const Icon = item.icon
          return (
            <li key={item.href} className="flex flex-1">
              <Link
                href={item.href}
                className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition ${
                  active ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <span
                  className={`flex size-8 items-center justify-center rounded-xl ${
                    active ? 'bg-primary/12' : ''
                  }`}
                >
                  <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
                </span>
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
