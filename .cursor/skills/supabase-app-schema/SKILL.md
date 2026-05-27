---
name: supabase-app-schema
description: Supabase database schema for Wix app installation tracking. Every Purple app uses this table to track installs, removals, plan changes, and setup completions.
---

# Supabase App Schema — Installation Tracking

Every Purple Wix CLI app uses this Supabase schema to track app installations, removals, billing changes, and setup completions.

## Database: `peofditgzrdovjjwxnta.supabase.co`

All Purple apps share the same Supabase instance.

## ⚠️ SUPABASE IS FOR `app_installations` ONLY ⚠️

The ONLY table this Supabase project hosts is `app_installations` — shared cross-app analytics keyed by `app_name`. Every per-instance need (widget settings, third-party credentials, usage counters, merchant content) belongs in **Wix Data** via the app's data extension (`src/extensions/data/extensions.ts`).

| Use case | Backend | Why |
|---|---|---|
| App installed / removed / plan changed events | Supabase `app_installations` | Cross-app rollups + ops dashboards |
| Setup-completion timestamp | Supabase `app_installations` (`setup_completed_at`) | Same row, just one more column |
| Per-instance widget settings | Wix Data collection | Auto-scoped per install, no `instance_id` column to manage |
| Per-instance API keys / credentials | Wix Data collection | `PRIVILEGED` permissions stop cross-install leakage |
| Per-instance usage counters | Wix Data collection | Same single-collection key-discriminator pattern as PayPal's usage_counter row |

❌ NEVER write `supabase.from('widget_settings')`, `supabase.from('credentials')`, `supabase.from('usage_counter')` or any other per-instance table — the table does NOT exist in the shared project and saves throw `Could not find the table 'public.<x>' in the schema cache`. The Foundation's smoke harness rejects any build that tries.

Canonical per-instance pattern: see `~/paypal-payment-button/src/extensions/_shared/credentials.ts` (Wix Data + `auth.elevate(items.query/insert/update)` + single-collection key-discriminator).

---

## Table: `app_installations`

```sql
CREATE TABLE IF NOT EXISTS app_installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- App & Instance
  instance_id TEXT UNIQUE NOT NULL,
  app_name TEXT,
  
  -- Site Info
  site_id TEXT,
  site_display_name TEXT,
  site_url TEXT,
  site_locale TEXT,
  
  -- Owner Info
  owner_email TEXT,
  business_name TEXT,
  phone TEXT,
  country TEXT,
  city TEXT,
  category TEXT,
  sub_category TEXT,
  
  -- Billing
  is_free BOOLEAN DEFAULT TRUE,
  package_name TEXT,
  billing_cycle TEXT,
  billing_started_at TIMESTAMPTZ,
  billing_expiration_date TIMESTAMPTZ,
  auto_renewing BOOLEAN,
  free_trial_status TEXT,
  
  -- Lifecycle
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  removed_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  setup_completed_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_app_installations_app_name ON app_installations(app_name);
CREATE INDEX IF NOT EXISTS idx_app_installations_is_active ON app_installations(is_active);
CREATE INDEX IF NOT EXISTS idx_app_installations_installed_at ON app_installations(installed_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_installations_country ON app_installations(country);
```

## How It's Used

### 1. App Installed Event (`src/backend/events/app-installed/event.ts`)

When a user installs the app, the event handler:
- Gets the instance ID from the event metadata
- Calls `appInstances.getAppInstance()` to get site details
- Calls `siteProperties.getSiteProperties()` to get business info
- Upserts a row into `app_installations` with all the data

### 2. App Removed Event (`src/backend/events/app-removed/event.ts`)

When uninstalled:
- Sets `removed_at` to current timestamp
- Sets `is_active` to false

### 3. Plan Changed Event (`src/backend/events/plan-changed/event.ts`)

When billing changes:
- Updates `package_name`, `billing_cycle`, `is_free`

### 4. Setup Completed (`src/backend/_shared/tracking.web.ts`)

When the user saves their first configuration:
- Sets `setup_completed_at` to current timestamp
- Only updates if `setup_completed_at` IS NULL (first save only)

## RLS (Row Level Security)

Since the backend uses the service role key, RLS is bypassed. No RLS policies are needed for server-side operations.

If you need to query from the frontend (not recommended), create appropriate RLS policies:

```sql
ALTER TABLE app_installations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON app_installations
  FOR ALL
  USING (auth.role() = 'service_role');
```

## Useful Queries

### Active installations count
```sql
SELECT COUNT(*) FROM app_installations WHERE is_active = TRUE AND app_name = 'your-app-name';
```

### Installations by country
```sql
SELECT country, COUNT(*) as count FROM app_installations 
WHERE is_active = TRUE AND app_name = 'your-app-name'
GROUP BY country ORDER BY count DESC;
```

### Premium conversion rate
```sql
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_free = FALSE) as premium,
  ROUND(COUNT(*) FILTER (WHERE is_free = FALSE)::numeric / NULLIF(COUNT(*), 0) * 100, 1) as conversion_pct
FROM app_installations 
WHERE is_active = TRUE AND app_name = 'your-app-name';
```

### Setup completion rate
```sql
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE setup_completed_at IS NOT NULL) as completed,
  ROUND(COUNT(*) FILTER (WHERE setup_completed_at IS NOT NULL)::numeric / NULLIF(COUNT(*), 0) * 100, 1) as completion_pct
FROM app_installations 
WHERE is_active = TRUE AND app_name = 'your-app-name';
```
