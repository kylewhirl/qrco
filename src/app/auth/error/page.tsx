import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-bold">Authentication Error</h1>
      <p className="mt-2 text-lg">There was an error with your authentication request.</p>
      <p className="mt-4 text-gray-500">Please try again or contact support if the issue persists.</p>
      <Button asChild className="mt-8">
        <Link href="/login">Back to Login</Link>
      </Button>
    </div>
  )
}
