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
import { BookOpenIcon, LogOutIcon, ShieldIcon, SettingsIcon, GridIcon } from "@/components/icons"
import Link from "next/link"

interface HeaderProps {
  user: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
    is_admin: boolean
  }
}

export function Header({ user }: HeaderProps) {
  const initials =
    user.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || user.email[0].toUpperCase()

  return (
    <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-7xl">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <BookOpenIcon className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Homework Helper</h1>
          </Link>

          <Link href="/communities">
            <Button variant="ghost" size="sm">
              <GridIcon className="w-4 h-4 mr-2" />
              Boards
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {user.is_admin && (
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <ShieldIcon className="w-4 h-4 mr-2" />
                Admin
              </Button>
            </Link>
          )}

          <Link href="/post/new">
            <Button size="sm" className="bg-primary hover:bg-primary/90">
              Ask for Help
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar>
                  <AvatarImage src={user.avatar_url || undefined} alt={user.full_name || user.email} />
                  <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
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
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <SettingsIcon className="w-4 h-4 mr-2" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <form action={signOut}>
                <DropdownMenuItem asChild>
                  <button type="submit" className="w-full cursor-pointer">
                    <LogOutIcon className="w-4 h-4 mr-2" />
                    Sign out
                  </button>
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
