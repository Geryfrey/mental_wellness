"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase/client"
import { getCurrentUser } from "@/lib/auth"
import { CalendarIcon, Clock, User, MapPin, Phone, Mail } from "lucide-react"
import { format } from "date-fns"

interface HealthProfessional {
  id: string
  user_id: string
  license_number?: string
  specialization?: string
  phone?: string
  location?: string
  is_approved: boolean
  user?: {
    id: string
    full_name: string
    email: string
  }
}

interface AppointmentFormProps {
  user?: any
}

export default function AppointmentForm({ user }: AppointmentFormProps) {
  const [healthProfessionals, setHealthProfessionals] = useState<HealthProfessional[]>([])
  const [selectedProfessional, setSelectedProfessional] = useState<string>("")
  const [appointmentDate, setAppointmentDate] = useState<Date>()
  const [timeSlot, setTimeSlot] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [studentId, setStudentId] = useState<string>("")
  const router = useRouter()

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get current user
        const userData = await getCurrentUser()
        if (!userData) {
          router.push("/auth/login")
          return
        }
        setCurrentUser(userData)

        // Get student profile
        const { data: student, error: studentError } = await supabase
          .from("students")
          .select("id")
          .eq("user_id", userData.id)
          .single()

        if (studentError || !student) {
          setError("Student profile not found. Please complete your profile first.")
          return
        }
        setStudentId(student.id)

        // Load health professionals
        const { data: professionals, error: profError } = await supabase
          .from("health_professionals")
          .select(`
            id,
            user_id,
            license_number,
            specialization,
            phone,
            location,
            is_approved,
            users!health_professionals_user_id_fkey(id, full_name, email)
          `)
          .eq("is_approved", true)

        if (profError) {
          console.error("Error loading professionals:", profError)
          setError("Failed to load health professionals")
        } else {
          // Transform the data to match our interface
          const transformedProfessionals = (professionals || []).map(prof => ({
            ...prof,
            user: Array.isArray(prof.users) ? prof.users[0] : prof.users
          }))
          setHealthProfessionals(transformedProfessionals)
        }
      } catch (err) {
        console.error("Error loading data:", err)
        setError("Failed to load appointment booking data")
      }
    }

    loadData()
  }, [router])

  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30"
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      if (!selectedProfessional || !appointmentDate || !timeSlot) {
        throw new Error("Please fill in all required fields")
      }

      if (!studentId) {
        throw new Error("Student profile not found")
      }

      // Combine date and time
      const [hours, minutes] = timeSlot.split(":").map(Number)
      const appointmentDateTime = new Date(appointmentDate)
      appointmentDateTime.setHours(hours, minutes, 0, 0)

      // Check if the appointment time is in the future
      if (appointmentDateTime <= new Date()) {
        throw new Error("Please select a future date and time")
      }

      const appointmentData = {
        student_id: studentId,
        health_professional_id: selectedProfessional,
        appointment_date: appointmentDateTime.toISOString(),
        duration_minutes: 60,
        status: "pending",
        student_notes: notes || null,
      }

      const { data, error: insertError } = await supabase
        .from("appointments")
        .insert(appointmentData)
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      setSuccess("Appointment request submitted successfully! You will receive a confirmation once approved.")
      
      // Reset form
      setSelectedProfessional("")
      setAppointmentDate(undefined)
      setTimeSlot("")
      setNotes("")

      // Redirect to appointments page after a delay
      setTimeout(() => {
        router.push("/appointments")
      }, 2000)

    } catch (err: any) {
      console.error("Error booking appointment:", err)
      setError(err.message || "Failed to book appointment. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Book an Appointment</h1>
        <p className="text-gray-600">Schedule a session with one of our approved mental health professionals</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health Professionals List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Available Health Professionals</CardTitle>
              <CardDescription>Select a mental health professional for your appointment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {healthProfessionals.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No approved health professionals available at the moment.</p>
              ) : (
                <div className="space-y-3">
                  {healthProfessionals.map((professional) => (
                    <div
                      key={professional.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedProfessional === professional.id
                          ? "border-purple-300 bg-purple-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedProfessional(professional.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <h3 className="font-semibold text-gray-900">
                              {professional.user?.full_name || "Unknown"}
                            </h3>
                          </div>
                          
                          {professional.specialization && (
                            <Badge variant="secondary" className="mb-2">
                              {professional.specialization}
                            </Badge>
                          )}

                          <div className="space-y-1 text-sm text-gray-600">
                            {professional.user?.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3" />
                                {professional.user.email}
                              </div>
                            )}
                            {professional.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3" />
                                {professional.phone}
                              </div>
                            )}
                            {professional.location && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3 w-3" />
                                {professional.location}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Booking Form */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Schedule Appointment</CardTitle>
              <CardDescription>Choose your preferred date and time</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        disabled={!selectedProfessional}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {appointmentDate ? format(appointmentDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={appointmentDate}
                        onSelect={setAppointmentDate}
                        disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Time</Label>
                  <Select value={timeSlot} onValueChange={setTimeSlot} disabled={!appointmentDate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((slot) => (
                        <SelectItem key={slot} value={slot}>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            {slot}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any specific concerns or topics you'd like to discuss..."
                    rows={3}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={loading || !selectedProfessional || !appointmentDate || !timeSlot}
                >
                  {loading ? "Booking..." : "Book Appointment"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
