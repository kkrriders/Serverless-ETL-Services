import { AuthTest } from "@/components/auth-test";

export default function ApiTestPage() {
  return (
    <div className="container mx-auto py-10 flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-6">API Authentication Testing</h1>
      <p className="text-muted-foreground mb-8 max-w-lg text-center">
        Use this page to test API authentication. The public endpoint should be accessible without 
        an API key, while the protected endpoint requires a valid API key.
      </p>
      <AuthTest />
    </div>
  );
} 