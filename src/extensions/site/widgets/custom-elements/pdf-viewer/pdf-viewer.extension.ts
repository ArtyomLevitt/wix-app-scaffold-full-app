import { extensions } from '@wix/astro/builders';

export default extensions.customElement({
  id: 'ed2a0b12-12ba-45b0-8c61-9dfb0dd1b758',
  name: 'PDF Viewer & Flipbook',
  tagName: 'pdf-viewer',
  element: './extensions/site/widgets/custom-elements/pdf-viewer/widget.tsx',
  settings: './extensions/site/widgets/custom-elements/pdf-viewer/panel.tsx',
  installation: {
    autoAdd: true,
  },
  width: {
    defaultWidth: 720,
    allowStretch: true,
  },
  height: {
    defaultHeight: 600,
  },
  behaviors: {
    dashboard: {
      dashboardPageComponentId: 'baf2dd75-bd1f-458d-b7ab-fa0ef6a9879a',
    },
  },
  presets: [
    {
      id: '42d6d241-4baa-4d89-b856-d2d5bb8b9b27',
      thumbnailUrl: '{{BASE_URL}}/pdf-viewer-thumbnail.png',
    },
  ],
});
