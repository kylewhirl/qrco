#!/usr/bin/env node

const REQUIRED_ENV_VARS = [
  "NEXT_PUBLIC_STACK_PROJECT_ID",
  "NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY",
  "STACK_SECRET_SERVER_KEY",
  "BILLING_GROWTH_EMAIL",
  "BILLING_CREATOR_EMAIL",
  "BILLING_FREE_EMAIL",
];

for (const key of REQUIRED_ENV_VARS) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const stackApiBaseUrl =
  process.env.NEXT_PUBLIC_SERVER_STACK_API_URL ||
  process.env.NEXT_PUBLIC_STACK_API_URL ||
  process.env.NEXT_PUBLIC_STACK_URL ||
  "https://api.stack-auth.com";

const appBaseUrl = process.env.APP_BASE_URL || "http://localhost:3002";

function stackHeaders(extra = {}) {
  return {
    "Content-Type": "application/json",
    "X-Stack-Override-Error-Status": "true",
    "X-Stack-Project-Id": process.env.NEXT_PUBLIC_STACK_PROJECT_ID,
    "X-Stack-Publishable-Client-Key": process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY,
    "X-Stack-Secret-Server-Key": process.env.STACK_SECRET_SERVER_KEY,
    "X-Stack-Access-Type": "server",
    "X-Stack-Client-Version": "tqrco-billing-verifier",
    "X-Stack-Random-Nonce": Math.random().toString(36).slice(2),
    "ngrok-skip-browser-warning": "true",
    ...extra,
  };
}

async function stackRequest(pathname, options = {}) {
  const response = await fetch(new URL(`/api/v1${pathname}`, stackApiBaseUrl), {
    ...options,
    headers: stackHeaders(options.headers),
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Stack request failed (${response.status}) ${pathname}: ${payload}`);
  }

  return response.json();
}

async function findUserByEmail(email) {
  const params = new URLSearchParams({
    query: email,
    limit: "20",
  });
  const response = await stackRequest(`/users?${params.toString()}`);
  return response.items.find((user) => user.primary_email?.toLowerCase() === email.toLowerCase()) ?? null;
}

async function createSessionCookies(userId) {
  const session = await stackRequest("/auth/sessions", {
    method: "POST",
    body: JSON.stringify({
      user_id: userId,
      expires_in_millis: 1000 * 60 * 60,
      is_impersonation: true,
    }),
  });

  const refreshCookieName = `stack-refresh-${process.env.NEXT_PUBLIC_STACK_PROJECT_ID}`;
  const accessCookieValue = JSON.stringify([session.refresh_token, session.access_token]);

  return [
    `${refreshCookieName}=${encodeURIComponent(session.refresh_token)}`,
    `stack-access=${encodeURIComponent(accessCookieValue)}`,
  ].join("; ");
}

async function appRequest(cookie, pathname, options = {}) {
  const response = await fetch(new URL(pathname, appBaseUrl), {
    method: options.method,
    headers: {
      cookie,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json") ? await response.json() : await response.text();

  return {
    status: response.status,
    body,
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function verifyUser(email, expectations) {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error(`Unable to find Stack user for ${email}`);
  }

  const cookie = await createSessionCookies(user.id);
  const billing = await appRequest(cookie, "/api/billing/summary");

  assert(billing.status === 200, `${email}: billing summary returned ${billing.status}`);
  assert(
    billing.body?.billing?.tier === expectations.tier,
    `${email}: expected tier ${expectations.tier}, got ${billing.body?.billing?.tier}`,
  );

  const domains = await appRequest(cookie, "/api/dashboard/domains");
  const apiKeys = await appRequest(cookie, "/api/dashboard/api-keys");

  if (expectations.locked) {
    assert(domains.status === 402, `${email}: expected domains to be locked`);
    assert(apiKeys.status === 402, `${email}: expected api keys to be locked`);
  } else {
    assert(domains.status === 200, `${email}: expected domains access, got ${domains.status}`);
    assert(apiKeys.status === 200, `${email}: expected api keys access, got ${apiKeys.status}`);
  }

  let setupIntentStatus = null;
  if (expectations.expectCheckoutReady) {
    const setupIntent = await appRequest(cookie, "/api/billing/setup-intent", {
      method: "POST",
      body: { tier: "creator" },
    });

    assert(setupIntent.status === 200, `${email}: expected setup intent, got ${setupIntent.status}`);
    assert(typeof setupIntent.body?.clientSecret === "string", `${email}: setup intent missing clientSecret`);
    setupIntentStatus = setupIntent.status;
  }

  return {
    email,
    userId: user.id,
    tier: billing.body.billing.tier,
    domainsStatus: domains.status,
    apiKeysStatus: apiKeys.status,
    setupIntentStatus,
  };
}

async function main() {
  const results = [];

  results.push(await verifyUser(process.env.BILLING_FREE_EMAIL, { tier: "free", locked: true, expectCheckoutReady: true }));
  results.push(await verifyUser(process.env.BILLING_CREATOR_EMAIL, { tier: "creator", locked: false }));
  results.push(await verifyUser(process.env.BILLING_GROWTH_EMAIL, { tier: "growth", locked: false }));

  console.log(JSON.stringify({ ok: true, appBaseUrl, results }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
