// @ts-nocheck — reference skeleton, not real source. Imports point at placeholder paths or modules that aren't installed in this skills repo. See examples/INDEX.md.
// VERBATIM (scrubbed) from password-protected/src/backend/api/verify-lock-password/api.ts.
// Goes at: src/backend/api/verify-lock-password/api.ts
//
// HTTP API endpoint exposed at: /_serverless/<appName>/verify-lock-password
//
// CRITICAL: site widgets MUST call this with httpClient.fetchWithAuth() — direct
// webMethod calls from site widgets do NOT include the Wix access token in production
// and will fail. Use the HTTP API for any cross-instance backend reads from a widget.

import { verifyLockPasswordLogic } from "../../app-instance.web";

export interface VerifyLockPasswordBody {
  lockKey?: string;
  password?: string;
}

export async function POST(req: Request): Promise<Response> {
  try {
    const body = (await req.json()) as VerifyLockPasswordBody;
    const lockKey = body?.lockKey != null ? String(body.lockKey) : "";
    const password = body?.password != null ? String(body.password) : "";
    const result = await verifyLockPasswordLogic(lockKey, password);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Verify lock password API error:", err);
    return new Response(JSON.stringify({ success: false }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
