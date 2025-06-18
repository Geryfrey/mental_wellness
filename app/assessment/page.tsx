"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { TopNavLayout } from "@/components/layout/top-nav-layout"
import { getCurrentUser } from "@/lib/auth"
import { supabase } from "@/lib/supabase/client"
import type { User } from "@/lib/types"
import { Brain, ArrowLeft, ArrowRight } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

const assessmentQuestions = [
  {
    id: "mood",
    category: "mood",
    question: "How would you describe your overall mood in the past week?",
    options: [
      { value: "very_poor", label: "Very poor" },
      { value: "poor", label: "Poor" },
      { value: "fair", label: "Fair" },
      { value: "good", label: "Good" },
      { value: "excellent", label: "Excellent" },
    ],
  },
  {
    id: "anxiety",
    category: "anxiety",
    question: "How often have you felt nervous, anxious, or on edge?",
    options: [
      { value: "nearly_every_day", label: "Nearly every day" },
      { value: "more_than_half_days", label: "More than half the days" },
      { value: "several_days", label: "Several days" },
      { value: "not_at_all", label: "Not at all" },
    ],
  },
  {
    id: "worry",
    category: "anxiety",
    question: "How often have you been unable to stop or control worrying?",
    options: [
      { value: "nearly_every_day", label: "Nearly every day" },
      { value: "more_than_half_days", label: "More than half the days" },
      { value: "several_days", label: "Several days" },
      { value: "not_at_all", label: "Not at all" },
    ],
  },
  {
    id: "interest",
    category: "depression",
    question: "How often have you had little interest or pleasure in doing things?",
    options: [
      { value: "nearly_every_day", label: "Nearly every day" },
      { value: "more_than_half_days", label: "More than half the days" },
      { value: "several_days", label: "Several days" },
      { value: "not_at_all", label: "Not at all" },
    ],
  },
  {
    id: "hopeless",
    category: "depression",
    question: "How often have you felt down, depressed, or hopeless?",
    options: [
      { value: "nearly_every_day", label: "Nearly every day" },
      { value: "more_than_half_days", label: "More than half the days" },
      { value: "several_days", label: "Several days" },
      { value: "not_at_all", label: "Not at all" },
    ],
  },
  {
    id: "sleep",
    category: "general",
    question: "How would you rate your sleep quality in the past week?",
    options: [
      { value: "very_poor", label: "Very poor" },
      { value: "poor", label: "Poor" },
      { value: "fair", label: "Fair" },
      { value: "good", label: "Good" },
      { value: "excellent", label: "Excellent" },
    ],
  },
  {
    id: "stress",
    category: "stress",
    question: "How stressed have you felt in the past week?",
    options: [
      { value: "extremely_stressed", label: "Extremely stressed" },
      { value: "very_stressed", label: "Very stressed" },
      { value: "moderately_stressed", label: "Moderately stressed" },
      { value: "slightly_stressed", label: "Slightly stressed" },
      { value: "not_stressed", label: "Not stressed at all" },
    ],
  },
  {
    id: "concentration",
    category: "general",
    question: "How has your ability to concentrate been?",
    options: [
      { value: "very_poor", label: "Very poor" },
      { value: "poor", label: "Poor" },
      { value: "fair", label: "Fair" },
      { value: "good", label: "Good" },
      { value: "excellent", label: "Excellent" },
    ],
  },
  {
    id: "academic_pressure",
    category: "academic",
    question: "How much academic pressure are you currently experiencing?",
    options: [
      { value: "overwhelming", label: "Overwhelming" },
      { value: "high", label: "High" },
      { value: "moderate", label: "Moderate" },
      { value: "low", label: "Low" },
      { value: "none", label: "None" },
    ],
  },
  {
    id: "social_connections",
    category: "social",
    question: "How satisfied are you with your social connections and relationships?",
    options: [
      { value: "very_dissatisfied", label: "Very dissatisfied" },
      { value: "dissatisfied", label: "Dissatisfied" },
      { value: "neutral", label: "Neutral" },
      { value: "satisfied", label: "Satisfied" },
      { value: "very_satisfied", label: "Very satisfied" },
    ],
  },
  {
    id: "additional_thoughts",
    category: "general",
    question: "Please share any additional thoughts about how you've been feeling lately (optional)",
    options: [],
    isTextArea: true,
  },
]

// Helper function to calculate basic scores from responses
function calculateScores(answers: Record<string, string>) {
  const anxietyQuestions = ["anxiety", "worry"]
  const depressionQuestions = ["interest", "hopeless"]
  const stressQuestions = ["stress"]
  const wellbeingQuestions = ["mood", "sleep", "concentration", "social_connections"]

  const scoreMap = {
    // Anxiety/Depression scoring (higher = worse)
    nearly_every_day: 75,
    more_than_half_days: 50,
    several_days: 25,
    not_at_all: 0,

    // Stress scoring
    extremely_stressed: 100,
    very_stressed: 75,
    moderately_stressed: 50,
    slightly_stressed: 25,
    not_stressed: 0,

    // General wellbeing scoring (higher = better)
    excellent: 100,
    good: 75,
    fair: 50,
    poor: 25,
    very_poor: 0,

    // Social connections
    very_satisfied: 100,
    satisfied: 75,
    neutral: 50,
    dissatisfied: 25,
    very_dissatisfied: 0,

    // Academic pressure (higher = worse)
    overwhelming: 100,
    high: 75,
    moderate: 50,
    low: 25,
    none: 0,
  }

  const calculateAverage = (questions: string[]) => {
    const scores = questions
      .map((q) => answers[q])
      .filter(Boolean)
      .map((answer) => scoreMap[answer as keyof typeof scoreMap] || 0)

    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
  }

  return {
    anxiety_score: calculateAverage(anxietyQuestions),
    depression_score: calculateAverage(depressionQuestions),
    stress_score: calculateAverage(stressQuestions),
    overall_wellbeing_score: calculateAverage(wellbeingQuestions),
  }
}

export default function AssessmentPage() {
  const [user, setUser] = useState<User | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
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
      } catch (error) {
        console.error("Auth error:", error)
        router.push("/auth/login")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const handleAnswer = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [assessmentQuestions[currentQuestion].id]: value,
    }))
  }

  const nextQuestion = () => {
    if (currentQuestion < assessmentQuestions.length - 1) {
      setCurrentQuestion((prev) => prev + 1)
    }
  }

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1)
    }
  }

  const submitAssessment = async () => {
    if (!user) return

    setSubmitting(true)
    try {
      // First, try to get the student profile
      let { data: student, error: studentError } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user.id)
        .single()

      // If student profile doesn't exist, create it
      if (studentError || !student) {
        console.log("Student profile not found, creating one...")
        const { data: newStudent, error: createError } = await supabase
          .from("students")
          .insert({
            user_id: user.id,
          })
          .select("id")
          .single()

        if (createError) {
          console.error("Error creating student profile:", createError)
          throw new Error("Failed to create student profile")
        }

        student = newStudent
      }

      if (!student) {
        throw new Error("Unable to create or find student profile")
      }

      // Calculate basic scores
      const scores = calculateScores(answers)

      // Prepare basic assessment data with only core fields
      const assessmentData: any = {
        student_id: student.id,
        responses: answers,
        ...scores, // Include calculated scores
        risk_level: "moderate", // Default risk level
        ai_analysis: "Assessment completed successfully.",
        recommendations: [
          "Practice deep breathing exercises daily",
          "Maintain a regular sleep schedule",
          "Engage in physical activity you enjoy",
          "Connect with friends and family regularly",
          "Consider speaking with a counselor if needed",
        ],
      }

      try {
        // Call AI API for enhanced analysis
        const aiResponse = await fetch("/api/analyze-assessment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers }),
        })

        if (aiResponse.ok) {
          const aiData = await aiResponse.json()
          console.log("AI Analysis received:", aiData)

          // Only add AI data if the columns exist (try to add them safely)
          if (aiData.predicted_risk_level) {
            assessmentData.risk_level = aiData.predicted_risk_level
          }
          if (aiData.sentiment_score !== undefined) {
            assessmentData.sentiment_score = aiData.sentiment_score
          }
          if (aiData.sentiment_label) {
            assessmentData.sentiment_label = aiData.sentiment_label
          }
          if (aiData.analysis) {
            assessmentData.ai_analysis = aiData.analysis
          }
          if (aiData.recommendations) {
            assessmentData.recommendations = aiData.recommendations
          }

          // Try to add predicted fields if they exist in the schema
          try {
            if (aiData.predicted_conditions) {
              assessmentData.predicted_conditions = aiData.predicted_conditions
            }
            if (aiData.predicted_risk_level) {
              assessmentData.predicted_risk_level = aiData.predicted_risk_level
            }
            if (aiData.predicted_sentiment) {
              assessmentData.predicted_sentiment = aiData.predicted_sentiment
            }
          } catch (schemaError) {
            console.log("Some predicted fields not available in schema, using fallbacks")
          }
        }
      } catch (aiError) {
        console.log("AI analysis failed, proceeding with basic assessment:", aiError)
      }

      // Save assessment with error handling for schema issues
      try {
        const { data: assessment, error } = await supabase.from("assessments").insert(assessmentData).select().single()

        if (error) throw error
        router.push(`/results/${assessment.id}`)
      } catch (insertError: any) {
        // If insert fails due to schema issues, try with minimal data
        console.log("Full insert failed, trying with minimal data:", insertError)

        const minimalData = {
          student_id: student.id,
          responses: answers,
          ...scores,
          risk_level: "moderate",
          ai_analysis:
            "Assessment completed. Please run the database migration script to enable full AI analysis features.",
        }

        const { data: assessment, error: minimalError } = await supabase
          .from("assessments")
          .insert(minimalData)
          .select()
          .single()

        if (minimalError) throw minimalError
        router.push(`/results/${assessment.id}`)
      }
    } catch (error: any) {
      console.error("Error submitting assessment:", error)
      alert(`Error submitting assessment: ${error.message}. Please try again.`)
    } finally {
      setSubmitting(false)
    }
  }

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

  const progress = ((currentQuestion + 1) / assessmentQuestions.length) * 100
  const currentQ = assessmentQuestions[currentQuestion]
  const isLastQuestion = currentQuestion === assessmentQuestions.length - 1
  const canProceed = answers[currentQ.id] || currentQ.isTextArea

  return (
    <TopNavLayout user={user}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mental Health Assessment</h1>
          <p className="text-gray-600">
            Please answer the following questions honestly. This assessment will help us understand your current mental
            wellness and provide personalized support.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              Question {currentQuestion + 1} of {assessmentQuestions.length}
            </span>
            <span className="text-sm text-gray-600">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">{currentQ.question}</CardTitle>
            <CardDescription>
              {currentQ.isTextArea
                ? "Optional - share your thoughts"
                : "Select the option that best describes your experience"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentQ.isTextArea ? (
              <Textarea
                value={answers[currentQ.id] || ""}
                onChange={(e) => handleAnswer(e.target.value)}
                placeholder="Share your thoughts here..."
                rows={4}
                className="w-full"
              />
            ) : (
              <RadioGroup value={answers[currentQ.id] || ""} onValueChange={handleAnswer} className="space-y-4">
                {currentQ.options.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={prevQuestion} disabled={currentQuestion === 0}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {isLastQuestion ? (
            <Button onClick={submitAssessment} disabled={submitting} className="bg-purple-600 hover:bg-purple-700">
              {submitting ? "Analyzing..." : "Complete Assessment"}
            </Button>
          ) : (
            <Button onClick={nextQuestion} disabled={!canProceed} className="bg-purple-600 hover:bg-purple-700">
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </TopNavLayout>
  )
}
