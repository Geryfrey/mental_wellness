import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cwalxehivuhosytfbnzi.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3YWx4ZWhpdnVob3N5dGZibnppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNjU2NzQsImV4cCI6MjA2NTc0MTY3NH0.5jHFXy5zrfVDiozpXNrZkfPXPF8kBzIYjLuHPY56cQI"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
