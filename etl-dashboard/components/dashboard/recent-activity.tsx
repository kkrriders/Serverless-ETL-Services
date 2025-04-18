import { Activity } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function RecentActivity() {
  const activities = [
    {
      id: 1,
      action: "Pipeline Completed",
      pipeline: "Customer Data Enrichment",
      time: "10 minutes ago",
      status: "success",
    },
    {
      id: 2,
      action: "Transformation Failed",
      pipeline: "Product Catalog Update",
      time: "25 minutes ago",
      status: "error",
    },
    {
      id: 3,
      action: "AI Enrichment Completed",
      pipeline: "Support Ticket Analysis",
      time: "1 hour ago",
      status: "success",
    },
    {
      id: 4,
      action: "Pipeline Started",
      pipeline: "Inventory Sync",
      time: "2 hours ago",
      status: "pending",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>Latest ETL operations and status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <div
                className={`h-2 w-2 rounded-full mt-2 ${
                  activity.status === "success"
                    ? "bg-green-500"
                    : activity.status === "error"
                      ? "bg-red-500"
                      : "bg-amber-500"
                }`}
              />
              <div className="space-y-1">
                <p className="font-medium">{activity.action}</p>
                <p className="text-sm text-muted-foreground">{activity.pipeline}</p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
