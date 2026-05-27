// @ts-nocheck — reference skeleton, not real source. Imports point at placeholder paths or modules that aren't installed in this skills repo. See examples/INDEX.md.
// VERBATIM (scrubbed) from password-protected/src/backend/app-instance.web.ts.
// Goes at: src/backend/app-instance.web.ts
//
// Provides:
//  1. getAppInstance()                         — returns isFree + paymentPageUrl + trial info
//  2. verifyLockPasswordLogic(key, password)   — shared verification logic (NOT a webMethod)
//  3. verifyLockPassword(req)                  — webMethod wrapper for dashboard usage only.
//                                                For site widget usage prefer the HTTP API.

import { webMethod, Permissions } from "@wix/web-methods";
import { appInstances } from "@wix/app-management";
import { auth } from "@wix/essentials";
import { items } from "@wix/data";

const APP_DEF_ID = "<APP_ID>";

/** Collection idSuffix for Lock Passwords (must match data extension and frontend). */
const LOCK_PASSWORDS_COLLECTION_ID = "@<APP_NS>/<app>/lock-passwords";

export interface AppInstanceBilling {
  freeTrialInfo?: {
    status?: string;
    endDate?: string;
  };
}

export interface AppInstanceResponse {
  isFree: boolean;
  billing?: AppInstanceBilling;
  freeTrialAvailable?: boolean;
  instanceId?: string;
  paymentPageUrl?: string;
}

async function getAppInstanceData(): Promise<AppInstanceResponse> {
  const elevatedGetAppInstance = auth.elevate(appInstances.getAppInstance);
  const { instance } = await elevatedGetAppInstance();

  if (!instance) {
    return { isFree: true, freeTrialAvailable: false };
  }

  const instanceId = instance.instanceId;
  const paymentPageUrl =
    instanceId &&
    `https://www.wix.com/apps/upgrade/${APP_DEF_ID}?appInstanceId=${encodeURIComponent(instanceId)}`;

  return {
    isFree: instance.isFree ?? true,
    instanceId,
    paymentPageUrl,
    billing: instance.billing
      ? {
          freeTrialInfo: instance.billing.freeTrialInfo
            ? {
                status: instance.billing.freeTrialInfo.status,
                endDate: instance.billing.freeTrialInfo.endDate
                  ? instance.billing.freeTrialInfo.endDate.toISOString()
                  : undefined,
              }
            : undefined,
        }
      : undefined,
    freeTrialAvailable: instance.freeTrialAvailable,
  };
}

export const getAppInstance = webMethod(
  Permissions.Anyone,
  async (): Promise<AppInstanceResponse> => {
    try {
      return await getAppInstanceData();
    } catch (err) {
      console.error("Failed to get app instance:", err);
      return { isFree: true, freeTrialAvailable: false };
    }
  },
);

export interface VerifyLockPasswordRequest {
  lockKey: string;
  password: string;
}

export interface VerifyLockPasswordResponse {
  success: boolean;
}

/**
 * Shared verification logic — used by:
 *   - the webMethod below (for dashboard or trusted callers)
 *   - the HTTP API in src/backend/api/verify-lock-password/api.ts (for site widgets via fetchWithAuth)
 */
export async function verifyLockPasswordLogic(
  lockKey: string,
  password: string,
): Promise<VerifyLockPasswordResponse> {
  const normalizedKey =
    lockKey != null && String(lockKey).trim() !== ""
      ? String(lockKey).trim()
      : "default";
  const normalizedPassword = password != null ? String(password) : "";
  try {
    const elevatedQuery = auth.elevate(items.query);
    const result = await elevatedQuery(LOCK_PASSWORDS_COLLECTION_ID)
      .eq("key", normalizedKey)
      .limit(1)
      .find();
    const item = result.items[0];
    const storedPassword = item
      ? String((item as { password?: string }).password ?? "")
      : "";
    const success =
      storedPassword.length > 0 && normalizedPassword === storedPassword;
    return { success };
  } catch (err) {
    console.error("Failed to verify lock password:", err);
    return { success: false };
  }
}

export const verifyLockPassword = webMethod(
  Permissions.Anyone,
  async (req: VerifyLockPasswordRequest): Promise<VerifyLockPasswordResponse> => {
    const lockKey =
      req?.lockKey != null && String(req.lockKey).trim() !== ""
        ? String(req.lockKey).trim()
        : "default";
    const password = req?.password != null ? String(req.password) : "";
    return verifyLockPasswordLogic(lockKey, password);
  },
);
