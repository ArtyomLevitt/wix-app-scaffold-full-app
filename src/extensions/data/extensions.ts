import { extensions } from '@wix/astro/builders';

export const dataExtension = extensions.genericExtension({
  compId: '471dd6c2-8749-4c68-82b9-399c0971936a',
  compName: 'data-extension',
  compType: 'DATA_COMPONENT',
  compData: {
    dataComponent: {
      collections: [
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
            {
              key: 'featuresJson',
              displayName: 'Features',
              type: 'OBJECT',
              objectOptions: {},
            },
            { key: 'badge', displayName: 'Badge', type: 'TEXT' },
            { key: 'ctaMode', displayName: 'CTA Mode', type: 'TEXT' },
            { key: 'ctaLabel', displayName: 'CTA Label', type: 'TEXT' },
            { key: 'ctaTarget', displayName: 'CTA Target', type: 'TEXT' },
            { key: 'wixPricingPlanId', displayName: 'Wix Plan ID', type: 'TEXT' },
            { key: 'sortOrder', displayName: 'Sort Order', type: 'NUMBER' },
            { key: 'isHighlighted', displayName: 'Highlighted', type: 'BOOLEAN' },
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
            { key: 'theme', displayName: 'Theme', type: 'TEXT' },
            { key: 'fontFamily', displayName: 'Font Family', type: 'TEXT' },
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
