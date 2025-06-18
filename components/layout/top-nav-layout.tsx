"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Home, Brain, BarChart3, BookOpen, Heart, Calendar, Settings, LogOut, Menu, X } from "lucide-react"
import { signOut } from "@/lib/auth"
import type { User } from "@/lib/types"

interface TopNavLayoutProps {
  user: User
  children: React.ReactNode
}

const studentNavItems = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/assessment", icon: Brain, label: "Assessment" },
  { href: "/results", icon: BarChart3, label: "My Results" },
  { href: "/journal", icon: BookOpen, label: "Journal" },
  { href: "/resources", icon: Heart, label: "Resources" },
  { href: "/appointments", icon: Calendar, label: "Appointments" },
  { href: "/settings", icon: Settings, label: "Settings" },
]

const professionalNavItems = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/appointments", icon: Calendar, label: "Appointments" },
  { href: "/patients", icon: Brain, label: "Patients" },
  { href: "/resources", icon: Heart, label: "Resources" },
  { href: "/settings", icon: Settings, label: "Settings" },
]

const adminNavItems = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/admin/users", icon: Brain, label: "Users" },
  { href: "/professionals", icon: Heart, label: "Professionals" },
  { href: "/resources", icon: BookOpen, label: "Resources" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/settings", icon: Settings, label: "Settings" },
]

export function TopNavLayout({ user, children }: TopNavLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()

  const getNavItems = () => {
    switch (user.role) {
      case "health_professional":
        return professionalNavItems
      case "admin":
        return adminNavItems
      default:
        return studentNavItems
    }
  }

  const navItems = getNavItems()

  const handleSignOut = async () => {
    await signOut()
    window.location.href = "/auth/login"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="bg-purple-600 p-2 rounded-lg">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">SWAP</span>
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">{user.full_name}</span>
                <span className="ml-2 capitalize text-purple-600">{user.role.replace("_", " ")}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Mobile menu button */}
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>

              {/* Desktop sign out */}
              <Button variant="outline" onClick={handleSignOut} className="hidden md:flex">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className={cn("px-6", isMenuOpen ? "block" : "hidden md:block")}>
          <nav className="flex flex-col md:flex-row md:space-x-8 space-y-2 md:space-y-0 pb-4 md:pb-0">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 py-4 px-1 border-b-2 font-medium transition-colors",
                    isActive
                      ? "border-purple-600 text-purple-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}

            {/* Mobile sign out */}
            <button
              onClick={handleSignOut}
              className="md:hidden flex items-center gap-2 py-4 px-1 text-gray-500 hover:text-gray-700"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="p-6">{children}</main>
    </div>
  )
}
