"use client"

import { useEffect, useRef } from "react"
import { ArrowRight, Database, FileJson, Wand2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Check, ChevronRight, Settings2 } from "lucide-react"

interface PipelineVisualizationProps {
  status: string
  lastRunTime?: string
  className?: string
}

export function PipelineVisualization({ status, lastRunTime, className }: PipelineVisualizationProps) {
  const isActive = status === "active"
  const isPaused = status === "paused"
  const isFailed = status === "failed"

  return (
    <div className={cn("w-full py-4", className)}>
      <div className="flex flex-col items-center space-y-3 sm:flex-row sm:space-x-8 sm:space-y-0">
        {/* Extract Stage */}
        <div className="flex flex-1 items-center">
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full border-2",
            isActive ? "border-green-500 bg-green-50" : 
            isFailed ? "border-red-500 bg-red-50" :
            isPaused ? "border-yellow-500 bg-yellow-50" : "border-gray-300 bg-gray-50"
          )}>
            <Database className={cn(
              "h-6 w-6", 
              isActive ? "text-green-600" : 
              isFailed ? "text-red-600" :
              isPaused ? "text-yellow-600" : "text-gray-500"
            )} />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium">Extract</p>
            <p className="text-xs text-gray-500">Data ingestion</p>
          </div>
        </div>

        <ChevronRight className="hidden h-5 w-5 text-gray-400 sm:block" />

        {/* Transform Stage */}
        <div className="flex flex-1 items-center">
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full border-2",
            isActive ? "border-green-500 bg-green-50" : 
            isFailed ? "border-red-500 bg-red-50" :
            isPaused ? "border-yellow-500 bg-yellow-50" : "border-gray-300 bg-gray-50"
          )}>
            <Settings2 className={cn(
              "h-6 w-6", 
              isActive ? "text-green-600" : 
              isFailed ? "text-red-600" :
              isPaused ? "text-yellow-600" : "text-gray-500"
            )} />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium">Transform</p>
            <p className="text-xs text-gray-500">AI processing</p>
          </div>
        </div>

        <ChevronRight className="hidden h-5 w-5 text-gray-400 sm:block" />

        {/* Load Stage */}
        <div className="flex flex-1 items-center">
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full border-2",
            isActive ? "border-green-500 bg-green-50" : 
            isFailed ? "border-red-500 bg-red-50" :
            isPaused ? "border-yellow-500 bg-yellow-50" : "border-gray-300 bg-gray-50"
          )}>
            <FileJson className={cn(
              "h-6 w-6", 
              isActive ? "text-green-600" : 
              isFailed ? "text-red-600" :
              isPaused ? "text-yellow-600" : "text-gray-500"
            )} />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium">Load</p>
            <p className="text-xs text-gray-500">Output delivery</p>
          </div>
        </div>
      </div>

      {lastRunTime && (
        <div className="mt-4 flex items-center justify-center text-xs text-gray-500">
          {isActive && <Check className="mr-1 h-3 w-3 text-green-500" />}
          Last processed: {lastRunTime}
        </div>
      )}
    </div>
  )
}
