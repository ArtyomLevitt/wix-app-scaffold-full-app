import { items } from '@wix/data';
import { auth } from '@wix/essentials';
import { COLLECTION_DATA, SETTINGS_DOC_KEY } from './collections';
import {
  DEFAULT_SETTINGS,
  migrateSettings,
  type WidgetSettings,
} from './widget-settings-types';

export interface SettingsRecord {
  _id?: string;
  key: string;
  settingsJson?: string;
}

async function findSettingsRow(): Promise<SettingsRecord | undefined> {
  const elevatedQuery = auth.elevate(items.query);
  const res = await elevatedQuery(COLLECTION_DATA)
    .eq('key', SETTINGS_DOC_KEY)
    .limit(1)
    .find();
  return res.items[0] as SettingsRecord | undefined;
}

export async function loadWidgetSettings(): Promise<WidgetSettings> {
  try {
    const row = await findSettingsRow();
    if (!row?.settingsJson) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(row.settingsJson) as Record<string, unknown>;
    return migrateSettings(parsed);
  } catch (err) {
    console.error('[settings-store] load failed:', err);
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveWidgetSettings(
  settings: WidgetSettings,
): Promise<WidgetSettings> {
  const elevatedInsert = auth.elevate(items.insert);
  const elevatedUpdate = auth.elevate(items.update);

  const existing = await findSettingsRow();
  const payload: SettingsRecord = {
    ...(existing ?? {}),
    key: SETTINGS_DOC_KEY,
    settingsJson: JSON.stringify(settings),
  };

  if (existing?._id) {
    await elevatedUpdate(COLLECTION_DATA, { ...payload, _id: existing._id });
  } else {
    await elevatedInsert(COLLECTION_DATA, payload);
  }

  return settings;
}

export async function mergeWidgetSettings(
  patch: Partial<WidgetSettings>,
): Promise<WidgetSettings> {
  const current = await loadWidgetSettings();
  const merged = migrateSettings({ ...current, ...patch });
  return saveWidgetSettings(merged);
}
