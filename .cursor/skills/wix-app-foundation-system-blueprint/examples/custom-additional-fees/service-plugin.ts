// @ts-nocheck — reference skeleton, not real source. Imports point at placeholder paths or modules that aren't installed in this skills repo. See examples/INDEX.md.
// VERBATIM (scrubbed) from custom-additional-fees/src/backend/service-plugins/ecom-additional-fees/additional-fee/plugin.ts.
// Goes at: src/backend/service-plugins/ecom-additional-fees/<plugin-name>/plugin.ts
//
// This is the canonical PRPL Service Plugin pattern:
//   1. provideHandlers({ <SPI_METHOD>: async ({ request, metadata }) => {...} })
//   2. The SPI method name is fixed by the schema ($schema in plugin.json) — for
//      ecom-additional-fees.json it's calculateAdditionalFees.
//   3. Inside, do whatever business logic — query products, query our own data
//      collection (via auth.elevate), match, return { additionalFees, currency }.

import { additionalFees } from '@wix/ecom/service-plugins';
import { products } from '@wix/stores';
import { auth } from '@wix/essentials';
import { ALL_PRODUCTS_ID, listFees } from '../../../_shared/fees-store';

additionalFees.provideHandlers({
  calculateAdditionalFees: async ({ request, metadata }) => {
    const itemIds =
      request.lineItems
        ?.map((item: any) => item?.catalogReference?.catalogItemId)
        ?.filter(Boolean) ?? [];

    const currency = metadata?.currency ?? undefined;

    if (itemIds.length === 0) {
      return { additionalFees: [], currency };
    }

    /* Fetch the product objects so we can read their collection IDs */
    const elevatedQueryProducts = auth.elevate(products.queryProducts);
    const productsResponse = await elevatedQueryProducts().in('_id', itemIds).find();

    /* Build a Set of all collections referenced by any product in the cart */
    const collectionIds = new Set<string>();
    for (const p of productsResponse?.items ?? []) {
      for (const cid of (p as any)?.collectionIds ?? []) {
        if (cid) collectionIds.add(String(cid));
      }
    }

    /* Get the merchant's configured fees from our data collection */
    const dbFees = await listFees();

    /* A fee applies if its collectionId is in the cart's collections,
     * OR if its collectionId is the ALL_PRODUCTS_ID sentinel ('all-products'). */
    const matched = (dbFees ?? []).filter((fee: any) => {
      const feeCollectionId = String(fee?.collectionId ?? '');
      if (!feeCollectionId) return false;
      if (feeCollectionId === ALL_PRODUCTS_ID) return true;
      return collectionIds.has(feeCollectionId);
    });

    /* IMPORTANT: Wix expects price as STRING (decimal), not number.
     * Use String(safePrice) — never .toFixed(2) (locale-dependent). */
    const fees = matched.map((fee: any) => {
      const priceNum = Number(fee?.price ?? 0);
      const safePrice = Number.isFinite(priceNum) ? priceNum : 0;
      return {
        name: fee?.name,
        description: fee?.description,
        price: String(safePrice),
      };
    });

    return { additionalFees: fees, currency };
  },
});
