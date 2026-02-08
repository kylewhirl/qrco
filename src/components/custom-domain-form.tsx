"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  initialDomain: string;
  verified: boolean;
}

export default function CustomDomainForm({ initialDomain, verified }: Props) {
  const [domain, setDomain] = useState(initialDomain);
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState(verified ? "verified" : "idle");
  const [loading, setLoading] = useState(false);

  const register = async () => {
    setLoading(true);
    const res = await fetch("/api/custom-domain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setToken(data.token);
      setStatus("pending");
    } else {
      alert(data.error || "Failed to register domain");
    }
  };

  const verify = async () => {
    setLoading(true);
    const res = await fetch("/api/custom-domain/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setStatus("verified");
    } else {
      alert(data.error || "Verification failed");
    }
  };

  return (
    <div className="space-y-4 max-w-md">
      <div className="grid gap-2">
        <Label htmlFor="domain">Custom Domain</Label>
        <Input id="domain" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="example.com" />
      </div>
      {status === "idle" && (
        <Button onClick={register} disabled={loading || !domain}>Save Domain</Button>
      )}
      {status === "pending" && token && (
        <div className="space-y-2">
          <p>Add a TXT record for <code>_qrco.{domain}</code> with the value:</p>
          <pre className="rounded bg-muted p-2 text-sm">{token}</pre>
          <Button onClick={verify} disabled={loading}>Verify Domain</Button>
        </div>
      )}
      {status === "verified" && (
        <p className="text-green-600">Domain verified: {domain}</p>
      )}
    </div>
  );
}
