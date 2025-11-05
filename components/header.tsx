"use client"

import { signOut } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BookOpen, LogOut, Shield } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface HeaderProps {
  user: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
    is_admin: boolean
  }
}

const ADMIN_KEY = "$#GS29gs1"

export function Header({ user }: HeaderProps) {
  const [showAdminDialog, setShowAdminDialog] = useState(false)
  const [adminKeyInput, setAdminKeyInput] = useState("")
  const [keyError, setKeyError] = useState("")
  const router = useRouter()

  const initials =
    user.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || user.email[0].toUpperCase()

  const handleAdminAccess = () => {
    if (adminKeyInput === ADMIN_KEY) {
      setShowAdminDialog(false)
      setAdminKeyInput("")
      setKeyError("")
      router.push("/admin")
    } else {
      setKeyError("Incorrect admin key")
    }
  }

  return (
    <>
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-6xl">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Homework Helper</h1>
          </Link>

          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => setShowAdminDialog(true)}>
              <Shield className="w-4 h-4 mr-2" />
              Admin
            </Button>

            <Link href="/post/new">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                Ask for Help
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarImage src={user.avatar_url || undefined} alt={user.full_name || user.email} />
                    <AvatarFallback className="bg-indigo-100 text-indigo-700">{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.full_name || "Student"}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <form action={signOut}>
                  <DropdownMenuItem asChild>
                    <button type="submit" className="w-full cursor-pointer">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign out
                    </button>
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin Access Required</DialogTitle>
            <DialogDescription>Enter the admin key to access the admin panel.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="adminKey">Admin Key</Label>
              <Input
                id="adminKey"
                type="password"
                placeholder="Enter admin key"
                value={adminKeyInput}
                onChange={(e) => {
                  setAdminKeyInput(e.target.value)
                  setKeyError("")
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAdminAccess()
                  }
                }}
              />
              {keyError && <p className="text-sm text-red-500">{keyError}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdminDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdminAccess}>Access Admin Panel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
