"use client";
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SiApple, SiGithub } from 'react-icons/si';
import { AnimatedGridPattern } from "@/components/magicui/animated-grid-pattern"
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStackApp } from "@stackframe/stack";
import Link from "next/link";
import { Google, Logo } from "@/assets/logo";
import { TypingMorph } from "./ui/typing-morph";
import AnimatedLogo from "@/assets/animated-logo";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const app = useStackApp();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await app.signInWithCredential({
      noRedirect: false,
      email,
      password,
    });
    setLoading(false);
    if (res.status === "error") {
      setError(res.error.message);
    } else {
      router.push(callbackUrl);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
       <div className="absolute top-6 left-6">
        <Link href="/" className="flex flex-row items-center text-center gap-4 w-full">
          <Logo className="!size-5" />
          <TypingMorph
            initialText="tqrco.de"
            ops={[
              { type: "move", to: 1, delay: 50 },
              { type: "insert", chars: "he ", speed: 100 },
              { type: "move", to: 6, delay: 100 },
              { type: "insert", chars: " ", speed: 100 },
              { type: "move", to: 10, delay: 100 },
              { type: "delete", count: 1, speed: 50 },
              { type: "move", to: 11, delay: 100 },
              { type: "insert", chars: " co.", speed: 100 },
            ]}
            className="text-xl font-brand font-semibold"
            hideCursor
          />
        </Link>
      </div>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form onSubmit={handleSubmit} className="p-6 md:p-8">
            {error && (
              <p className="text-sm text-destructive text-center">
                {error}
              </p>
            )}
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-muted-foreground text-balance">
                  Login to your qr code co. account
                </p>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="#"
                    className="ml-auto text-sm underline-offset-2 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="ILov3QRCod3s!"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Signing in…" : "Login"}
              </Button>
              <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="bg-card text-muted-foreground relative z-10 px-2">
                  Or continue with
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Button variant="outline" type="button" className="w-full" onClick={async () => {await app.signInWithOAuth('apple');}}>
                    <SiApple className="h-4 w-4" />
                  <span className="sr-only">Login with Apple</span>
                </Button>
                <Button variant="outline" type="button" className="w-full" onClick={async () => {await app.signInWithOAuth('google');}}>
                    <Google className="h-4 w-4" />
                  <span className="sr-only">Login with Google</span>
                </Button>
                <Button variant="outline" type="button" className="w-full" onClick={async () => {await app.signInWithOAuth('github');}}>
                    <SiGithub className="h-4 w-4" />
                  <span className="sr-only">Login with Github</span>
                </Button>
              </div>
              <div className="text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/sign-up" className="underline underline-offset-4">
                  Sign up
                </Link>
              </div>
            </div>
          </form>
           <div className="bg-muted relative hidden md:block">
            <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-background p-20">
                <AnimatedGridPattern
                    numSquares={30}
                    maxOpacity={0.1}
                    duration={1.5}
                />
                <div className="z-10">
                  <AnimatedLogo className="!size-56" startTimeSec={0}/>
                </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Skeleton fallback that mimics the LoginForm layout for Suspense boundaries.
// ---------------------------------------------------------------------------
export function LoginLoading({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          {/* Left column – form layout */}
          <div className="p-6 md:p-8 flex flex-col gap-6">
            <div className="flex flex-col items-center text-center gap-2">
              <Skeleton className="h-6 w-32" />    {/* “Welcome back” */}
              <Skeleton className="h-4 w-48" />    {/* subtitle */}
            </div>

            <div className="flex flex-col gap-5">
              {/* Email field */}
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />

              {/* Password field */}
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-10 w-full" />

              {/* Login button */}
              <Skeleton className="h-10 w-full" />

              {/* OAuth buttons */}
              <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>

              {/* Sign‑up hint */}
              <Skeleton className="h-4 w-40 mx-auto" />
            </div>
          </div>

          {/* Right column – illustration area */}
          <div className="hidden md:block">
            <Skeleton className="h-full w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
