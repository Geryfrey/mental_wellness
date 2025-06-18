// Environment variables validation and configuration
export const env = {
  // Supabase
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://cwalxehivuhosytfbnzi.supabase.co",
    anonKey:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3YWx4ZWhpdnVob3N5dGZibnppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNjU2NzQsImV4cCI6MjA2NTc0MTY3NH0.5jHFXy5zrfVDiozpXNrZkfPXPF8kBzIYjLuHPY56cQI",
    serviceRoleKey:
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3YWx4ZWhpdnVob3N5dGZibnppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE2NTY3NCwiZXhwIjoyMDY1NzQxNjc0fQ.Fmodq68rdd6NlNjGozRh10NIU-Ha6SJndWP9f7zQ5Rw",
    jwtSecret:
      process.env.SUPABASE_JWT_SECRET ||
      "kEV3c4GLxxDypH7MfUFuT9R+sUQmy8AA3IBSn8WCucy3T+v9Wlkv21rTtYvcGxoAcyGWI/tXANOh7PwTILWuOw==",
  },

  // PostgreSQL
  postgres: {
    url:
      process.env.POSTGRES_URL ||
      "postgres://postgres.cwalxehivuhosytfbnzi:T6cVwBJpt70Y4CWU@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x",
    prismaUrl:
      process.env.POSTGRES_PRISMA_URL ||
      "postgres://postgres.cwalxehivuhosytfbnzi:T6cVwBJpt70Y4CWU@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x",
    urlNonPooling:
      process.env.POSTGRES_URL_NON_POOLING ||
      "postgres://postgres.cwalxehivuhosytfbnzi:T6cVwBJpt70Y4CWU@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require",
    user: process.env.POSTGRES_USER || "postgres",
    host: process.env.POSTGRES_HOST || "db.cwalxehivuhosytfbnzi.supabase.co",
    password: process.env.POSTGRES_PASSWORD || "T6cVwBJpt70Y4CWU",
    database: process.env.POSTGRES_DATABASE || "postgres",
  },

  // AI
  groq: {
    apiKey: process.env.GROQ_API_KEY || "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",
  },

  // Environment
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
}

// Validation function
export function validateEnvironment() {
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "POSTGRES_URL",
    "GROQ_API_KEY",
  ]

  const missing = required.filter((key) => !process.env[key])

  if (missing.length > 0) {
    console.warn(`Missing environment variables: ${missing.join(", ")}`)
    console.warn("Using fallback values for development")
  }

  return missing.length === 0
}
