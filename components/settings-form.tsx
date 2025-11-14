"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateUserPreferences, updateUserProfile } from "@/lib/actions/settings"
import { useRouter } from 'next/navigation'

export function SettingsForm({ user, preferences }: { user: any; preferences: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [darkMode, setDarkMode] = useState(preferences?.dark_mode ?? false)
  const [layout, setLayout] = useState(preferences?.layout ?? "card")
  const [fullName, setFullName] = useState(user?.full_name || "")
  const [bio, setBio] = useState(user?.bio || "")

  const handleSave = async () => {
    setLoading(true)

    const prefsFormData = new FormData()
    prefsFormData.append("darkMode", darkMode.toString())
    prefsFormData.append("layout", layout)

    const profileFormData = new FormData()
    profileFormData.append("fullName", fullName)
    profileFormData.append("bio", bio)

    await Promise.all([updateUserPreferences(prefsFormData), updateUserProfile(profileFormData)])

    // Apply dark mode immediately
    if (darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }

    setLoading(false)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Profile</h2>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full-name">Display Name</Label>
            <Input
              id="full-name"
              placeholder="Enter your display name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={100}
            />
            <p className="text-sm text-muted-foreground">This is how your name will appear to other users</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
              rows={4}
              className="resize-none"
            />
            <p className="text-sm text-muted-foreground">
              {bio.length}/500 characters - Describe yourself, your interests, or what you're studying
            </p>
          </div>
        </div>
      </Card>

      {/* Appearance */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Appearance</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="dark-mode">Dark Mode</Label>
              <p className="text-sm text-muted-foreground">Switch between light and dark themes</p>
            </div>
            <Switch id="dark-mode" checked={darkMode} onCheckedChange={setDarkMode} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="layout">Feed Layout</Label>
            <Select value={layout} onValueChange={setLayout}>
              <SelectTrigger id="layout">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="card">Card View</SelectItem>
                <SelectItem value="list">List View</SelectItem>
                <SelectItem value="compact">Compact View</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">Choose how posts are displayed in your feed</p>
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <Button onClick={handleSave} disabled={loading} className="w-full">
        {loading ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  )
}
