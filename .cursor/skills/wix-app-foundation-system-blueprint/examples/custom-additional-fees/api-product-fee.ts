// @ts-nocheck — reference skeleton, not real source. Imports point at placeholder paths or modules that aren't installed in this skills repo. See examples/INDEX.md.
// VERBATIM from custom-additional-fees/src/backend/api/product-fee/api.ts.
// Goes at: src/backend/api/<resource>/api.ts
// HTTP route: /_serverless/<appName>/<resource>?productId=...
//
// Site-plugin-facing endpoint: returns the SINGLE fee that applies to one product.
// Site widgets call this via httpClient.fetchWithAuth() so the request carries
// the Wix access token (direct webMethod calls from site widgets don't include it).

import { products } from '@wix/stores';
import { ALL_PRODUCTS_ID, listFees } from '../../_shared/fees-store';

export async function GET(req: Request) {
  const searchParams = new URL(req.url).searchParams;
  const productId = searchParams.get('productId') ?? '';

  if (!productId) return Response.json(null);

  const { product } = await products.getProduct(productId);
  const productCollectionIds = ((product as any)?.collectionIds ?? []).map(String);

  const fees = await listFees();

  /* Prefer a fee whose collection actually contains this product;
   * fall back to the ALL_PRODUCTS_ID fee if any. */
  const feeByCollection = fees.find((f) =>
    productCollectionIds.includes(String(f.collectionId))
  ) ?? null;

  const feeAllProducts = fees.find(
    (f) => String(f.collectionId) === ALL_PRODUCTS_ID
  ) ?? null;

  const fee = feeByCollection ?? feeAllProducts ?? null;
  if (!fee) return Response.json(null);

  const currency = (product as any)?.priceData?.currency ?? undefined;
  return Response.json({ ...fee, currency });
}
