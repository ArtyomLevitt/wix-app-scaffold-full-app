import { extensions } from '@wix/astro/builders';

export default extensions.customElement({
  id: '02de0227-3b8c-42d4-a3ec-87eaa3f858e0',
  name: 'Pricing Plans Compare',
  tagName: 'plan-pricing-table',
  element: './extensions/site/widgets/custom-elements/plan-pricing-table/widget.tsx',
  settings: './extensions/site/widgets/custom-elements/plan-pricing-table/panel.tsx',
  installation: {
    autoAdd: true,
  },
  width: {
    defaultWidth: 900,
    allowStretch: true,
  },
  height: {
    defaultHeight: 480,
  },
  presets: [
    {
      id: 'default',
      name: 'Pricing Plans Compare',
      thumbnailUrl: '{{BASE_URL}}/plan-pricing-table-thumbnail.png',
    },
  ],
  behaviors: {
    dashboard: {
      dashboardPageComponentId: '53b37c9d-1b41-4f3c-9fd6-ab361d279b25',
    },
  },
});
