import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center mb-4 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
            <p className="mt-4 text-sm text-gray-600">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <Link href="/">
              <Button className="mt-6">
                Return to Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
