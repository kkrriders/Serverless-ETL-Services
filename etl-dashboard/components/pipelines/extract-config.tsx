"use client"

import { useState } from "react"
import { Database, FileJson, Globe } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

interface ExtractConfigProps {
  config: any
  onChange: (config: any) => void
}

export function ExtractConfig({ config, onChange }: ExtractConfigProps) {
  const [sourceType, setSourceType] = useState(config.source.type || "api")

  const handleSourceTypeChange = (value: string) => {
    setSourceType(value)
    onChange({
      source: {
        ...config.source,
        type: value,
      },
    })
  }

  const handleSourceChange = (key: string, value: any) => {
    onChange({
      source: {
        ...config.source,
        [key]: value,
      },
    })
  }

  const handleOptionsChange = (key: string, value: any) => {
    onChange({
      options: {
        ...config.options,
        [key]: value,
      },
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Pipeline Information</h2>
        <p className="text-sm text-muted-foreground">Enter basic information about your pipeline</p>
        <div className="mt-4 grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="pipeline-name">Pipeline Name</Label>
            <Input
              id="pipeline-name"
              placeholder="Customer Data Enrichment"
              value={config.name}
              onChange={(e) => onChange({ name: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pipeline-description">Description</Label>
            <Textarea
              id="pipeline-description"
              placeholder="Describe the purpose of this pipeline"
              value={config.description}
              onChange={(e) => onChange({ description: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium">Data Source</h2>
        <p className="text-sm text-muted-foreground">Configure where your data will be extracted from</p>
        <div className="mt-4">
          <RadioGroup value={sourceType} onValueChange={handleSourceTypeChange} className="grid grid-cols-3 gap-4">
            <Card className={`cursor-pointer ${sourceType === "api" ? "border-primary" : ""}`}>
              <CardContent className="flex flex-col items-center justify-center p-4">
                <RadioGroupItem value="api" id="api" className="sr-only" />
                <Globe className="mb-2 h-6 w-6 text-primary" />
                <Label htmlFor="api" className="cursor-pointer">
                  API
                </Label>
              </CardContent>
            </Card>
            <Card className={`cursor-pointer ${sourceType === "mongodb" ? "border-primary" : ""}`}>
              <CardContent className="flex flex-col items-center justify-center p-4">
                <RadioGroupItem value="mongodb" id="mongodb" className="sr-only" />
                <Database className="mb-2 h-6 w-6 text-primary" />
                <Label htmlFor="mongodb" className="cursor-pointer">
                  MongoDB
                </Label>
              </CardContent>
            </Card>
            <Card className={`cursor-pointer ${sourceType === "blob" ? "border-primary" : ""}`}>
              <CardContent className="flex flex-col items-center justify-center p-4">
                <RadioGroupItem value="blob" id="blob" className="sr-only" />
                <FileJson className="mb-2 h-6 w-6 text-primary" />
                <Label htmlFor="blob" className="cursor-pointer">
                  Blob Storage
                </Label>
              </CardContent>
            </Card>
          </RadioGroup>
        </div>

        <div className="mt-6">
          <Tabs defaultValue={sourceType} value={sourceType} className="w-full">
            <TabsContent value="api" className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="api-url">API URL</Label>
                <Input
                  id="api-url"
                  placeholder="https://api.example.com/data"
                  value={config.source.url || ""}
                  onChange={(e) => handleSourceChange("url", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="api-method">Method</Label>
                <Select
                  value={config.source.method || "GET"}
                  onValueChange={(value) => handleSourceChange("method", value)}
                >
                  <SelectTrigger id="api-method">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="api-headers">Headers (JSON)</Label>
                <Textarea
                  id="api-headers"
                  placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                  value={config.source.headers ? JSON.stringify(config.source.headers, null, 2) : ""}
                  onChange={(e) => {
                    try {
                      const headers = JSON.parse(e.target.value)
                      handleSourceChange("headers", headers)
                    } catch (error) {
                      // Handle invalid JSON
                    }
                  }}
                />
              </div>
            </TabsContent>

            <TabsContent value="mongodb" className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="mongodb-collection">Collection</Label>
                <Input
                  id="mongodb-collection"
                  placeholder="customers"
                  value={config.source.collection || ""}
                  onChange={(e) => handleSourceChange("collection", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mongodb-query">Query (JSON)</Label>
                <Textarea
                  id="mongodb-query"
                  placeholder='{"status": "active"}'
                  value={config.source.query ? JSON.stringify(config.source.query, null, 2) : ""}
                  onChange={(e) => {
                    try {
                      const query = JSON.parse(e.target.value)
                      handleSourceChange("query", query)
                    } catch (error) {
                      // Handle invalid JSON
                    }
                  }}
                />
              </div>
            </TabsContent>

            <TabsContent value="blob" className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="blob-container">Container</Label>
                <Input
                  id="blob-container"
                  placeholder="data-files"
                  value={config.source.container || ""}
                  onChange={(e) => handleSourceChange("container", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="blob-name">Blob Name</Label>
                <Input
                  id="blob-name"
                  placeholder="customer-data.json"
                  value={config.source.blobName || ""}
                  onChange={(e) => handleSourceChange("blobName", e.target.value)}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium">Extraction Options</h2>
        <p className="text-sm text-muted-foreground">Configure how data is extracted</p>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="save-to-db">Save Raw Data to Database</Label>
              <p className="text-xs text-muted-foreground">Store the raw extracted data before transformation</p>
            </div>
            <Switch
              id="save-to-db"
              checked={config.options?.saveToDb || false}
              onCheckedChange={(checked) => handleOptionsChange("saveToDb", checked)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="batch-size">Batch Size</Label>
            <Input
              id="batch-size"
              type="number"
              placeholder="100"
              value={config.options?.batchSize || 100}
              onChange={(e) => handleOptionsChange("batchSize", Number.parseInt(e.target.value) || 100)}
            />
            <p className="text-xs text-muted-foreground">Number of records to process in each batch</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" className="mr-2">
          Test Connection
        </Button>
        <Button variant="outline">Preview Data</Button>
      </div>
    </div>
  )
}
