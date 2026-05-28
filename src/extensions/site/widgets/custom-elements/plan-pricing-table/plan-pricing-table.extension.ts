import { extensions } from '@wix/astro/builders';

export default extensions.customElement({
  id: '63d32b26-d297-46a4-a820-e95e336a7875',
  name: 'Pricing Plans Compare',
  tagName: 'plan-pricing-table',
  element: './extensions/site/widgets/custom-elements/plan-pricing-table/widget.tsx',
  settings: './extensions/site/widgets/custom-elements/plan-pricing-table/panel.tsx',
  installation: {
    autoAdd: true,
  },
  width: {
    defaultWidth: 960,
    allowStretch: true,
  },
  height: {
    defaultHeight: 480,
  },
  presets: [
    {
      id: 'default',
      name: 'Default',
      thumbnailUrl: '{{BASE_URL}}/plan-pricing-table-thumbnail.png',
    },
  ],
});
