// @ts-nocheck — reference skeleton, not real source. Imports point at placeholder paths or modules that aren't installed in this skills repo. See examples/INDEX.md.
//
// Lives at: src/pages/api/secret/save.ts
//
// Pattern: an API route that accepts a provider credential, server-side
// probes it for validity + environment, and persists it with the auto-
// detected `sandboxMode` flag. Use this shape (validate → probe → persist)
// for any "paste your provider key" dashboard flow.

import type { APIRoute } from 'astro';
import {
  isValidPayPalClientId,
  saveCredentials,
} from '../../../extensions/_shared/credentials.ts';
import {
  probePayPalClientId,
  type TokenKind,
} from '../../../extensions/_shared/paypal-token-probe.ts';

interface SaveResponse {
  ok: boolean;
  error?: string;
  detectedKind?: TokenKind;
  sandboxMode?: boolean;
  probeReason?: string;
}

// CORS preflight — mandatory on every Astro API route. Astro's auto OPTIONS
// has no CORS headers, so the browser blocks the real request.
export const OPTIONS: APIRoute = async () =>
  new Response(null, { status: 204 });

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as {
      token?: string;
      sandboxMode?: boolean;
    };

    if (typeof body.token !== 'string' || body.token.trim().length === 0) {
      const payload: SaveResponse = { ok: false, error: 'Empty client ID' };
      return new Response(JSON.stringify(payload), {
        status: 400,
        statusText: 'Bad Request',
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cleanToken = body.token.trim();

    // 1. Cheap format check first — saves a network round-trip if the user
    //    pasted random text.
    if (!isValidPayPalClientId(cleanToken)) {
      const payload: SaveResponse = {
        ok: false,
        error:
          'Invalid PayPal client ID. Must be at least 20 characters and only contain letters, digits, dashes and underscores.',
      };
      return new Response(JSON.stringify(payload), {
        status: 400,
        statusText: 'Bad Request',
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Server-side token probe — fires 4 parallel checks against PayPal
    //    (live SDK + sandbox SDK + live OAuth + sandbox OAuth) and combines
    //    the signals to detect environment.
    const probe = await probePayPalClientId(cleanToken);

    if (probe.kind === 'invalid') {
      const payload: SaveResponse = {
        ok: false,
        error:
          probe.reason ||
          'PayPal rejected this client ID. Double-check that you copied the full client ID from your PayPal Developer Dashboard.',
        detectedKind: 'invalid',
      };
      return new Response(JSON.stringify(payload), {
        status: 400,
        statusText: 'Bad Request',
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. Detected environment overrides whatever the user picked in the
    //    UI — auto-detection is more reliable than asking. Fallback to the
    //    body value only if the probe came back as `unknown`.
    const detectedSandboxMode =
      probe.kind === 'sandbox'
        ? true
        : probe.kind === 'live'
          ? false
          : undefined;

    const finalSandboxMode =
      detectedSandboxMode !== undefined
        ? detectedSandboxMode
        : typeof body.sandboxMode === 'boolean'
          ? body.sandboxMode
          : false;

    await saveCredentials(cleanToken, finalSandboxMode);

    const payload: SaveResponse = {
      ok: true,
      detectedKind: probe.kind,
      sandboxMode: finalSandboxMode,
      probeReason: probe.reason,
    };
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'failed';
    console.error('Failed to save client ID:', err);
    const payload: SaveResponse = { ok: false, error: message };
    return new Response(JSON.stringify(payload), {
      status: 500,
      statusText: 'Internal Server Error',
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
