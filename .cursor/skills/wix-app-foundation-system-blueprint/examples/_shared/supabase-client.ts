// @ts-nocheck — reference skeleton, not real source. Imports point at placeholder paths or modules that aren't installed in this skills repo. See examples/INDEX.md.
// Canonical PRPL Supabase client.
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
//   - Astro Astro API routes (`src/pages/api/...`):
//       src/extensions/_shared/supabase-client.ts
//
// The foundation pipeline auto-mirrors the file to all canonical Astro
// paths so every importer resolves — but emit your own copies too,
// because the AI's path guesses are usually wrong.
//
// **MUST be gitignored before first commit.**
// Add to .gitignore:
//   # secrets
//   src/**/supabase-client.ts

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "<SUPABASE_URL>";              // e.g. https://xxxxxxxx.supabase.co
const SUPABASE_SERVICE_KEY = "<SUPABASE_SERVICE_KEY>"; // service-role key — server-side only, NEVER ship to client

export function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}
