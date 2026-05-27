// @ts-nocheck — reference skeleton, not real source. Imports point at placeholder paths or modules that aren't installed in this skills repo. See examples/INDEX.md.
// VERBATIM (with UUID placeholder) from advanced-product-file-uploader/src/extensions/dashboard/pages/my-page/my-page.extension.ts.
// Goes at: src/extensions/dashboard/pages/<page-name>/<page-name>.extension.ts
//
// This is the canonical Astro dashboard-page registration. Pair with a sibling
// `<page-name>.tsx` that exports the React component.
//
// IMPORTANT: every extension UUID must be unique across the app. Generate fresh ones with:
//   node -e "console.log(crypto.randomUUID())"

import { extensions } from '@wix/astro/builders';

export default extensions.dashboardPage({
  id: '<DASHBOARD_PAGE_UUID>',
  title: 'Product File Uploader',                            // appears in the Wix dashboard nav
  routePath: '',                                             // empty = root page; set to a slug for sub-pages
  component: './extensions/dashboard/pages/my-page/my-page.tsx',
});
