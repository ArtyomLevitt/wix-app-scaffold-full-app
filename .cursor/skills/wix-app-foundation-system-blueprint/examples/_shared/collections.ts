// Canonical collections constants module for every PRPL Wix CLI app.
//
// File path in the generated app: src/extensions/_shared/collections.ts
//
// Why this file exists:
//   - Centralizes the scoped collection ID so backend code never has to
//     concatenate `APP_NS + '/<slug>-data'` manually (typos there silently
//     return empty results).
//   - Holds well-known row keys for the single-collection key/value
//     pattern (multiple logical "documents" stored in ONE collection
//     keyed by the `key` field).
//
// Companion file `src/extensions/data/extensions.ts`:
//   The `idSuffix` declared there MUST match the suffix here exactly
//   (case-sensitive, kebab-case preserved). Mismatch → API errors.

import { APP_NS } from './app-config';

// Full scoped collection ID for use in items.query/insert/update calls.
// MUST match the `idSuffix` in src/extensions/data/extensions.ts exactly.
export const COLLECTION_DATA = `${APP_NS}/<slug>-data`;

// Stable row keys for the single-collection key/value pattern. Add more
// constants here as the app grows (do NOT create new collections just for
// a new doc — keep them all under <slug>-data keyed by `key`).
export const SETTINGS_DOC_KEY = 'widget_settings';
export const USAGE_DOC_KEY = 'usage_counter';
export const CREDENTIALS_DOC_KEY = 'credentials';
