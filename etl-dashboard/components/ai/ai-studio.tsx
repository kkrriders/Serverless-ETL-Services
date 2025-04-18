"use client"

import { useState } from "react"
import { Play, Save, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Helper function to safely display templates
const safeTemplate = (template: string) => {
  // Replace template variables with a safe format for display
  return template.replace(/\{\{(\w+)\}\}/g, "[[$1]]");
}

export function AIStudio() {
  const [activeTab, setActiveTab] = useState("prompt")
  const [promptTemplate, setPromptTemplate] = useState(
    "Analyze the following {{content}} and provide:\n\n1. A summary of key points\n2. Sentiment analysis (positive, negative, neutral)\n3. Main topics discussed\n4. Suggested actions based on the content",
  )
  const [sampleData, setSampleData] = useState(
    "The new product launch exceeded our expectations with 50% more signups than projected. Customer feedback has been mostly positive, with users highlighting the intuitive interface and quick setup process. However, some users reported difficulties with the advanced features and requested more comprehensive documentation. The support team has been overwhelmed with questions, suggesting we need to improve our onboarding materials and possibly expand the team.",
  )
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(1000)
  const [enrichmentType, setEnrichmentType] = useState("analysis")
  const [result, setResult] = useState("")
  const [processedPrompt, setProcessedPrompt] = useState("")

  const handleRunPrompt = () => {
    // Simulate AI processing
    setActiveTab("result")

    // Replace variables in the prompt template
    const newProcessedPrompt = promptTemplate.replace(/\{\{content\}\}/g, sampleData)
    setProcessedPrompt(newProcessedPrompt)

    // Simulate AI response based on enrichment type
    setTimeout(() => {
      if (enrichmentType === "analysis") {
        setResult(`# Analysis Results

## Summary of Key Points
- Product launch exceeded expectations with 50% more signups than projected
- Customer feedback is mostly positive, particularly about the interface and setup
- Some users struggled with advanced features
- Documentation needs improvement
- Support team is overwhelmed, indicating onboarding issues

## Sentiment Analysis
**Overall Sentiment**: Positive with concerns
- Positive aspects: Exceeded expectations, intuitive interface, quick setup
- Negative aspects: Difficulties with advanced features, documentation gaps, support team overwhelmed

## Main Topics Discussed
1. Product Launch Performance
2. User Experience
3. Documentation Quality
4. Customer Support Challenges

## Suggested Actions
1. Improve documentation for advanced features
2. Create better onboarding materials
3. Consider expanding the support team
4. Develop targeted tutorials for complex features
5. Conduct user research to identify specific pain points with advanced features`)
      } else if (enrichmentType === "summarization") {
        setResult(`# Executive Summary

The recent product launch has been successful, exceeding signup projections by 50%. Users appreciate the intuitive interface and quick setup, but are struggling with advanced features due to insufficient documentation. The support team is currently overwhelmed, indicating a need for improved onboarding materials and possible team expansion.

## Recommendations
- Prioritize documentation improvements
- Enhance onboarding process
- Evaluate support team capacity
- Create targeted training for advanced features`)
      } else if (enrichmentType === "categorization") {
        setResult(`# Content Categorization

## Primary Categories
- Product Performance (Confidence: 95%)
- User Experience (Confidence: 90%)
- Support Operations (Confidence: 85%)
- Documentation (Confidence: 80%)

## Subcategories
- Launch Metrics (Confidence: 95%)
- Interface Design (Confidence: 85%)
- Feature Complexity (Confidence: 80%)
- Support Capacity (Confidence: 90%)
- Training Materials (Confidence: 85%)

## Related Business Areas
- Product Development
- Customer Success
- Technical Writing
- User Experience Design`)
      }
    }, 1500)
  }

  return (
    <Card>
      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="prompt" className="flex items-center gap-2">
              Prompt Design
            </TabsTrigger>
            <TabsTrigger value="result" className="flex items-center gap-2">
              Results
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prompt" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="enrichment-type">Enrichment Type</Label>
                  <Select value={enrichmentType} onValueChange={setEnrichmentType}>
                    <SelectTrigger id="enrichment-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="analysis">Content Analysis</SelectItem>
                      <SelectItem value="summarization">Summarization</SelectItem>
                      <SelectItem value="categorization">Categorization</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="prompt-template">Prompt Template</Label>
                  <Textarea
                    id="prompt-template"
                    value={promptTemplate}
                    onChange={(e) => setPromptTemplate(e.target.value)}
                    className="min-h-[200px] font-mono text-sm"
                    placeholder="Enter your prompt template with {{variables}}"
                  />
                  <p className="text-xs text-muted-foreground">Use {{ content }} as a placeholder for the input data</p>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Model Parameters</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="temperature">Temperature: {temperature}</Label>
                    </div>
                    <Slider
                      id="temperature"
                      min={0}
                      max={1}
                      step={0.1}
                      value={[temperature]}
                      onValueChange={(value) => setTemperature(value[0])}
                    />
                    <p className="text-xs text-muted-foreground">
                      Lower values produce more predictable outputs, higher values more creative
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="max-tokens">Max Tokens</Label>
                    <Input
                      id="max-tokens"
                      type="number"
                      value={maxTokens}
                      onChange={(e) => setMaxTokens(Number.parseInt(e.target.value) || 1000)}
                    />
                    <p className="text-xs text-muted-foreground">Maximum number of tokens to generate</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="sample-data">Sample Data</Label>
                  <Textarea
                    id="sample-data"
                    value={sampleData}
                    onChange={(e) => setSampleData(e.target.value)}
                    className="min-h-[200px]"
                    placeholder="Enter sample data to test your prompt"
                  />
                </div>

                <div className="flex items-center gap-2 rounded-md border bg-muted p-3">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  <p className="text-sm">
                    Design your prompt template and test it with sample data before using it in your pipeline.
                  </p>
                </div>

                <Button onClick={handleRunPrompt} className="w-full flex items-center justify-center gap-2">
                  <Play className="h-4 w-4" />
                  Run Prompt
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="result" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="font-medium">Input Data</h3>
                <div className="rounded-md border bg-muted p-4">
                  <pre className="text-sm whitespace-pre-wrap">{sampleData}</pre>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Processed Prompt</h3>
                <div className="rounded-md border bg-muted p-4">
                  <pre className="text-sm whitespace-pre-wrap">
                    {processedPrompt || safeTemplate(promptTemplate).replace(/\[\[content\]\]/g, "[CONTENT]")}
                  </pre>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">AI Output</h3>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save as Template
                </Button>
              </div>
              <div className="rounded-md border p-4">
                {result ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <pre className="whitespace-pre-wrap">{result}</pre>
                  </div>
                ) : (
                  <div className="flex h-40 items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                      <p className="text-sm text-muted-foreground">Processing...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
