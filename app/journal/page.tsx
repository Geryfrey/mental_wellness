"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TopNavLayout } from "@/components/layout/top-nav-layout"
import { getCurrentUser } from "@/lib/auth"
import type { User } from "@/lib/types"
import { BookOpen, Plus, Search, Calendar } from "lucide-react"

export default function JournalPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          router.push("/auth/login")
          return
        }
        setUser(currentUser)
      } catch (error) {
        console.error("Auth error:", error)
        router.push("/auth/login")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <TopNavLayout user={user}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <BookOpen className="h-8 w-8" />
              Personal Journal
            </h1>
            <p className="text-gray-600">Track your thoughts, feelings, and daily experiences</p>
          </div>
          <Button className="bg-gray-900 hover:bg-gray-800 text-white">
            <Plus className="h-4 w-4 mr-2" />
            New Entry
          </Button>
        </div>

        {/* Search and Filter */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search entries..." className="pl-10" />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All moods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All moods</SelectItem>
                  <SelectItem value="happy">Happy</SelectItem>
                  <SelectItem value="stressed">Stressed</SelectItem>
                  <SelectItem value="anxious">Anxious</SelectItem>
                  <SelectItem value="calm">Calm</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Journal Entry */}
        <Card>
          <CardContent className="p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">Feeling Overwhelmed with Midterms</h2>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Wednesday, June 18, 2025
                </div>
                <Badge className="bg-red-100 text-red-800">Stressed</Badge>
              </div>
            </div>

            <div className="prose max-w-none text-gray-700 space-y-4">
              <p>
                Today was particularly challenging. I have three midterm exams coming up next week and I'm feeling
                really overwhelmed. The amount of material I need to review seems impossible to cover in time.
              </p>

              <p>
                I spent most of the day in the library, but I kept getting distracted by my phone and social media. I
                know I need to find better ways to focus and manage my time.
              </p>

              <p>
                On the positive side, I did manage to complete my chemistry lab report, which was due tomorrow. Small
                wins, I guess.
              </p>

              <p>I think I need to:</p>
            </div>
          </CardContent>
        </Card>

        {/* Empty State for Additional Entries */}
        <Card className="mt-6 border-2 border-dashed border-gray-300">
          <CardContent className="text-center py-12">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold mb-2">Start Writing</h3>
            <p className="text-gray-600 mb-6">Express your thoughts and feelings in your personal journal</p>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Create New Entry
            </Button>
          </CardContent>
        </Card>
      </div>
    </TopNavLayout>
  )
}
