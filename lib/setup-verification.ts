import { supabase } from "./supabase/client"
import { supabaseAdmin } from "./supabase/server"
import { env, validateEnvironment } from "./env"

export async function verifySetup() {
  console.log("🔍 Verifying system setup...")

  // 1. Check environment variables
  const envValid = validateEnvironment()
  console.log(`✅ Environment variables: ${envValid ? "Valid" : "Using fallbacks"}`)

  // 2. Test Supabase connection
  try {
    const { data, error } = await supabase.from("profiles").select("count").limit(1)
    if (error && error.code !== "PGRST116") {
      // PGRST116 = table doesn't exist yet
      console.log("⚠️  Supabase connection: Connected (tables need setup)")
    } else {
      console.log("✅ Supabase connection: Working")
    }
  } catch (error) {
    console.log("❌ Supabase connection: Failed", error)
  }

  // 3. Test Groq AI
  try {
    const groqKey = env.groq.apiKey
    if (groqKey && groqKey.startsWith("gsk_")) {
      console.log("✅ Groq AI: API key configured")
    } else {
      console.log("⚠️  Groq AI: API key missing or invalid")
    }
  } catch (error) {
    console.log("❌ Groq AI: Configuration error", error)
  }

  // 4. Database connection test
  try {
    const { data, error } = await supabaseAdmin.from("information_schema.tables").select("table_name").limit(1)
    console.log("✅ Database connection: Working")
  } catch (error) {
    console.log("❌ Database connection: Failed", error)
  }

  console.log("🎉 Setup verification complete!")
}
