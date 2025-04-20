import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowUpRight, Clock, Database, FileJson } from "lucide-react"

interface MetricProps {
  title: string
  value: string | number
  change?: string
  icon?: React.ReactNode
}

function Metric({ title, value, change, icon }: MetricProps) {
  const isPositiveChange = change && change.startsWith('+')
  
  return (
    <div className="flex items-center space-x-2">
      {icon && <div className="rounded-md bg-muted p-2">{icon}</div>}
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="flex items-baseline space-x-2">
          <p className="text-2xl font-bold">{value}</p>
          {change && (
            <span className={`text-xs font-medium ${isPositiveChange ? 'text-green-500' : 'text-red-500'}`}>
              {change} <ArrowUpRight className="inline h-3 w-3" />
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

interface PipelineMetricsCardProps {
  records: number
  recordsChange?: string
  processingTime: string
  processingTimeChange?: string
  dataSize: string
  dataSizeChange?: string
  errorRate: string
  errorRateChange?: string
}

export function PipelineMetricsCard({
  records,
  recordsChange,
  processingTime,
  processingTimeChange,
  dataSize,
  dataSizeChange,
  errorRate,
  errorRateChange,
}: PipelineMetricsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipeline Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Metric 
                title="Records Processed"
                value={records}
                change={recordsChange}
                icon={<Database className="h-4 w-4" />}
              />
              <Metric 
                title="Data Size"
                value={dataSize}
                change={dataSizeChange} 
                icon={<FileJson className="h-4 w-4" />}
              />
            </div>
          </TabsContent>
          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Metric 
                title="Processing Time"
                value={processingTime}
                change={processingTimeChange}
                icon={<Clock className="h-4 w-4" />}
              />
              <Metric 
                title="Error Rate"
                value={errorRate}
                change={errorRateChange}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 