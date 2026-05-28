import { extensions } from '@wix/astro/builders';

export const dataExtension = extensions.genericExtension({
  compId: 'ace56116-25dc-44a5-8c9d-f33410522b8e',
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
            { key: 'name', displayName: 'Name', type: 'TEXT', description: 'Plan name' },
            { key: 'price', displayName: 'Price', type: 'NUMBER', description: 'Plan price' },
            { key: 'currency', displayName: 'Currency', type: 'TEXT', description: 'Currency code' },
            { key: 'period', displayName: 'Period', type: 'TEXT', description: 'monthly / annual / one-time' },
            { key: 'tagline', displayName: 'Tagline', type: 'TEXT', description: 'Short tagline' },
            { key: 'featuresJson', displayName: 'Features JSON', type: 'TEXT', description: 'Serialized features list' },
            { key: 'badge', displayName: 'Badge', type: 'TEXT', description: 'mostPopular / new / crown' },
            { key: 'isHighlighted', displayName: 'Highlighted', type: 'BOOLEAN', description: 'Highlight this card' },
            { key: 'ctaMode', displayName: 'CTA Mode', type: 'TEXT', description: 'wixCheckout / customUrl / contact' },
            { key: 'ctaTarget', displayName: 'CTA Target', type: 'TEXT', description: 'Wix plan ID, URL, or form ID' },
            { key: 'ctaLabel', displayName: 'CTA Label', type: 'TEXT', description: 'Button label' },
            { key: 'sortOrder', displayName: 'Sort Order', type: 'NUMBER', description: 'Display order' },
            { key: 'wixPlanId', displayName: 'Wix Plan ID', type: 'TEXT', description: 'Linked Wix Pricing Plan' },
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
            { key: 'key', displayName: 'Key', type: 'TEXT', description: 'Settings document key' },
            { key: 'theme', displayName: 'Theme', type: 'TEXT', description: 'light / dark / minimal / brand' },
            { key: 'fontFamily', displayName: 'Font Family', type: 'TEXT', description: 'Optional font override' },
            { key: 'highlightColor', displayName: 'Highlight Color', type: 'TEXT', description: 'Accent color' },
            { key: 'cardStyle', displayName: 'Card Style', type: 'TEXT', description: 'modern / classic / compact' },
            { key: 'showBilledAs', displayName: 'Show Billed As', type: 'BOOLEAN', description: 'Show billing period label' },
            {
              key: 'advancedDesign',
              displayName: 'Advanced Design',
              type: 'OBJECT',
              objectOptions: {},
              description: 'Premium design overrides',
            },
            { key: 'settingsVersion', displayName: 'Settings Version', type: 'NUMBER', description: 'Schema version' },
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
