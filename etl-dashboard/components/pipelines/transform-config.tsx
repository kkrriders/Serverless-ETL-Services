"use client"

import { useState } from "react"
import { Check, Trash, Wand2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"

interface TransformConfigProps {
  config: any
  onChange: (config: any) => void
}

export function TransformConfig({ config, onChange }: TransformConfigProps) {
  const [activeTab, setActiveTab] = useState("clean")
  const [newField, setNewField] = useState("")

  const handleCleanChange = (key: string, value: any) => {
    onChange({
      transformations: {
        ...config.transformations,
        clean: {
          ...config.transformations.clean,
          [key]: value,
        },
      },
    })
  }

  const handleTextOptionsChange = (key: string, value: any) => {
    onChange({
      transformations: {
        ...config.transformations,
        clean: {
          ...config.transformations.clean,
          textOptions: {
            ...config.transformations.clean.textOptions,
            [key]: value,
          },
        },
      },
    })
  }

  const handleValidateChange = (key: string, value: any) => {
    onChange({
      transformations: {
        ...config.transformations,
        validate: {
          ...config.transformations.validate,
          [key]: value,
        },
      },
    })
  }

  const handleEnrichChange = (key: string, value: any) => {
    onChange({
      transformations: {
        ...config.transformations,
        enrich: {
          ...config.transformations.enrich,
          [key]: value,
        },
      },
    })
  }

  const handleModelOptionsChange = (key: string, value: any) => {
    onChange({
      transformations: {
        ...config.transformations,
        enrich: {
          ...config.transformations.enrich,
          modelOptions: {
            ...config.transformations.enrich.modelOptions,
            [key]: value,
          },
        },
      },
    })
  }

  const addTextField = () => {
    if (newField && !config.transformations.clean.textFields.includes(newField)) {
      const updatedFields = [...config.transformations.clean.textFields, newField]
      handleCleanChange("textFields", updatedFields)
      setNewField("")
    }
  }

  const removeTextField = (field: string) => {
    const updatedFields = config.transformations.clean.textFields.filter((f: string) => f !== field)
    handleCleanChange("textFields", updatedFields)
  }

  const addEnrichField = () => {
    if (newField && !config.transformations.enrich.fields.includes(newField)) {
      const updatedFields = [...config.transformations.enrich.fields, newField]
      handleEnrichChange("fields", updatedFields)
      setNewField("")
    }
  }

  const removeEnrichField = (field: string) => {
    const updatedFields = config.transformations.enrich.fields.filter((f: string) => f !== field)
    handleEnrichChange("fields", updatedFields)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Data Transformation</h2>
        <p className="text-sm text-muted-foreground">Configure how your data will be transformed</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="clean">Clean</TabsTrigger>
          <TabsTrigger value="validate">Validate</TabsTrigger>
          <TabsTrigger value="enrich">AI Enrich</TabsTrigger>
        </TabsList>

        <TabsContent value="clean" className="space-y-6 pt-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="remove-empty">Remove Empty Fields</Label>
              <p className="text-xs text-muted-foreground">Remove fields with null or empty string values</p>
            </div>
            <Switch
              id="remove-empty"
              checked={config.transformations.clean.removeEmpty}
              onCheckedChange={(checked) => handleCleanChange("removeEmpty", checked)}
            />
          </div>

          <div className="space-y-2">
            <Label>Text Fields to Clean</Label>
            <div className="flex flex-wrap gap-2">
              {config.transformations.clean.textFields.map((field: string) => (
                <Badge key={field} variant="secondary" className="flex items-center gap-1">
                  {field}
                  <Button variant="ghost" size="icon" className="h-4 w-4 p-0" onClick={() => removeTextField(field)}>
                    <Trash className="h-3 w-3" />
                    <span className="sr-only">Remove {field}</span>
                  </Button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Field name"
                value={newField}
                onChange={(e) => setNewField(e.target.value)}
                className="flex-1"
              />
              <Button onClick={addTextField} size="sm">
                Add Field
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-4">
              <h3 className="mb-2 font-medium">Text Cleaning Options</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="trim">Trim Whitespace</Label>
                  <Switch
                    id="trim"
                    checked={config.transformations.clean.textOptions?.trim}
                    onCheckedChange={(checked) => handleTextOptionsChange("trim", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="lowercase">Convert to Lowercase</Label>
                  <Switch
                    id="lowercase"
                    checked={config.transformations.clean.textOptions?.lowercase}
                    onCheckedChange={(checked) => handleTextOptionsChange("lowercase", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validate" className="space-y-6 pt-4">
          <div className="grid gap-2">
            <Label htmlFor="validation-schema">Validation Schema (JSON)</Label>
            <Textarea
              id="validation-schema"
              placeholder='{"name": "string", "email": "email", "age": "number"}'
              value={
                config.transformations.validate.schema
                  ? JSON.stringify(config.transformations.validate.schema, null, 2)
                  : ""
              }
              onChange={(e) => {
                try {
                  const schema = JSON.parse(e.target.value)
                  handleValidateChange("schema", schema)
                } catch (error) {
                  // Handle invalid JSON
                }
              }}
              className="min-h-[200px] font-mono"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="abort-early">Abort Early</Label>
              <p className="text-xs text-muted-foreground">Stop validation after the first error</p>
            </div>
            <Switch
              id="abort-early"
              checked={config.transformations.validate.abortEarly}
              onCheckedChange={(checked) => handleValidateChange("abortEarly", checked)}
            />
          </div>
        </TabsContent>

        <TabsContent value="enrich" className="space-y-6 pt-4">
          <div className="grid gap-2">
            <Label htmlFor="ai-instruction">AI Instruction</Label>
            <Textarea
              id="ai-instruction"
              placeholder="Analyze the customer feedback and extract sentiment, key topics, and suggested actions."
              value={config.transformations.enrich.instruction || ""}
              onChange={(e) => handleEnrichChange("instruction", e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Fields to Enrich</Label>
            <div className="flex flex-wrap gap-2">
              {config.transformations.enrich.fields.map((field: string) => (
                <Badge key={field} variant="secondary" className="flex items-center gap-1">
                  {field}
                  <Button variant="ghost" size="icon" className="h-4 w-4 p-0" onClick={() => removeEnrichField(field)}>
                    <Trash className="h-3 w-3" />
                    <span className="sr-only">Remove {field}</span>
                  </Button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Field name"
                value={newField}
                onChange={(e) => setNewField(e.target.value)}
                className="flex-1"
              />
              <Button onClick={addEnrichField} size="sm">
                Add Field
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-4">
              <h3 className="mb-4 font-medium">AI Model Options</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="temperature">
                      Temperature: {config.transformations.enrich.modelOptions?.temperature}
                    </Label>
                  </div>
                  <Slider
                    id="temperature"
                    min={0}
                    max={1}
                    step={0.1}
                    value={[config.transformations.enrich.modelOptions?.temperature || 0.7]}
                    onValueChange={(value) => handleModelOptionsChange("temperature", value[0])}
                  />
                  <p className="text-xs text-muted-foreground">
                    Lower values produce more predictable outputs, higher values more creative
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-tokens">Max Tokens</Label>
                  <Input
                    id="max-tokens"
                    type="number"
                    value={config.transformations.enrich.modelOptions?.maxTokens || 1000}
                    onChange={(e) => handleModelOptionsChange("maxTokens", Number.parseInt(e.target.value) || 1000)}
                  />
                  <p className="text-xs text-muted-foreground">Maximum number of tokens to generate</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-2 rounded-md border bg-muted p-3">
            <Wand2 className="h-5 w-5 text-purple-500" />
            <p className="text-sm">
              AI enrichment will process your data using the specified instructions and model settings.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button variant="outline" className="flex items-center gap-2">
          <Check className="h-4 w-4" />
          Test Transformation
        </Button>
      </div>
    </div>
  )
}
