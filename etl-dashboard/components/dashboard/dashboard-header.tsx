import Link from "next/link"
import { Bell, Settings, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-10 border-b bg-background">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <span className="text-sm font-bold text-primary-foreground">ETL</span>
            </div>
            <span className="text-lg font-semibold">DataFlow AI</span>
          </Link>
          <nav className="hidden md:flex">
            <ul className="flex items-center gap-4">
              <li>
                <Link href="/pipelines" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                  Pipelines
                </Link>
              </li>
              <li>
                <Link href="/sources" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                  Sources
                </Link>
              </li>
              <li>
                <Link
                  href="/transformations"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  Transformations
                </Link>
              </li>
              <li>
                <Link href="/destinations" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                  Destinations
                </Link>
              </li>
              <li>
                <Link href="/ai-studio" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                  AI Studio
                </Link>
              </li>
              <li>
                <Link href="/api-test" className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  API Test
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
            <span className="sr-only">Settings</span>
          </Button>
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
