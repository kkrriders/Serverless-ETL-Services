import Link from "next/link"
import { ArrowRight, Database, FileJson, Plus, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PipelineStatusBadge } from "@/components/pipelines/pipeline-status-badge"
import { PipelineVisualization } from "@/components/pipelines/pipeline-visualization"

export function PipelineOverview() {
  const pipelines = [
    {
      id: "pipeline-1",
      name: "Customer Data Enrichment",
      description: "Enrich customer data with AI-generated insights",
      status: "active",
      lastRun: "10 minutes ago",
      source: "MongoDB",
      destination: "MongoDB",
      recordsProcessed: 1250,
      nextRun: "In 50 minutes",
    },
    {
      id: "pipeline-2",
      name: "Product Catalog Update",
      description: "Update product descriptions with AI enhancement",
      status: "failed",
      lastRun: "25 minutes ago",
      source: "API",
      destination: "MongoDB",
      recordsProcessed: 450,
      nextRun: "Manual trigger required",
    },
    {
      id: "pipeline-3",
      name: "Support Ticket Analysis",
      description: "Analyze and categorize support tickets",
      status: "completed",
      lastRun: "1 hour ago",
      source: "API",
      destination: "Blob Storage",
      recordsProcessed: 320,
      nextRun: "Tomorrow at 9:00 AM",
    },
  ]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Pipelines</CardTitle>
          <CardDescription>Your ETL pipelines and their current status</CardDescription>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Pipeline
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {pipelines.map((pipeline) => (
            <div key={pipeline.id} className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{pipeline.name}</h3>
                    <PipelineStatusBadge status={pipeline.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">{pipeline.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Run Now
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/pipelines/${pipeline.id}`}>
                      Details
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <PipelineVisualization pipeline={pipeline} />
              </div>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Source</p>
                  <div className="flex items-center gap-2">
                    {pipeline.source === "MongoDB" ? (
                      <Database className="h-4 w-4" />
                    ) : (
                      <FileJson className="h-4 w-4" />
                    )}
                    <p className="text-sm font-medium">{pipeline.source}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Destination</p>
                  <div className="flex items-center gap-2">
                    {pipeline.destination === "MongoDB" ? (
                      <Database className="h-4 w-4" />
                    ) : (
                      <FileJson className="h-4 w-4" />
                    )}
                    <p className="text-sm font-medium">{pipeline.destination}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Records Processed</p>
                  <p className="text-sm font-medium">{pipeline.recordsProcessed.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Next Run</p>
                  <p className="text-sm font-medium">{pipeline.nextRun}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
