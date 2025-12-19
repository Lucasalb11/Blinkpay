"use client"

import { Bell, ChevronRight } from "lucide-react"
import { usePathname } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { WalletButton } from "@/components/wallet-button"

function generateBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean)
  return segments.map((segment, index) => ({
    label: segment.charAt(0).toUpperCase() + segment.slice(1),
    href: "/" + segments.slice(0, index + 1).join("/"),
    isLast: index === segments.length - 1,
  }))
}

export function DashboardTopBar() {
  const pathname = usePathname()
  const breadcrumbs = generateBreadcrumbs(pathname)

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2">
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.href} className="flex items-center gap-2">
            {index > 0 && <ChevronRight className="w-4 h-4 text-slate-400" />}
            <span className={crumb.isLast ? "text-sm font-medium text-slate-900" : "text-sm text-slate-500"}>
              {crumb.label}
            </span>
          </div>
        ))}
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-3">
        <WalletButton />
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5 text-slate-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full" />
        </Button>
        <Avatar>
          <AvatarFallback className="bg-blue-600 text-white">AD</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
