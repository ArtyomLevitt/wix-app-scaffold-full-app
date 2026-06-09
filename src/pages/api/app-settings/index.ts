import type { APIRoute } from 'astro';
import { items } from '@wix/data';
import { auth } from '@wix/essentials';
import {
  COLLECTION_APP_SETTINGS,
  SETTINGS_DOC_KEY,
} from '../../../extensions/_shared/collections';
import {
  applyPremiumGating,
  migrateSettings,
  stripPremiumFromPatch,
  type AppSettings,
} from '../../../extensions/_shared/pricing-types';
import {
  getPremiumInfo,
  jsonResponse,
  resolveInstanceId,
} from '../../../extensions/_shared/api-helpers';

const elevatedQuery = auth.elevate(items.query);
const elevatedInsert = auth.elevate(items.insert);
const elevatedUpdate = auth.elevate(items.update);

function recordToSettings(item: Record<string, unknown>): AppSettings {
  return migrateSettings({
    theme: item.theme as AppSettings['theme'],
    fontFamily: item.fontFamily as AppSettings['fontFamily'],
    highlightColor: item.highlightColor as string,
    cardStyle: item.cardStyle as AppSettings['cardStyle'],
    showBilledAs: item.showBilledAs as boolean,
    advancedDesign: item.advancedDesign as AppSettings['advancedDesign'],
    _v: item.v as number,
  });
}

async function loadSettingsRow(): Promise<Record<string, unknown> | null> {
  const res = await elevatedQuery(COLLECTION_APP_SETTINGS)
    .eq('key', SETTINGS_DOC_KEY)
    .limit(1)
    .find();
  return (res.items?.[0] as Record<string, unknown>) ?? null;
}

export const OPTIONS: APIRoute = async () =>
  new Response(null, { status: 204 });

export const GET: APIRoute = async () => {
  try {
    const premium = await getPremiumInfo();
    const row = await loadSettingsRow();
    const settings = applyPremiumGating(
      row ? recordToSettings(row) : migrateSettings(null),
      premium.isPremium,
    );
    return jsonResponse({ settings, isPremium: premium.isPremium });
  } catch (error) {
    console.error('[app-settings GET]', error);
    return jsonResponse({
      settings: migrateSettings(null),
      isPremium: false,
      error: 'load_failed',
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const instanceId = await resolveInstanceId();
    if (!instanceId) return jsonResponse({ ok: false, error: 'no-instance' }, 403);

    const premium = await getPremiumInfo();
    const body = (await request.json()) as { settings?: Partial<AppSettings> };
    const patch = stripPremiumFromPatch(body.settings ?? {}, premium.isPremium);

    const row = await loadSettingsRow();
    const base = applyPremiumGating(
      row ? recordToSettings(row) : migrateSettings(null),
      premium.isPremium,
    );
    const merged = migrateSettings({ ...base, ...patch });

    const record = {
      key: SETTINGS_DOC_KEY,
      theme: merged.theme,
      fontFamily: merged.fontFamily,
      highlightColor: merged.highlightColor,
      cardStyle: merged.cardStyle,
      showBilledAs: merged.showBilledAs,
      advancedDesign: merged.advancedDesign,
      v: merged._v,
    };

    if (row?._id) {
      await elevatedUpdate(COLLECTION_APP_SETTINGS, { ...record, _id: row._id });
    } else {
      await elevatedInsert(COLLECTION_APP_SETTINGS, record);
    }

    return jsonResponse({
      ok: true,
      settings: applyPremiumGating(merged, premium.isPremium),
    });
  } catch (error) {
    console.error('[app-settings POST]', error);
    return jsonResponse({ ok: false, error: 'save_failed' }, 500);
  }
};
