---
name: wix-dev-center-setup
description: Post-build guide for registering a generated Wix CLI app on the Wix Dev Center. Covers app registration, setting appId, permissions, pricing plans, and submission for review.
---

# Wix Dev Center — Post-Build Setup Guide

After the App Factory generates code and pushes to GitHub, follow these steps to register and configure the app on the Wix Dev Center.

---

## Step 1: Create the App on Wix Dev Center

1. Go to [https://dev.wix.com/apps](https://dev.wix.com/apps)
2. Click **Create New App**
3. Enter the app name and description
4. Note the **App ID** from the URL or app settings page

## Step 2: Update `wix.config.json`

Replace the placeholder `appId` in the generated project:

```json
{
  "$schema": "https://dev.wix.com/wix-cli/schemas/wix-config.json",
  "appId": "YOUR-ACTUAL-APP-ID",
  "projectId": "your-app-slug"
}
```

## Step 3: Connect the GitHub Repository

1. In the Dev Center, go to **Build** > **CLI**
2. Link your GitHub repository
3. Set up automatic builds from the main branch

## Step 4: Configure Permissions

Go to `https://manage.wix.com/apps/{app-id}/dev-center-permissions`

### Required permissions for all apps:
- No additional permissions needed for basic dashboard-only apps

### Permissions by app type:

| App Type | Required Permissions |
|---|---|
| Embedded Script | `SCOPE.DC-APPS.MANAGE-EMBEDDED-SCRIPTS` |
| eCommerce (Stores) | `WIX_STORES.READ`, `WIX_STORES.WRITE`, `WIX_ECOM.READ` |
| Members/CRM | `WIX_MEMBERS.READ`, `WIX_CRM.READ` |
| Bookings | `WIX_BOOKINGS.READ` |
| Blog | `WIX_BLOG.READ` |
| Data Collections | `WIX_DATA.READ`, `WIX_DATA.WRITE` |

## Step 5: Configure OAuth & Webhooks

1. **OAuth**: Go to **Build** > **OAuth** and add the redirect URL
2. **Webhooks**: Backend events (app-installed, app-removed, plan-changed) are automatically registered via the CLI extensions

## Step 6: Set Up Pricing Plans

Go to **Monetization** > **Pricing Plans** in the Dev Center.

### Standard Purple pricing tiers:

| Plan | Monthly Price | Annual Price | Features |
|---|---|---|---|
| Free | $0 | - | 1 item limit, basic features |
| Starter | $4.99/mo | $3.99/mo | 10 items, priority support |
| Standard | $9.99/mo | $7.99/mo | Unlimited items, advanced features |
| Advanced | $19.99/mo | $15.99/mo | Unlimited, API access, white-label |

**Important:** After creating plans, update the `APP_ID` constant in `src/backend/app-plans.web.ts` to match the actual app ID.

## Step 7: Update Supabase

1. Update `SUPABASE_SERVICE_KEY` in `src/backend/_shared/supabase-client.ts` with the real key
2. Create the `app_installations` table (see `supabase-app-schema` skill)
3. Update the `DEFAULT_REVIEW_URL` in `src/dashboard/_shared/rate-popup.ts` with the actual app ID

## Step 8: Build & Test

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Release to production
npm run release
```

## Step 9: Submit for Review

1. Go to **Submit** in the Dev Center
2. Fill in:
   - App name and description
   - Screenshots (at least 3)
   - Support email: apps-support@prpl.io
   - Privacy policy URL
   - Category
3. Submit for review (typically 3-7 business days)

## Step 10: Post-Launch

After approval:
- Monitor installations in Supabase `app_installations` table
- Track setup completions via `tracking.web.ts`
- Monitor app reviews on the Wix App Market
- Update pricing plans based on market feedback
