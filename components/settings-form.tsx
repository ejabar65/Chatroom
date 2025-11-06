"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateUserPreferences } from "@/lib/actions/settings"
import { useRouter } from "next/navigation"

export function SettingsForm({ user, preferences }: { user: any; preferences: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [darkMode, setDarkMode] = useState(preferences?.dark_mode ?? false)
  const [layout, setLayout] = useState(preferences?.layout ?? "card")
  const [displayName, setDisplayName] = useState(user.full_name || "")

  const handleSave = async () => {
    setLoading(true)
    const formData = new FormData()
    formData.append("darkMode", darkMode.toString())
    formData.append("layout", layout)
    formData.append("displayName", displayName)

    await updateUserPreferences(formData)

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

      {/* Profile */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Profile</h2>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="display-name">Display Name</Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user.email} disabled />
            <p className="text-sm text-muted-foreground">Email cannot be changed</p>
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
