// @ts-nocheck — reference skeleton, not real source. Imports point at placeholder paths or modules that aren't installed in this skills repo. See examples/INDEX.md.
//
// Lives at: src/extensions/_shared/credentials.ts
//
// Pattern: store provider credentials (PayPal client ID, Stripe publishable
// key, Mapbox token, etc.) in a PRIVILEGED Wix Data collection. Every read/
// write goes through `auth.elevate(...)` so visitor sessions can never see
// the stored values.
//
// The `key` discriminator lets one collection hold multiple logical docs
// (here: `paypal_credentials` AND `usage_counter`) — see `data.extension.ts`.

import { items } from '@wix/data';
import { auth } from '@wix/essentials';
import { COLLECTION_DATA, CREDENTIALS_DOC_KEY } from './collections.ts';
import { probePayPalClientId, type TokenKind } from './paypal-token-probe.ts';

export interface PayPalCredentialsRecord {
  _id?: string;
  key: string;
  clientId?: string;
  sandboxMode?: boolean;
}

export interface PublicCredentialsStatus {
  connected: boolean;
  sandboxMode: boolean;
  clientIdPreview?: string;
  tokenKind?: TokenKind;
}

// Format check: PayPal client IDs are 80+ chars but we accept anything ≥ 20
// of [A-Za-z0-9_-]. The token probe is the real validator — this is just a
// cheap "did the user paste random text" guard.
export function isValidPayPalClientId(clientId: string | undefined | null): boolean {
  if (!clientId || typeof clientId !== 'string') return false;
  const clean = clientId.trim();
  if (clean.length < 20) return false;
  return /^[A-Za-z0-9_\-]+$/.test(clean);
}

async function findCredentialsRow(): Promise<PayPalCredentialsRecord | undefined> {
  const elevatedQuery = auth.elevate(items.query);
  const res = await elevatedQuery(COLLECTION_DATA)
    .eq('key', CREDENTIALS_DOC_KEY)
    .limit(1)
    .find();
  return res.items[0] as PayPalCredentialsRecord | undefined;
}

export async function getCredentials(): Promise<PayPalCredentialsRecord | undefined> {
  try {
    return await findCredentialsRow();
  } catch (err) {
    console.error('getCredentials failed:', err);
    return undefined;
  }
}

// Used by the dashboard "PayPal connected" card. With `probe: true` it
// re-probes the stored client ID and AUTO-CORRECTS `sandboxMode` if PayPal
// flipped — self-healing config beats requiring the merchant to remember
// which environment they're on.
export async function getCredentialsStatus(
  options: { probe?: boolean } = {},
): Promise<PublicCredentialsStatus> {
  const row = await getCredentials();
  const clientId = (row?.clientId ?? '').toString().trim();
  if (!clientId) {
    return { connected: false, sandboxMode: false };
  }

  const base: PublicCredentialsStatus = {
    connected: true,
    sandboxMode: !!row?.sandboxMode,
    clientIdPreview: `${clientId.slice(0, 8)}…${clientId.slice(-4)}`,
    tokenKind: row?.sandboxMode ? 'sandbox' : 'live',
  };

  if (options.probe) {
    try {
      const probe = await probePayPalClientId(clientId);
      base.tokenKind = probe.kind;
      if (probe.kind === 'sandbox' || probe.kind === 'live') {
        const detectedSandbox = probe.kind === 'sandbox';
        base.sandboxMode = detectedSandbox;
        if (detectedSandbox !== !!row?.sandboxMode) {
          try {
            await setSandboxMode(detectedSandbox);
          } catch (persistErr) {
            console.warn(
              'Failed to persist auto-detected sandbox mode:',
              persistErr,
            );
          }
        }
      }
    } catch (probeErr) {
      console.warn('Token probe failed during status check:', probeErr);
    }
  }

  return base;
}

export async function getPublicClientId(): Promise<{
  clientId?: string;
  sandboxMode: boolean;
}> {
  const row = await getCredentials();
  const clientId = (row?.clientId ?? '').toString().trim();
  return {
    clientId: clientId || undefined,
    sandboxMode: !!row?.sandboxMode,
  };
}

export async function saveCredentials(
  clientId: string,
  sandboxMode?: boolean,
): Promise<void> {
  const clean = String(clientId).trim();
  if (!clean) throw new Error('Empty PayPal client ID');
  if (!isValidPayPalClientId(clean)) {
    throw new Error('Invalid PayPal client ID. Must be at least 20 characters.');
  }

  const elevatedInsert = auth.elevate(items.insert);
  const elevatedUpdate = auth.elevate(items.update);

  const existing = await findCredentialsRow();
  const next: PayPalCredentialsRecord = {
    ...(existing ?? {}),
    key: CREDENTIALS_DOC_KEY,
    clientId: clean,
    ...(typeof sandboxMode === 'boolean' ? { sandboxMode } : {}),
  };

  if (existing?._id) {
    const updateItem = { ...next, _id: existing._id };
    await elevatedUpdate(COLLECTION_DATA, updateItem);
  } else {
    await elevatedInsert(COLLECTION_DATA, next);
  }
}

export async function setSandboxMode(sandboxMode: boolean): Promise<void> {
  const elevatedInsert = auth.elevate(items.insert);
  const elevatedUpdate = auth.elevate(items.update);

  const existing = await findCredentialsRow();
  const next: PayPalCredentialsRecord = {
    ...(existing ?? {}),
    key: CREDENTIALS_DOC_KEY,
    sandboxMode,
  };

  if (existing?._id) {
    const updateItem = { ...next, _id: existing._id };
    await elevatedUpdate(COLLECTION_DATA, updateItem);
  } else {
    await elevatedInsert(COLLECTION_DATA, next);
  }
}
