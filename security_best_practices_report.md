# Security Best Practices Report

## Executive Summary

This review found five concrete security issues in the app. The highest-risk issue is an unauthenticated file upload endpoint that allows arbitrary writes into Cloudflare R2 using attacker-chosen object keys. I also found a server-side SSRF path in the QR render pipeline, an architectural bypass of Neon authenticated access/RLS, an unauthenticated paid AI proxy endpoint, and overly broad database result logging that can leak sensitive user data into logs.

## Critical Findings

### SBP-001: Unauthenticated file upload allows arbitrary storage writes and possible file takeover

- Severity: Critical
- Location: `/Users/kyle/tqrco/src/app/api/upload/route.ts:4`
- Evidence:

```ts
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const code = formData.get("code");
  ...
  const key = `${code}.${extension}`;
  ...
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: body,
      ContentType: file.type,
    })
  );
}
```

Related client usage:

```ts
uploadForm.append("file", selectedFile);
uploadForm.append("code", code);
const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadForm });
```

- Impact: Any unauthenticated attacker can write arbitrary content into your R2 bucket, consume storage/bandwidth, and potentially overwrite objects for existing file-backed QR flows if they can guess the same key.
- Fix: Require authenticated ownership checks before upload, generate server-side object keys that are not attacker-controlled, and enforce size/content-type limits before accepting the file.
- Mitigation: Put bucket lifecycle/size quotas in place and reject duplicate object writes unless tied to the authenticated QR owner.
- False positive notes: If this route is blocked at the edge by some external auth layer, verify that at runtime. No such protection is visible in app code.

## High Findings

### SBP-002: User-controlled logo URLs are fetched server-side during QR rendering, enabling SSRF

- Severity: High
- Location: `/Users/kyle/tqrco/src/lib/qr-validation.ts:99`, `/Users/kyle/tqrco/src/lib/qr-renderer.ts:59`, `/Users/kyle/tqrco/src/app/api/v1/qr-codes/[id]/render/route.ts:63`
- Evidence:

```ts
export const qrLogoSettingsSchema = z.object({
  src: z.string().trim().min(1),
  size: z.number().min(0.1).max(0.8),
```

```ts
return {
  ...
  image: config.logoSettings?.src ?? undefined,
```

```ts
const rendered = await renderQRCodeBinary(qr, config, format);
```

- Impact: An authenticated user can store an internal URL such as `http://169.254.169.254/...` or an internal service hostname in `logoSettings.src`, then trigger server-side fetches from the render endpoint and use your server as an SSRF pivot.
- Fix: Do not allow arbitrary remote URLs in `logoSettings.src`; restrict logos to uploaded assets you control, or enforce an allowlist of trusted HTTPS origins and block private/link-local address space.
- Mitigation: Run egress filtering on the server/runtime so the app cannot reach instance metadata or internal-only networks.
- False positive notes: The exact fetch behavior comes from `qr-code-styling` in Node mode, but this app clearly passes attacker-controlled URLs into that server-side image pipeline.

## Medium Findings

### SBP-003: The app bypasses Neon authenticated access for all database operations

- Severity: Medium
- Location: `/Users/kyle/tqrco/src/lib/db.ts:13`, `/Users/kyle/tqrco/src/lib/db.ts:39`, `/Users/kyle/tqrco/src/lib/qr-service.ts:1`, `/Users/kyle/tqrco/src/lib/api-keys.ts:5`, `/Users/kyle/tqrco/src/lib/brand-styles.ts:3`, `/Users/kyle/tqrco/src/lib/custom-domains.ts:3`
- Evidence:

```ts
function getSql() {
  return neon(process.env.DATABASE_AUTHENTICATED_URL!, {
    authToken: async () => {
      const user = await stackServerApp.getUser();
      ...
      return accessToken;
    },
  });
}
```

```ts
export async function queryNoAuth<T>(queryString: string, params: unknown[] = []): Promise<T> {
  const result = await neon(process.env.DATABASE_URL!).query(queryString, params)
```

`query()` is defined but not used anywhere in `src/`; all data services import `queryNoAuth`.

- Impact: Your stated Stack Auth -> Neon authenticated-data boundary is not actually enforced at the database layer. Any server-side authorization mistake exposes the full service-role database rather than being constrained by per-user DB auth/RLS.
- Fix: Move tenant-facing queries to the authenticated Neon client, enable and rely on RLS where appropriate, and reserve the service URL for narrowly scoped admin tasks only.
- Mitigation: Audit every route for explicit user scoping until DB-enforced isolation is in place.
- False positive notes: This is an architectural weakness rather than a demonstrated direct exploit path by itself, but it materially increases the blast radius of any route bug.

### SBP-004: Unauthenticated AI route can be abused as an open proxy for paid model usage

- Severity: Medium
- Location: `/Users/kyle/tqrco/src/app/api/ai/route.ts:12`
- Evidence:

```ts
export async function POST(request: Request) {
  const { text } = await request.json();
  const apiKey = process.env.MISTRAL_API_KEY;
  ...
  const response = await fetch(
    `https://api.mistral.ai/v1/agents/completions`,
```

- Impact: Anyone on the internet can send prompts through your server using your Mistral credentials, causing direct cost exposure and making the endpoint available for abuse or spam.
- Fix: Require authentication and rate limiting, validate payload size, and consider removing the public route entirely if the feature is user-account scoped.
- Mitigation: Add provider-side budget alerts and usage caps immediately.
- False positive notes: If an upstream gateway already enforces auth or quotas, verify it; there is no protection visible in this repository.

### SBP-005: Raw database results are logged for every `queryNoAuth` call

- Severity: Medium
- Location: `/Users/kyle/tqrco/src/lib/db.ts:39`
- Evidence:

```ts
export async function queryNoAuth<T>(queryString: string, params: unknown[] = []): Promise<T> {
  try {
    const result = await neon(process.env.DATABASE_URL!).query(queryString, params)
    console.log("QR update result: ", result);
    return result as T
```

- Impact: Application logs can accumulate QR payloads, scan data, API key hashes, custom-domain records, and other user-associated data, widening the blast radius of any log access or third-party log sink compromise.
- Fix: Remove result logging entirely, or replace it with structured metadata that excludes row contents and sensitive identifiers.
- Mitigation: Treat historical logs as sensitive data and review retention/access controls.
- False positive notes: The exact exposure depends on where logs are shipped, but the application is clearly emitting raw query results today.
