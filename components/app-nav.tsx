'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home } from 'lucide-react'

const LINKS = [
  { href: '/brand-profile', label: 'Hồ sơ' },
  { href: '/roadmap', label: 'Lộ trình' },
  { href: '/drafts', label: 'Chờ duyệt' },
]

export function AppNav({ showHome = true }: { showHome?: boolean }) {
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-1.5">
      {showHome ? (
        <Link
          href="/"
          className="inline-flex size-9 items-center justify-center rounded-xl border border-border/70 bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Trang chủ"
        >
          <Home className="size-4" />
        </Link>
      ) : null}
      <nav className="flex flex-1 gap-1 overflow-x-auto">
        {LINKS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 rounded-full px-3.5 py-2 text-[11px] font-semibold transition ${
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
