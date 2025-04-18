"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ApiDiagnosticsLink() {
  return (
    <Button variant="outline" size="sm" asChild className="gap-2">
      <Link href="/api-diagnostics">
        <AlertCircle className="h-4 w-4" />
        API Diagnostics
      </Link>
    </Button>
  );
} 