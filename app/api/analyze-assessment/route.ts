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

    const prompt = `
You are a mental health AI assistant analyzing a student wellness assessment. 

Student Responses: ${JSON.stringify(answers)}
Written Content: "${writtenResponses}"

Please analyze and provide the following in JSON format:

{
  "predicted_conditions": ["condition1", "condition2"],
  "predicted_risk_level": "low|moderate|critical",
  "predicted_sentiment": "positive|negative|neutral",
  "sentiment_score": 0-100,
  "sentiment_label": "very_negative|negative|neutral|positive|very_positive",
  "analysis": "detailed analysis text",
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"]
}

Available mental health conditions to predict from:
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

Risk levels:
- low: Minor concerns, manageable with self-care
- moderate: Some intervention needed, counseling recommended
- critical: Immediate professional help required

Sentiment analysis:
- sentiment_score: 0-100 (0=very negative, 50=neutral, 100=very positive)
- sentiment_label: very_negative, negative, neutral, positive, very_positive
- predicted_sentiment: overall sentiment (positive/negative/neutral)

Provide compassionate, evidence-based analysis and practical recommendations.
`

    const { text } = await generateText({
      model: groq("llama-3.1-8b-instant"), // Updated to supported model
      prompt,
      system:
        "You are a compassionate mental health AI assistant. Always respond with valid JSON format. Be supportive and non-judgmental in your analysis.",
    })

    // Try to parse JSON response
    let analysisResult
    try {
      analysisResult = JSON.parse(text)
    } catch (parseError) {
      console.warn("Failed to parse AI response as JSON:", parseError)
      // Fallback if JSON parsing fails
      analysisResult = {
        predicted_conditions: ["academic_stress"],
        predicted_risk_level: "moderate",
        predicted_sentiment: "neutral",
        sentiment_score: 50,
        sentiment_label: "neutral",
        analysis:
          "Thank you for completing the assessment. Based on your responses, we recommend focusing on self-care practices and considering professional support if needed.",
        recommendations: [
          "Practice deep breathing exercises daily",
          "Maintain a regular sleep schedule",
          "Engage in physical activity you enjoy",
          "Connect with friends and family regularly",
          "Consider speaking with a counselor",
        ],
      }
    }

    return NextResponse.json(analysisResult)
  } catch (error) {
    console.error("Error analyzing assessment:", error)

    // Provide fallback response if AI analysis fails
    return NextResponse.json({
      predicted_conditions: ["academic_stress"],
      predicted_risk_level: "moderate",
      predicted_sentiment: "neutral",
      sentiment_score: 50,
      sentiment_label: "neutral",
      analysis:
        "Thank you for completing the assessment. Based on your responses, we recommend focusing on self-care practices and considering professional support if needed.",
      recommendations: [
        "Practice deep breathing exercises daily",
        "Maintain a regular sleep schedule",
        "Engage in physical activity you enjoy",
        "Connect with friends and family regularly",
        "Consider speaking with a counselor",
        "Practice mindfulness or meditation",
        "Limit caffeine and alcohol intake",
      ],
    })
  }
}
