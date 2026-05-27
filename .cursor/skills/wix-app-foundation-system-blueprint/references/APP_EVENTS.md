# Backend Events — App Installed / Removed / Plan Changed

Three event extensions ship with every PRPL app. They write to a shared Supabase `app_installations` table that powers our churn / billing / onboarding analytics.

---

## ⚠️ Mandatory Astro Config

Add to `astro.config.mjs`:

```js
export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  integrations: [wix(), react()],
  security: { checkOrigin: false },          // ← MANDATORY
  // ... rest
});
```

Without `security: { checkOrigin: false }`, Astro 5+ rejects every Wix webhook with 403 (CSRF origin mismatch). NO row will appear in Supabase.

---

## File Layout

```
src/extensions/_shared/
  supabase-client.ts                      # gitignored

src/extensions/backend/events/
  app-installed/
    app-installed.ts
    app-installed.extension.ts
  app-removed/
    app-removed.ts
    app-removed.extension.ts
  plan-changed/
    plan-changed.ts                       # handles BOTH onAppInstancePaidPlanPurchased + onAppInstancePaidPlanChanged
    plan-changed.extension.ts
```

Then register all three in `src/extensions.ts`:

```ts
import { eventAppInstalled } from './extensions/backend/events/app-installed/app-installed.extension';
import { eventAppRemoved }   from './extensions/backend/events/app-removed/app-removed.extension';
import { eventPlanChanged }  from './extensions/backend/events/plan-changed/plan-changed.extension';

export default app()
  .use(/* dashboard, widgets, data, ... */)
  .use(eventAppInstalled)
  .use(eventAppRemoved)
  .use(eventPlanChanged);
```

---

## Supabase Client (gitignored)

`src/extensions/_shared/supabase-client.ts`:

```ts
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL         = '<your-supabase-project-url>';
const SUPABASE_SERVICE_KEY = '<service-role-key — server-side only, NEVER ship to client>';

export function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}
```

`.gitignore` (BEFORE first commit):

```
# secrets
src/extensions/_shared/supabase-client.ts
```

Verify: `git check-ignore -v src/extensions/_shared/supabase-client.ts` must print the rule.

---

## app-installed

`app-installed.ts`:

```ts
import { appInstances } from '@wix/app-management';
import { siteProperties } from '@wix/business-tools';
import { auth } from '@wix/essentials';
import { getSupabase } from '../../../_shared/supabase-client';
import { APP_NAME } from '../../../_shared/app-config';

const elevatedGetAppInstance = auth.elevate(appInstances.getAppInstance);
const elevatedGetSiteProps   = auth.elevate(siteProperties.getSiteProperties);

export default appInstances.onAppInstanceInstalled(async (event) => {
  try {
    const instanceId = event.metadata?.instanceId;
    const siteId     = event.metadata?.accountInfo?.siteId;
    const { instance, site } = await elevatedGetAppInstance();

    let businessName: string | null = null,
        phone: string | null = null,
        country: string | null = null,
        city: string | null = null,
        category: string | null = null,
        subCategory: string | null = null;

    try {
      const props = (await elevatedGetSiteProps()) as any;
      businessName = props?.properties?.businessName ?? null;
      phone        = props?.properties?.phone ?? null;
      country      = props?.properties?.address?.country ?? null;
      city         = props?.properties?.address?.city ?? null;
      category     = props?.properties?.categories?.primary ?? null;
      subCategory  = props?.properties?.categories?.secondary?.[0] ?? null;
    } catch (err) {
      console.warn('[app-installed] getSiteProperties failed:', err);
    }

    const supabase = getSupabase();
    await supabase.from('app_installations').upsert({
      instance_id:             instanceId,
      app_name:                (instance as any)?.appName ?? APP_NAME,
      site_id:                 site?.siteId ?? siteId,
      owner_email:             site?.ownerInfo?.email ?? null,
      business_name:           businessName,
      phone, country, city, category, sub_category: subCategory,
      site_display_name:       site?.siteDisplayName ?? null,
      site_url:                (site as any)?.url ?? null,
      site_locale:             (site as any)?.locale ?? null,
      is_free:                 (instance as any)?.isFree ?? true,
      package_name:            (instance as any)?.billing?.packageName ?? null,
      billing_cycle:           (instance as any)?.billing?.billingCycle ?? null,
      billing_started_at:      (instance as any)?.billing?.timeStamp ?? null,
      billing_expiration_date: (instance as any)?.billing?.expirationDate ?? null,
      auto_renewing:           (instance as any)?.billing?.autoRenewing ?? null,
      free_trial_status:       (instance as any)?.billing?.freeTrialInfo?.status ?? null,
      installed_at:            new Date().toISOString(),
      removed_at:              null,
      is_active:               true,
    }, { onConflict: 'instance_id' });
  } catch (error) {
    console.error('[app-installed] failed:', error);
  }
});
```

`app-installed.extension.ts`:

```ts
import { extensions } from '@wix/astro/builders';

export const eventAppInstalled = extensions.event({
  id: '<fresh-uuid>',
  source: './extensions/backend/events/app-installed/app-installed.ts',
});
```

Generate a fresh UUID with: `node -e "console.log(crypto.randomUUID())"`. NEVER copy a UUID from a sample.

---

## app-removed

`app-removed.ts`:

```ts
import { appInstances } from '@wix/app-management';
import { getSupabase } from '../../../_shared/supabase-client';

export default appInstances.onAppInstanceRemoved(async (event) => {
  try {
    const instanceId = event.metadata?.instanceId;
    if (!instanceId) return;
    const supabase = getSupabase();
    await supabase
      .from('app_installations')
      .update({ is_active: false, removed_at: new Date().toISOString() })
      .eq('instance_id', instanceId);
  } catch (error) {
    console.error('[app-removed] failed:', error);
  }
});
```

`app-removed.extension.ts`:

```ts
import { extensions } from '@wix/astro/builders';

export const eventAppRemoved = extensions.event({
  id: '<fresh-uuid>',
  source: './extensions/backend/events/app-removed/app-removed.ts',
});
```

We do NOT delete rows on uninstall. Keeping them flips `is_active = false` and stamps `removed_at` so we can analyse churn.

---

## plan-changed (BOTH events in ONE file)

`plan-changed.ts`:

```ts
import { appInstances } from '@wix/app-management';
import { auth } from '@wix/essentials';
import { getSupabase } from '../../../_shared/supabase-client';

const elevatedGetAppInstance = auth.elevate(appInstances.getAppInstance);

async function syncBillingToSupabase(instanceId: string, logPrefix: string) {
  try {
    const { instance } = await elevatedGetAppInstance();
    const supabase = getSupabase();
    await supabase
      .from('app_installations')
      .update({
        is_free:                 (instance as any)?.isFree ?? true,
        package_name:            (instance as any)?.billing?.packageName ?? null,
        billing_cycle:           (instance as any)?.billing?.billingCycle ?? null,
        billing_started_at:      (instance as any)?.billing?.timeStamp ?? null,
        billing_expiration_date: (instance as any)?.billing?.expirationDate ?? null,
        auto_renewing:           (instance as any)?.billing?.autoRenewing ?? null,
        free_trial_status:       (instance as any)?.billing?.freeTrialInfo?.status ?? null,
      })
      .eq('instance_id', instanceId);
  } catch (e) {
    console.error(`[${logPrefix}] failed:`, e);
  }
}

// Side-effect call (not the default export)
appInstances.onAppInstancePaidPlanPurchased(async (event) => {
  const id = event.metadata?.instanceId;
  if (id) await syncBillingToSupabase(id, 'plan-purchased');
});

// Default export — Astro picks this up as the "main" handler
export default appInstances.onAppInstancePaidPlanChanged(async (event) => {
  const id = event.metadata?.instanceId;
  if (id) await syncBillingToSupabase(id, 'plan-changed');
});
```

`plan-changed.extension.ts`:

```ts
import { extensions } from '@wix/astro/builders';

export const eventPlanChanged = extensions.event({
  id: '<fresh-uuid>',
  source: './extensions/backend/events/plan-changed/plan-changed.ts',
});
```

**Critical:** Only ONE of the two SDK calls (`onAppInstancePaidPlanPurchased` / `onAppInstancePaidPlanChanged`) can be the file's `default export`. The other is a side-effect call. Co-locating them in one file matches our shared `syncBillingToSupabase` helper.

---

## Setup-tracking endpoint (called from dashboard)

In addition to the 3 backend events, the dashboard pings this on first save so we can compute "install → setup" funnel:

`src/pages/api/app/track-setup-completed.ts`:

```ts
import type { APIRoute } from 'astro';
import { appInstances } from '@wix/app-management';
import { auth } from '@wix/essentials';
import { getSupabase } from '../../../extensions/_shared/supabase-client';

const elevated = auth.elevate(appInstances.getAppInstance);

export const OPTIONS: APIRoute = async () => new Response(null, { status: 204 });

export const POST: APIRoute = async () => {
  try {
    const { instance } = await elevated();
    const id = instance?.instanceId;
    if (!id) return Response.json({ ok: false });
    await getSupabase()
      .from('app_installations')
      .update({ setup_completed_at: new Date().toISOString() })
      .eq('instance_id', id)
      .is('setup_completed_at', null);     // ONLY first time
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false });
  }
};
```

The `.is('setup_completed_at', null)` clause guarantees we only ever record the **first** save. The dashboard can call this on every save without polluting metrics.

---

## Supabase Schema

```sql
create table if not exists public.app_installations (
  instance_id              text primary key,
  app_name                 text,
  site_id                  text,
  owner_email              text,

  business_name            text,
  phone                    text,
  country                  text,
  city                     text,
  category                 text,
  sub_category             text,
  site_display_name        text,
  site_url                 text,
  site_locale              text,

  is_free                  boolean,
  package_name             text,
  billing_cycle            text,
  billing_started_at       timestamptz,
  billing_expiration_date  timestamptz,
  auto_renewing            boolean,
  free_trial_status        text,

  installed_at             timestamptz default now(),
  removed_at               timestamptz,
  setup_completed_at       timestamptz,

  is_active                boolean default true,
  created_at               timestamptz default now(),
  updated_at               timestamptz default now()
);

create index if not exists app_installations_app_name_idx       on public.app_installations(app_name);
create index if not exists app_installations_active_idx         on public.app_installations(is_active);
create index if not exists app_installations_setup_done_idx     on public.app_installations(setup_completed_at);
create index if not exists app_installations_package_idx        on public.app_installations(package_name);

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists app_installations_touch on public.app_installations;
create trigger app_installations_touch
  before update on public.app_installations
  for each row execute function public.touch_updated_at();
```

**Notes:**
- Single shared table across ALL PRPL apps; filter rows by `app_name` for per-app analytics.
- `is_active` flips to `false` on uninstall. Keep rows for churn analysis — never delete.
- `setup_completed_at` writes ONCE (first save) thanks to the `.is(null)` filter.
- Service-role key is server-side only; the client never reads the table directly.
- Enable Row Level Security if/when client-side reads are needed later.

---

## Manual steps for the user

After the agent scaffolds the events:

1. Create the Supabase project (or reuse the shared PRPL one).
2. Run the schema above in the SQL editor.
3. Paste `SUPABASE_URL` + service-role key into `src/extensions/_shared/supabase-client.ts`.
4. Confirm `.gitignore` excludes the file: `git check-ignore -v src/extensions/_shared/supabase-client.ts`.
5. In Wix Dev Center → Webhooks, register the 3 backend events (CLI usually does this automatically once `extensions.ts` is registered).
6. Deploy: `npx wix dev` first, then `npx wix release`.
7. Test by installing the app on a test site → check Supabase dashboard for the new row in `app_installations`.

---

## Common pitfalls

| Symptom | Likely cause |
|---------|--------------|
| "The webhook server returned an error" in Dev Center; no Supabase row | Missing `security: { checkOrigin: false }` in `astro.config.mjs` |
| Function silently returns `isPremium: false` everywhere | Used `Permissions.Anyone` instead of `"Anyone" as any` (older `@wix/web-methods`) |
| Event extension runs but no row written | Service key is wrong or has RLS that blocks service role; check Supabase logs |
| `randomUUID` import error in `.web.ts` | Use `crypto.randomUUID()` (Web Crypto), don't `import { randomUUID } from 'node:crypto'` |
| Two `onAppInstancePaidPlanPurchased` handlers ran twice | Only one file may declare a given handler — co-locate purchased + changed in one `plan-changed.ts` |
