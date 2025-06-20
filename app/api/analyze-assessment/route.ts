import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { feeling } = await request.json();
    if (
      !feeling ||
      typeof feeling !== "string" ||
      feeling.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Missing or invalid 'feeling' input." },
        { status: 400 }
      );
    }

    const groqApiKey = env.groq.apiKey;
    if (!groqApiKey) {
      return NextResponse.json(
        { error: "Groq API key not configured." },
        { status: 500 }
      );
    }

    const groq = createGroq({ apiKey: groqApiKey });

    // Fetch all unique tags from the resources table
    const { data: resources, error: resourcesError } = await supabaseAdmin
      .from("resources")
      .select("tags")
      .eq("is_featured", true);
    if (resourcesError) {
      return NextResponse.json(
        { error: "Failed to fetch resource tags." },
        { status: 500 }
      );
    }
    // Flatten and deduplicate tags
    const allTags = Array.from(
      new Set(
        (resources || [])
          .flatMap((r: any) => (Array.isArray(r.tags) ? r.tags : []))
          .filter(
            (tag: any) => typeof tag === "string" && tag.trim().length > 0
          )
          .map((tag: string) => tag.trim().toLowerCase())
      )
    );

    // Prompt for sentiment, risk level, tag prediction, and professional help
    const prompt = `Analyze the following text and return a JSON object with only these fields and no explanation: { "sentiment": "positive|neutral|negative", "score": number (0-100, 0=very negative, 50=neutral, 100=very positive), "riskLevel": "low|moderate|high", "predicted_tags": string[], "requires_mental_health_professional": boolean }. The riskLevel and requires_mental_health_professional should be inferred from the text content, not just the score. Only include tags related to mental health conditions such as depression, academic stress that matches with the predicted risk score should be returned : [${allTags.join(
      ", "
    )}]. Text: "${feeling}"`;

    const { text } = await generateText({
      model: groq("deepseek-r1-distill-llama-70b"),
      prompt,
      system:
        "You are a compassionate health assistant. Analyze the user's text and respond ONLY with valid JSON as described, inferring risk level and relevant tags from the content.",
      maxTokens: 2000,
      temperature: 0.7,
    });
    console.log("Generated text:", text);
    let result;
    try {
      if (text.includes("```json")) {
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          result = JSON.parse(jsonMatch[1].trim());
        } else {
          throw new Error("JSON content not found in code block");
        }
      } else {
        result = JSON.parse(text);
      }
    } catch (e) {
      console.log("Error in analyze-assessment route:", e);
      return NextResponse.json(
        { error: "Failed to parse sentiment result." },
        { status: 500 }
      );
    }

    // Return the AI's result directly (sentiment, score, riskLevel, predicted_tags, requires_mental_health_professional)
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
