"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Home, Brain, BarChart3, BookOpen, Heart, Calendar, Settings, LogOut, Menu, X } from "lucide-react"
import { signOut } from "@/lib/auth"
import type { User } from "@/lib/types"

interface SidebarProps {
  user: User
}

const studentNavItems = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/assessment", icon: Brain, label: "Check Mental Health" },
  { href: "/results", icon: BarChart3, label: "My Results" },
  { href: "/journal", icon: BookOpen, label: "Journal / Notes" },
  { href: "/resources", icon: Heart, label: "Self-Help Resources" },
  { href: "/appointments", icon: Calendar, label: "Appointments" },
  { href: "/settings", icon: Settings, label: "Settings" },
]

const professionalNavItems = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/appointments", icon: Calendar, label: "Appointments" },
  { href: "/patients", icon: Brain, label: "Patient Overview" },
  { href: "/resources", icon: Heart, label: "Resources" },
  { href: "/settings", icon: Settings, label: "Settings" },
]

const adminNavItems = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/users", icon: Brain, label: "Manage Users" },
  { href: "/professionals", icon: Heart, label: "Health Professionals" },
  { href: "/resources", icon: BookOpen, label: "Manage Resources" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/settings", icon: Settings, label: "Settings" },
]

export function Sidebar({ user }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
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
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-purple-600 p-2 rounded-lg">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">SWAP</span>
            </div>
            <div className="text-sm text-gray-600">
              <p className="font-medium">{user.full_name}</p>
              <p className="capitalize text-purple-600">{user.role.replace("_", " ")}</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-purple-100 text-purple-700"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-600 hover:text-gray-900"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" onClick={() => setIsOpen(false)} />
      )}
    </>
  )
}
