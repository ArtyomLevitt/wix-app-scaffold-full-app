// @ts-nocheck — reference skeleton, not real source. Imports point at placeholder paths or modules that aren't installed in this skills repo. See examples/INDEX.md.
//
// Lives at: src/extensions/_shared/paypal-token-probe.ts
//
// Pattern: detect which environment a third-party credential belongs to
// (sandbox vs live, staging vs prod) by combining multiple signals from
// the provider's APIs. PayPal exposes the same client ID surface in
// sandbox and live with no metadata, so we have to triangulate from
// SDK + OAuth responses across both environments.
//
// Reuse this whenever a provider has dual environments behind a single ID
// and you want the merchant to only paste the ID once (no env toggle).

import { isValidPayPalClientId } from './credentials.ts';

export type TokenKind = 'live' | 'sandbox' | 'invalid' | 'unknown';

export interface TokenProbeResult {
  kind: TokenKind;
  reason?: string;
}

const LIVE_SDK = 'https://www.paypal.com/sdk/js';
const SANDBOX_SDK = 'https://www.sandbox.paypal.com/sdk/js';
const SDK_QUERY = 'components=buttons&currency=USD&intent=capture';

const LIVE_OAUTH = 'https://api-m.paypal.com/v1/oauth2/token';
const SANDBOX_OAUTH = 'https://api-m.sandbox.paypal.com/v1/oauth2/token';

interface SdkProbe {
  ok: boolean;
  status: number;
  notRecognizedAnywhere: boolean;
  notRecognizedForProduction: boolean;
  notRecognizedForSandbox: boolean;
}

interface OAuthProbe {
  status: number;
  /** PayPal accepted the client_id and issued an access_token. */
  recognized: boolean;
  /** PayPal returned a structured `invalid_client` rejection. */
  invalidClient: boolean;
  /** Network or other failure unrelated to the credentials. */
  unreachable: boolean;
}

function inspectSdkBody(body: string) {
  if (!body) {
    return {
      hasValidationError: false,
      notRecognizedAnywhere: false,
      notRecognizedForProduction: false,
      notRecognizedForSandbox: false,
    };
  }
  const lower = body.toLowerCase();
  const hasValidationError =
    body.startsWith('throw new Error') || lower.includes('sdk validation error');
  const notRecognizedAnywhere = lower.includes(
    'not recognized for either production or sandbox',
  );
  return {
    hasValidationError,
    notRecognizedAnywhere,
    notRecognizedForProduction:
      !notRecognizedAnywhere && lower.includes('not recognized for production'),
    notRecognizedForSandbox:
      !notRecognizedAnywhere && lower.includes('not recognized for sandbox'),
  };
}

async function probeSdk(baseUrl: string, clientId: string): Promise<SdkProbe> {
  const url = `${baseUrl}?client-id=${encodeURIComponent(clientId)}&${SDK_QUERY}`;
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'follow' });
    let body = '';
    try {
      body = await res.text();
    } catch {
      /* ignore body read failure */
    }
    const inspection = inspectSdkBody(body);
    return {
      ok: res.ok && !inspection.hasValidationError,
      status: res.status,
      notRecognizedAnywhere: inspection.notRecognizedAnywhere,
      notRecognizedForProduction: inspection.notRecognizedForProduction,
      notRecognizedForSandbox: inspection.notRecognizedForSandbox,
    };
  } catch {
    return {
      ok: false,
      status: 0,
      notRecognizedAnywhere: false,
      notRecognizedForProduction: false,
      notRecognizedForSandbox: false,
    };
  }
}

function makeBasicAuth(clientId: string): string {
  const raw = `${clientId}:`;
  if (typeof Buffer !== 'undefined') {
    return `Basic ${Buffer.from(raw, 'utf-8').toString('base64')}`;
  }
  return `Basic ${btoa(raw)}`;
}

async function probeOAuth(
  baseUrl: string,
  clientId: string,
): Promise<OAuthProbe> {
  try {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: makeBasicAuth(clientId),
      },
      body: 'grant_type=client_credentials',
    });
    let body = '';
    try {
      body = await res.text();
    } catch {
      /* ignore */
    }
    let parsed: Record<string, unknown> = {};
    try {
      parsed = body ? JSON.parse(body) : {};
    } catch {
      parsed = {};
    }
    if (res.ok && typeof parsed.access_token === 'string') {
      return {
        status: res.status,
        recognized: true,
        invalidClient: false,
        unreachable: false,
      };
    }
    if (res.status === 401 && parsed.error === 'invalid_client') {
      return {
        status: res.status,
        recognized: false,
        invalidClient: true,
        unreachable: false,
      };
    }
    return {
      status: res.status,
      recognized: false,
      invalidClient: false,
      unreachable: false,
    };
  } catch {
    return {
      status: 0,
      recognized: false,
      invalidClient: false,
      unreachable: true,
    };
  }
}

/**
 * Detect whether a PayPal client ID belongs to the Live or Sandbox environment.
 *
 * PayPal's SDK URLs (`/sdk/js`) return 200 for any valid client ID regardless
 * of environment, so they can only tell us "valid vs not". Environment
 * detection happens via the OAuth token endpoints — sandbox apps frequently
 * issue a token to client_credentials with no secret, while live apps return
 * 401 `invalid_client`. We combine all four signals:
 *
 *   1. SDK explicitly rejects the client ID for both environments
 *      (`not recognized for either production or sandbox`) → invalid.
 *   2. SDK rejection mentions only `production` or only `sandbox` → that other
 *      side is the right environment.
 *   3. OAuth: sandbox accepts (200 + access_token), live rejects → sandbox.
 *   4. OAuth: live accepts (200 + access_token), sandbox rejects → live.
 *   5. OAuth: only one side returned `invalid_client` (the other was reachable
 *      but didn't issue a token) → the OK side is the environment.
 *   6. Both OAuth sides return `invalid_client` and SDK accepted the key →
 *      it's a live app that requires a secret (most production apps). Default
 *      to live.
 *   7. Otherwise unknown.
 */
export async function probePayPalClientId(
  clientId: string,
): Promise<TokenProbeResult> {
  const clean = String(clientId || '').trim();
  if (!clean) return { kind: 'invalid', reason: 'Empty client ID' };
  if (!isValidPayPalClientId(clean)) {
    return {
      kind: 'invalid',
      reason:
        'Invalid PayPal client ID format. Use the client ID from your PayPal Developer Dashboard.',
    };
  }

  const [liveSdk, sandboxSdk, liveOAuth, sandboxOAuth] = await Promise.all([
    probeSdk(LIVE_SDK, clean),
    probeSdk(SANDBOX_SDK, clean),
    probeOAuth(LIVE_OAUTH, clean),
    probeOAuth(SANDBOX_OAUTH, clean),
  ]);

  if (liveSdk.notRecognizedAnywhere || sandboxSdk.notRecognizedAnywhere) {
    return {
      kind: 'invalid',
      reason:
        'PayPal could not validate this client ID. Generate a new one in the PayPal Developer Dashboard and save it again.',
    };
  }

  if (sandboxOAuth.recognized && !liveOAuth.recognized) {
    return { kind: 'sandbox' };
  }
  if (liveOAuth.recognized && !sandboxOAuth.recognized) {
    return { kind: 'live' };
  }

  if (
    sandboxSdk.notRecognizedForProduction ||
    liveSdk.notRecognizedForProduction
  ) {
    return { kind: 'sandbox' };
  }
  if (
    liveSdk.notRecognizedForSandbox ||
    sandboxSdk.notRecognizedForSandbox
  ) {
    return { kind: 'live' };
  }

  if (liveSdk.ok && !sandboxSdk.ok) return { kind: 'live' };
  if (!liveSdk.ok && sandboxSdk.ok) return { kind: 'sandbox' };

  if (liveSdk.ok && sandboxSdk.ok) {
    if (sandboxOAuth.invalidClient && !liveOAuth.invalidClient) {
      return { kind: 'live' };
    }
    if (liveOAuth.invalidClient && !sandboxOAuth.invalidClient) {
      return { kind: 'sandbox' };
    }
    return { kind: 'live' };
  }

  if (liveSdk.status === 0 && sandboxSdk.status === 0) {
    return {
      kind: 'unknown',
      reason: 'Could not reach PayPal to verify the client ID.',
    };
  }
  return {
    kind: 'invalid',
    reason:
      'PayPal could not validate this client ID. Generate a new one and try again.',
  };
}
