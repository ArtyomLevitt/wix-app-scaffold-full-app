import { extensions } from '@wix/astro/builders';

export const dataExtension = extensions.genericExtension({
  compId: 'adcd0c1f-7c69-44b4-bb6f-35e78fa2e18d',
  compName: 'data-extension',
  compType: 'DATA_COMPONENT',
  compData: {
    dataComponent: {
      collections: [
        {
          schemaUrl: 'https://www.wix.com/',
          idSuffix: 'plan-pricing-table-data',
          displayName: 'Pricing Plans Compare Data',
          displayField: 'key',
          fields: [
            {
              key: 'key',
              displayName: 'Key',
              type: 'TEXT',
              description:
                'Row identifier — e.g. "widget_settings", "usage_counter".',
            },
            {
              key: 'settings',
              displayName: 'Settings JSON',
              type: 'OBJECT',
              objectOptions: {},
              description: 'Stored widget configuration.',
            },
            {
              key: 'v',
              displayName: 'Encoded Value',
              type: 'TEXT',
              description: 'Encoded monthly usage counter.',
            },
            {
              key: 'notes',
              displayName: 'Notes',
              type: 'TEXT',
              description: 'Free-form notes for admin debugging.',
            },
          ],
          dataPermissions: {
            itemRead: 'PRIVILEGED',
            itemInsert: 'PRIVILEGED',
            itemUpdate: 'PRIVILEGED',
            itemRemove: 'PRIVILEGED',
          },
        },
        {
          schemaUrl: 'https://www.wix.com/',
          idSuffix: 'pricing-plans',
          displayName: 'Pricing Plans',
          displayField: 'name',
          fields: [
            { key: 'name', displayName: 'Name', type: 'TEXT' },
            { key: 'price', displayName: 'Price', type: 'TEXT' },
            { key: 'period', displayName: 'Period', type: 'TEXT' },
            { key: 'tagline', displayName: 'Tagline', type: 'TEXT' },
            { key: 'featuresJson', displayName: 'Features JSON', type: 'TEXT' },
            { key: 'badge', displayName: 'Badge', type: 'TEXT' },
            { key: 'ctaMode', displayName: 'CTA Mode', type: 'TEXT' },
            { key: 'ctaLabel', displayName: 'CTA Label', type: 'TEXT' },
            { key: 'wixPlanId', displayName: 'Wix Plan ID', type: 'TEXT' },
            { key: 'customUrl', displayName: 'Custom URL', type: 'TEXT' },
            { key: 'contactEmail', displayName: 'Contact Email', type: 'TEXT' },
            { key: 'highlighted', displayName: 'Highlighted', type: 'BOOLEAN' },
            { key: 'sortOrder', displayName: 'Sort Order', type: 'NUMBER' },
            { key: 'cardColor', displayName: 'Card Color', type: 'TEXT' },
            { key: 'cardBorderColor', displayName: 'Card Border Color', type: 'TEXT' },
          ],
          dataPermissions: {
            itemRead: 'ANYONE',
            itemInsert: 'PRIVILEGED',
            itemUpdate: 'PRIVILEGED',
            itemRemove: 'PRIVILEGED',
          },
        },
        {
          schemaUrl: 'https://www.wix.com/',
          idSuffix: 'app-settings',
          displayName: 'App Settings',
          displayField: 'key',
          fields: [
            { key: 'key', displayName: 'Key', type: 'TEXT' },
            {
              key: 'settings',
              displayName: 'Settings',
              type: 'OBJECT',
              objectOptions: {},
            },
            { key: 'v', displayName: 'Schema Version', type: 'TEXT' },
          ],
          dataPermissions: {
            itemRead: 'ANYONE',
            itemInsert: 'PRIVILEGED',
            itemUpdate: 'PRIVILEGED',
            itemRemove: 'PRIVILEGED',
          },
        },
      ],
    },
  },
});
