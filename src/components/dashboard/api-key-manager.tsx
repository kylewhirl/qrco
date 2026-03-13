"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { ApiKeySummary } from "@/lib/types";

interface ApiKeyListItem extends Omit<ApiKeySummary, "createdAt" | "lastUsedAt" | "revokedAt"> {
  createdAt: string | Date
  lastUsedAt: string | Date | null
  revokedAt: string | Date | null
}

interface ApiKeyCreateResponse {
  apiKey: string
  record: ApiKeyListItem
}

export function ApiKeyManager() {
  const [apiKeys, setApiKeys] = useState<ApiKeyListItem[]>([]);
  const [name, setName] = useState("Production key");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newSecret, setNewSecret] = useState<string | null>(null);

  useEffect(() => {
    void loadApiKeys();
  }, []);

  async function loadApiKeys() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/dashboard/api-keys");
      if (!response.ok) {
        throw new Error("Failed to load API keys");
      }

      const data = await response.json();
      setApiKeys((data.apiKeys ?? []) as ApiKeyListItem[]);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load API keys");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreate() {
    if (!name.trim()) {
      toast.error("Key name is required");
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/dashboard/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error("Failed to create API key");
      }

      const data = await response.json() as ApiKeyCreateResponse;
      setNewSecret(data.apiKey);
      setApiKeys((current) => [data.record, ...current]);
      toast.success("API key created");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create API key");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleRevoke(id: string) {
    setDeletingId(id);
    try {
      const response = await fetch(`/api/dashboard/api-keys/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to revoke API key");
      }

      setApiKeys((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                revokedAt: new Date().toISOString(),
              }
            : item,
        ),
      );
      toast.success("API key revoked");
    } catch (error) {
      console.error(error);
      toast.error("Failed to revoke API key");
    } finally {
      setDeletingId(null);
    }
  }

  async function copySecret(secret: string) {
    try {
      await navigator.clipboard.writeText(secret);
      toast.success("API key copied");
    } catch (error) {
      console.error(error);
      toast.error("Failed to copy API key");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>API access</CardTitle>
        <CardDescription>
          Create a bearer key for user-scoped REST access to your QR codes and analytics.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="space-y-2">
            <Label htmlFor="api-key-name">Key name</Label>
            <Input
              id="api-key-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Production key"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating ? "Creating..." : "Create API key"}
            </Button>
          </div>
        </div>

        {newSecret ? (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm">
            <p className="font-medium text-amber-950">Copy this key now.</p>
            <p className="mt-1 text-amber-900">You will only see the raw secret once.</p>
            <div className="mt-3 flex flex-col gap-3 md:flex-row">
              <Input readOnly value={newSecret} className="font-mono text-xs" />
              <Button variant="outline" onClick={() => copySecret(newSecret)}>
                Copy
              </Button>
            </div>
          </div>
        ) : null}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Issued keys</h3>
            {isLoading ? <span className="text-sm text-muted-foreground">Loading...</span> : null}
          </div>

          <div className="space-y-3">
            {apiKeys.length === 0 && !isLoading ? (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                No API keys yet.
              </div>
            ) : null}

            {apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="rounded-lg border p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{apiKey.name}</span>
                      <Badge variant={apiKey.revokedAt ? "secondary" : "default"}>
                        {apiKey.revokedAt ? "Revoked" : "Active"}
                      </Badge>
                    </div>
                    <p className="font-mono text-xs text-muted-foreground">{apiKey.prefix}...</p>
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(apiKey.createdAt).toLocaleString()}
                      {apiKey.lastUsedAt ? ` • Last used ${new Date(apiKey.lastUsedAt).toLocaleString()}` : ""}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    disabled={Boolean(apiKey.revokedAt) || deletingId === apiKey.id}
                    onClick={() => handleRevoke(apiKey.id)}
                  >
                    {deletingId === apiKey.id ? "Revoking..." : "Revoke"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="text-sm font-medium">REST endpoints</h3>
          <div className="rounded-lg bg-muted p-4">
            <pre className="overflow-x-auto text-xs leading-6 text-muted-foreground">
{`Authorization: Bearer YOUR_API_KEY

GET    /api/v1/qr-codes
POST   /api/v1/qr-codes
GET    /api/v1/qr-codes/:id
PATCH  /api/v1/qr-codes/:id
DELETE /api/v1/qr-codes/:id
GET    /api/v1/analytics/summary
GET    /api/v1/analytics/scans?limit=100
GET    /api/v1/analytics/scans?qrId=QR_ID&limit=100`}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
