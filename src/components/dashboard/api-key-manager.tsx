"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import type { ApiAccessScope, ApiKeySummary } from "@/lib/types";

const AVAILABLE_SCOPES: Array<{ value: ApiAccessScope; label: string }> = [
  { value: "qr:read", label: "Read QR codes" },
  { value: "qr:write", label: "Create and edit QR codes" },
  { value: "analytics:read", label: "Read analytics" },
  { value: "brand:read", label: "Read brand profile" },
  { value: "brand:write", label: "Edit brand profile" },
  { value: "styles:read", label: "Read style presets" },
  { value: "styles:write", label: "Edit style presets" },
];

interface ApiKeyListItem extends Omit<ApiKeySummary, "createdAt" | "lastUsedAt" | "revokedAt"> {
  createdAt: string | Date;
  lastUsedAt: string | Date | null;
  revokedAt: string | Date | null;
}

interface ApiKeyCreateResponse {
  apiKey: string;
  record: ApiKeyListItem;
}

function formatDate(value: string | Date | null) {
  if (!value) {
    return null;
  }

  return new Date(value).toLocaleString();
}

function parseOrigins(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function ApiKeyManager() {
  const [apiKeys, setApiKeys] = useState<ApiKeyListItem[]>([]);
  const [publishableTokens, setPublishableTokens] = useState<ApiKeyListItem[]>([]);
  const [name, setName] = useState("Production key");
  const [publishableName, setPublishableName] = useState("Public web app");
  const [publishableOrigins, setPublishableOrigins] = useState("http://localhost:3000");
  const [publishableScopes, setPublishableScopes] = useState<ApiAccessScope[]>(["qr:read", "analytics:read"]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingPublishable, setIsCreatingPublishable] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [newPublishableSecret, setNewPublishableSecret] = useState<string | null>(null);

  useEffect(() => {
    void loadTokens();
  }, []);

  async function loadTokens() {
    setIsLoading(true);
    try {
      const [apiKeyResponse, publishableResponse] = await Promise.all([
        fetch("/api/dashboard/api-keys"),
        fetch("/api/dashboard/publishable-tokens"),
      ]);

      if (!apiKeyResponse.ok || !publishableResponse.ok) {
        throw new Error("Failed to load token data");
      }

      const [apiKeyData, publishableData] = await Promise.all([
        apiKeyResponse.json(),
        publishableResponse.json(),
      ]);

      setApiKeys((apiKeyData.apiKeys ?? []) as ApiKeyListItem[]);
      setPublishableTokens((publishableData.tokens ?? []) as ApiKeyListItem[]);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load API access");
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

      const data = (await response.json()) as ApiKeyCreateResponse;
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

  async function handleCreatePublishable() {
    const allowedOrigins = parseOrigins(publishableOrigins);
    if (!publishableName.trim()) {
      toast.error("Token name is required");
      return;
    }
    if (publishableScopes.length === 0) {
      toast.error("Select at least one scope");
      return;
    }
    if (allowedOrigins.length === 0) {
      toast.error("Add at least one allowed origin");
      return;
    }

    setIsCreatingPublishable(true);
    try {
      const response = await fetch("/api/dashboard/publishable-tokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: publishableName,
          scopes: publishableScopes,
          allowedOrigins,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create publishable token");
      }

      const data = (await response.json()) as ApiKeyCreateResponse;
      setNewPublishableSecret(data.apiKey);
      setPublishableTokens((current) => [data.record, ...current]);
      toast.success("Publishable token created");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create publishable token");
    } finally {
      setIsCreatingPublishable(false);
    }
  }

  async function handleRevoke(id: string, kind: "secret" | "publishable") {
    setDeletingId(id);
    try {
      const response = await fetch(
        kind === "secret" ? `/api/dashboard/api-keys/${id}` : `/api/dashboard/publishable-tokens/${id}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to revoke token");
      }

      const setter = kind === "secret" ? setApiKeys : setPublishableTokens;
      setter((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                revokedAt: new Date().toISOString(),
              }
            : item,
        ),
      );
      toast.success(kind === "secret" ? "API key revoked" : "Publishable token revoked");
    } catch (error) {
      console.error(error);
      toast.error("Failed to revoke token");
    } finally {
      setDeletingId(null);
    }
  }

  async function copySecret(secret: string, label: string) {
    try {
      await navigator.clipboard.writeText(secret);
      toast.success(`${label} copied`);
    } catch (error) {
      console.error(error);
      toast.error(`Failed to copy ${label.toLowerCase()}`);
    }
  }

  function toggleScope(scope: ApiAccessScope, checked: boolean) {
    setPublishableScopes((current) =>
      checked ? Array.from(new Set([...current, scope])) : current.filter((item) => item !== scope),
    );
  }

  function renderTokenList(items: ApiKeyListItem[], kind: "secret" | "publishable") {
    if (items.length === 0 && !isLoading) {
      return (
        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          No {kind === "secret" ? "API keys" : "publishable tokens"} yet.
        </div>
      );
    }

    return items.map((item) => (
      <div key={item.id} className="rounded-lg border p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{item.name}</span>
              <Badge variant={item.revokedAt ? "secondary" : "default"}>
                {item.revokedAt ? "Revoked" : "Active"}
              </Badge>
              <Badge variant="outline">{item.kind === "secret" ? "Server" : "Browser"}</Badge>
            </div>
            <p className="font-mono text-xs text-muted-foreground">{item.prefix}...</p>
            <p className="text-xs text-muted-foreground">
              Created {formatDate(item.createdAt)}
              {item.lastUsedAt ? ` • Last used ${formatDate(item.lastUsedAt)}` : ""}
            </p>
            {item.allowedOrigins?.length ? (
              <p className="text-xs text-muted-foreground">Origins: {item.allowedOrigins.join(", ")}</p>
            ) : null}
            {item.scopes?.length ? (
              <p className="text-xs text-muted-foreground">Scopes: {item.scopes.join(", ")}</p>
            ) : null}
          </div>

          <Button
            variant="outline"
            disabled={Boolean(item.revokedAt) || deletingId === item.id}
            onClick={() => handleRevoke(item.id, kind)}
          >
            {deletingId === item.id ? "Revoking..." : "Revoke"}
          </Button>
        </div>
      </div>
    ));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>API access</CardTitle>
        <CardDescription>
          Create server-only bearer keys and browser-safe publishable tokens for the `tqrco` SDK.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="space-y-4 rounded-xl border p-4">
            <div className="space-y-1">
              <h3 className="text-sm font-medium">Secret server key</h3>
              <p className="text-sm text-muted-foreground">
                Use this in server code, SSR, cron jobs, or backend integrations.
              </p>
            </div>
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
                <p className="font-medium text-amber-950">Copy this secret now.</p>
                <p className="mt-1 text-amber-900">You will only see the raw key once.</p>
                <div className="mt-3 flex flex-col gap-3 md:flex-row">
                  <Input readOnly value={newSecret} className="font-mono text-xs" />
                  <Button variant="outline" onClick={() => copySecret(newSecret, "API key")}>
                    Copy
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-4 rounded-xl border p-4">
            <div className="space-y-1">
              <h3 className="text-sm font-medium">Publishable browser token</h3>
              <p className="text-sm text-muted-foreground">
                Lock browser access to specific origins and scopes for external React apps.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="publishable-name">Token name</Label>
              <Input
                id="publishable-name"
                value={publishableName}
                onChange={(event) => setPublishableName(event.target.value)}
                placeholder="Public web app"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="publishable-origins">Allowed origins</Label>
              <Textarea
                id="publishable-origins"
                value={publishableOrigins}
                onChange={(event) => setPublishableOrigins(event.target.value)}
                placeholder={"https://app.example.com\nhttp://localhost:3000"}
              />
            </div>
            <div className="space-y-3">
              <Label>Scopes</Label>
              <div className="grid gap-3 md:grid-cols-2">
                {AVAILABLE_SCOPES.map((scope) => (
                  <label key={scope.value} className="flex items-start gap-3 rounded-lg border p-3 text-sm">
                    <Checkbox
                      checked={publishableScopes.includes(scope.value)}
                      onCheckedChange={(checked) => toggleScope(scope.value, checked === true)}
                    />
                    <span>{scope.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleCreatePublishable} disabled={isCreatingPublishable}>
                {isCreatingPublishable ? "Creating..." : "Create publishable token"}
              </Button>
            </div>
            {newPublishableSecret ? (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm">
                <p className="font-medium text-amber-950">Copy this publishable token now.</p>
                <p className="mt-1 text-amber-900">The raw token is shown once, even though it is origin-scoped.</p>
                <div className="mt-3 flex flex-col gap-3 md:flex-row">
                  <Input readOnly value={newPublishableSecret} className="font-mono text-xs" />
                  <Button variant="outline" onClick={() => copySecret(newPublishableSecret, "Publishable token")}>
                    Copy
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Issued server keys</h3>
            {isLoading ? <span className="text-sm text-muted-foreground">Loading...</span> : null}
          </div>
          <div className="space-y-3">{renderTokenList(apiKeys, "secret")}</div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Issued publishable tokens</h3>
          </div>
          <div className="space-y-3">{renderTokenList(publishableTokens, "publishable")}</div>
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="text-sm font-medium">SDK defaults</h3>
          <div className="rounded-lg bg-muted p-4">
            <pre className="overflow-x-auto text-xs leading-6 text-muted-foreground">
{`npm install tqrco

Server API base URL: https://tqrco.de
Marketing domain:    https://theqrcode.co

Secret keys:
  Use in server code only.

Publishable tokens:
  Use in browser apps with allowed origins + scopes.

GET    /api/v1/qr-codes
POST   /api/v1/qr-codes
GET    /api/v1/qr-codes/:id
PATCH  /api/v1/qr-codes/:id
DELETE /api/v1/qr-codes/:id
GET    /api/v1/analytics/summary
GET    /api/v1/analytics/scans?limit=100
GET    /api/v1/brand
PUT    /api/v1/brand
GET    /api/v1/styles
POST   /api/v1/styles
GET    /api/v1/styles/:id
PATCH  /api/v1/styles/:id
DELETE /api/v1/styles/:id`}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
