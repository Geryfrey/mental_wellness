"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { TopNavLayout } from "@/components/layout/top-nav-layout"
import { getCurrentUser } from "@/lib/auth"
import { supabase } from "@/lib/supabase/client"
import type { User, Assessment } from "@/lib/types"
import { Brain, BookOpen } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import Link from "next/link"

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [recentAssessment, setRecentAssessment] = useState<Assessment | null>(null)
  const [allAssessments, setAllAssessments] = useState<Assessment[]>([])
  const [assessmentCount, setAssessmentCount] = useState(0)
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

        // Get student data and assessments for students
        if (currentUser.role === "student") {
          const { data: student } = await supabase.from("students").select("id").eq("user_id", currentUser.id).single()

          if (student) {
            // Get assessment count
            const { count } = await supabase
              .from("assessments")
              .select("*", { count: "exact", head: true })
              .eq("student_id", student.id)

            setAssessmentCount(count || 0)

            // Get all assessments for trends
            const { data: assessments } = await supabase
              .from("assessments")
              .select("*")
              .eq("student_id", student.id)
              .order("created_at", { ascending: true })

            setAllAssessments(assessments || [])

            // Get most recent assessment
            if (assessments && assessments.length > 0) {
              setRecentAssessment(assessments[assessments.length - 1])
            }
          }
        }
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
          <Brain className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  // Prepare wellness score trend data
  const wellnessTrendData = allAssessments.map((assessment, index) => ({
    date: new Date(assessment.created_at).toLocaleDateString(),
    assessment: `Assessment ${index + 1}`,
    wellness: assessment.wellness_score ?? 0,
  }))

  // Remove unused variables and functions
  const currentRiskLevel = recentAssessment?.predicted_risk_level || recentAssessment?.risk_level || "moderate"
  const lastAssessmentDate = recentAssessment ? new Date(recentAssessment.created_at).toLocaleDateString() : null

  // Utility for risk badge color
  const getRiskLevelColor = (level?: string) => {
    switch (level) {
      case "low":
        return "bg-green-600 text-white"
      case "moderate":
        return "bg-gray-800 text-white"
      case "high":
        return "bg-orange-600 text-white"
      case "critical":
        return "bg-red-600 text-white"
      default:
        return "bg-gray-600 text-white"
    }
  }

  return (
    <TopNavLayout user={user}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Assessments</p>
                  <p className="text-3xl font-bold">{assessmentCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Recent Wellness Score</p>
                  <p className="text-3xl font-bold">{recentAssessment?.wellness_score ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div>
                <p className="text-sm text-gray-600">Recent Risk Level</p>
                <Badge className={`mt-2 ${getRiskLevelColor(currentRiskLevel)}`}>{currentRiskLevel}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Wellness Score Trend Chart */}
        {allAssessments.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Wellness Score Trend</CardTitle>
                <CardDescription>Your wellness score over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{ wellness: { label: "Wellness Score", color: "#6366f1" } }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={wellnessTrendData}>
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="wellness"
                        stroke="#6366f1"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Latest Assessment Results */}
        {recentAssessment && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Latest Assessment Results</CardTitle>
              <CardDescription className="text-gray-600">Completed on {lastAssessmentDate}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Risk Level */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Risk Level</h3>
                  <Badge className={`${getRiskLevelColor(currentRiskLevel)} px-3 py-1 text-sm font-medium`}>
                    {currentRiskLevel.toUpperCase()}
                  </Badge>
                </div>
                {/* Wellness Score */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Wellness Score</h3>
                  <span className="text-2xl font-bold text-blue-700">
                    {recentAssessment.wellness_score ?? 0}/100
                  </span>
                </div>
              </div>
              {/* Recommendations */}
              {recentAssessment.recommendations && recentAssessment.recommendations.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-3">Personalized Recommendations</h4>
                  <div className="space-y-2">
                    {recentAssessment.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                        <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-gray-700 text-sm">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recommended Resources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-semibold">
              <BookOpen className="h-5 w-5 text-blue-600" />
              Recommended Resources
            </CardTitle>
            <CardDescription className="text-gray-600">
              Educational materials and self-help resources tailored to your needs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <h3 className="font-medium text-gray-900 mb-2">Understanding Anxiety: Symptoms and Coping Strategies</h3>
              <p className="text-gray-600 text-sm mb-3">
                Learn about anxiety symptoms, types, and evidence-based coping strategies to manage anxiety effectively.
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    article
                  </Badge>
                  <span className="text-sm text-gray-500">10 min read</span>
                </div>
                <Link href="/resources">
                  <Button variant="outline" size="sm">
                    Read Article
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Link href="/assessment">
                <Button className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2">Take New Assessment</Button>
              </Link>
              <Link href="/journal">
                <Button variant="outline" className="px-6 py-2">
                  Write in Journal
                </Button>
              </Link>
              <Link href="/results">
                <Button variant="outline" className="px-6 py-2">
                  View Trends
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action for New Assessment */}
        {!recentAssessment && (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="text-center py-12">
              <Brain className="h-16 w-16 mx-auto mb-4 text-purple-600" />
              <h3 className="text-xl font-semibold mb-2">Take Your First Assessment</h3>
              <p className="text-gray-600 mb-6">
                Get started with understanding your mental wellness by taking our comprehensive assessment.
              </p>
              <Link href="/assessment">
                <Button className="bg-purple-600 hover:bg-purple-700">Start Assessment</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </TopNavLayout>
  )
}
