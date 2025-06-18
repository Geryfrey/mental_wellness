"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TopNavLayout } from "@/components/layout/top-nav-layout"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { getCurrentUser } from "@/lib/auth"
import { supabase } from "@/lib/supabase/client"
import type { User, Assessment } from "@/lib/types"
import { Brain, Calendar, AlertCircle, CheckCircle, ArrowLeft, TrendingUp, PieChart } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  PieChart as RechartsPieChart,
} from "recharts"
import Link from "next/link"

export default function AssessmentResultPage() {
  const [user, setUser] = useState<User | null>(null)
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [historicalData, setHistoricalData] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const params = useParams()

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

        // Get specific assessment
        const { data: assessmentData, error } = await supabase
          .from("assessments")
          .select("*")
          .eq("id", params.id)
          .eq("student_id", student.id)
          .single()

        if (error) throw error
        setAssessment(assessmentData)

        // Get historical assessments for trends
        const { data: historicalAssessments, error: historyError } = await supabase
          .from("assessments")
          .select("*")
          .eq("student_id", student.id)
          .order("created_at", { ascending: true })
          .limit(10)

        if (historyError) throw historyError
        setHistoricalData(historicalAssessments || [])
      } catch (error) {
        console.error("Error loading assessment:", error)
        router.push("/results")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router, params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p>Loading assessment details...</p>
        </div>
      </div>
    )
  }

  if (!user || !assessment) return null

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

  const getScoreColor = (score?: number) => {
    if (!score) return "text-gray-500"
    if (score >= 70) return "text-red-600"
    if (score >= 50) return "text-orange-600"
    if (score >= 30) return "text-yellow-600"
    return "text-green-600"
  }

  // Prepare chart data
  const chartData = historicalData.map((item, index) => ({
    assessment: `Assessment ${index + 1}`,
    date: new Date(item.created_at).toLocaleDateString(),
    stress: item.stress_score || 0,
    anxiety: item.anxiety_score || 0,
    depression: item.depression_score || 0,
    wellbeing: item.overall_wellbeing_score || 0,
  }))

  // Risk level distribution data
  const riskDistribution = historicalData.reduce(
    (acc, item) => {
      const risk = item.risk_level || "unknown"
      acc[risk] = (acc[risk] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const pieData = Object.entries(riskDistribution).map(([level, count]) => ({
    name: level,
    value: count,
    color: level === "low" ? "#10b981" : level === "moderate" ? "#f59e0b" : level === "high" ? "#f97316" : "#ef4444",
  }))

  return (
    <TopNavLayout user={user}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/results">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Results
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Assessment Results</h1>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>
              {new Date(assessment.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>

        {/* Top Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Stress Level</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getScoreColor(assessment.stress_score)}`}>
                {assessment.stress_score ? `${assessment.stress_score}/100` : "N/A"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Anxiety Level</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getScoreColor(assessment.anxiety_score)}`}>
                {assessment.anxiety_score ? `${assessment.anxiety_score}/100` : "N/A"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Sleep Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-500">N/A</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Risk Level</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className={`${getRiskLevelColor(assessment.risk_level)} flex items-center gap-1 w-fit`}>
                {getRiskLevelIcon(assessment.risk_level)}
                {assessment.risk_level || "Unknown"}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Wellness Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Wellness Trends
              </CardTitle>
              <CardDescription>Your wellness metrics over time</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length > 1 ? (
                <ChartContainer
                  config={{
                    stress: {
                      label: "Stress",
                      color: "hsl(var(--chart-1))",
                    },
                    anxiety: {
                      label: "Anxiety",
                      color: "hsl(var(--chart-2))",
                    },
                    depression: {
                      label: "Depression",
                      color: "hsl(var(--chart-3))",
                    },
                    wellbeing: {
                      label: "Wellbeing",
                      color: "hsl(var(--chart-4))",
                    },
                  }}
                  className="h-64"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="assessment" />
                      <YAxis domain={[0, 100]} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="stress"
                        stroke="var(--color-stress)"
                        strokeWidth={2}
                        dot={{ fill: "var(--color-stress)" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="anxiety"
                        stroke="var(--color-anxiety)"
                        strokeWidth={2}
                        dot={{ fill: "var(--color-anxiety)" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="depression"
                        stroke="var(--color-depression)"
                        strokeWidth={2}
                        dot={{ fill: "var(--color-depression)" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="wellbeing"
                        stroke="var(--color-wellbeing)"
                        strokeWidth={2}
                        dot={{ fill: "var(--color-wellbeing)" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
                  <div className="text-center">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-500">Wellness trend visualization would appear here</p>
                    <p className="text-sm text-gray-400">Take more assessments to see trends</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Risk Level Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-purple-600" />
                Risk Level Distribution
              </CardTitle>
              <CardDescription>Distribution of your risk assessments</CardDescription>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <ChartContainer
                  config={{
                    low: {
                      label: "Low Risk",
                      color: "#10b981",
                    },
                    moderate: {
                      label: "Moderate Risk",
                      color: "#f59e0b",
                    },
                    high: {
                      label: "High Risk",
                      color: "#f97316",
                    },
                    critical: {
                      label: "Critical Risk",
                      color: "#ef4444",
                    },
                  }}
                  className="h-64"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <RechartsPieChart data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </RechartsPieChart>
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                      <div className="text-white font-semibold text-sm">{assessment.risk_level || "Unknown"}</div>
                    </div>
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-sm text-gray-600">
                      Current Assessment
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Common Conditions */}
          <Card>
            <CardHeader>
              <CardTitle>Common Conditions</CardTitle>
              <CardDescription>Most frequently identified conditions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {assessment.ai_analysis ? (
                  <div className="text-sm text-gray-600">
                    <p>{assessment.ai_analysis}</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-1 bg-gray-200 rounded mx-auto mb-4"></div>
                    <p className="text-gray-500">No specific conditions identified</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sentiment Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Sentiment Analysis</CardTitle>
              <CardDescription>Your emotional sentiment over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assessment.sentiment_label ? (
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-gray-600">Current Sentiment:</div>
                    <Badge variant="outline" className="capitalize">
                      {assessment.sentiment_label.replace("_", " ")}
                    </Badge>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-1 bg-gray-200 rounded mx-auto mb-4"></div>
                    <p className="text-gray-500">Sentiment analysis not available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recommendations */}
        {assessment.recommendations && assessment.recommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
              <CardDescription>Personalized suggestions based on your assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {assessment.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                    <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-700">{recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TopNavLayout>
  )
}
