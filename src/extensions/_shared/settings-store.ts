import { items } from '@wix/data';
import { auth } from '@wix/essentials';
import {
  applyPremiumGating,
  DEFAULT_SETTINGS,
  migrateSettings,
  stripPremiumFromPatch,
  type AppSettings,
} from './app-settings-types';
import { COLLECTION_APP_SETTINGS, SETTINGS_DOC_KEY } from './collections';
import { getPremiumInfo } from '../../pages/api/_shared/premium';

const elevatedQuery = auth.elevate(items.query);
const elevatedInsert = auth.elevate(items.insert);
const elevatedUpdate = auth.elevate(items.update);

function rowToSettings(row: Record<string, unknown>): AppSettings {
  return migrateSettings({
    theme: row.theme,
    fontFamily: row.fontFamily,
    highlightColor: row.highlightColor,
    cardStyle: row.cardStyle,
    showBilledAs: row.showBilledAs,
    advancedDesign: row.advancedDesign,
    v: row.v,
  });
}

export async function loadAppSettings(forWidget = false): Promise<AppSettings> {
  const res = await elevatedQuery(COLLECTION_APP_SETTINGS)
    .eq('key', SETTINGS_DOC_KEY)
    .limit(1)
    .find();
  const row = (res.items?.[0] ?? {}) as Record<string, unknown>;
  const settings = Object.keys(row).length ? rowToSettings(row) : { ...DEFAULT_SETTINGS };
  if (!forWidget) return settings;
  const premium = await getPremiumInfo();
  return applyPremiumGating(settings, premium.isPremium);
}

export async function saveAppSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const premium = await getPremiumInfo();
  const sanitized = stripPremiumFromPatch(patch, premium.isPremium);
  const base = await loadAppSettings(false);
  const merged = migrateSettings({ ...base, ...sanitized });

  const res = await elevatedQuery(COLLECTION_APP_SETTINGS)
    .eq('key', SETTINGS_DOC_KEY)
    .limit(1)
    .find();

  const payload = {
    key: SETTINGS_DOC_KEY,
    theme: merged.theme,
    fontFamily: merged.fontFamily,
    highlightColor: merged.highlightColor,
    cardStyle: merged.cardStyle,
    showBilledAs: merged.showBilledAs,
    advancedDesign: merged.advancedDesign,
    v: merged.v,
  };

  if (res.items?.[0]?._id) {
    await elevatedUpdate(COLLECTION_APP_SETTINGS, { _id: res.items[0]._id, ...payload });
  } else {
    await elevatedInsert(COLLECTION_APP_SETTINGS, payload);
  }

  return applyPremiumGating(merged, premium.isPremium);
}
