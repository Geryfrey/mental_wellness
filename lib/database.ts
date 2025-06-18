import { createClient } from "@supabase/supabase-js"

// Database connection utility using Postgres URL
export function createDatabaseConnection() {
  const postgresUrl = process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL

  if (!postgresUrl) {
    throw new Error("No PostgreSQL connection URL found")
  }

  return postgresUrl
}

// Direct Supabase client for database operations
export function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase configuration")
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Environment configuration helper
export const dbConfig = {
  host: process.env.POSTGRES_HOST || "db.cwalxehivuhosytfbnzi.supabase.co",
  user: process.env.POSTGRES_USER || "postgres",
  password: process.env.POSTGRES_PASSWORD || "T6cVwBJpt70Y4CWU",
  database: process.env.POSTGRES_DATABASE || "postgres",
  url: process.env.POSTGRES_URL,
  urlNonPooling: process.env.POSTGRES_URL_NON_POOLING,
  prismaUrl: process.env.POSTGRES_PRISMA_URL,
}
