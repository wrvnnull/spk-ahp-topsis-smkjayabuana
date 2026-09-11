"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuthContext"
import { cn } from "@/lib/utils"
import type { User } from "@/types/api"

interface NavItem {
  href: string
  label: string
  roles?: User["role"][]
  icon: React.ComponentType<{ className?: string }>
}

const Sidebar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function ({ className, ...props }, ref) {
    const pathname = usePathname()
    const router = useRouter()
    const { user, logout } = useAuth()

    const navItems: NavItem[] = [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: DashboardIcon,
      },
      {
        href: "/academic-periods",
        label: "Periode Akademik",
        icon: AcademicPeriodIcon,
        roles: ["SUPER_ADMIN", "KEPALA_SEKOLAH"],
      },
      {
        href: "/classes",
        label: "Kelas",
        icon: ClassIcon,
        roles: ["SUPER_ADMIN", "KEPALA_SEKOLAH"],
      },
      {
        href: "/students",
        label: "Siswa",
        icon: StudentIcon,
        roles: ["SUPER_ADMIN", "GURU", "KEPALA_SEKOLAH"],
      },
      {
        href: "/criteria",
        label: "Kriteria",
        icon: CriteriaIcon,
        roles: ["SUPER_ADMIN"],
      },
      {
        href: "/scores",
        label: "Nilai",
        icon: ScoreIcon,
        roles: ["SUPER_ADMIN", "GURU", "KEPALA_SEKOLAH"],
      },
      {
        href: "/ahp",
        label: "AHP",
        icon: AhpIcon,
        roles: ["SUPER_ADMIN", "KEPALA_SEKOLAH"],
      },
      {
        href: "/topsis",
        label: "TOPSIS",
        icon: TopsisIcon,
        roles: ["SUPER_ADMIN", "KEPALA_SEKOLAH", "GURU"],
      },
    ]

    const filteredNavItems = navItems.filter((item) => {
      if (!item.roles) return true
      const userRole = user?.role
      if (!userRole) return false
      return item.roles.includes(userRole)
    })

    const handleLogout = async () => {
      await logout()
      router.push("/login")
    }

    return (
      <aside
        ref={ref}
        className={cn(
          "flex h-screen flex-col border-r bg-card overflow-y-auto",
          className
        )}
        {...props}
      >
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
              SPK
            </div>
            <span className="text-sm font-semibold">AHP-TOPSIS</span>
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4">
          <div className="space-y-1">
            {filteredNavItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </nav>
        <div className="border-t p-3">
          {user && (
            <div className="mb-3 text-xs text-muted-foreground">
              {user.role === "SUPER_ADMIN" && "Super Admin"}
              {user.role === "GURU" && "Guru"}
              {user.role === "KEPALA_SEKOLAH" && "Kepala Sekolah"}
            </div>
          )}
          <button
            onClick={handleLogout}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <LogoutIcon className="h-5 w-5 flex-shrink-0" />
            Logout
          </button>
        </div>
      </aside>
    )
  }
)
Sidebar.displayName = "Sidebar"

// Icons
function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}

function AcademicPeriodIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

function ClassIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  )
}

function StudentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1m6 1v1m-6-1h6" />
    </svg>
  )
}

function CriteriaIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}

function ScoreIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function AhpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}

function TopsisIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v2m1-6V5a2 2 0 00-2-2h-2a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z" />
    </svg>
  )
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  )
}

export { Sidebar }
