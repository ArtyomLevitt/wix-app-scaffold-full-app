import { extensions } from '@wix/astro/builders';

export const dataExtension = extensions.genericExtension({
  compId: '865b1c18-cc5e-4109-b13a-dd9d71e748ec',
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
              description: 'Row identifier — e.g. "widget_settings", "usage_counter".',
            },
            {
              key: 'settings',
              displayName: 'Settings JSON',
              type: 'OBJECT',
              objectOptions: {},
            },
            {
              key: 'v',
              displayName: 'Encoded Value',
              type: 'TEXT',
              description: 'Encoded monthly usage counter.',
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
            { key: 'price', displayName: 'Price', type: 'NUMBER' },
            { key: 'currency', displayName: 'Currency', type: 'TEXT' },
            { key: 'period', displayName: 'Period', type: 'TEXT' },
            { key: 'tagline', displayName: 'Tagline', type: 'TEXT' },
            {
              key: 'featuresJson',
              displayName: 'Features',
              type: 'OBJECT',
              objectOptions: {},
            },
            { key: 'badge', displayName: 'Badge', type: 'TEXT' },
            { key: 'isHighlighted', displayName: 'Highlighted', type: 'BOOLEAN' },
            { key: 'ctaMode', displayName: 'CTA Mode', type: 'TEXT' },
            { key: 'ctaTarget', displayName: 'CTA Target', type: 'TEXT' },
            { key: 'ctaLabel', displayName: 'CTA Label', type: 'TEXT' },
            { key: 'sortOrder', displayName: 'Sort Order', type: 'NUMBER' },
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
            { key: 'key', displayName: 'Key', type: 'TEXT', unique: true },
            { key: 'theme', displayName: 'Theme', type: 'TEXT' },
            { key: 'fontFamily', displayName: 'Font', type: 'TEXT' },
            { key: 'highlightColor', displayName: 'Highlight Color', type: 'TEXT' },
            { key: 'cardStyle', displayName: 'Card Style', type: 'TEXT' },
            { key: 'showBilledAs', displayName: 'Show Billed As', type: 'BOOLEAN' },
            {
              key: 'advancedDesign',
              displayName: 'Advanced Design',
              type: 'OBJECT',
              objectOptions: {},
            },
            { key: 'v', displayName: 'Schema Version', type: 'NUMBER' },
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
