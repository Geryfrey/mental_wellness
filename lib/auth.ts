import { supabase } from "./supabase/client"
import type { User } from "./types"

export async function signUp(
  email: string,
  password: string,
  fullName: string,
  role = "student",
  registrationNumber?: string,
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) throw error

  if (data.user) {
    // Create user profile
    const { error: profileError } = await supabase.from("users").insert({
      id: data.user.id,
      email,
      full_name: fullName,
      role,
    })

    if (profileError) throw profileError

    // If student, create student profile with registration number
    if (role === "student") {
      const studentData: any = {
        user_id: data.user.id,
      }

      // Only add registration_number if provided
      if (registrationNumber) {
        studentData.registration_number = registrationNumber
      }

      const { error: studentError } = await supabase.from("students").insert(studentData)

      if (studentError) {
        console.error("Error creating student profile:", studentError)
        // Don't throw error here, we'll handle it in the assessment page
      }

      // Create default user settings
      try {
        await supabase.from("user_settings").insert({
          user_id: data.user.id,
        })
      } catch (settingsError) {
        console.log("Settings creation failed:", settingsError)
      }
    } else if (role === "health_professional") {
      const { error: professionalError } = await supabase.from("health_professionals").insert({
        user_id: data.user.id,
        is_approved: false,
      })

      if (professionalError) throw professionalError
    }
  }

  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser(): Promise<User | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single()

  return profile
}

// Helper function to ensure student profile exists
export async function ensureStudentProfile(userId: string) {
  const { data: student, error } = await supabase.from("students").select("id").eq("user_id", userId).single()

  if (error || !student) {
    // Create student profile if it doesn't exist
    const { data: newStudent, error: createError } = await supabase
      .from("students")
      .insert({
        user_id: userId,
      })
      .select("id")
      .single()

    if (createError) throw createError
    return newStudent
  }

  return student
}
