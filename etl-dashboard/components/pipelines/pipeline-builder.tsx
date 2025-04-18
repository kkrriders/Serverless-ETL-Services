"use client"

import { useState } from "react"
import { ArrowLeft, ArrowRight, Check, Database, FileJson, Play, Save, Wand2, Loader2, CheckCircle, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ExtractConfig } from "@/components/pipelines/extract-config"
import { TransformConfig } from "@/components/pipelines/transform-config"
import { LoadConfig } from "@/components/pipelines/load-config"
import { PipelineReview } from "@/components/pipelines/pipeline-review"
import { orchestrateEtl } from "@/lib/apiClient"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function PipelineBuilder() {
  const [activeTab, setActiveTab] = useState("extract")
  const [isRunning, setIsRunning] = useState(false)
  const [runResult, setRunResult] = useState<any>(null)
  const [runError, setRunError] = useState<string | null>(null)
  
  const [pipelineConfig, setPipelineConfig] = useState({
    name: "",
    description: "",
    extract: {
      source: {
        type: "api",
        url: "",
        method: "GET",
        headers: {},
      },
      options: {
        saveToDb: false,
        batchSize: 100,
      },
    },
    transform: {
      transformations: {
        clean: {
          removeEmpty: true,
          textFields: [],
          textOptions: {
            trim: true,
            lowercase: false,
          },
        },
        validate: {
          schema: {},
          abortEarly: false,
        },
        enrich: {
          instruction: "",
          fields: [],
          modelOptions: {
            temperature: 0.7,
            maxTokens: 1000,
          },
        },
      },
    },
    load: {
      destination: {
        type: "mongodb",
        collection: "",
        upsert: false,
        upsertKey: "",
      },
    },
  })

  const handleNext = () => {
    if (activeTab === "extract") setActiveTab("transform")
    else if (activeTab === "transform") setActiveTab("load")
    else if (activeTab === "load") setActiveTab("review")
  }

  const handleBack = () => {
    if (activeTab === "transform") setActiveTab("extract")
    else if (activeTab === "load") setActiveTab("transform")
    else if (activeTab === "review") setActiveTab("load")
  }

  const updateConfig = (section: string, data: any) => {
    setPipelineConfig((prev) => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        ...data,
      },
    }))
  }
  
  const handleRunPipeline = async () => {
    setIsRunning(true)
    setRunResult(null)
    setRunError(null)
    
    try {
      // Map the pipelineConfig to the format expected by the backend
      const payload = {
        source: pipelineConfig.extract.source,
        transformations: pipelineConfig.transform.transformations,
        destination: pipelineConfig.load.destination,
        options: {
          ...pipelineConfig.extract.options,
          pipelineName: pipelineConfig.name || "Untitled Pipeline",
          pipelineDescription: pipelineConfig.description || "",
        }
      }
      
      // Call the backend API
      const result = await orchestrateEtl(payload)
      setRunResult(result)
    } catch (error: any) {
      setRunError(error.message || "An error occurred while running the pipeline")
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="extract" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Extract
            </TabsTrigger>
            <TabsTrigger value="transform" className="flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              Transform
            </TabsTrigger>
            <TabsTrigger value="load" className="flex items-center gap-2">
              <FileJson className="h-4 w-4" />
              Load
            </TabsTrigger>
            <TabsTrigger value="review" className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              Review
            </TabsTrigger>
          </TabsList>

          <TabsContent value="extract" className="space-y-6">
            <ExtractConfig config={pipelineConfig.extract} onChange={(data) => updateConfig("extract", data)} />
          </TabsContent>

          <TabsContent value="transform" className="space-y-6">
            <TransformConfig config={pipelineConfig.transform} onChange={(data) => updateConfig("transform", data)} />
          </TabsContent>

          <TabsContent value="load" className="space-y-6">
            <LoadConfig config={pipelineConfig.load} onChange={(data) => updateConfig("load", data)} />
          </TabsContent>

          <TabsContent value="review" className="space-y-6">
            <PipelineReview config={pipelineConfig} />
            
            {/* Pipeline Run Results */}
            {(runResult || runError) && (
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-medium">Pipeline Execution {runResult ? "Results" : "Error"}</h3>
                
                {runError && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{runError}</AlertDescription>
                  </Alert>
                )}
                
                {runResult && (
                  <div className="rounded-md border p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="font-medium">Pipeline executed successfully</span>
                    </div>
                    
                    <div className="mt-4 space-y-4">
                      {runResult.extractResult && (
                        <div>
                          <h4 className="text-sm font-medium">Extract Result</h4>
                          <p className="text-sm text-muted-foreground">
                            {runResult.extractResult.success 
                              ? `Successfully extracted data (${Object.keys(runResult.extractResult.data || {}).length} records)` 
                              : `Extract failed: ${runResult.extractResult.error}`}
                          </p>
                        </div>
                      )}
                      
                      {runResult.transformResult && (
                        <div>
                          <h4 className="text-sm font-medium">Transform Result</h4>
                          <p className="text-sm text-muted-foreground">
                            {runResult.transformResult.success 
                              ? `Successfully transformed data (${Object.keys(runResult.transformations || {}).length} operations applied)` 
                              : `Transform failed: ${runResult.transformResult.error}`}
                          </p>
                        </div>
                      )}
                      
                      {runResult.loadResult && (
                        <div>
                          <h4 className="text-sm font-medium">Load Result</h4>
                          <p className="text-sm text-muted-foreground">
                            {runResult.loadResult.success 
                              ? `Successfully loaded data to ${runResult.loadResult.destination}` 
                              : `Load failed: ${runResult.loadResult.error}`}
                          </p>
                        </div>
                      )}
                      
                      {runResult.recordId && (
                        <div>
                          <h4 className="text-sm font-medium">Record ID</h4>
                          <p className="text-sm font-mono">{runResult.recordId}</p>
                        </div>
                      )}
                      
                      <div>
                        <Button 
                          variant="outline" 
                          onClick={() => window.navigator.clipboard.writeText(JSON.stringify(runResult, null, 2))}
                          className="text-xs"
                        >
                          Copy Full Result
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={activeTab === "extract"}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex gap-2">
              {activeTab === "review" ? (
                <>
                  <Button 
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save Pipeline
                  </Button>
                  <Button 
                    onClick={handleRunPipeline} 
                    disabled={isRunning}
                    className="flex items-center gap-2"
                  >
                    {isRunning ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Run Pipeline
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <Button onClick={handleNext} className="flex items-center gap-2">
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}
