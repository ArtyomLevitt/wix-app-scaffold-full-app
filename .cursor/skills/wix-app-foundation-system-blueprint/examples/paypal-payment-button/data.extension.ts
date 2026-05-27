// @ts-nocheck — reference skeleton, not real source. Imports point at placeholder paths or modules that aren't installed in this skills repo. See examples/INDEX.md.
import { extensions } from '@wix/astro/builders';

// Single Wix Data collection holding multiple logical documents discriminated
// by the `key` field. Rows: `paypal_credentials` (clientId + sandboxMode) and
// `usage_counter` (encoded count + month in `v`). Cheaper and simpler than
// declaring two collections when each only ever has one row.
export const dataExtension = extensions.genericExtension({
  compId: '<DATA_EXTENSION_UUID>',
  compName: 'data-extension',
  compType: 'DATA_COMPONENT',
  compData: {
    dataComponent: {
      collections: [
        {
          schemaUrl: 'https://www.wix.com/',
          idSuffix: 'data',
          displayName: 'PayPal Pay Button Data',
          displayField: 'key',
          fields: [
            {
              key: 'key',
              displayName: 'Key',
              type: 'TEXT',
              description:
                'Row identifier (e.g. "paypal_credentials" or "usage_counter").',
            },
            {
              key: 'clientId',
              displayName: 'PayPal Client ID',
              type: 'TEXT',
              description:
                'Public PayPal client ID from the PayPal Developer Dashboard.',
            },
            {
              key: 'sandboxMode',
              displayName: 'Sandbox Mode',
              type: 'BOOLEAN',
              description: 'Use the PayPal sandbox environment for testing.',
            },
            {
              key: 'v',
              displayName: 'Encoded Value',
              type: 'TEXT',
              description: 'Encoded monthly usage counter.',
            },
          ],
          // PRIVILEGED for all CRUD — every read/write must go through
          // `auth.elevate(items.query)` etc. so visitor sessions can never
          // read the stored client ID.
          dataPermissions: {
            itemRead: 'PRIVILEGED',
            itemInsert: 'PRIVILEGED',
            itemUpdate: 'PRIVILEGED',
            itemRemove: 'PRIVILEGED',
          },
        },
      ],
    },
  },
});
