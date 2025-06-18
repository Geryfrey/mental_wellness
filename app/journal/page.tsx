"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TopNavLayout } from "@/components/layout/top-nav-layout"
import { getCurrentUser } from "@/lib/auth"
import { supabase } from "@/lib/supabase/client"
import type { User } from "@/lib/types"
import { BookOpen, Plus, Calendar, Edit, Trash2 } from "lucide-react"
import { format } from "date-fns"

interface JournalEntry {
  id: string
  title: string
  content: string
  mood_rating: number
  created_at: string
  updated_at: string
}

export default function JournalPage() {
  const [user, setUser] = useState<User | null>(null)
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewEntry, setShowNewEntry] = useState(false)
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null)
  const [newEntry, setNewEntry] = useState({
    title: "",
    content: "",
    mood_rating: 5,
  })
  const router = useRouter()

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          router.push("/auth/login")
          return
        }
        if (currentUser.role !== "student") {
          router.push("/dashboard")
          return
        }
        setUser(currentUser)

        // Get student ID
        const { data: student } = await supabase.from("students").select("id").eq("user_id", currentUser.id).single()

        if (student) {
          // Get journal entries
          const { data: entriesData, error } = await supabase
            .from("journal_entries")
            .select("*")
            .eq("student_id", student.id)
            .order("created_at", { ascending: false })

          if (error && error.code !== "PGRST116") {
            console.error("Error loading journal entries:", error)
          } else {
            setEntries(entriesData || [])
          }
        }
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const handleSaveEntry = async () => {
    if (!user || !newEntry.title.trim() || !newEntry.content.trim()) return

    try {
      // Get student ID
      const { data: student } = await supabase.from("students").select("id").eq("user_id", user.id).single()

      if (!student) throw new Error("Student profile not found")

      const entryData = {
        student_id: student.id,
        title: newEntry.title.trim(),
        content: newEntry.content.trim(),
        mood_rating: newEntry.mood_rating,
      }

      if (editingEntry) {
        // Update existing entry
        const { data, error } = await supabase
          .from("journal_entries")
          .update(entryData)
          .eq("id", editingEntry.id)
          .select()
          .single()

        if (error) throw error

        setEntries((prev) => prev.map((entry) => (entry.id === editingEntry.id ? data : entry)))
        setEditingEntry(null)
      } else {
        // Create new entry
        const { data, error } = await supabase.from("journal_entries").insert(entryData).select().single()

        if (error) throw error

        setEntries((prev) => [data, ...prev])
        setShowNewEntry(false)
      }

      // Reset form
      setNewEntry({ title: "", content: "", mood_rating: 5 })
    } catch (error) {
      console.error("Error saving journal entry:", error)
      alert("Error saving journal entry. Please try again.")
    }
  }

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry)
    setNewEntry({
      title: entry.title,
      content: entry.content,
      mood_rating: entry.mood_rating,
    })
    setShowNewEntry(true)
  }

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm("Are you sure you want to delete this journal entry?")) return

    try {
      const { error } = await supabase.from("journal_entries").delete().eq("id", entryId)

      if (error) throw error

      setEntries((prev) => prev.filter((entry) => entry.id !== entryId))
    } catch (error) {
      console.error("Error deleting journal entry:", error)
      alert("Error deleting journal entry. Please try again.")
    }
  }

  const getMoodColor = (rating: number) => {
    if (rating >= 8) return "text-green-600"
    if (rating >= 6) return "text-blue-600"
    if (rating >= 4) return "text-yellow-600"
    if (rating >= 2) return "text-orange-600"
    return "text-red-600"
  }

  const getMoodEmoji = (rating: number) => {
    if (rating >= 9) return "😊"
    if (rating >= 7) return "🙂"
    if (rating >= 5) return "😐"
    if (rating >= 3) return "😔"
    return "😢"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p>Loading journal...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <TopNavLayout user={user}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Journal & Notes</h1>
              <p className="text-gray-600">Track your thoughts, feelings, and daily reflections</p>
            </div>

            <Button
              onClick={() => {
                setShowNewEntry(true)
                setEditingEntry(null)
                setNewEntry({ title: "", content: "", mood_rating: 5 })
              }}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Entry
            </Button>
          </div>
        </div>

        {/* New/Edit Entry Form */}
        {showNewEntry && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{editingEntry ? "Edit Entry" : "New Journal Entry"}</CardTitle>
              <CardDescription>
                {editingEntry ? "Update your journal entry" : "Write about your thoughts and feelings"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newEntry.title}
                  onChange={(e) => setNewEntry((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Give your entry a title..."
                />
              </div>

              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={newEntry.content}
                  onChange={(e) => setNewEntry((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your thoughts here..."
                  rows={6}
                />
              </div>

              <div>
                <Label htmlFor="mood">Mood Rating (1-10)</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Input
                    id="mood"
                    type="range"
                    min="1"
                    max="10"
                    value={newEntry.mood_rating}
                    onChange={(e) => setNewEntry((prev) => ({ ...prev, mood_rating: Number.parseInt(e.target.value) }))}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-2 min-w-[80px]">
                    <span className={`font-medium ${getMoodColor(newEntry.mood_rating)}`}>{newEntry.mood_rating}</span>
                    <span className="text-xl">{getMoodEmoji(newEntry.mood_rating)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveEntry} className="bg-purple-600 hover:bg-purple-700">
                  {editingEntry ? "Update Entry" : "Save Entry"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNewEntry(false)
                    setEditingEntry(null)
                    setNewEntry({ title: "", content: "", mood_rating: 5 })
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Journal Entries */}
        {entries.length > 0 ? (
          <div className="space-y-6">
            {entries.map((entry) => (
              <Card key={entry.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{entry.title}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(entry.created_at), "MMMM d, yyyy 'at' h:mm a")}
                        </div>
                        <div className="flex items-center gap-1">
                          <span>Mood:</span>
                          <span className={`font-medium ${getMoodColor(entry.mood_rating)}`}>
                            {entry.mood_rating}/10
                          </span>
                          <span className="text-lg">{getMoodEmoji(entry.mood_rating)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditEntry(entry)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-line text-gray-700">{entry.content}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold mb-2">Start Your Journal</h3>
              <p className="text-gray-600 mb-6">
                Begin documenting your thoughts, feelings, and daily reflections to track your mental wellness journey.
              </p>
              <Button onClick={() => setShowNewEntry(true)} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Write Your First Entry
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </TopNavLayout>
  )
}
