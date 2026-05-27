// @ts-nocheck — reference skeleton, not real source. Imports point at placeholder paths or modules that aren't installed in this skills repo. See examples/INDEX.md.
// VERBATIM (scrubbed) from advanced-product-file-uploader/src/extensions/site/plugins/file-uploader/file-uploader.extension.ts.
// Goes at: src/extensions/site/plugins/<plugin-name>/<plugin-name>.extension.ts
//
// Demonstrates a site plugin with TWO placements (cross-vendor compatibility for both
// Wix Stores Catalog v3 and the classic Stores app).

import { extensions } from '@wix/astro/builders';

export default extensions.sitePlugin({
  id: '<SITE_PLUGIN_UUID>',
  name: 'File Upload',
  marketData: {
    name: 'Product File Upload',
    description: 'Let customers upload files on product pages',
  },
  placements: [
    /* Wix Stores Catalog v3 */
    {
      appDefinitionId: 'a0c68605-c2e7-4c8d-9ea1-767f9770e087',
      widgetId: '6a25b678-53ec-4b37-a190-65fcd1ca1a63',
      slotId: 'product-page-details-2',
    },
    /* Wix Stores classic */
    {
      appDefinitionId: '1380b703-ce81-ff05-f115-39571d94dfcd',
      widgetId: '13a94f09-2766-3c40-4a32-8edb5acdd8bc',
      slotId: 'product-page-details-2',
    },
  ],
  installation: { autoAdd: true },
  tagName: 'file-uploader-plugin',                                  // MUST be globally unique across all your apps
  element: './extensions/site/plugins/file-uploader/file-uploader.tsx',
  settings: './extensions/site/plugins/file-uploader/file-uploader.panel.tsx',
});
