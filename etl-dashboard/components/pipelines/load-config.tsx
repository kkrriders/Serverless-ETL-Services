"use client"

import { Database, FileJson } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface LoadConfigProps {
  config: any
  onChange: (config: any) => void
}

export function LoadConfig({ config, onChange }: LoadConfigProps) {
  const handleDestinationTypeChange = (value: string) => {
    onChange({
      destination: {
        ...config.destination,
        type: value,
      },
    })
  }

  const handleDestinationChange = (key: string, value: any) => {
    onChange({
      destination: {
        ...config.destination,
        [key]: value,
      },
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Data Destination</h2>
        <p className="text-sm text-muted-foreground">Configure where your transformed data will be loaded</p>
      </div>

      <div>
        <RadioGroup
          value={config.destination.type}
          onValueChange={handleDestinationTypeChange}
          className="grid grid-cols-2 gap-4"
        >
          <Card className={`cursor-pointer ${config.destination.type === "mongodb" ? "border-primary" : ""}`}>
            <CardContent className="flex flex-col items-center justify-center p-4">
              <RadioGroupItem value="mongodb" id="dest-mongodb" className="sr-only" />
              <Database className="mb-2 h-6 w-6 text-primary" />
              <Label htmlFor="dest-mongodb" className="cursor-pointer">
                MongoDB
              </Label>
            </CardContent>
          </Card>
          <Card className={`cursor-pointer ${config.destination.type === "blob" ? "border-primary" : ""}`}>
            <CardContent className="flex flex-col items-center justify-center p-4">
              <RadioGroupItem value="blob" id="dest-blob" className="sr-only" />
              <FileJson className="mb-2 h-6 w-6 text-primary" />
              <Label htmlFor="dest-blob" className="cursor-pointer">
                Blob Storage
              </Label>
            </CardContent>
          </Card>
        </RadioGroup>
      </div>

      <div className="space-y-4">
        {config.destination.type === "mongodb" ? (
          <>
            <div className="grid gap-2">
              <Label htmlFor="mongodb-collection">Collection</Label>
              <Input
                id="mongodb-collection"
                placeholder="customers_enriched"
                value={config.destination.collection || ""}
                onChange={(e) => handleDestinationChange("collection", e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="upsert">Upsert Documents</Label>
                <p className="text-xs text-muted-foreground">Update existing documents or insert new ones</p>
              </div>
              <Switch
                id="upsert"
                checked={config.destination.upsert || false}
                onCheckedChange={(checked) => handleDestinationChange("upsert", checked)}
              />
            </div>
            {config.destination.upsert && (
              <div className="grid gap-2">
                <Label htmlFor="upsert-key">Upsert Key</Label>
                <Input
                  id="upsert-key"
                  placeholder="_id"
                  value={config.destination.upsertKey || ""}
                  onChange={(e) => handleDestinationChange("upsertKey", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Field to use as the unique identifier for upsert operations
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="grid gap-2">
              <Label htmlFor="blob-container">Container</Label>
              <Input
                id="blob-container"
                placeholder="processed-data"
                value={config.destination.container || ""}
                onChange={(e) => handleDestinationChange("container", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="blob-name">Blob Name Pattern</Label>
              <Input
                id="blob-name"
                placeholder="data-{timestamp}.json"
                value={config.destination.blobName || ""}
                onChange={(e) => handleDestinationChange("blobName", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                You can use {"{timestamp}"} as a placeholder for the current time
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="format">File Format</Label>
              <Select
                value={config.destination.format || "json"}
                onValueChange={(value) => handleDestinationChange("format", value)}
              >
                <SelectTrigger id="format">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="parquet">Parquet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>

      <div className="flex justify-end">
        <Button variant="outline">Test Connection</Button>
      </div>
    </div>
  )
}
