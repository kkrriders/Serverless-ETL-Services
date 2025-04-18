import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { PipelineBuilder } from "@/components/pipelines/pipeline-builder"

export default function NewPipelinePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 p-6">
        <div className="mx-auto max-w-5xl">
          <h1 className="mb-6 text-2xl font-bold">Create New Pipeline</h1>
          <PipelineBuilder />
        </div>
      </main>
    </div>
  )
}
