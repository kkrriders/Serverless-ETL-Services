import Link from "next/link"
import { ArrowLeft, Clock, Database, FileText, Play, Pause, RefreshCcw, Trash2 } from "lucide-react"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PipelineStatusBadge } from "@/components/pipelines/pipeline-status-badge"
import { PipelineVisualization } from "@/components/pipelines/pipeline-visualization"

// This would come from an API in a real implementation
const getPipelineById = (id: string) => {
  const pipelines = {
    "1": {
      id: "1",
      name: "Product Data Enrichment",
      description: "Extract product data, enhance descriptions with AI, load to MongoDB",
      status: "active",
      lastRun: "2023-11-15T10:30:00Z",
      runs: 24,
      successRate: 98.5,
      extract: {
        source: "API",
        endpoint: "https://api.example.com/products",
        authType: "Bearer Token",
        format: "JSON",
      },
      transform: {
        steps: [
          { type: "Data Cleaning", description: "Remove duplicate products and fix formatting issues" },
          { type: "AI Enrichment", description: "Generate enhanced product descriptions using Mistral model" },
          { type: "Data Validation", description: "Ensure all required fields are present and valid" }
        ],
        enrichmentPrompt: "Generate a detailed and engaging product description for this item: {{item}}",
      },
      load: {
        destination: "MongoDB",
        connectionString: "mongodb://localhost:27017/products",
        collection: "enriched_products",
        strategy: "Upsert",
      },
      history: [
        { timestamp: "2023-11-15T10:30:00Z", status: "success", duration: "45s", recordsProcessed: 124 },
        { timestamp: "2023-11-14T10:30:00Z", status: "success", duration: "48s", recordsProcessed: 117 },
        { timestamp: "2023-11-13T10:30:00Z", status: "failed", duration: "23s", recordsProcessed: 0, error: "API Connection Timeout" },
        { timestamp: "2023-11-12T10:30:00Z", status: "success", duration: "44s", recordsProcessed: 130 },
      ]
    }
  };
  
  return pipelines[id as keyof typeof pipelines];
}

export default function PipelineDetailsPage({ params }: { params: { id: string } }) {
  const pipeline = getPipelineById(params.id);
  
  if (!pipeline) {
    return (
      <div className="flex min-h-screen flex-col">
        <DashboardHeader />
        <main className="flex-1 p-6">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center gap-4 mb-6">
              <Button variant="outline" size="sm" asChild>
                <Link href="/pipelines">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Pipelines
                </Link>
              </Button>
            </div>
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-lg font-medium">Pipeline not found</p>
                <p className="text-sm text-muted-foreground mb-4">The pipeline with ID {params.id} does not exist</p>
                <Button asChild>
                  <Link href="/pipelines">Return to Pipeline List</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

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
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" size="sm" asChild>
              <Link href="/pipelines">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Pipelines
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">{pipeline.name}</h1>
            <PipelineStatusBadge status={pipeline.status} />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Pipeline Overview</CardTitle>
                <CardDescription>{pipeline.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <PipelineVisualization />
                <div className="flex justify-end gap-2 mt-6">
                  {pipeline.status === "active" ? (
                    <Button variant="outline" className="flex items-center gap-2">
                      <Pause className="h-4 w-4" />
                      Pause Pipeline
                    </Button>
                  ) : (
                    <Button variant="outline" className="flex items-center gap-2">
                      <Play className="h-4 w-4" />
                      Start Pipeline
                    </Button>
                  )}
                  <Button className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    Run Now
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Pipeline Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium flex items-center gap-2">
                      <PipelineStatusBadge status={pipeline.status} />
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Run</p>
                    <p className="font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {formatDate(pipeline.lastRun)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Runs</p>
                    <p className="font-medium">{pipeline.runs}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Success Rate</p>
                    <p className="font-medium">{pipeline.successRate}%</p>
                  </div>
                  <div className="pt-4 border-t">
                    <Button variant="destructive" size="sm" className="w-full flex items-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      Delete Pipeline
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Tabs defaultValue="configuration">
            <TabsList className="mb-4">
              <TabsTrigger value="configuration">Configuration</TabsTrigger>
              <TabsTrigger value="history">Run History</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
            </TabsList>
            
            <TabsContent value="configuration">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle>Extract</CardTitle>
                      <CardDescription>Data source configuration</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Source Type</p>
                        <p className="font-medium">{pipeline.extract.source}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Endpoint</p>
                        <p className="font-medium">{pipeline.extract.endpoint}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Auth Type</p>
                        <p className="font-medium">{pipeline.extract.authType}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Format</p>
                        <p className="font-medium">{pipeline.extract.format}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center gap-2">
                    <RefreshCcw className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle>Transform</CardTitle>
                      <CardDescription>Data transformation steps</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {pipeline.transform.steps.map((step, index) => (
                        <div key={index}>
                          <p className="text-sm text-muted-foreground">{step.type}</p>
                          <p className="font-medium">{step.description}</p>
                        </div>
                      ))}
                      <div className="pt-4">
                        <p className="text-sm text-muted-foreground">AI Enrichment Prompt</p>
                        <p className="font-medium text-sm border p-2 rounded bg-muted">
                          {pipeline.transform.enrichmentPrompt}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center gap-2">
                    <Database className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle>Load</CardTitle>
                      <CardDescription>Data destination settings</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Destination</p>
                        <p className="font-medium">{pipeline.load.destination}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Connection String</p>
                        <p className="font-medium text-sm border p-2 rounded bg-muted">
                          {pipeline.load.connectionString}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Collection</p>
                        <p className="font-medium">{pipeline.load.collection}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Write Strategy</p>
                        <p className="font-medium">{pipeline.load.strategy}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Run History</CardTitle>
                  <CardDescription>Recent pipeline execution history</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="h-12 px-4 text-left font-medium">Timestamp</th>
                          <th className="h-12 px-4 text-left font-medium">Status</th>
                          <th className="h-12 px-4 text-left font-medium">Duration</th>
                          <th className="h-12 px-4 text-left font-medium">Records Processed</th>
                          <th className="h-12 px-4 text-left font-medium">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pipeline.history.map((run, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-4 align-middle">{formatDate(run.timestamp)}</td>
                            <td className="p-4 align-middle">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                run.status === "success" 
                                  ? "bg-green-100 text-green-800" 
                                  : "bg-red-100 text-red-800"
                              }`}>
                                {run.status}
                              </span>
                            </td>
                            <td className="p-4 align-middle">{run.duration}</td>
                            <td className="p-4 align-middle">{run.recordsProcessed}</td>
                            <td className="p-4 align-middle">
                              {run.error && (
                                <span className="text-red-500">{run.error}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="logs">
              <Card>
                <CardHeader>
                  <CardTitle>Pipeline Logs</CardTitle>
                  <CardDescription>Real-time logs from pipeline executions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-80 overflow-auto">
                    <p>[2023-11-15 10:30:00] INFO: Pipeline started - Product Data Enrichment</p>
                    <p>[2023-11-15 10:30:01] INFO: Extract phase started</p>
                    <p>[2023-11-15 10:30:05] INFO: Retrieved 124 records from API</p>
                    <p>[2023-11-15 10:30:05] INFO: Transform phase started</p>
                    <p>[2023-11-15 10:30:10] INFO: Cleaning data - removed 3 duplicate records</p>
                    <p>[2023-11-15 10:30:15] INFO: AI Enrichment started</p>
                    <p>[2023-11-15 10:30:25] INFO: Processed 50 records with AI</p>
                    <p>[2023-11-15 10:30:35] INFO: Processed 100 records with AI</p>
                    <p>[2023-11-15 10:30:40] INFO: AI Enrichment completed for 121 records</p>
                    <p>[2023-11-15 10:30:42] INFO: Data validation complete - all records valid</p>
                    <p>[2023-11-15 10:30:42] INFO: Load phase started</p>
                    <p>[2023-11-15 10:30:44] INFO: Connected to MongoDB</p>
                    <p>[2023-11-15 10:30:45] INFO: Loading data to collection: enriched_products</p>
                    <p>[2023-11-15 10:30:45] INFO: Upsert operation started</p>
                    <p>[2023-11-15 10:30:45] INFO: Inserted 98 records, updated 23 records</p>
                    <p>[2023-11-15 10:30:45] INFO: Pipeline execution completed successfully</p>
                    <p>[2023-11-15 10:30:45] INFO: Total duration: 45 seconds</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
} 