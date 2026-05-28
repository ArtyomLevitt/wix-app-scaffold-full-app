import { extensions } from '@wix/astro/builders';

export default extensions.customElement({
  id: '8f516169-0372-4935-a9c8-4db52b9b51a7',
  name: 'Pricing Plans Compare',
  tagName: 'plan-pricing-table',
  element: './extensions/site/widgets/custom-elements/plan-pricing-table/widget.tsx',
  settings: './extensions/site/widgets/custom-elements/plan-pricing-table/panel.tsx',
  installation: {
    autoAdd: true,
  },
  presets: [
    {
      thumbnailUrl: '{{BASE_URL}}/plan-pricing-table-thumbnail.png',
    },
  ],
  width: {
    defaultWidth: 900,
    allowStretch: true,
  },
  height: {
    defaultHeight: 500,
  },
});
