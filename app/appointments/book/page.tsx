import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import AppointmentForm from "@/components/appointment-form"
import { TopNavLayout } from "@/components/layout/top-nav-layout"

const BookAppointmentPage = async () => {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  const { data: user } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

  if (!user) {
    redirect("/login")
  }

  return (
    <TopNavLayout user={user}>
      <div className="p-6">
        <AppointmentForm user={user} />
      </div>
    </TopNavLayout>
  )
}

export default BookAppointmentPage
