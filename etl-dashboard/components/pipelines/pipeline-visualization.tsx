"use client"

import { useEffect, useRef } from "react"
import { ArrowRight, Database, FileJson, Wand2 } from "lucide-react"

interface PipelineVisualizationProps {
  pipeline: {
    id: string
    name: string
    status: string
    source: string
    destination: string
    recordsProcessed: number
  }
}

export function PipelineVisualization({ pipeline }: PipelineVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height)

    // Draw flow lines
    ctx.beginPath()
    ctx.strokeStyle = "#e2e8f0"
    ctx.lineWidth = 2

    // Extract to Transform
    ctx.moveTo(rect.width * 0.2, rect.height * 0.5)
    ctx.lineTo(rect.width * 0.4, rect.height * 0.5)

    // Transform to Load
    ctx.moveTo(rect.width * 0.6, rect.height * 0.5)
    ctx.lineTo(rect.width * 0.8, rect.height * 0.5)

    ctx.stroke()

    // Draw progress indicator based on status
    if (pipeline.status === "active" || pipeline.status === "completed") {
      const gradient = ctx.createLinearGradient(0, 0, rect.width, 0)
      gradient.addColorStop(0, "#10b981")
      gradient.addColorStop(1, "#059669")

      ctx.beginPath()
      ctx.strokeStyle = gradient
      ctx.lineWidth = 3

      // Extract to Transform
      ctx.moveTo(rect.width * 0.2, rect.height * 0.5)
      ctx.lineTo(rect.width * 0.4, rect.height * 0.5)

      // Transform to Load
      ctx.moveTo(rect.width * 0.6, rect.height * 0.5)
      ctx.lineTo(rect.width * 0.8, rect.height * 0.5)

      ctx.stroke()
    } else if (pipeline.status === "failed") {
      const gradient = ctx.createLinearGradient(0, 0, rect.width, 0)
      gradient.addColorStop(0, "#ef4444")
      gradient.addColorStop(1, "#dc2626")

      ctx.beginPath()
      ctx.strokeStyle = gradient
      ctx.lineWidth = 3

      // Extract to Transform (completed)
      ctx.moveTo(rect.width * 0.2, rect.height * 0.5)
      ctx.lineTo(rect.width * 0.4, rect.height * 0.5)

      ctx.stroke()
    }
  }, [pipeline])

  return (
    <div className="relative h-20 w-full">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 flex items-center justify-between px-4">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-background">
            {pipeline.source === "MongoDB" ? (
              <Database className="h-5 w-5 text-blue-500" />
            ) : (
              <FileJson className="h-5 w-5 text-green-500" />
            )}
          </div>
          <span className="text-xs font-medium">Extract</span>
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground" />
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-background">
            <Wand2 className="h-5 w-5 text-purple-500" />
          </div>
          <span className="text-xs font-medium">Transform</span>
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground" />
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-background">
            {pipeline.destination === "MongoDB" ? (
              <Database className="h-5 w-5 text-blue-500" />
            ) : (
              <FileJson className="h-5 w-5 text-green-500" />
            )}
          </div>
          <span className="text-xs font-medium">Load</span>
        </div>
      </div>
    </div>
  )
}
