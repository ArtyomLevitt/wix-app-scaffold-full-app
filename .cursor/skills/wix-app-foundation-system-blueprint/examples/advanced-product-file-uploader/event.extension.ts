// @ts-nocheck — reference skeleton, not real source. Imports point at placeholder paths or modules that aren't installed in this skills repo. See examples/INDEX.md.
// VERBATIM (scrubbed) from advanced-product-file-uploader/src/extensions/backend/events/app-installed/app-installed.extension.ts.
// Goes at: src/extensions/backend/events/<event-name>/<event-name>.extension.ts
//
// The .extension.ts file is the metadata wrapper — id + path to the actual handler.
// The sibling <event-name>.ts exports the appInstances.onXxx() handler as default.
//
// You need ONE .extension.ts per event handler:
//   - app-installed.extension.ts → app-installed.ts
//   - app-removed.extension.ts   → app-removed.ts
//   - plan-changed.extension.ts  → plan-changed.ts
//   - plan-purchased.extension.ts → plan-purchased.ts
//   - order-created.extension.ts → order-created.ts (or other domain events)

import { extensions } from '@wix/astro/builders';

export default extensions.event({
  id: '<EVENT_EXTENSION_UUID>',
  source: './extensions/backend/events/app-installed/app-installed.ts',
});
