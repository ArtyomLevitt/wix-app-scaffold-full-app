// @ts-nocheck — reference skeleton, not real source. Imports point at placeholder paths or modules that aren't installed in this skills repo. See examples/INDEX.md.
// VERBATIM (scrubbed) from shipping-address-verifier/src/backend/service-plugins/ecom-validations/my-service-plugin/settings.ts.
// Goes at: src/backend/service-plugins/<spi-name>/<plugin-name>/settings.ts
//
// Single-row settings store: collection has exactly ONE row keyed _id: 'settings'.
// items.save({ _id, ... }) upserts in one call.
//
// All access uses auth.elevate() because:
//   - the service plugin handler runs in checkout's elevated context (no current user)
//   - the dashboard reads/writes via the settings.web.ts web methods
//
// MISSING_COLLECTION_HINT: long, actionable error so devs know which extension to create
// and which fields to declare on first install.

import { auth } from "@wix/essentials";
import { items } from "@wix/data";

const elevatedGet  = auth.elevate(items.get);
const elevatedSave = auth.elevate(items.save);

export type ShippingVerifierSettings = {
  enabled: boolean;
  allowedCountriesCsv: string;
  blockedCountriesCsv: string;
  requirePostalCode: boolean;
  blockedPostalRegex: string;
  validateStateZip: boolean;
};

export type SettingsDiagnostics = {
  collectionId: string;
  settingsId: string;
  status: "ok" | "missing-collection" | "error";
  errorMessage?: string;
  errorName?: string;
};

const COLLECTION_ID = "@<APP_NS>/shipping-address-verifier/ShippingAddressVerifierSettings";
const SETTINGS_ID = "settings";
const MISSING_COLLECTION_HINT =
  "Settings collection not found. Create a Data Collections extension in the App Dashboard with collection ID suffix 'ShippingAddressVerifierSettings' and fields: enabled (boolean), allowedCountriesCsv (text), blockedCountriesCsv (text), requirePostalCode (boolean), blockedPostalRegex (text), validateStateZip (boolean).";

const DEFAULTS: ShippingVerifierSettings = {
  enabled: true,
  allowedCountriesCsv: "",
  blockedCountriesCsv: "",
  requirePostalCode: false,
  blockedPostalRegex: "",
  validateStateZip: false,
};

function safeString(v: any): string {
  if (v === null || v === undefined) return "";
  return String(v);
}

function normalizeCsv(csv: any): string {
  return safeString(csv)
    .split(",")
    .map((x) => x.trim().toUpperCase())
    .filter(Boolean)
    .join(",");
}

function isMissingCollectionError(e: any): boolean {
  const message = String(e?.message ?? "").toLowerCase();
  return (
    message.includes("collection") &&
    (message.includes("not found") ||
      message.includes("does not exist") ||
      message.includes("missing"))
  );
}

function toMissingCollectionError(): Error {
  return new Error(MISSING_COLLECTION_HINT);
}

export async function getDiagnostics(): Promise<SettingsDiagnostics> {
  try {
    await elevatedGet(COLLECTION_ID, SETTINGS_ID);
    return { collectionId: COLLECTION_ID, settingsId: SETTINGS_ID, status: "ok" };
  } catch (e: any) {
    if (isMissingCollectionError(e)) {
      return {
        collectionId: COLLECTION_ID,
        settingsId: SETTINGS_ID,
        status: "missing-collection",
        errorMessage: MISSING_COLLECTION_HINT,
        errorName: e?.name ?? "Error",
      };
    }
    return {
      collectionId: COLLECTION_ID,
      settingsId: SETTINGS_ID,
      status: "error",
      errorMessage: String(e?.message ?? e),
      errorName: e?.name ?? "Error",
    };
  }
}

export async function getSettings(): Promise<ShippingVerifierSettings> {
  try {
    const item = await elevatedGet(COLLECTION_ID, SETTINGS_ID);
    return {
      enabled: Boolean((item as any)?.enabled),
      allowedCountriesCsv: normalizeCsv((item as any)?.allowedCountriesCsv),
      blockedCountriesCsv: normalizeCsv((item as any)?.blockedCountriesCsv),
      requirePostalCode: Boolean((item as any)?.requirePostalCode),
      blockedPostalRegex: safeString((item as any)?.blockedPostalRegex),
      validateStateZip: Boolean((item as any)?.validateStateZip),
    };
  } catch (e: any) {
    console.error("[settings] getSettings ERROR — returning defaults", {
      message: e?.message,
      name: e?.name,
      collectionId: COLLECTION_ID,
    });
    return DEFAULTS;
  }
}

export async function saveSettings(
  next: ShippingVerifierSettings
): Promise<{ ok: true }> {
  const clean: ShippingVerifierSettings = {
    enabled: Boolean(next?.enabled),
    allowedCountriesCsv: normalizeCsv(next?.allowedCountriesCsv),
    blockedCountriesCsv: normalizeCsv(next?.blockedCountriesCsv),
    requirePostalCode: Boolean(next?.requirePostalCode),
    blockedPostalRegex: safeString(next?.blockedPostalRegex),
    validateStateZip: Boolean(next?.validateStateZip),
  };

  try {
    await elevatedSave(COLLECTION_ID, { _id: SETTINGS_ID, ...clean });
  } catch (e: any) {
    if (isMissingCollectionError(e)) {
      console.error("[settings] saveSettings missing collection:", COLLECTION_ID);
      throw toMissingCollectionError();
    }
    throw e;
  }

  return { ok: true };
}
