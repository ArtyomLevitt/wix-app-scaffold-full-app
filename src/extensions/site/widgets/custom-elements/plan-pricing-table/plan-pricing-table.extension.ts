import { extensions } from '@wix/astro/builders';

export default extensions.customElement({
  id: '154d8d1e-1ee7-4da5-96c7-a2d5b192ed4c',
  name: 'Pricing Plans Compare',
  tagName: 'plan-pricing-table',
  element: './extensions/site/widgets/custom-elements/plan-pricing-table/widget.tsx',
  presets: [
    {
      id: 'default',
      name: 'Default',
      thumbnailUrl: '{{BASE_URL}}/plan-pricing-table-thumbnail.png',
    },
  ],
  width: {
    defaultWidth: 960,
    allowStretch: true,
  },
  height: {
    defaultHeight: 480,
  },
  installation: {
    autoAdd: false,
  },
});
