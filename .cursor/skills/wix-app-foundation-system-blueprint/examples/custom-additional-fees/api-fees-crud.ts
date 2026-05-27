// @ts-nocheck — reference skeleton, not real source. Imports point at placeholder paths or modules that aren't installed in this skills repo. See examples/INDEX.md.
// VERBATIM (scrubbed) from custom-additional-fees/src/backend/api/custom-additional-fees/api.ts.
// Goes at: src/backend/api/<resource>/api.ts
// HTTP route: /_serverless/<appName>/<resource>
//
// Canonical PRPL HTTP API CRUD pattern:
//   GET    /<resource>           — list, with enriched-from-Stores fields
//   POST   /<resource>           — create (server-generated UUID if not provided)
//   PUT    /<resource>/<id>      — update by id (parsed from URL path)
//   DELETE /<resource>/<id>      — delete by id

import { collections, products } from '@wix/stores';
import type { AdditionalFee } from '../../../types';
import { ALL_PRODUCTS_ID, listFees, createFee, updateFee, deleteFee } from '../../_shared/fees-store';

/** Extract the trailing id from /api/foo/<id>. */
function getIdFromReq(req: Request) {
  const url = new URL(req.url);
  const parts = url.pathname.split('/').filter(Boolean);
  return parts[parts.length - 1];
}

function pickCollectionFields(c: any) {
  if (!c) return null;
  return {
    _id: String(c._id ?? c.id ?? ''),
    name: String(c.name ?? ''),
    numberOfProducts:
      typeof c.numberOfProducts === 'number' ? c.numberOfProducts
      : typeof c.numberOfItems === 'number'   ? c.numberOfItems
      : typeof c.productCount === 'number'    ? c.productCount
      : undefined,
  };
}

async function buildCollectionsMap(collectionIds: string[]) {
  const ids = Array.from(new Set(collectionIds.map(String).filter(Boolean)));
  if (ids.length === 0) return new Map<string, any>();

  const res = await collections.queryCollections().in('_id', ids).find();
  const map = new Map<string, any>();
  for (const c of res.items ?? []) {
    const id = String((c as any)._id ?? (c as any).id ?? '');
    if (id) map.set(id, pickCollectionFields(c));
  }
  return map;
}

function enrichFee(fee: AdditionalFee, collectionsMap: Map<string, any>) {
  const collectionId = String(fee.collectionId ?? '');

  if (collectionId === ALL_PRODUCTS_ID) {
    return {
      ...fee,
      collection: { _id: ALL_PRODUCTS_ID, name: 'All Products', numberOfProducts: undefined },
    };
  }

  if (!collectionId) return { ...fee, collection: null };

  return { ...fee, collection: collectionsMap.get(collectionId) ?? null };
}

export async function GET() {
  const fees = await listFees();
  const ids = fees
    .map((x) => String(x.collectionId ?? ''))
    .filter((id) => id && id !== ALL_PRODUCTS_ID);

  const collectionsMap = await buildCollectionsMap(ids);
  const items = fees.map((fee) => enrichFee(fee, collectionsMap));

  /* Best-effort store currency — query a single product for its priceData.currency.
   * Falls back to USD if the store has no products yet. */
  let currency = 'USD';
  try {
    const res = await products.queryProducts().limit(1).find();
    const first = res.items?.[0];
    if ((first as any)?.priceData?.currency) currency = (first as any).priceData.currency;
  } catch {}

  return Response.json({ items, currency });
}

export async function POST(req: Request) {
  const data = (await req.json()) as Partial<AdditionalFee>;

  const created = await createFee({
    id: String(data.id ?? crypto.randomUUID()),    // server-generated if not provided
    name: String(data.name ?? ''),
    description: String(data.description ?? ''),
    collectionId: String(data.collectionId ?? ALL_PRODUCTS_ID),
    price: Number.isFinite(Number(data.price)) ? Number(data.price) : 0,
  });

  const colId = String(created.collectionId ?? '');
  const collectionsMap = colId && colId !== ALL_PRODUCTS_ID
    ? await buildCollectionsMap([colId])
    : new Map<string, any>();

  return Response.json(enrichFee(created, collectionsMap));
}

export async function PUT(req: Request) {
  const id = getIdFromReq(req);
  const patch = (await req.json()) as Partial<AdditionalFee>;

  const updated = await updateFee(String(id), {
    name: patch.name,
    description: patch.description,
    collectionId: patch.collectionId,
    price: patch.price,
  });

  const colId = String(updated.collectionId ?? '');
  const collectionsMap = colId && colId !== ALL_PRODUCTS_ID
    ? await buildCollectionsMap([colId])
    : new Map<string, any>();

  return Response.json(enrichFee(updated, collectionsMap));
}

export async function DELETE(req: Request) {
  const id = getIdFromReq(req);
  await deleteFee(String(id));
  return new Response(null, { status: 204 });
}
