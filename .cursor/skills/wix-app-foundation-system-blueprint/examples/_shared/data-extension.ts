// Canonical data collections extension for every PRPL Wix CLI app.
//
// File path in the generated app: src/extensions/data/extensions.ts
//
// Why this file is REQUIRED on every app (do NOT delete):
//   Wix CLI apps that call the @wix/data APIs (items.query / insert / update)
//   require the installed site's code editor to be enabled. Without this
//   `genericExtension({ compType: 'DATA_COMPONENT' })` declaration the site
//   owner would have to manually enable the code editor before our backend
//   calls work — and they won't. The presence of this extension causes Wix
//   to automatically enable the editor on install, unlocking the Data APIs
//   reliably for every installed site.
//
// Default shape:
//   A SINGLE private `<slug>-data` collection with a `{ key, ... }` row
//   pattern that holds multiple logical "documents" keyed by the `key`
//   field (widget_settings, usage_counter, credentials, etc.). This is the
//   same pattern paypal-payment-button uses — one collection, many row
//   types — which keeps the app's data footprint minimal and avoids
//   declaring a separate collection per concern.
//
//   If the spec's "Data Collections" section names additional collections,
//   add MORE `{ idSuffix, displayName, fields, dataPermissions }` objects
//   to the SAME `collections: [ ... ]` array — do NOT create separate
//   `extensions.genericExtension()` calls per collection.
//
// Registration:
//   This file is dead code unless `src/extensions.ts` imports and
//   registers `dataExtension` in its `extensions:` array. Wix Astro
//   discovers extensions ONLY from that default export.
//
// Companion file `src/extensions/_shared/collections.ts`:
//   import { APP_NS } from './app-config';
//   export const COLLECTION_DATA = `${APP_NS}/<slug>-data`;
//   export const SETTINGS_DOC_KEY = 'widget_settings';
//   export const USAGE_DOC_KEY = 'usage_counter';
//
// Backend usage from a web method:
//   import { items } from '@wix/data';
//   import { auth } from '@wix/essentials';
//   import { COLLECTION_DATA, SETTINGS_DOC_KEY } from '../_shared/collections';
//   const elevatedQuery = auth.elevate(items.query);
//   const res = await elevatedQuery(COLLECTION_DATA)
//     .eq('key', SETTINGS_DOC_KEY)
//     .limit(1)
//     .find();

import { extensions } from '@wix/astro/builders';

export const dataExtension = extensions.genericExtension({
  // CRITICAL: static UUID v4 baked into the file. Generate ONCE per app at
  // scaffold time, never call randomUUID(). Changing this id rotates the
  // collection on every install and orphans existing data.
  compId: '<STATIC-UUID-v4-PER-APP>',
  compName: 'data-extension',
  compType: 'DATA_COMPONENT',
  compData: {
    dataComponent: {
      collections: [
        {
          // Legacy field — keep as-is.
          schemaUrl: 'https://www.wix.com/',
          // Kebab-case. Full scoped ID becomes `${APP_NS}/<slug>-data`.
          idSuffix: '<slug>-data',
          displayName: '<App Name> Data',
          displayField: 'key',
          fields: [
            {
              key: 'key',
              displayName: 'Key',
              type: 'TEXT',
              description:
                'Logical row identifier — e.g. "widget_settings", "usage_counter".',
            },
            {
              key: 'settings',
              displayName: 'Settings JSON',
              type: 'OBJECT',
              // OBJECT fields MUST include `objectOptions` — without it the
              // field is silently dropped on install and items.insert() that
              // tries to write it returns "unknown field".
              objectOptions: {},
              description: 'Stored widget configuration.',
            },
            {
              key: 'v',
              displayName: 'Encoded Value',
              type: 'TEXT',
              description:
                'Encoded monthly usage counter (packed count + month).',
            },
            {
              key: 'notes',
              displayName: 'Notes',
              type: 'TEXT',
              description: 'Free-form notes for admin debugging.',
            },
          ],
          // PRIVILEGED across the board — all reads/writes go through
          // backend web methods using `auth.elevate(...)`. Only weaken to
          // ANYONE / SITE_MEMBER for collections that a site widget queries
          // DIRECTLY without going through a backend web method (e.g.
          // visitor-submitted reviews displayed by the widget).
          dataPermissions: {
            itemRead: 'PRIVILEGED',
            itemInsert: 'PRIVILEGED',
            itemUpdate: 'PRIVILEGED',
            itemRemove: 'PRIVILEGED',
          },
          // Optional initial seed data (only imported on FIRST install,
          // ignored on subsequent updates to the major version). Match
          // field keys + types exactly.
          // initialData: [
          //   { key: 'widget_settings', settings: { primaryColor: '#3B6AEA' } },
          // ],
        },
        // Add more collections here when the spec's "Data Collections"
        // section names them — same array, NOT a separate genericExtension.
        // Example:
        // {
        //   schemaUrl: 'https://www.wix.com/',
        //   idSuffix: 'reviews',
        //   displayName: 'Reviews',
        //   displayField: 'author',
        //   fields: [
        //     { key: 'author',     displayName: 'Author',  type: 'TEXT', required: true },
        //     { key: 'rating',     displayName: 'Rating',  type: 'NUMBER', required: true },
        //     { key: 'body',       displayName: 'Body',    type: 'RICH_TEXT' },
        //     { key: 'isApproved', displayName: 'Approved',type: 'BOOLEAN' },
        //   ],
        //   dataPermissions: {
        //     // Site widget reads + visitor inserts publicly → ANYONE.
        //     // Dashboard moderates → CMS_EDITOR.
        //     itemRead:   'ANYONE',
        //     itemInsert: 'ANYONE',
        //     itemUpdate: 'CMS_EDITOR',
        //     itemRemove: 'CMS_EDITOR',
        //   },
        // },
      ],
    },
  },
});
