import { generateText } from "ai"
import { createGroq } from "@ai-sdk/groq"
import { type NextRequest, NextResponse } from "next/server"
import { env } from "@/lib/env"

export async function POST(request: NextRequest) {
  try {
    const { answers, riskLevel } = await request.json()

    // Configure Groq with API key from environment
    const groqApiKey = env.groq.apiKey

    if (!groqApiKey) {
      console.error("Groq API key not found in environment configuration")
      throw new Error("Groq API key not configured")
    }

    const groq = createGroq({
      apiKey: groqApiKey,
    })

    // Extract written responses for sentiment analysis
    const writtenResponses = Object.values(answers)
      .filter((response) => typeof response === "string" && response.length > 10)
      .join(" ")

    // Calculate basic risk assessment from responses
    const calculateRiskFromAnswers = (answers: Record<string, string>) => {
      let riskScore = 0
      const responses = Object.entries(answers)

      responses.forEach(([key, value]) => {
        if (typeof value === "string") {
          // High risk indicators
          if (
            value.includes("nearly_every_day") ||
            value.includes("extremely_stressed") ||
            value.includes("overwhelming")
          ) {
            riskScore += 3
          }
          // Moderate risk indicators
          else if (value.includes("more_than_half_days") || value.includes("very_stressed") || value.includes("high")) {
            riskScore += 2
          }
          // Low risk indicators
          else if (
            value.includes("several_days") ||
            value.includes("moderately_stressed") ||
            value.includes("moderate")
          ) {
            riskScore += 1
          }
        }
      })

      if (riskScore >= 15) return "critical"
      if (riskScore >= 10) return "high"
      if (riskScore >= 5) return "moderate"
      return "low"
    }

    const calculatedRisk = calculateRiskFromAnswers(answers)

    const prompt = `
You are a compassionate mental health AI assistant analyzing a student wellness assessment. 

Assessment Responses: ${JSON.stringify(answers, null, 2)}
Written Content: "${writtenResponses}"
Calculated Risk Level: ${calculatedRisk}

Please provide a comprehensive analysis in JSON format with the following structure:

{
  "predicted_conditions": ["condition1", "condition2"],
  "predicted_risk_level": "low|moderate|high|critical",
  "predicted_sentiment": "positive|negative|neutral",
  "sentiment_score": 0-100,
  "sentiment_label": "very_negative|negative|neutral|positive|very_positive",
  "analysis": "A detailed, compassionate analysis of the student's mental health state based on their responses. Include specific observations about their stress levels, anxiety, mood, and any concerning patterns. Be supportive and non-judgmental while being clinically accurate.",
  "recommendations": [
    "Specific, actionable recommendation 1",
    "Specific, actionable recommendation 2",
    "Specific, actionable recommendation 3",
    "Specific, actionable recommendation 4",
    "Specific, actionable recommendation 5"
  ],
  "immediate_actions": [
    "Immediate step they can take today",
    "Another immediate action"
  ],
  "professional_help_needed": true/false,
  "crisis_indicators": true/false
}

Available mental health conditions to predict from (select the most relevant):
- academic_stress
- anxiety
- depression
- social_anxiety
- adjustment_disorder
- sleep_disorder
- eating_disorder
- substance_abuse
- relationship_issues
- financial_stress
- homesickness
- perfectionism
- imposter_syndrome
- mild_anxiety
- severe_anxiety
- panic_disorder
- generalized_anxiety

Risk level guidelines:
- low: Minor concerns, manageable with self-care and lifestyle changes
- moderate: Some intervention needed, counseling recommended, regular monitoring
- high: Professional help strongly recommended, may need intensive support
- critical: Immediate professional intervention required, safety concerns present

Sentiment analysis guidelines:
- sentiment_score: 0-100 (0=very negative, 25=negative, 50=neutral, 75=positive, 100=very positive)
- Consider the overall tone, hope vs despair, coping vs overwhelm
- Look for positive coping mechanisms, support systems, resilience factors

Analysis should be:
- Compassionate and non-judgmental
- Specific to their responses
- Culturally sensitive
- Evidence-based
- Actionable and hopeful
- Include validation of their feelings
- Highlight strengths and coping resources they mentioned

Recommendations should be:
- Specific and actionable
- Varied (lifestyle, therapeutic, social, academic)
- Appropriate to their risk level
- Include both immediate and long-term strategies
- Consider their specific situation and responses
`

    const { text } = await generateText({
      model: groq("llama-3.1-8b-instant"),
      prompt,
      system:
        "You are a compassionate mental health AI assistant with expertise in student wellness. Always respond with valid JSON format. Be supportive, evidence-based, and provide actionable guidance while maintaining appropriate clinical boundaries.",
      maxTokens: 2000,
      temperature: 0.7,
    })

    // Try to parse JSON response
    let analysisResult
    try {
      analysisResult = JSON.parse(text)

      // Validate and enhance the response
      if (!analysisResult.predicted_conditions || !Array.isArray(analysisResult.predicted_conditions)) {
        analysisResult.predicted_conditions = ["academic_stress"]
      }

      if (!analysisResult.predicted_risk_level) {
        analysisResult.predicted_risk_level = calculatedRisk
      }

      if (!analysisResult.sentiment_score || typeof analysisResult.sentiment_score !== "number") {
        analysisResult.sentiment_score = 50
      }

      if (!analysisResult.analysis) {
        analysisResult.analysis =
          "Thank you for completing this assessment. Your responses indicate areas where focused attention and support could be beneficial for your mental wellness."
      }

      if (!analysisResult.recommendations || !Array.isArray(analysisResult.recommendations)) {
        analysisResult.recommendations = [
          "Practice deep breathing exercises for 5-10 minutes daily",
          "Maintain a consistent sleep schedule of 7-9 hours per night",
          "Engage in regular physical activity, even light walking",
          "Connect with friends, family, or support groups regularly",
          "Consider speaking with a counselor or mental health professional",
          "Practice mindfulness or meditation techniques",
          "Limit caffeine intake, especially in the afternoon and evening",
        ]
      }
    } catch (parseError) {
      console.warn("Failed to parse AI response as JSON:", parseError)
      console.log("Raw AI response:", text)

      // Fallback response with calculated risk
      analysisResult = {
        predicted_conditions: ["academic_stress"],
        predicted_risk_level: calculatedRisk,
        predicted_sentiment: "neutral",
        sentiment_score: 50,
        sentiment_label: "neutral",
        analysis: `Based on your assessment responses, you appear to be experiencing ${calculatedRisk} levels of stress and mental health concerns. Your responses indicate areas where focused attention and support could be beneficial. It's important to remember that seeking help is a sign of strength, and there are many effective strategies and resources available to support your mental wellness.`,
        recommendations: [
          "Practice stress-reduction techniques like deep breathing or progressive muscle relaxation",
          "Maintain a regular sleep schedule and aim for 7-9 hours of sleep per night",
          "Engage in regular physical activity, which can significantly improve mood and reduce stress",
          "Stay connected with supportive friends, family members, or peer groups",
          "Consider speaking with a mental health professional for personalized guidance",
          "Practice mindfulness or meditation to help manage overwhelming thoughts",
          "Create a balanced daily routine that includes time for both work and relaxation",
        ],
        immediate_actions: [
          "Take 5 deep breaths right now to help center yourself",
          "Write down one thing you're grateful for today",
        ],
        professional_help_needed: calculatedRisk === "high" || calculatedRisk === "critical",
        crisis_indicators: calculatedRisk === "critical",
      }
    }

    console.log("AI Analysis completed:", {
      risk_level: analysisResult.predicted_risk_level,
      conditions: analysisResult.predicted_conditions,
      sentiment: analysisResult.sentiment_score,
    })

    return NextResponse.json(analysisResult)
  } catch (error) {
    console.error("Error analyzing assessment:", error)

    // Provide comprehensive fallback response
    return NextResponse.json({
      predicted_conditions: ["academic_stress"],
      predicted_risk_level: "moderate",
      predicted_sentiment: "neutral",
      sentiment_score: 50,
      sentiment_label: "neutral",
      analysis:
        "Thank you for taking the time to complete this mental health assessment. While we encountered a technical issue with the detailed analysis, your willingness to engage with this process shows self-awareness and care for your mental wellness. Based on common student experiences, it's normal to face challenges with stress, academic pressure, and emotional well-being during your educational journey.",
      recommendations: [
        "Establish a daily routine that includes time for both study and relaxation",
        "Practice stress management techniques such as deep breathing or meditation",
        "Maintain regular sleep patterns and aim for 7-9 hours of sleep per night",
        "Stay physically active with activities you enjoy, even if just a daily walk",
        "Connect regularly with friends, family, or support networks",
        "Consider speaking with a counselor or mental health professional",
        "Practice self-compassion and remember that seeking help is a sign of strength",
        "Limit caffeine and alcohol intake, especially during stressful periods",
      ],
      immediate_actions: [
        "Take three deep breaths and remind yourself that you're taking positive steps",
        "Identify one small self-care activity you can do today",
      ],
      professional_help_needed: false,
      crisis_indicators: false,
    })
  }
}
