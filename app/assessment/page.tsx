"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Loader2, Brain } from "lucide-react"
import { TopNavLayout } from "@/components/layout/top-nav-layout"
import { supabase } from "@/lib/supabase/client"
import { getCurrentUser } from "@/lib/auth"
import { useRouter } from "next/navigation"
import type { User } from "@/lib/types"

const questions = [
  {
    id: "stress_level",
    question: "How would you rate your current stress level?",
    type: "radio",
    options: [
      { value: "not_stressed", label: "Not stressed at all" },
      { value: "mildly_stressed", label: "Mildly stressed" },
      { value: "moderately_stressed", label: "Moderately stressed" },
      { value: "very_stressed", label: "Very stressed" },
      { value: "extremely_stressed", label: "Extremely stressed" },
    ],
  },
  {
    id: "anxiety_frequency",
    question: "Over the last 2 weeks, how often have you felt nervous, anxious, or on edge?",
    type: "radio",
    options: [
      { value: "not_at_all", label: "Not at all" },
      { value: "several_days", label: "Several days" },
      { value: "more_than_half_days", label: "More than half the days" },
      { value: "nearly_every_day", label: "Nearly every day" },
    ],
  },
  {
    id: "mood_changes",
    question: "Have you experienced significant mood changes recently?",
    type: "radio",
    options: [
      { value: "no_changes", label: "No significant changes" },
      { value: "minor_changes", label: "Minor mood fluctuations" },
      { value: "moderate_changes", label: "Moderate mood swings" },
      { value: "major_changes", label: "Major mood changes" },
      { value: "severe_changes", label: "Severe emotional instability" },
    ],
  },
  {
    id: "sleep_quality",
    question: "How would you describe your sleep quality over the past week?",
    type: "radio",
    options: [
      { value: "excellent", label: "Excellent - 8+ hours, restful" },
      { value: "good", label: "Good - 7-8 hours, mostly restful" },
      { value: "fair", label: "Fair - 6-7 hours, somewhat restful" },
      { value: "poor", label: "Poor - 4-6 hours, not restful" },
      { value: "very_poor", label: "Very poor - Less than 4 hours" },
    ],
  },
  {
    id: "academic_pressure",
    question: "How much pressure do you feel from academic responsibilities?",
    type: "radio",
    options: [
      { value: "no_pressure", label: "No pressure" },
      { value: "low_pressure", label: "Low pressure" },
      { value: "moderate_pressure", label: "Moderate pressure" },
      { value: "high_pressure", label: "High pressure" },
      { value: "overwhelming", label: "Overwhelming pressure" },
    ],
  },
  {
    id: "social_connections",
    question: "How satisfied are you with your social connections and support system?",
    type: "radio",
    options: [
      { value: "very_satisfied", label: "Very satisfied" },
      { value: "satisfied", label: "Satisfied" },
      { value: "neutral", label: "Neutral" },
      { value: "dissatisfied", label: "Dissatisfied" },
      { value: "very_dissatisfied", label: "Very dissatisfied" },
    ],
  },
  {
    id: "coping_strategies",
    question: "What coping strategies do you currently use when feeling stressed or overwhelmed?",
    type: "textarea",
    placeholder: "Please describe the methods you use to manage stress, anxiety, or difficult emotions...",
  },
  {
    id: "additional_concerns",
    question: "Are there any other mental health concerns or thoughts you'd like to share?",
    type: "textarea",
    placeholder:
      "Feel free to share any additional concerns, thoughts, or experiences that might be relevant to your mental wellness...",
  },
]

export default function AssessmentPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
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

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const calculateRiskLevel = (answers: Record<string, string>) => {
    let riskScore = 0

    // Stress level scoring
    if (answers.stress_level === "extremely_stressed") riskScore += 3
    else if (answers.stress_level === "very_stressed") riskScore += 2
    else if (answers.stress_level === "moderately_stressed") riskScore += 1

    // Anxiety frequency scoring
    if (answers.anxiety_frequency === "nearly_every_day") riskScore += 3
    else if (answers.anxiety_frequency === "more_than_half_days") riskScore += 2
    else if (answers.anxiety_frequency === "several_days") riskScore += 1

    // Mood changes scoring
    if (answers.mood_changes === "severe_changes") riskScore += 3
    else if (answers.mood_changes === "major_changes") riskScore += 2
    else if (answers.mood_changes === "moderate_changes") riskScore += 1

    // Sleep quality scoring
    if (answers.sleep_quality === "very_poor") riskScore += 3
    else if (answers.sleep_quality === "poor") riskScore += 2
    else if (answers.sleep_quality === "fair") riskScore += 1

    // Academic pressure scoring
    if (answers.academic_pressure === "overwhelming") riskScore += 3
    else if (answers.academic_pressure === "high_pressure") riskScore += 2
    else if (answers.academic_pressure === "moderate_pressure") riskScore += 1

    // Social connections scoring (reverse scoring)
    if (answers.social_connections === "very_dissatisfied") riskScore += 3
    else if (answers.social_connections === "dissatisfied") riskScore += 2
    else if (answers.social_connections === "neutral") riskScore += 1

    // Determine risk level
    if (riskScore >= 12) return "critical"
    if (riskScore >= 8) return "high"
    if (riskScore >= 4) return "moderate"
    return "low"
  }

  const submitAssessment = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      // Get current user
      const {
        data: { user: authUser },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError || !authUser) {
        throw new Error("You must be logged in to submit an assessment")
      }

      // Get student profile
      const { data: student, error: studentError } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", authUser.id)
        .single()

      if (studentError || !student) {
        throw new Error("Student profile not found. Please complete your profile first.")
      }

      const riskLevel = calculateRiskLevel(answers)

      // Get AI analysis
      let aiAnalysis = null
      try {
        const aiResponse = await fetch("/api/analyze-assessment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers, riskLevel }),
        })

        if (aiResponse.ok) {
          aiAnalysis = await aiResponse.json()
        } else {
          console.warn("AI analysis failed, proceeding without it")
        }
      } catch (aiError) {
        console.warn("AI analysis error:", aiError)
      }

      // Prepare assessment data with fallbacks
      const assessmentData = {
        student_id: student.id,
        answers: answers,
        risk_level: riskLevel,
        score: Object.keys(answers).length, // Simple scoring based on completion
        // AI analysis fields with fallbacks
        ...(aiAnalysis && {
          predicted_conditions: aiAnalysis.predicted_conditions || null,
          predicted_risk_level: aiAnalysis.predicted_risk_level || riskLevel,
          predicted_sentiment: aiAnalysis.predicted_sentiment || "neutral",
          sentiment_score: aiAnalysis.sentiment_score || 50,
          sentiment_label: aiAnalysis.sentiment_label || "neutral",
          analysis: aiAnalysis.analysis || null,
          recommendations: aiAnalysis.recommendations || null,
          immediate_actions: aiAnalysis.immediate_actions || null,
          professional_help_needed: aiAnalysis.professional_help_needed || false,
          crisis_indicators: aiAnalysis.crisis_indicators || false,
        }),
      }

      // Try to insert with all fields first
      let { data: assessment, error: insertError } = await supabase
        .from("assessments")
        .insert(assessmentData)
        .select()
        .single()

      // If insertion fails due to missing columns, try with minimal data
      if (insertError && insertError.message.includes("column")) {
        console.warn("Full insert failed, trying with minimal data:", insertError.message)

        const minimalData = {
          student_id: student.id,
          answers: answers,
          risk_level: riskLevel,
          score: Object.keys(answers).length,
        }

        const { data: minimalAssessment, error: minimalError } = await supabase
          .from("assessments")
          .insert(minimalData)
          .select()
          .single()

        if (minimalError) {
          throw minimalError
        }

        assessment = minimalAssessment

        // Show warning about missing AI analysis
        setError(
          "Assessment saved successfully, but AI analysis features are not available due to database configuration. Please contact support.",
        )
      } else if (insertError) {
        throw insertError
      }

      setSuccess(true)

      // Redirect to results after a short delay
      setTimeout(() => {
        router.push(`/results/${assessment.id}`)
      }, 2000)
    } catch (error) {
      console.error("Error submitting assessment:", error)
      setError(error instanceof Error ? error.message : "Failed to submit assessment. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Loading assessment...</p>
        </div>
      </div>
    )
  }

  // If no user after loading, don't render anything (redirect will happen)
  if (!user) {
    return null
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100
  const currentQ = questions[currentQuestion]
  const isLastQuestion = currentQuestion === questions.length - 1
  const canProceed = answers[currentQ.id]

  if (success) {
    return (
      <TopNavLayout user={user}>
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-700 mb-2">Assessment Completed!</h2>
              <p className="text-gray-600 mb-4">
                Thank you for completing your mental health assessment. You'll be redirected to your results shortly.
              </p>
              <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            </CardContent>
          </Card>
        </div>
      </TopNavLayout>
    )
  }

  return (
    <TopNavLayout user={user}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mental Health Assessment</h1>
            <p className="text-gray-600 mb-4">
              This confidential assessment will help us understand your current mental wellness and provide personalized
              recommendations.
            </p>
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-gray-500 mt-2">
              Question {currentQuestion + 1} of {questions.length}
            </p>
          </div>

          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{currentQ.question}</CardTitle>
              {currentQ.type === "textarea" && (
                <CardDescription>
                  Please provide as much detail as you're comfortable sharing. Your responses are confidential.
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {currentQ.type === "radio" && (
                <RadioGroup
                  value={answers[currentQ.id] || ""}
                  onValueChange={(value) => handleAnswer(currentQ.id, value)}
                >
                  {currentQ.options?.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {currentQ.type === "textarea" && (
                <Textarea
                  value={answers[currentQ.id] || ""}
                  onChange={(e) => handleAnswer(currentQ.id, e.target.value)}
                  placeholder={currentQ.placeholder}
                  className="min-h-[120px]"
                />
              )}

              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={prevQuestion} disabled={currentQuestion === 0}>
                  Previous
                </Button>

                {isLastQuestion ? (
                  <Button onClick={submitAssessment} disabled={!canProceed || isSubmitting} className="min-w-[120px]">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Assessment"
                    )}
                  </Button>
                ) : (
                  <Button onClick={nextQuestion} disabled={!canProceed}>
                    Next
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TopNavLayout>
  )
}
