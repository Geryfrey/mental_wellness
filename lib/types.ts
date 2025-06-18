export interface User {
  id: string
  email: string
  full_name: string
  role: "student" | "health_professional" | "admin" | "super_admin"
  created_at: string
  updated_at: string
}

export interface Student {
  id: string
  user_id: string
  registration_number?: string
  student_id?: string
  date_of_birth?: string
  phone?: string
  emergency_contact?: string
  emergency_phone?: string
  user?: User
}

export interface HealthProfessional {
  id: string
  user_id: string
  license_number?: string
  specialization?: string
  phone?: string
  location?: string
  availability_hours?: any
  is_approved: boolean
  user?: User
}

export interface Assessment {
  id: string
  student_id: string
  responses: any
  predicted_conditions?: string[]
  predicted_risk_level?: "low" | "moderate" | "critical"
  predicted_sentiment?: "positive" | "negative" | "neutral"
  sentiment_score?: number
  sentiment_label?: "very_negative" | "negative" | "neutral" | "positive" | "very_positive"
  ai_analysis?: string
  recommendations?: string[]
  risk_level?: "low" | "moderate" | "high" | "critical"
  created_at: string
}

export interface Resource {
  id: string
  title: string
  description?: string
  content?: string
  resource_type: "article" | "video" | "audio" | "pdf" | "external_link"
  url?: string
  category?: string
  tags?: string[]
  is_featured: boolean
  created_by?: string
  created_at: string
}

export interface Appointment {
  id: string
  student_id: string
  health_professional_id: string
  assessment_id?: string
  appointment_date: string
  duration_minutes: number
  status: "pending" | "approved" | "rejected" | "completed" | "cancelled"
  notes?: string
  student_notes?: string
  professional_notes?: string
  created_at: string
  updated_at: string
  student?: Student
  health_professional?: HealthProfessional
}

export interface MentalHealthCenter {
  id: string
  name: string
  location: string
  phone?: string
  email?: string
  address?: string
  services?: string[]
  operating_hours?: any
  is_emergency: boolean
  is_active: boolean
  created_at: string
}

export interface JournalEntry {
  id: string
  student_id: string
  title?: string
  content: string
  mood?: string
  tags?: string[]
  is_private: boolean
  created_at: string
  updated_at: string
}

export interface UserSettings {
  id: string
  user_id: string
  notifications_enabled: boolean
  email_notifications: boolean
  reminder_frequency: string
  privacy_level: string
  theme: string
  language: string
  created_at: string
  updated_at: string
}

export interface Report {
  id: string
  title: string
  report_type: string
  period_type: "weekly" | "monthly" | "quarterly" | "yearly"
  start_date: string
  end_date: string
  data: any
  generated_by?: string
  created_at: string
}
