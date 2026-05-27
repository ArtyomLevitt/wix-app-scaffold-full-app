// @ts-nocheck — reference skeleton, not real source. Imports point at placeholder paths or modules that aren't installed in this skills repo. See examples/INDEX.md.
// VERBATIM (scrubbed) from password-protected/src/backend/embed-script.web.ts.
// Goes at: src/backend/embed-script.web.ts
//
// Pushes the lock config into the embedded script's parameters.
// Each call REPLACES the entire parameter blob — pass all three keys every time.

import { webMethod, Permissions } from "@wix/web-methods";
import { embeddedScripts } from "@wix/app-management";
import { auth } from "@wix/essentials";

const elevatedEmbedScript = auth.elevate(embeddedScripts.embedScript);
const elevatedGetEmbeddedScript = auth.elevate(embeddedScripts.getEmbeddedScript);

export interface EmbedScriptParams {
  protectedPages: string;   // base64 of JSON array of page configs
  siteWideLock: string;     // base64 of JSON site-wide config (empty string disables it)
  enabled: string;          // "true" | "false"
}

export const pushEmbeddedScript = webMethod(
  Permissions.Admin,
  async (params: EmbedScriptParams): Promise<{ success: boolean; error?: string }> => {
    try {
      await elevatedEmbedScript({
        parameters: {
          protectedPages: params.protectedPages,
          siteWideLock: params.siteWideLock,
          enabled: params.enabled,
        },
      });
      return { success: true };
    } catch (err: any) {
      console.error("[embed-script] Failed to push config:", err);
      return {
        success: false,
        error: err?.message || String(err),
      };
    }
  },
);

export const getEmbeddedScriptStatus = webMethod(
  Permissions.Admin,
  async (): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const script = await elevatedGetEmbeddedScript();
      return { success: true, data: script };
    } catch (err: any) {
      console.error("[embed-script] Failed to get script status:", err);
      return {
        success: false,
        error: err?.message || String(err),
      };
    }
  },
);
