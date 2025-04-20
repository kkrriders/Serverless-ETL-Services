import Link from "next/link"
import { PlusCircle, RefreshCcw } from "lucide-react"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PipelineStatusBadge } from "@/components/pipelines/pipeline-status-badge"

// This would come from an API in a real implementation
const pipelines = [
  {
    id: "1",
    name: "Product Data Enrichment",
    description: "Extract product data, enhance descriptions with AI, load to MongoDB",
    status: "active",
    lastRun: "2023-11-15T10:30:00Z",
    runs: 24,
    successRate: 98.5,
  },
  {
    id: "2",
    name: "Customer Feedback Analysis",
    description: "Extract feedback from survey responses, analyze sentiment, categorize issues",
    status: "failed",
    lastRun: "2023-11-14T14:45:00Z",
    runs: 18,
    successRate: 72.2,
  },
  {
    id: "3",
    name: "Market News Summarization",
    description: "Extract news articles, generate concise summaries, load to database",
    status: "paused",
    lastRun: "2023-11-10T09:15:00Z",
    runs: 45,
    successRate: 93.3,
  }
]

export default function PipelinesPage() {
  // Format date to be more readable
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Pipelines</h1>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </Button>
              <Button size="sm" asChild className="flex items-center gap-2">
                <Link href="/pipelines/new">
                  <PlusCircle className="h-4 w-4" />
                  New Pipeline
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pipelines.map((pipeline) => (
              <Link href={`/pipelines/${pipeline.id}`} key={pipeline.id}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader className="flex flex-row items-start justify-between pb-2">
                    <div>
                      <CardTitle>{pipeline.name}</CardTitle>
                      <CardDescription className="mt-1">{pipeline.description}</CardDescription>
                    </div>
                    <PipelineStatusBadge status={pipeline.status} />
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Last Run</p>
                        <p className="font-medium">{formatDate(pipeline.lastRun)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Runs</p>
                        <p className="font-medium">{pipeline.runs}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Success Rate</p>
                        <p className="font-medium">{pipeline.successRate}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}

            <Link href="/pipelines/new">
              <Card className="h-full border-dashed hover:border-solid hover:shadow-md transition-all flex items-center justify-center">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <PlusCircle className="h-10 w-10 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Create New Pipeline</p>
                  <p className="text-sm text-muted-foreground">Set up extraction, transformation and loading</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
} 