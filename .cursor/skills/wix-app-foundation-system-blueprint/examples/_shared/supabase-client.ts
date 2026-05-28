// @ts-nocheck — reference skeleton, not real source. Imports point at placeholder paths or modules that aren't installed in this skills repo. See examples/INDEX.md.
// Canonical PRPL Supabase client (env-based — safe to commit).
//
// Place it at ONE OR MORE of these paths, depending on what imports it.
// For Astro you usually need BOTH copies because web methods + event
// handlers resolve `_shared/` differently:
//
//   - Legacy CLI:
//       src/backend/_shared/supabase-client.ts
//
//   - Astro web methods (`src/extensions/backend/<x>.web.ts`) and event
//     handlers (`src/extensions/backend/events/<x>/<x>.ts`):
//       src/extensions/backend/_shared/supabase-client.ts
//
//   - Astro API routes (`src/pages/api/...`):
//       src/extensions/_shared/supabase-client.ts
//
// **This file is SAFE TO COMMIT** — it contains no secrets. Credentials
// live in `.env.local` (gitignored) and are read at runtime via
// `process.env`. Foundation's phased pipeline auto-mirrors the file to
// every canonical path and writes the env vars into the developer's
// `.env.local`. The agent build path (Via Agent / Cursor SDK) auto-injects
// an env-based copy too — so every fresh `git clone && npm install &&
// wix dev` resolves the import even before the developer fills in their
// credentials. Missing env vars only surface as a thrown error when an
// actual install/remove/plan-changed webhook fires AND tries to write to
// Supabase — `wix dev` itself boots cleanly.

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "";

export function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error(
      "Supabase env vars not set. Add SUPABASE_URL and SUPABASE_SERVICE_KEY " +
      "to your .env.local (or your hosting provider's env config). The " +
      "service-role key is server-side only — NEVER ship it to the client."
    );
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}
