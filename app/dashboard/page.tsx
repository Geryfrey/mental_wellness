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
import { Brain, AlertTriangle, CheckCircle, Clock, Calendar, Heart } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [recentAssessment, setRecentAssessment] = useState<Assessment | null>(null)
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

            // Get most recent assessment
            const { data: assessment } = await supabase
              .from("assessments")
              .select("*")
              .eq("student_id", student.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .single()

            setRecentAssessment(assessment)
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

  // Calculate wellness score (simplified for demo)
  const getWellnessScore = () => {
    if (!recentAssessment) return 0

    // Simple calculation based on risk level
    switch (recentAssessment.predicted_risk_level || recentAssessment.risk_level) {
      case "low":
        return 90
      case "moderate":
        return 85
      case "high":
        return 60
      case "critical":
        return 30
      default:
        return 75
    }
  }

  const getRiskLevelColor = (level?: string) => {
    switch (level) {
      case "low":
        return "bg-green-600 text-white"
      case "moderate":
        return "bg-yellow-600 text-white"
      case "high":
        return "bg-orange-600 text-white"
      case "critical":
        return "bg-red-600 text-white"
      default:
        return "bg-gray-600 text-white"
    }
  }

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case "positive":
      case "very_positive":
        return "bg-green-100 text-green-800"
      case "neutral":
        return "bg-gray-100 text-gray-800"
      case "negative":
      case "very_negative":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatConditions = (conditions?: string[]) => {
    if (!conditions || conditions.length === 0) return []

    return conditions.map((condition) => condition.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()))
  }

  const currentRiskLevel = recentAssessment?.predicted_risk_level || recentAssessment?.risk_level || "moderate"
  const wellnessScore = getWellnessScore()
  const lastAssessmentDate = recentAssessment ? new Date(recentAssessment.created_at).toLocaleDateString() : null

  return (
    <TopNavLayout user={user}>
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user.full_name}</h1>
          <p className="text-gray-600">Here's an overview of your mental health wellness journey</p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Assessments */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Assessments</p>
                  <p className="text-3xl font-bold text-gray-900">{assessmentCount}</p>
                </div>
                <Brain className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          {/* Current Risk Level */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Current Risk Level</p>
                  <Badge className={`mt-2 ${getRiskLevelColor(currentRiskLevel)}`}>
                    {currentRiskLevel.toUpperCase()}
                  </Badge>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          {/* Wellness Score */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Wellness Score</p>
                  <p className="text-3xl font-bold text-gray-900">{wellnessScore}%</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          {/* Last Assessment */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Last Assessment</p>
                  <p className="text-lg font-semibold text-gray-900">{lastAssessmentDate || "No assessments"}</p>
                </div>
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/assessment">
              <CardContent className="p-6 text-center">
                <Brain className="h-12 w-12 mx-auto mb-4 text-purple-600" />
                <h3 className="text-lg font-semibold mb-2">Take Assessment</h3>
                <p className="text-gray-600">Check your current mental health status</p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/appointments">
              <CardContent className="p-6 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                <h3 className="text-lg font-semibold mb-2">Book Appointment</h3>
                <p className="text-gray-600">Schedule time with a counselor</p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/resources">
              <CardContent className="p-6 text-center">
                <Heart className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <h3 className="text-lg font-semibold mb-2">Browse Resources</h3>
                <p className="text-gray-600">Explore self-help materials</p>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* Latest Assessment Results */}
        {recentAssessment && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Latest Assessment Results</CardTitle>
              <CardDescription>
                Completed on {new Date(recentAssessment.created_at).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Predicted Conditions */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Predicted Conditions</h4>
                  <div className="flex flex-wrap gap-2">
                    {formatConditions(recentAssessment.predicted_conditions).map((condition, index) => (
                      <Badge key={index} variant="outline" className="bg-gray-100">
                        {condition}
                      </Badge>
                    ))}
                    {(!recentAssessment.predicted_conditions || recentAssessment.predicted_conditions.length === 0) && (
                      <Badge variant="outline" className="bg-gray-100">
                        Academic Stress
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Risk Level */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Risk Level</h4>
                  <Badge className={getRiskLevelColor(currentRiskLevel)}>{currentRiskLevel.toUpperCase()}</Badge>
                </div>

                {/* Sentiment */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Sentiment</h4>
                  <Badge className={getSentimentColor(recentAssessment.predicted_sentiment)}>
                    {(recentAssessment.predicted_sentiment || "NEUTRAL").toUpperCase()}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Call to Action for New Assessment */}
        {!recentAssessment && (
          <Card className="mt-8">
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
