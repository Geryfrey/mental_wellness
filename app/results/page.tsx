"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { TopNavLayout } from "@/components/layout/top-nav-layout"
import { getCurrentUser } from "@/lib/auth"
import { supabase } from "@/lib/supabase/client"
import type { User, Assessment } from "@/lib/types"
import { Brain, Calendar, AlertCircle, CheckCircle, Eye, AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function ResultsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const loadAssessments = async () => {
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
        const { data: student, error: studentError } = await supabase
          .from("students")
          .select("id")
          .eq("user_id", currentUser.id)
          .single()

        if (studentError || !student) {
          throw new Error("Student profile not found. Please complete your profile setup.")
        }

        // Get assessments
        const { data: assessmentData, error: assessmentError } = await supabase
          .from("assessments")
          .select("*")
          .eq("student_id", student.id)
          .order("created_at", { ascending: false })

        if (assessmentError) {
          throw new Error(`Failed to load assessments: ${assessmentError.message}`)
        }

        setAssessments(assessmentData || [])
      } catch (error: any) {
        console.error("Error loading assessments:", error)
        setError(error.message || "Failed to load assessment data")
      } finally {
        setLoading(false)
      }
    }

    loadAssessments()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p>Loading your assessment results...</p>
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
        return <AlertTriangle className="h-4 w-4" />
      case "critical":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  return (
    <TopNavLayout user={user}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Assessment Results</h1>
          <p className="text-gray-600">View your mental health assessment history and detailed results.</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">Error Loading Results</AlertTitle>
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {/* No Assessments */}
        {!error && assessments.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Assessments Yet</h3>
              <p className="text-gray-600 mb-6">
                Take your first mental health assessment to get personalized insights.
              </p>
              <Link href="/assessment">
                <Button className="bg-purple-600 hover:bg-purple-700">Take Assessment</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Assessment List */}
        {!error && assessments.length > 0 && (
          <div className="space-y-6">
            {assessments.map((assessment) => (
              <Card key={assessment.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-purple-600" />
                        Assessment Results
                      </CardTitle>
                      <CardDescription>
                        {new Date(assessment.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </CardDescription>
                    </div>
                    <Badge
                      className={`${getRiskLevelColor(assessment.predicted_risk_level || assessment.risk_level)} flex items-center gap-1`}
                    >
                      {getRiskLevelIcon(assessment.predicted_risk_level || assessment.risk_level)}
                      {(assessment.predicted_risk_level || assessment.risk_level || "Unknown").charAt(0).toUpperCase() +
                        (assessment.predicted_risk_level || assessment.risk_level || "unknown").slice(1)}{" "}
                      Risk
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-600">Stress Level</div>
                      <div className="text-lg font-semibold">
                        {assessment.stress_score ? `${assessment.stress_score}/100` : "N/A"}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Anxiety Level</div>
                      <div className="text-lg font-semibold">
                        {assessment.anxiety_score ? `${assessment.anxiety_score}/100` : "N/A"}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Sentiment</div>
                      <div className="text-lg font-semibold capitalize">
                        {assessment.sentiment_label ? assessment.sentiment_label.replace("_", " ") : "N/A"}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Conditions</div>
                      <div className="text-lg font-semibold">
                        {assessment.predicted_conditions ? assessment.predicted_conditions.length : 0}
                      </div>
                    </div>
                  </div>

                  {/* AI Analysis Preview */}
                  {assessment.ai_analysis && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-700 line-clamp-2">
                        {assessment.ai_analysis.length > 150
                          ? `${assessment.ai_analysis.substring(0, 150)}...`
                          : assessment.ai_analysis}
                      </div>
                    </div>
                  )}

                  {/* Professional Help Alert */}
                  {assessment.professional_help_needed && (
                    <Alert className="mb-4 border-orange-200 bg-orange-50">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-700">
                        Professional support recommended based on this assessment.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Crisis Alert */}
                  {assessment.crisis_indicators && (
                    <Alert className="mb-4 border-red-200 bg-red-50">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-700">
                        This assessment indicated crisis-level concerns. Please seek immediate support.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      {assessment.recommendations
                        ? `${assessment.recommendations.length} recommendations`
                        : "No recommendations"}
                    </div>
                    <Link href={`/results/${assessment.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Take New Assessment Button */}
        {!error && assessments.length > 0 && (
          <div className="mt-8 text-center">
            <Link href="/assessment">
              <Button className="bg-purple-600 hover:bg-purple-700">Take New Assessment</Button>
            </Link>
          </div>
        )}
      </div>
    </TopNavLayout>
  )
}
