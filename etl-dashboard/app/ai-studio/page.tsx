import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { AIStudio } from "@/components/ai/ai-studio"

export default function AIStudioPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 p-6">
        <div className="mx-auto max-w-5xl">
          <h1 className="mb-6 text-2xl font-bold">AI Enrichment Studio</h1>
          <AIStudio />
        </div>
      </main>
    </div>
  )
}
