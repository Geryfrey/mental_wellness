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
import { Brain, BookOpen, TrendingUp, TrendingDown } from "lucide-react"
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

  // Process real data for charts
  const processChartData = () => {
    if (!allAssessments.length)
      return { stressAnxietyData: [], sentimentData: [], commonConditions: {}, riskDistribution: {} }

    const stressAnxietyData = allAssessments.map((assessment, index) => ({
      date: new Date(assessment.created_at).toLocaleDateString(),
      assessment: `Assessment ${index + 1}`,
      stress: assessment.stress_score || 0,
      anxiety: assessment.anxiety_score || 0,
      depression: assessment.depression_score || 0,
      wellbeing: assessment.overall_wellbeing_score || 0,
    }))

    const sentimentData = allAssessments.map((assessment, index) => ({
      date: new Date(assessment.created_at).toLocaleDateString(),
      assessment: `Assessment ${index + 1}`,
      sentiment: assessment.sentiment_score ? (assessment.sentiment_score - 50) / 10 : 0, // Convert to -5 to +5 scale
    }))

    // Count common conditions
    const commonConditions: Record<string, number> = {}
    allAssessments.forEach((assessment) => {
      if (assessment.predicted_conditions) {
        assessment.predicted_conditions.forEach((condition) => {
          const formatted = condition.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
          commonConditions[formatted] = (commonConditions[formatted] || 0) + 1
        })
      }
    })

    // Count risk distribution
    const riskDistribution: Record<string, number> = {}
    allAssessments.forEach((assessment) => {
      const risk = assessment.predicted_risk_level || assessment.risk_level || "unknown"
      riskDistribution[risk] = (riskDistribution[risk] || 0) + 1
    })

    return { stressAnxietyData, sentimentData, commonConditions, riskDistribution }
  }

  const { stressAnxietyData, sentimentData, commonConditions, riskDistribution } = processChartData()

  // Convert to chart format
  const commonConditionsData = Object.entries(commonConditions)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([condition, count]) => ({
      condition,
      value: count / allAssessments.length, // Normalize to 0-1
    }))

  const riskDistributionData = Object.entries(riskDistribution).map(([level, count]) => ({
    name: level.charAt(0).toUpperCase() + level.slice(1),
    value: count,
    color: level === "low" ? "#10b981" : level === "moderate" ? "#f59e0b" : level === "high" ? "#f97316" : "#ef4444",
  }))

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

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case "positive":
      case "very_positive":
        return "bg-green-100 text-green-800"
      case "neutral":
        return "bg-yellow-100 text-yellow-800"
      case "negative":
      case "very_negative":
        return "bg-red-100 text-red-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  const formatConditions = (conditions?: string[]) => {
    if (!conditions || conditions.length === 0) return ["No specific conditions identified"]
    return conditions.map((condition) => condition.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()))
  }

  const currentRiskLevel = recentAssessment?.predicted_risk_level || recentAssessment?.risk_level || "moderate"
  const currentSentiment = recentAssessment?.predicted_sentiment || recentAssessment?.sentiment_label || "neutral"
  const lastAssessmentDate = recentAssessment ? new Date(recentAssessment.created_at).toLocaleDateString() : null

  // Get current metrics from most recent assessment
  const currentStress = recentAssessment?.stress_score || 0
  const currentAnxiety = recentAssessment?.anxiety_score || 0
  const currentSleep = 7 - Math.floor((currentStress + currentAnxiety) / 25) // Estimate sleep based on stress/anxiety

  // Calculate trends
  const getStressTrend = () => {
    if (stressAnxietyData.length < 2) return null
    const recent = stressAnxietyData[stressAnxietyData.length - 1].stress
    const previous = stressAnxietyData[stressAnxietyData.length - 2].stress
    return recent > previous ? "up" : recent < previous ? "down" : "stable"
  }

  const getAnxietyTrend = () => {
    if (stressAnxietyData.length < 2) return null
    const recent = stressAnxietyData[stressAnxietyData.length - 1].anxiety
    const previous = stressAnxietyData[stressAnxietyData.length - 2].anxiety
    return recent > previous ? "up" : recent < previous ? "down" : "stable"
  }

  const stressTrend = getStressTrend()
  const anxietyTrend = getAnxietyTrend()

  return (
    <TopNavLayout user={user}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Stress Level</p>
                  <p className="text-3xl font-bold">{currentStress}</p>
                </div>
                {stressTrend === "up" && <TrendingUp className="h-4 w-4 text-red-500" />}
                {stressTrend === "down" && <TrendingDown className="h-4 w-4 text-green-500" />}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Anxiety Level</p>
                  <p className="text-3xl font-bold">{currentAnxiety}</p>
                </div>
                {anxietyTrend === "up" && <TrendingUp className="h-4 w-4 text-red-500" />}
                {anxietyTrend === "down" && <TrendingDown className="h-4 w-4 text-green-500" />}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div>
                <p className="text-sm text-gray-600">Sleep Hours</p>
                <p className="text-3xl font-bold">{Math.max(4, currentSleep)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div>
                <p className="text-sm text-gray-600">Risk Level</p>
                <Badge className={`mt-2 ${getRiskLevelColor(currentRiskLevel)}`}>{currentRiskLevel}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Charts */}
        {allAssessments.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stress & Anxiety Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Stress & Anxiety Trends</CardTitle>
                <CardDescription>Your stress and anxiety levels over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    stress: { label: "Stress", color: "#ef4444" },
                    anxiety: { label: "Anxiety", color: "#06b6d4" },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stressAnxietyData}>
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="stress"
                        stroke="var(--color-stress)"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="anxiety"
                        stroke="var(--color-anxiety)"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Risk Level Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Risk Level Distribution</CardTitle>
                <CardDescription>Distribution of your risk assessments</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    low: { label: "Low Risk", color: "#10b981" },
                    moderate: { label: "Moderate Risk", color: "#f59e0b" },
                    high: { label: "High Risk", color: "#f97316" },
                    critical: { label: "Critical Risk", color: "#ef4444" },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={riskDistributionData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name} ${value}`}
                      >
                        {riskDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Common Conditions & Sentiment Analysis */}
        {allAssessments.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Common Conditions */}
            <Card>
              <CardHeader>
                <CardTitle>Common Conditions</CardTitle>
                <CardDescription>Most frequently identified conditions</CardDescription>
              </CardHeader>
              <CardContent>
                {commonConditionsData.length > 0 ? (
                  <ChartContainer
                    config={{
                      value: { label: "Frequency", color: "#6366f1" },
                    }}
                    className="h-[300px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={commonConditionsData} layout="horizontal">
                        <XAxis type="number" domain={[0, 1]} />
                        <YAxis dataKey="condition" type="category" width={100} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="value" fill="var(--color-value)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No conditions data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sentiment Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Sentiment Analysis</CardTitle>
                <CardDescription>Your emotional sentiment over time</CardDescription>
              </CardHeader>
              <CardContent>
                {sentimentData.length > 0 ? (
                  <ChartContainer
                    config={{
                      sentiment: { label: "Sentiment", color: "#f59e0b" },
                    }}
                    className="h-[300px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={sentimentData}>
                        <XAxis dataKey="date" />
                        <YAxis
                          domain={[-5, 5]}
                          tickFormatter={(value) => {
                            if (value >= 2) return "Positive"
                            if (value <= -2) return "Negative"
                            return "Neutral"
                          }}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line
                          type="monotone"
                          dataKey="sentiment"
                          stroke="var(--color-sentiment)"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No sentiment data available
                  </div>
                )}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Predicted Conditions */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Predicted Conditions</h3>
                  <div className="flex flex-wrap gap-2">
                    {formatConditions(recentAssessment?.predicted_conditions).map((condition, index) => (
                      <Badge key={index} variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
                        {condition}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Risk Level */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Risk Level</h3>
                  <Badge className={`${getRiskLevelColor(currentRiskLevel)} px-3 py-1 text-sm font-medium`}>
                    {currentRiskLevel.toUpperCase()}
                  </Badge>
                </div>

                {/* Sentiment */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Sentiment</h3>
                  <Badge className={`${getSentimentColor(currentSentiment)} px-3 py-1 text-sm font-medium`}>
                    {currentSentiment.toUpperCase()}
                  </Badge>
                </div>
              </div>

              {/* AI Analysis */}
              {recentAssessment.ai_analysis && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">AI Analysis</h4>
                  <p className="text-gray-700 text-sm">{recentAssessment.ai_analysis}</p>
                </div>
              )}

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
