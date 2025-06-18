"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TopNavLayout } from "@/components/layout/top-nav-layout"
import { getCurrentUser } from "@/lib/auth"
import { supabase } from "@/lib/supabase/client"
import type { User, Assessment } from "@/lib/types"
import { Brain, Calendar, AlertCircle, CheckCircle, LineChart } from "lucide-react"
import Link from "next/link"

export default function ResultsHistoryPage() {
  const [user, setUser] = useState<User | null>(null)
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)
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

        if (!student) throw new Error("Student profile not found")

        // Get assessments
        const { data: assessmentData, error } = await supabase
          .from("assessments")
          .select("*")
          .eq("student_id", student.id)
          .order("created_at", { ascending: false })

        if (error) throw error
        setAssessments(assessmentData || [])
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p>Loading results...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const getRiskLevelColor = (level?: string) => {
    switch (level) {
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      case "moderate":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "critical":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getRiskLevelIcon = (level?: string) => {
    switch (level) {
      case "low":
        return <CheckCircle className="h-4 w-4" />
      case "moderate":
        return <AlertCircle className="h-4 w-4" />
      case "high":
        return <AlertCircle className="h-4 w-4" />
      case "critical":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  return (
    <TopNavLayout user={user}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Assessment History</h1>
          <p className="text-gray-600">View your past mental health assessments and track your progress over time</p>
        </div>

        {/* Wellness Trend */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5 text-purple-600" />
              Your Wellness Journey
            </CardTitle>
            <CardDescription>Track your mental wellness indicators over time</CardDescription>
          </CardHeader>
          <CardContent>
            {assessments.length > 0 ? (
              <div className="h-64 flex items-center justify-center">
                <p className="text-gray-500">Wellness trend visualization would appear here</p>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">You haven't taken any assessments yet</p>
                <Link href="/assessment">
                  <Button>Take Your First Assessment</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assessment History */}
        {assessments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Past Assessments</CardTitle>
              <CardDescription>Your previous mental health assessments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assessments.map((assessment) => (
                  <Link key={assessment.id} href={`/results/${assessment.id}`} className="block">
                    <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {new Date(assessment.created_at).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <Badge className={`${getRiskLevelColor(assessment.risk_level)} flex items-center gap-1`}>
                          {getRiskLevelIcon(assessment.risk_level)}
                          {assessment.risk_level?.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        {assessment.anxiety_score !== undefined && (
                          <div>
                            <div className="text-xs text-gray-500">Anxiety</div>
                            <div className="font-medium">{assessment.anxiety_score}/100</div>
                          </div>
                        )}

                        {assessment.depression_score !== undefined && (
                          <div>
                            <div className="text-xs text-gray-500">Depression</div>
                            <div className="font-medium">{assessment.depression_score}/100</div>
                          </div>
                        )}

                        {assessment.stress_score !== undefined && (
                          <div>
                            <div className="text-xs text-gray-500">Stress</div>
                            <div className="font-medium">{assessment.stress_score}/100</div>
                          </div>
                        )}

                        {assessment.overall_wellbeing_score !== undefined && (
                          <div>
                            <div className="text-xs text-gray-500">Wellbeing</div>
                            <div className="font-medium">{assessment.overall_wellbeing_score}/100</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TopNavLayout>
  )
}
