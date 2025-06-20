"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { TopNavLayout } from "@/components/layout/top-nav-layout"
import { getCurrentUser } from "@/lib/auth"
import type { User } from "@/lib/types"
import { SettingsIcon, Bell, Shield, Palette } from "lucide-react"

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState({
    emailNotifications: true,
    assessmentReminders: true,
    weeklyReports: false,
    emergencyAlerts: true,
    autoSaveJournal: true,
    shareDataForResearch: false,
    anonymousAnalytics: true,
    theme: "light",
    language: "english",
    reminderFrequency: "weekly",
    dataRetention: "1year",
  })
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          router.push("/auth/login")
          return
        }
        setUser(currentUser)
      } catch (error) {
        console.error("Auth error:", error)
        router.push("/auth/login")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const handleSettingChange = (key: string, value: boolean | string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <SettingsIcon className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p>Loading settings...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <TopNavLayout user={user}>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <SettingsIcon className="h-8 w-8" />
            Account Settings
          </h1>
          <p className="text-gray-600">Manage your account preferences and privacy settings</p>
        </div>

        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Profile Information</CardTitle>
            <CardDescription>Update your personal information and account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" defaultValue={user.full_name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" defaultValue={user.email} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="registration">Registration Number</Label>
              <Input id="registration" defaultValue="220014748" disabled />
              <p className="text-sm text-gray-500">Registration number cannot be changed</p>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-semibold">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>Choose what notifications you want to receive</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Email Notifications</h3>
                <p className="text-sm text-gray-600">Receive updates via email</p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => handleSettingChange("emailNotifications", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Assessment Reminders</h3>
                <p className="text-sm text-gray-600">Get reminded to take regular assessments</p>
              </div>
              <Switch
                checked={settings.assessmentReminders}
                onCheckedChange={(checked) => handleSettingChange("assessmentReminders", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Weekly Reports</h3>
                <p className="text-sm text-gray-600">Receive weekly wellness summaries</p>
              </div>
              <Switch
                checked={settings.weeklyReports}
                onCheckedChange={(checked) => handleSettingChange("weeklyReports", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">Emergency Alerts</h3>
                  <Badge variant="destructive" className="text-xs">
                    Required
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">Critical mental health notifications</p>
              </div>
              <Switch checked={settings.emergencyAlerts} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminderFrequency">Reminder Frequency</Label>
              <Select
                value={settings.reminderFrequency}
                onValueChange={(value) => handleSettingChange("reminderFrequency", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-semibold">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>Customize the look and feel of your dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select value={settings.theme} onValueChange={(value) => handleSettingChange("theme", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={settings.language} onValueChange={(value) => handleSettingChange("language", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="spanish">Spanish</SelectItem>
                  <SelectItem value="french">French</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Assessment Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Assessment Preferences</CardTitle>
            <CardDescription>Configure your assessment and journal settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Auto-save Journal Entries</h3>
                <p className="text-sm text-gray-600">Automatically save drafts while writing</p>
              </div>
              <Switch
                checked={settings.autoSaveJournal}
                onCheckedChange={(checked) => handleSettingChange("autoSaveJournal", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-semibold">
              <Shield className="h-5 w-5" />
              Privacy & Data
            </CardTitle>
            <CardDescription>Control how your data is used and shared</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Share Data for Research</h3>
                <p className="text-sm text-gray-600">Help improve mental health services (anonymized)</p>
              </div>
              <Switch
                checked={settings.shareDataForResearch}
                onCheckedChange={(checked) => handleSettingChange("shareDataForResearch", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Anonymous Analytics</h3>
                <p className="text-sm text-gray-600">Help us improve the app experience</p>
              </div>
              <Switch
                checked={settings.anonymousAnalytics}
                onCheckedChange={(checked) => handleSettingChange("anonymousAnalytics", checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataRetention">Data Retention Period</Label>
              <Select
                value={settings.dataRetention}
                onValueChange={(value) => handleSettingChange("dataRetention", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6months">6 Months</SelectItem>
                  <SelectItem value="1year">1 Year</SelectItem>
                  <SelectItem value="2years">2 Years</SelectItem>
                  <SelectItem value="indefinite">Indefinite</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-600">How long to keep your assessment and journal data</p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button className="bg-purple-600 hover:bg-purple-700">Save Changes</Button>
        </div>
      </div>
    </TopNavLayout>
  )
}
