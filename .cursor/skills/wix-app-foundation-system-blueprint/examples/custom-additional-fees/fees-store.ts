// @ts-nocheck — reference skeleton, not real source. Imports point at placeholder paths or modules that aren't installed in this skills repo. See examples/INDEX.md.
// VERBATIM (scrubbed) from custom-additional-fees/src/backend/_shared/fees-store.ts.
// Goes at: src/backend/_shared/<entity>-store.ts
//
// Canonical PRPL data-store wrapper:
//   1. Constants for namespace + collection ID — single source of truth
//   2. ALL_PRODUCTS_ID sentinel for "applies to everything" semantics
//   3. toFee() / toRecord() converters between API shape and DB shape
//   4. auth.elevate() on EVERY items.* method — works in both dashboard and service-plugin contexts
//   5. Graceful WDE0025 (collection-missing) handling — return [] on first install before data extension auto-creates the collection
//   6. Stable IDs end-to-end (_id: fee.id) — the dashboard, site plugin, and service plugin all reference the same row by the same UUID

import { items } from '@wix/data';
import { auth } from '@wix/essentials';
import type { AdditionalFee } from '../../types';

export const APP_NAMESPACE      = '@<APP_NS>/custom-additional-fees';
export const FEES_ID_SUFFIX     = 'custom-additional-fees';
export const FEES_COLLECTION_ID = `${APP_NAMESPACE}/${FEES_ID_SUFFIX}`;

export const ALL_PRODUCTS_ID = 'all-products';

type FeeRecord = {
  _id?: string;
  id?: string;
  name?: string;
  description?: string;
  collectionId?: string;
  price?: number;
};

function toFee(r: FeeRecord): AdditionalFee {
  const id = String(r._id ?? r.id ?? '');
  return {
    id,
    name: String(r.name ?? ''),
    description: String(r.description ?? ''),
    collectionId: String(r.collectionId ?? ALL_PRODUCTS_ID),
    price: Number.isFinite(Number(r.price)) ? Number(r.price) : 0,
  };
}

function isCollectionMissingError(err: any): boolean {
  const msg = String(err?.message ?? '');
  return msg.includes('WDE0025') || msg.includes('collection does not exist');
}

function isPermissionError(err: any): boolean {
  const msg = String(err?.message ?? '');
  return msg.toLowerCase().includes('forbidden') || msg.includes('WDE') || msg.includes('403');
}

const elevatedQueryItems  = auth.elevate(items.query);
const elevatedGetItem     = auth.elevate(items.get);
const elevatedInsertItem  = auth.elevate(items.insert);
const elevatedUpdateItem  = auth.elevate(items.update);
const elevatedRemoveItem  = auth.elevate(items.remove);

export async function listFees(): Promise<AdditionalFee[]> {
  try {
    const res = await elevatedQueryItems(FEES_COLLECTION_ID).limit(1000).find();
    return (res.items ?? []).map((x: any) => toFee(x as FeeRecord));
  } catch (err: any) {
    if (isCollectionMissingError(err)) return [];   // first-install grace
    if (isPermissionError(err)) {
      console.error('[fees-store] listFees permission error:', err);
      return [];
    }
    throw err;
  }
}

export async function createFee(fee: AdditionalFee): Promise<AdditionalFee> {
  const created = await elevatedInsertItem(FEES_COLLECTION_ID, {
    _id: fee.id,                     // STABLE ID — keep dashboard/site/service plugin in sync
    name: fee.name,
    description: fee.description,
    collectionId: fee.collectionId,
    price: fee.price,
  });
  return toFee(created as any);
}

export async function updateFee(id: string, patch: Partial<AdditionalFee>): Promise<AdditionalFee> {
  const current = await elevatedGetItem(FEES_COLLECTION_ID, id);
  const next = {
    ...(current as any),
    _id: id,
    name: patch.name ?? (current as any).name,
    description: patch.description ?? (current as any).description,
    collectionId: patch.collectionId ?? (current as any).collectionId,
    price: patch.price ?? (current as any).price,
  };
  const updated = await elevatedUpdateItem(FEES_COLLECTION_ID, next);
  return toFee(updated as any);
}

export async function deleteFee(id: string): Promise<void> {
  await elevatedRemoveItem(FEES_COLLECTION_ID, id);
}
