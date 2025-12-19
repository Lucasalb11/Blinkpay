'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  Users,
  Wallet,
  Bell,
  Menu,
  LogOut,
  Settings,
  ChevronRight,
  Zap,
} from 'lucide-react'
import { useWallet } from '@solana/wallet-adapter-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Sheet, SheetContent } from '@/components/ui/Sheet'
import { WalletButton } from '@/components/WalletButton'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Invoices', href: '/dashboard/invoices', icon: FileText },
  { label: 'Customers', href: '/dashboard/customers', icon: Users },
  { label: 'Wallet', href: '/dashboard/wallet', icon: Wallet },
]

const secondaryNavItems: NavItem[] = [
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
]

function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname()
  const { disconnect } = useWallet()

  return (
    <aside
      className={cn(
        'flex h-full w-64 flex-col bg-white border-r border-slate-200',
        className
      )}
    >
      {/* Logo Area */}
      <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-bold text-slate-900">BlinkPay</span>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Main Menu
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'sidebar-link',
                isActive && 'sidebar-link-active'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}

        <div className="my-4 border-t border-slate-100" />

        <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Settings
        </div>
        {secondaryNavItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'sidebar-link',
                isActive && 'sidebar-link-active'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User Section / Logout */}
      <div className="border-t border-slate-200 p-4">
        <button
          onClick={() => disconnect()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-5 w-5" />
          Disconnect Wallet
        </button>
      </div>
    </aside>
  )
}

function Header() {
  const { publicKey } = useWallet()
  const pathname = usePathname()

  // Generate breadcrumbs based on pathname
  const getBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean)
    return segments.map((segment, index) => ({
      label: segment.charAt(0).toUpperCase() + segment.slice(1),
      isLast: index === segments.length - 1,
    }))
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium text-slate-500">My Company</span>
        {breadcrumbs.map((crumb, index) => (
          <span key={index} className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-slate-300" />
            <span
              className={cn(
                crumb.isLast
                  ? 'font-semibold text-slate-900'
                  : 'text-slate-500'
              )}
            >
              {crumb.label}
            </span>
          </span>
        ))}
      </div>

      {/* Right Side - Notifications & User */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <button className="relative rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700">
          <Bell className="h-5 w-5" />
          {/* Notification Dot */}
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-slate-900">
              {publicKey
                ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
                : 'Not Connected'}
            </p>
            <p className="text-xs text-slate-500">Enterprise Plan</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-semibold text-white">
            {publicKey ? publicKey.toBase58().slice(0, 2).toUpperCase() : 'BP'}
          </div>
        </div>
      </div>
    </header>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <Sidebar className="hidden lg:flex" />

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" onClose={() => setSidebarOpen(false)} className="w-64 p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col">
        {/* Mobile Header with Menu Button */}
        <div className="flex lg:hidden items-center gap-4 h-16 border-b border-slate-200 bg-white px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">BlinkPay</span>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block">
          <Header />
        </div>

        {/* Page Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
