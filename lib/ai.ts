import { groq } from "@ai-sdk/groq"

// Groq AI client configuration
export function createGroqClient() {
  const apiKey = process.env.GROQ_API_KEY

  if (!apiKey) {
    throw new Error("GROQ_API_KEY environment variable is required")
  }

  return groq(apiKey)
}

// AI model configuration
export const aiConfig = {
  model: "llama-3.1-8b-instant", // Updated to supported model
  maxTokens: 1000,
  temperature: 0.7,
}
