"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { TopNavLayout } from "@/components/layout/top-nav-layout"
import { getCurrentUser } from "@/lib/auth"
import { supabase } from "@/lib/supabase/client"
import type { User, Appointment } from "@/lib/types"
import { Calendar, UserIcon, MapPin, Plus, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

export default function AppointmentsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          router.push("/auth/login")
          return
        }
        setUser(currentUser)

        // Get appointments based on role
        if (currentUser.role === "student") {
          // Get student ID
          const { data: student } = await supabase.from("students").select("id").eq("user_id", currentUser.id).single()

          if (!student) throw new Error("Student profile not found")

          // Get student appointments
          const { data: appointmentData, error } = await supabase
            .from("appointments")
            .select(`
              *,
              health_professional:health_professionals(
                *,
                user:users(*)
              )
            `)
            .eq("student_id", student.id)
            .order("appointment_date", { ascending: true })

          if (error) throw error
          setAppointments(appointmentData || [])
        } else if (currentUser.role === "health_professional") {
          // Get professional ID
          const { data: professional } = await supabase
            .from("health_professionals")
            .select("id")
            .eq("user_id", currentUser.id)
            .single()

          if (!professional) throw new Error("Professional profile not found")

          // Get professional appointments
          const { data: appointmentData, error } = await supabase
            .from("appointments")
            .select(`
              *,
              student:students(
                *,
                user:users(*)
              )
            `)
            .eq("health_professional_id", professional.id)
            .order("appointment_date", { ascending: true })

          if (error) throw error
          setAppointments(appointmentData || [])
        }
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const updateAppointmentStatus = async (appointmentId: string, status: string) => {
    try {
      const { error } = await supabase.from("appointments").update({ status }).eq("id", appointmentId)

      if (error) throw error

      // Update local state
      setAppointments((prev) =>
        prev.map((appointment) => (appointment.id === appointmentId ? { ...appointment, status } : appointment)),
      )
    } catch (error) {
      console.error("Error updating appointment:", error)
      alert("Error updating appointment. Please try again.")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Calendar className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p>Loading appointments...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "approved":
        return "bg-green-100 text-green-800 border-green-200"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200"
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "cancelled":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  // Filter appointments by status
  const pendingAppointments = appointments.filter((a) => a.status === "pending")
  const upcomingAppointments = appointments.filter(
    (a) => a.status === "approved" && new Date(a.appointment_date) > new Date(),
  )
  const pastAppointments = appointments.filter(
    (a) => a.status === "completed" || (a.status === "approved" && new Date(a.appointment_date) <= new Date()),
  )
  const cancelledAppointments = appointments.filter((a) => a.status === "rejected" || a.status === "cancelled")

  return (
    <TopNavLayout user={user}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Appointments</h1>
              <p className="text-gray-600">
                {user.role === "student"
                  ? "Manage your appointments with health professionals"
                  : "Manage your appointments with students"}
              </p>
            </div>

            {user.role === "student" && (
              <Link href="/appointments/book">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Book Appointment
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Appointments Tabs */}
        <Tabs defaultValue="upcoming" className="mb-8">
          <TabsList className="mb-4">
            <TabsTrigger value="upcoming">
              Upcoming
              {upcomingAppointments.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {upcomingAppointments.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending
              {pendingAppointments.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {pendingAppointments.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>

          {/* Upcoming Appointments */}
          <TabsContent value="upcoming">
            {upcomingAppointments.length > 0 ? (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <Card key={appointment.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">
                              {format(new Date(appointment.appointment_date), "MMMM d, yyyy")}
                            </span>
                            <span className="text-gray-600">
                              {format(new Date(appointment.appointment_date), "h:mm a")}
                            </span>
                          </div>

                          {user.role === "student" && appointment.health_professional && (
                            <div className="flex items-center gap-2">
                              <UserIcon className="h-4 w-4 text-gray-500" />
                              <span>{appointment.health_professional.user?.full_name}</span>
                              <span className="text-gray-600">{appointment.health_professional.specialization}</span>
                            </div>
                          )}

                          {user.role === "health_professional" && appointment.student && (
                            <div className="flex items-center gap-2">
                              <UserIcon className="h-4 w-4 text-gray-500" />
                              <span>{appointment.student.user?.full_name}</span>
                            </div>
                          )}

                          {appointment.health_professional?.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-600">{appointment.health_professional.location}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(appointment.status)}>
                            {appointment.status.toUpperCase()}
                          </Badge>

                          {user.role === "student" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateAppointmentStatus(appointment.id, "cancelled")}
                            >
                              Cancel
                            </Button>
                          )}

                          {user.role === "health_professional" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateAppointmentStatus(appointment.id, "completed")}
                            >
                              Mark Completed
                            </Button>
                          )}
                        </div>
                      </div>

                      {appointment.notes && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm text-gray-600">{appointment.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming appointments</h3>
                {user.role === "student" && (
                  <div>
                    <p className="text-gray-500 mb-4">Schedule an appointment with a health professional</p>
                    <Link href="/appointments/book">
                      <Button>Book Appointment</Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Pending Appointments */}
          <TabsContent value="pending">
            {pendingAppointments.length > 0 ? (
              <div className="space-y-4">
                {pendingAppointments.map((appointment) => (
                  <Card key={appointment.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">
                              {format(new Date(appointment.appointment_date), "MMMM d, yyyy")}
                            </span>
                            <span className="text-gray-600">
                              {format(new Date(appointment.appointment_date), "h:mm a")}
                            </span>
                          </div>

                          {user.role === "student" && appointment.health_professional && (
                            <div className="flex items-center gap-2">
                              <UserIcon className="h-4 w-4 text-gray-500" />
                              <span>{appointment.health_professional.user?.full_name}</span>
                              <span className="text-gray-600">{appointment.health_professional.specialization}</span>
                            </div>
                          )}

                          {user.role === "health_professional" && appointment.student && (
                            <div className="flex items-center gap-2">
                              <UserIcon className="h-4 w-4 text-gray-500" />
                              <span>{appointment.student.user?.full_name}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(appointment.status)}>
                            {appointment.status.toUpperCase()}
                          </Badge>

                          {user.role === "student" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateAppointmentStatus(appointment.id, "cancelled")}
                            >
                              Cancel
                            </Button>
                          )}

                          {user.role === "health_professional" && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => updateAppointmentStatus(appointment.id, "approved")}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => updateAppointmentStatus(appointment.id, "rejected")}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {appointment.student_notes && (
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="text-sm font-medium mb-1">Student Notes:</h4>
                          <p className="text-sm text-gray-600">{appointment.student_notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No pending appointments</h3>
                <p className="text-gray-500">
                  {user.role === "student"
                    ? "You have no pending appointment requests"
                    : "You have no pending appointment requests to review"}
                </p>
              </div>
            )}
          </TabsContent>

          {/* Past Appointments */}
          <TabsContent value="past">
            {pastAppointments.length > 0 ? (
              <div className="space-y-4">
                {pastAppointments.map((appointment) => (
                  <Card key={appointment.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">
                              {format(new Date(appointment.appointment_date), "MMMM d, yyyy")}
                            </span>
                            <span className="text-gray-600">
                              {format(new Date(appointment.appointment_date), "h:mm a")}
                            </span>
                          </div>

                          {user.role === "student" && appointment.health_professional && (
                            <div className="flex items-center gap-2">
                              <UserIcon className="h-4 w-4 text-gray-500" />
                              <span>{appointment.health_professional.user?.full_name}</span>
                              <span className="text-gray-600">{appointment.health_professional.specialization}</span>
                            </div>
                          )}

                          {user.role === "health_professional" && appointment.student && (
                            <div className="flex items-center gap-2">
                              <UserIcon className="h-4 w-4 text-gray-500" />
                              <span>{appointment.student.user?.full_name}</span>
                            </div>
                          )}
                        </div>

                        <Badge className={getStatusColor(appointment.status)}>{appointment.status.toUpperCase()}</Badge>
                      </div>

                      {appointment.notes && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm text-gray-600">{appointment.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No past appointments</h3>
                <p className="text-gray-500">You have no past appointments</p>
              </div>
            )}
          </TabsContent>

          {/* Cancelled Appointments */}
          <TabsContent value="cancelled">
            {cancelledAppointments.length > 0 ? (
              <div className="space-y-4">
                {cancelledAppointments.map((appointment) => (
                  <Card key={appointment.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">
                              {format(new Date(appointment.appointment_date), "MMMM d, yyyy")}
                            </span>
                            <span className="text-gray-600">
                              {format(new Date(appointment.appointment_date), "h:mm a")}
                            </span>
                          </div>

                          {user.role === "student" && appointment.health_professional && (
                            <div className="flex items-center gap-2">
                              <UserIcon className="h-4 w-4 text-gray-500" />
                              <span>{appointment.health_professional.user?.full_name}</span>
                              <span className="text-gray-600">{appointment.health_professional.specialization}</span>
                            </div>
                          )}

                          {user.role === "health_professional" && appointment.student && (
                            <div className="flex items-center gap-2">
                              <UserIcon className="h-4 w-4 text-gray-500" />
                              <span>{appointment.student.user?.full_name}</span>
                            </div>
                          )}
                        </div>

                        <Badge className={getStatusColor(appointment.status)}>{appointment.status.toUpperCase()}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No cancelled appointments</h3>
                <p className="text-gray-500">You have no cancelled or rejected appointments</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </TopNavLayout>
  )
}
