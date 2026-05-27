// @ts-nocheck — reference skeleton, not real source. Imports point at placeholder paths or modules that aren't installed in this skills repo. See examples/INDEX.md.
import { validations } from "@wix/ecom/service-plugins";
import { getSettings } from "./settings";
import { getStateForZipPrefix, stateName } from "./us-zip-states";

function parseCsv(csv: any): string[] {
  return String(csv ?? "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
}

const DISPLAY_NAMES =
  typeof Intl !== "undefined" && "DisplayNames" in Intl
    ? new Intl.DisplayNames(["en"], { type: "region" })
    : null;

function normalizeCountry(value: any): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  return raw.toUpperCase();
}

/** Turn "IQ" into "Iraq", "IR" into "Iran", etc. */
function countryName(code: string): string {
  try {
    const name = DISPLAY_NAMES?.of(code.toUpperCase());
    if (name && name !== code) return name;
  } catch (_) {}
  return code;
}

/** Build a human-readable list: "Iraq, Iran and North Korea" */
function formatCountryList(codes: string[]): string {
  const names = codes.map(countryName);
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  return names.slice(0, -1).join(", ") + " and " + names[names.length - 1];
}

/**
 * The handler receives an envelope: { request: GetValidationViolationsRequest }
 * But the request itself has: { validationInfo, sourceInfo, ... }
 * validationInfo.shippingAddress is AddressWithContact: { address: { country, ... }, contactDetails }
 *
 * We handle both shapes defensively in case the runtime differs from types.
 */
function extractValidationInfo(payload: any): any {
  // SDK shape: { request: { validationInfo } }
  if (payload?.request?.validationInfo) return payload.request.validationInfo;
  // Flat shape: payload IS the options with { validationInfo } directly
  if (payload?.validationInfo) return payload.validationInfo;
  // Maybe the first positional arg has it
  return null;
}

/** Determine whether the request originates from CART or CHECKOUT */
function extractSource(payload: any): string {
  const src =
    payload?.request?.sourceInfo?.source ??
    payload?.sourceInfo?.source ??
    "";
  return String(src).toUpperCase();
}

function extractPostalCode(validationInfo: any): string {
  const addr =
    validationInfo?.shippingAddress?.address ??
    validationInfo?.shippingAddress ??
    validationInfo?.shippingInfo?.shippingDestination?.address?.address ??
    validationInfo?.shippingInfo?.shippingDestination?.address ??
    null;
  const raw = addr?.postalCode ?? addr?.zipCode ?? "";
  return String(raw).trim();
}

function extractCountry(validationInfo: any): string {
  // Path 1: validationInfo.shippingAddress.address.country (AddressWithContact wrapper)
  const fromWrapped = validationInfo?.shippingAddress?.address?.country;
  if (fromWrapped) return normalizeCountry(fromWrapped);

  // Path 2: validationInfo.shippingAddress.country (flat address)
  const fromFlat = validationInfo?.shippingAddress?.country;
  if (fromFlat) return normalizeCountry(fromFlat);

  // Path 3: shippingAddress.countryCode
  const fromCode = validationInfo?.shippingAddress?.address?.countryCode
    || validationInfo?.shippingAddress?.countryCode;
  if (fromCode) return normalizeCountry(fromCode);

  // Path 4: via shippingInfo
  const fromShippingInfo = validationInfo?.shippingInfo?.shippingDestination?.address?.address?.country
    || validationInfo?.shippingInfo?.shippingDestination?.address?.country;
  if (fromShippingInfo) return normalizeCountry(fromShippingInfo);

  return "";
}

function extractSubdivision(validationInfo: any): string {
  const addr =
    validationInfo?.shippingAddress?.address ??
    validationInfo?.shippingAddress ??
    validationInfo?.shippingInfo?.shippingDestination?.address?.address ??
    validationInfo?.shippingInfo?.shippingDestination?.address ??
    null;
  const raw = String(
    addr?.subdivision ?? addr?.state ?? addr?.region ?? addr?.province ?? ""
  ).trim();
  if (!raw) return "";
  // Wix often sends ISO 3166-2 format like "US-CA" — strip the country prefix
  const parts = raw.split("-");
  const code = parts.length > 1 ? parts[parts.length - 1] : raw;
  return code.toUpperCase();
}

validations.provideHandlers({
  getValidationViolations: async (payload: any) => {
    console.log("[ShippingValidation] HANDLER CALLED");

    const violations: any[] = [];

    try {
      const vi = extractValidationInfo(payload);
      const country = vi ? extractCountry(vi) : "";
      const source = extractSource(payload); // "CART" or "CHECKOUT"

      console.log("[ShippingValidation] source:", source, "country:", country);

      // Load settings (falls back to DEFAULTS if collection is missing)
      const s = await getSettings();

      const enabled = Boolean(s?.enabled);
      if (!enabled) return { violations };

      const blockedList = parseCsv(s?.blockedCountriesCsv);
      const blockedSet = new Set(blockedList);
      const allowedList = parseCsv(s?.allowedCountriesCsv);
      const allowedSet = new Set(allowedList);

      const isBlocked = country && blockedSet.has(country);
      const isNotAllowed = allowedSet.size > 0 && country && !allowedSet.has(country);
      const isCheckout = source === "CHECKOUT";

      if (isBlocked || isNotAllowed) {
        // ── User selected a blocked / disallowed country ──
        // Checkout → ERROR (blocks "Place Order & Pay")
        // Cart → WARNING (informational)
        violations.push({
          severity: isCheckout ? "ERROR" : "WARNING",
          target: { other: { name: "OTHER_DEFAULT" } },
          description: `We cannot ship to ${countryName(country)}. Please choose a different shipping address.`,
        });
      } else if (blockedList.length > 0 && !country) {
        // ── No country selected yet (e.g. cart) — show informational list ──
        // Skip this if user already selected an allowed country
        violations.push({
          severity: "WARNING",
          target: { other: { name: "OTHER_DEFAULT" } },
          description: `Unfortunately, we are not shipping to ${formatCountryList(blockedList)} yet.`,
        });
      }

      // ── 3) Blocked postal regex — only in checkout when a postal code exists ──
      const postalCode = vi ? extractPostalCode(vi) : "";
      const blockedPostalRegex = String(s?.blockedPostalRegex ?? "").trim();
      if (isCheckout && postalCode && blockedPostalRegex) {
        try {
          const regex = new RegExp(blockedPostalRegex);
          if (regex.test(postalCode)) {
            violations.push({
              severity: "ERROR",
              target: { other: { name: "OTHER_DEFAULT" } },
              description: `We cannot ship to postal code ${postalCode}. Please use a different shipping address.`,
            });
          }
        } catch (_) {
          // Invalid regex in settings — skip silently
        }
      }

      // ── 4) State / ZIP mismatch — US addresses only (premium) ──
      const validateStateZip = Boolean(s?.validateStateZip);
      if (validateStateZip && country === "US" && postalCode) {
        const subdivision = vi ? extractSubdivision(vi) : "";
        const expectedState = getStateForZipPrefix(postalCode);
        if (subdivision && expectedState && subdivision !== expectedState) {
          console.log(
            "[ShippingValidation] state-zip mismatch:",
            subdivision, "vs expected", expectedState, "for zip", postalCode,
          );
          violations.push({
            severity: isCheckout ? "ERROR" : "WARNING",
            target: { other: { name: "OTHER_DEFAULT" } },
            description: `ZIP code ${postalCode} doesn't match ${stateName(subdivision)}. Please verify your address.`,
          });
        }
      }

      console.log("[ShippingValidation] returning", violations.length, "violations, source:", source);
      return { violations };
    } catch (err: any) {
      console.error("[ShippingValidation] ERROR:", err?.message ?? err);
      return { violations };
    }
  },
});
