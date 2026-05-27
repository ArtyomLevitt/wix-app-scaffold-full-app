# localStorage Keys — Conventions

All localStorage keys used by a PRPL Wix app are namespaced by `APP_SLUG` so multiple PRPL apps can co-exist on the same site without conflict.

Defined once in `src/extensions/_shared/app-config.ts`, exported as constants, and consumed everywhere.

---

## Canonical key list

| Constant | Value | Purpose | Set by | Read by |
|----------|-------|---------|--------|---------|
| `LS_ONBOARDING` | `${APP_SLUG}_onboarding_done` | Hides the onboarding slideshow on subsequent visits | Onboarding "Skip" / "Configure" / "Demo" / completion handlers | Dashboard page mount |
| `LS_REVIEW` | `${APP_SLUG}_review_shown_v1` | Prevents the review popup from showing again | First-save handler (BEFORE the 2s `setTimeout`) | First-save handler (early return if set) |
| `LS_CELEBRATION_LAST` | `${APP_SLUG}_last_celebration_at` | Throttles the green celebration banner to at most once per N days | First-save handler | First-save handler |
| `LS_LAST_TAB` | `${APP_SLUG}_last_tab` | Restores the last active dashboard tab on refresh (optional) | Tab onClick | Dashboard page mount |
| `LS_DRAFT_<feature>` | `${APP_SLUG}_draft_<feature>` | Auto-save unsaved form drafts | Form `onChange` (debounced) | Form mount |

---

## Helper hook

```ts
// src/extensions/dashboard/_shared/use-local-storage-bool.ts
import { useState, useCallback } from 'react';

export function useLocalStorageBool(key: string): [boolean, (val: boolean) => void] {
  const [val, setValRaw] = useState<boolean>(() => {
    try { return localStorage.getItem(key) === '1'; } catch { return false; }
  });

  const setVal = useCallback((next: boolean) => {
    setValRaw(next);
    try {
      if (next) localStorage.setItem(key, '1');
      else      localStorage.removeItem(key);
    } catch { /* localStorage blocked */ }
  }, [key]);

  return [val, setVal];
}
```

---

## Rules

1. **Always wrap in `try/catch`.** Site visitors with privacy mode (Safari ITP, incognito) block `localStorage`, throwing on every call. Falling back gracefully is mandatory.
2. **Never read across apps.** Don't read another app's key (e.g. `password-protected_review_shown_v1` from the FBT dashboard). Each app owns its own namespace.
3. **Bump the version suffix on schema change.** If the review popup logic changes meaningfully (different copy, different trigger), bump to `_review_shown_v2` so the new popup re-shows once for existing users.
4. **Set BEFORE async / setTimeout.** For one-time triggers like the review popup, set the key BEFORE scheduling the open — otherwise rapid double-saves can race and fire the popup twice.
5. **Don't gate critical UI.** localStorage can be cleared by the user. Never use it as the only source of truth for "this user has paid" — always cross-check against `getAppInstance()`.
6. **No PII.** Never store emails, payment data, tokens, or anything reversible. localStorage is plain-text and visible in DevTools.
7. **Document every key.** When adding a new key to your app, append it to this file (or a per-app version) so debugging future support tickets is easier.

---

## Debugging cheatsheet

In the dashboard browser console:

```js
// See every PRPL key on this site
Object.keys(localStorage).filter(k => /^(fbt|password-protected|google-drive|...)_/.test(k))

// Reset onboarding for FBT
localStorage.removeItem('fbt_onboarding_done')

// Reset review popup for Google Drive Content
localStorage.removeItem('google-drive_review_shown_v1')

// Reset everything for an app
Object.keys(localStorage).filter(k => k.startsWith('fbt_')).forEach(k => localStorage.removeItem(k))
```

Provide these to the user in support docs / FAQ so they can self-debug.
