// @ts-nocheck — reference skeleton, not real source. Imports point at placeholder paths or modules that aren't installed in this skills repo. See examples/INDEX.md.
import { webMethod } from "@wix/web-methods";
import {
  getSettings as _getSettings,
  getDiagnostics as _getDiagnostics,
  saveSettings as _saveSettings,
} from "./settings";
import type { ShippingVerifierSettings, SettingsDiagnostics } from "./settings";

const DEFAULTS: ShippingVerifierSettings = {
  enabled: true,
  allowedCountriesCsv: "",
  blockedCountriesCsv: "", 
  requirePostalCode: true,
  blockedPostalRegex: "",
  validateStateZip: false,
};


const DASHBOARD_PERMISSION: any = "Anyone";

export const getSettings = webMethod(
  DASHBOARD_PERMISSION,
  async (): Promise<ShippingVerifierSettings> => {
    console.log("[settings.web] getSettings called");
    try {
      const res = await _getSettings();
      console.log("[settings.web] getSettings OK", res);
      return res ?? DEFAULTS;
    } catch (e: any) {
      console.error("[settings.web] getSettings ERROR", e);
      return DEFAULTS;
    }
  }
);

export const saveSettings = webMethod(
  DASHBOARD_PERMISSION,
  async (settings?: ShippingVerifierSettings): Promise<{ ok: true }> => {
    console.log("[settings.web] saveSettings called", settings);
    try {
      await _saveSettings(settings ?? DEFAULTS);
      console.log("[settings.web] saveSettings OK");
      return { ok: true };
    } catch (e: any) {
      console.error("[settings.web] saveSettings ERROR", e);
      // keep throwing so dashboard shows "Save failed"
      throw new Error(e?.message ?? String(e));
    }
  }
);

export const getDiagnostics = webMethod(
  DASHBOARD_PERMISSION,
  async (): Promise<SettingsDiagnostics> => {
    console.log("[settings.web] getDiagnostics called");
    try {
      const res = await _getDiagnostics();
      console.log("[settings.web] getDiagnostics OK", res);
      return res;
    } catch (e: any) {
      console.error("[settings.web] getDiagnostics ERROR", e);
      return {
        collectionId: "unknown",
        settingsId: "settings",
        status: "error",
        errorMessage: String(e?.message ?? e),
        errorName: e?.name ?? "Error",
      };
    }
  }
);
