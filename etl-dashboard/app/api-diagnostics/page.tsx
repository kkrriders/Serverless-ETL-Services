import { ApiDiagnostics } from "@/components/api-diagnostics";

export const metadata = {
  title: "API Diagnostics",
  description: "Diagnose API connection and authentication issues",
};

export default function ApiDiagnosticsPage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-8">API Diagnostics</h1>
      <p className="mb-8 text-muted-foreground">
        This page helps diagnose API connection and authentication issues. 
        It checks the configuration of your API base URL and API key, and tests 
        the connection to the backend API.
      </p>
      
      <div className="max-w-2xl mx-auto">
        <ApiDiagnostics />
      </div>
      
      <div className="mt-10 border-t pt-6">
        <h2 className="text-2xl font-semibold mb-4">Troubleshooting Steps</h2>
        <ul className="list-disc pl-6 space-y-3">
          <li>
            <strong>Check API Base URL:</strong> Make sure your <code className="bg-muted px-1 py-0.5 rounded text-sm">.env.local</code> file 
            has the correct API base URL (e.g., <code className="bg-muted px-1 py-0.5 rounded text-sm">http://localhost:3000</code> for local development).
          </li>
          <li>
            <strong>Check API Key:</strong> Ensure your API key is correctly set without any leading or trailing spaces.
          </li>
          <li>
            <strong>Backend Running:</strong> Verify that the backend API server is running and accessible.
          </li>
          <li>
            <strong>Restart Development Server:</strong> Sometimes restarting the Next.js development server can resolve environment variable issues.
          </li>
          <li>
            <strong>Environment Files:</strong> Check all these files for conflicts:
            <ul className="list-disc pl-6 mt-2">
              <li><code className="bg-muted px-1 py-0.5 rounded text-sm">.env.local</code> (for local development)</li>
              <li><code className="bg-muted px-1 py-0.5 rounded text-sm">.env.production</code> (for production)</li>
              <li><code className="bg-muted px-1 py-0.5 rounded text-sm">.env</code> (global defaults)</li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  );
} 