import type { APIRoute } from 'astro';
import { items } from '@wix/data';
import { auth } from '@wix/essentials';
import { jsonResponse, optionsResponse } from '../../../extensions/_shared/cors';
import { COLLECTION_APP_SETTINGS, SETTINGS_DOC_KEY } from '../../../extensions/_shared/collections';
import {
  applyPremiumGating,
  DEFAULT_SETTINGS,
  migrateSettings,
  SETTINGS_VERSION,
  type AppSettingsRecord,
  type StoredAppSettings,
} from '../../../extensions/_shared/app-settings-types';
import { getPremiumStatus } from '../../../extensions/_shared/premium-server';

const elevatedQuery = auth.elevate(items.query);
const elevatedInsert = auth.elevate(items.insert);
const elevatedUpdate = auth.elevate(items.update);

function mapSettings(item: Record<string, unknown>): StoredAppSettings {
  const advancedDesign = item.advancedDesign as AppSettingsRecord['advancedDesign'] | undefined;
  return migrateSettings({
    theme: item.theme as AppSettingsRecord['theme'],
    fontFamily: String(item.fontFamily ?? ''),
    highlightColor: String(item.highlightColor ?? DEFAULT_SETTINGS.highlightColor),
    cardStyle: item.cardStyle as AppSettingsRecord['cardStyle'],
    showBilledAs: item.showBilledAs !== false,
    advancedDesign: advancedDesign ?? DEFAULT_SETTINGS.advancedDesign,
    _v: Number(item.settingsVersion ?? SETTINGS_VERSION),
  });
}

function toDbPayload(settings: StoredAppSettings) {
  return {
    key: SETTINGS_DOC_KEY,
    theme: settings.theme,
    fontFamily: settings.fontFamily,
    highlightColor: settings.highlightColor,
    cardStyle: settings.cardStyle,
    showBilledAs: settings.showBilledAs,
    advancedDesign: settings.advancedDesign,
    settingsVersion: settings._v,
  };
}

export const OPTIONS: APIRoute = async ({ request }) => optionsResponse(request);

export const GET: APIRoute = async ({ request }) => {
  try {
    const { isPremium } = await getPremiumStatus();
    const result = await elevatedQuery(COLLECTION_APP_SETTINGS)
      .eq('key', SETTINGS_DOC_KEY)
      .limit(1)
      .find();
    const item = (result.items?.[0] ?? null) as Record<string, unknown> | null;
    const settings = applyPremiumGating(
      item ? mapSettings(item) : migrateSettings({}),
      isPremium,
    );
    return jsonResponse({ ok: true, settings, isPremium, _id: item?._id ?? null }, request);
  } catch (error) {
    console.error('[settings GET]', error);
    return jsonResponse(
      { ok: true, settings: applyPremiumGating(migrateSettings({}), false), isPremium: false },
      request,
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const { isPremium } = await getPremiumStatus();
    const body = (await request.json()) as { settings?: Partial<AppSettingsRecord> };

    const existingResult = await elevatedQuery(COLLECTION_APP_SETTINGS)
      .eq('key', SETTINGS_DOC_KEY)
      .limit(1)
      .find();
    const existingItem = (existingResult.items?.[0] ?? null) as Record<string, unknown> | null;
    const base = applyPremiumGating(
      existingItem ? mapSettings(existingItem) : migrateSettings({}),
      isPremium,
    );

    const merged = migrateSettings({ ...base, ...body.settings });
    const gated = applyPremiumGating(merged, isPremium) as StoredAppSettings;
    const payload = toDbPayload(gated);

    if (existingItem?._id) {
      await elevatedUpdate(COLLECTION_APP_SETTINGS, {
        ...payload,
        _id: existingItem._id as string,
      });
    } else {
      await elevatedInsert(COLLECTION_APP_SETTINGS, payload);
    }

    return jsonResponse({ ok: true, settings: gated, isPremium }, request);
  } catch (error) {
    console.error('[settings POST]', error);
    return jsonResponse({ ok: false, error: 'save_failed' }, request, 500);
  }
};
