import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { PipelineOverview } from "@/components/dashboard/pipeline-overview"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { SystemHealth } from "@/components/dashboard/system-health"
import { SystemMetrics } from "@/components/dashboard/system-metrics"

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 space-y-6 p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <SystemHealth className="lg:col-span-2" />
          <SystemMetrics />
          <RecentActivity className="lg:col-span-1" />
        </div>
        <PipelineOverview />
      </main>
    </div>
  )
}
