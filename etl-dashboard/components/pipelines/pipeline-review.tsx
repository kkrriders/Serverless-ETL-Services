import { Database, FileJson, Wand2 } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PipelineReviewProps {
  config: any
}

export function PipelineReview({ config }: PipelineReviewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Pipeline Review</h2>
        <p className="text-sm text-muted-foreground">Review your pipeline configuration before saving</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Pipeline Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Name</dt>
                <dd>{config.name || "Untitled Pipeline"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Description</dt>
                <dd>{config.description || "No description provided"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="h-4 w-4" />
              Extract Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Source Type</dt>
                <dd className="capitalize">{config.extract.source.type}</dd>
              </div>
              {config.extract.source.type === "api" && (
                <>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">URL</dt>
                    <dd className="break-all">{config.extract.source.url || "Not specified"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Method</dt>
                    <dd>{config.extract.source.method || "GET"}</dd>
                  </div>
                </>
              )}
              {config.extract.source.type === "mongodb" && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Collection</dt>
                  <dd>{config.extract.source.collection || "Not specified"}</dd>
                </div>
              )}
              {config.extract.source.type === "blob" && (
                <>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Container</dt>
                    <dd>{config.extract.source.container || "Not specified"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Blob Name</dt>
                    <dd>{config.extract.source.blobName || "Not specified"}</dd>
                  </div>
                </>
              )}
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Batch Size</dt>
                <dd>{config.extract.options?.batchSize || 100}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wand2 className="h-4 w-4" />
              Transform Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Clean</dt>
                <dd className="space-y-1 pt-1">
                  <div className="text-xs">
                    Remove Empty Fields: {config.transform.transformations.clean.removeEmpty ? "Yes" : "No"}
                  </div>
                  <div className="text-xs">
                    Text Fields:{" "}
                    {config.transform.transformations.clean.textFields.length > 0
                      ? config.transform.transformations.clean.textFields.join(", ")
                      : "None"}
                  </div>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Validate</dt>
                <dd className="space-y-1 pt-1">
                  <div className="text-xs">
                    Schema:{" "}
                    {Object.keys(config.transform.transformations.validate.schema || {}).length > 0
                      ? `${Object.keys(config.transform.transformations.validate.schema).length} fields defined`
                      : "No schema defined"}
                  </div>
                  <div className="text-xs">
                    Abort Early: {config.transform.transformations.validate.abortEarly ? "Yes" : "No"}
                  </div>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">AI Enrich</dt>
                <dd className="space-y-1 pt-1">
                  <div className="text-xs">
                    Instruction:{" "}
                    {config.transform.transformations.enrich.instruction
                      ? `${config.transform.transformations.enrich.instruction.substring(0, 50)}${
                          config.transform.transformations.enrich.instruction.length > 50 ? "..." : ""
                        }`
                      : "Not specified"}
                  </div>
                  <div className="text-xs">
                    Fields:{" "}
                    {config.transform.transformations.enrich.fields.length > 0
                      ? config.transform.transformations.enrich.fields.join(", ")
                      : "None"}
                  </div>
                  <div className="text-xs">
                    Temperature: {config.transform.transformations.enrich.modelOptions?.temperature || 0.7}
                  </div>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileJson className="h-4 w-4" />
              Load Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Destination Type</dt>
                <dd className="capitalize">{config.load.destination.type}</dd>
              </div>
              {config.load.destination.type === "mongodb" && (
                <>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Collection</dt>
                    <dd>{config.load.destination.collection || "Not specified"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Upsert</dt>
                    <dd>{config.load.destination.upsert ? "Yes" : "No"}</dd>
                  </div>
                  {config.load.destination.upsert && (
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Upsert Key</dt>
                      <dd>{config.load.destination.upsertKey || "Not specified"}</dd>
                    </div>
                  )}
                </>
              )}
              {config.load.destination.type === "blob" && (
                <>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Container</dt>
                    <dd>{config.load.destination.container || "Not specified"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Blob Name Pattern</dt>
                    <dd>{config.load.destination.blobName || "Not specified"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Format</dt>
                    <dd className="uppercase">{config.load.destination.format || "JSON"}</dd>
                  </div>
                </>
              )}
            </dl>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border bg-muted p-4">
        <h3 className="mb-2 font-medium">Pipeline Flow</h3>
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border bg-background">
              {config.extract.source.type === "mongodb" ? (
                <Database className="h-6 w-6 text-blue-500" />
              ) : config.extract.source.type === "api" ? (
                <FileJson className="h-6 w-6 text-green-500" />
              ) : (
                <FileJson className="h-6 w-6 text-amber-500" />
              )}
            </div>
            <span className="text-sm font-medium">Extract</span>
            <span className="text-xs text-muted-foreground capitalize">{config.extract.source.type}</span>
          </div>
          <div className="h-0.5 w-16 bg-muted-foreground"></div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border bg-background">
              <Wand2 className="h-6 w-6 text-purple-500" />
            </div>
            <span className="text-sm font-medium">Transform</span>
            <span className="text-xs text-muted-foreground">
              {
                Object.keys(config.transform.transformations).filter(
                  (key) =>
                    (key === "clean" && config.transform.transformations.clean.removeEmpty) ||
                    (key === "validate" &&
                      Object.keys(config.transform.transformations.validate.schema || {}).length > 0) ||
                    (key === "enrich" && config.transform.transformations.enrich.instruction),
                ).length
              }{" "}
              operations
            </span>
          </div>
          <div className="h-0.5 w-16 bg-muted-foreground"></div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border bg-background">
              {config.load.destination.type === "mongodb" ? (
                <Database className="h-6 w-6 text-blue-500" />
              ) : (
                <FileJson className="h-6 w-6 text-amber-500" />
              )}
            </div>
            <span className="text-sm font-medium">Load</span>
            <span className="text-xs text-muted-foreground capitalize">{config.load.destination.type}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
