# Onboarding Slideshow — PRPL House Style

A 4-slide slideshow that **replaces** the dashboard for first-time users. Dismissed once → never shown again on this site (gated by localStorage).

---

## Visibility Rule

```tsx
const isFirstTime = savedConfigs.length === 0;
const showOnboarding = isFirstTime && !loading && !onboardingDismissed;

return (
  <>
    {showOnboarding && <OnboardingSlideshow ... />}
    {(!isFirstTime || onboardingDismissed || loading) && (
      <>
        {/* Stats cards, table, form, plan, settings, more apps... */}
      </>
    )}
  </>
);
```

---

## localStorage Gating

```tsx
import { LS_ONBOARDING } from '../_shared/app-config';

const [onboardingDismissed, setOnboardingDismissedRaw] = useState<boolean>(() => {
  try { return localStorage.getItem(LS_ONBOARDING) === '1'; } catch { return false; }
});

const setOnboardingDismissed = useCallback((val: boolean) => {
  setOnboardingDismissedRaw(val);
  if (val) {
    try { localStorage.setItem(LS_ONBOARDING, '1'); } catch { /* ignore */ }
  }
}, []);
```

`LS_ONBOARDING` = `${APP_SLUG}_onboarding_done`. Defined in `src/extensions/_shared/app-config.ts`. See [LOCALSTORAGE_KEYS.md](LOCALSTORAGE_KEYS.md).

---

## Slide Structure

A fixed-height container (`minHeight: 340px`) **with flexbox vertical+horizontal centering** so the hero never sits at the top of the slide and dot indicators / buttons don't jump between slides:

```tsx
<div
  style={{
    minHeight: 340,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center', // ← vertically centers each slide's content
  }}
>
  {step === 0 && <Slide1 />}
  {step === 1 && <Slide2 />}
  {/* … */}
</div>
```

Do NOT use a plain `<div style={{ minHeight: 340 }}>` — the content will stick to the top of the container and look unbalanced against the (vertically large) buttons below.

### Slide 1 — Welcome

- Heading: `t('onboarding.slide1.title')` — e.g. "Welcome to {APP_NAME}"
- Subtitle: `t('onboarding.slide1.subtitle')` — short value prop
- **Auto-rotating mini preview** (square 120×120, `borderRadius: 12`, `objectFit: cover`, no badge overlay). Keep the hero compact so the heading + subtitle + CTA fit above the fold without scrolling:
  ```tsx
  const OnboardingPreview: FC = () => {
    const [frame, setFrame] = useState(0);
    useEffect(() => {
      const id = setInterval(() => setFrame(f => (f + 1) % EXAMPLE_IMAGES.length), 120);
      return () => clearInterval(id);
    }, []);
    return (
      <div style={{ width: 120, height: 120, borderRadius: 12, overflow: 'hidden', border: '2px solid #e0e3e8' }}>
        <img src={EXAMPLE_IMAGES[frame]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
      </div>
    );
  };
  ```
- If you use a **single icon** instead of an image preview, size the container 120×120 and the icon 56×56 (NOT 200/96 — that's too big and pushes the CTA off screen):
  ```tsx
  <div style={{ width: 120, height: 120, borderRadius: 12, background: 'linear-gradient(135deg, #DBEAFE, #C3D9F7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Icons.Bulb style={{ color: '#1565C0', width: 56, height: 56 }} />
  </div>
  ```
- Single wide "Get Started" button (`size="medium"`, `minWidth: 200`). NO Back button.

### Slide 2 — How It Works

- Heading: `t('onboarding.slide2.title')` — e.g. "How It Works"
- 4 step cards in a row, **use `display: 'grid'` with `gridTemplateColumns: 'repeat(4, minmax(0, 1fr))'`** (NOT `flexWrap: 'wrap'` — that lets cards drop to a second row at narrow widths and breaks the visual rhythm). Wrap the grid in a `maxWidth: 760` container with `margin: '0 auto'` so the row is horizontally centered inside the slide.
- Each card: `padding: 14, borderRadius: 8, border: '1px solid #E4E6EB', textAlign: 'center', minWidth: 0` (the `minWidth: 0` lets cards shrink below their content size so the grid never overflows), vertical flex column with `gap: 8`:
  1. Blue circle icon (`width: 40, height: 40, backgroundColor: '#2B81CB'`, white icon)
  2. Step number + label (`{i+1}. Connect`, `weight="bold"`, `size="small"`)
  3. **One-sentence description** (`size="tiny"`, `secondary`, `lineHeight: 1.4`) — REQUIRED. Without it the slide feels like a placeholder. Describe what the user actually does in that step (e.g. "Paste your public Google Calendar ID — no OAuth, no API keys.").
- Common steps: Connect → Configure → Customize → Publish, but tailor labels + descriptions to the specific app.
- Translation keys (add `desc` alongside the existing `step` keys):
  ```
  "onboarding.slide2.step1":      "Connect"
  "onboarding.slide2.step1.desc": "<one sentence — what the user does>"
  "onboarding.slide2.step2":      "Configure"
  "onboarding.slide2.step2.desc": "<…>"
  …
  ```

### Slide 3 — Features

- Heading: `t('onboarding.slide3.title')` — e.g. "What You Get"
- 4 feature cards in a 2×2 grid (`gridTemplateColumns: 'repeat(2, minmax(0, 1fr))'`), wrapped in `maxWidth: 720, margin: '0 auto'`. Each card has:
  - A **32×32 rounded square icon badge** (`borderRadius: 8, background: '#EAF2FB', color: '#2B81CB'`) — NOT a bare icon. Bare icons make the card look unfinished and "empty".
  - Bold title (`size="small", weight="bold"`).
  - **One-sentence description** (`size="tiny", secondary, lineHeight: 1.45`) — REQUIRED, must explain the actual user benefit (NOT just restate the title).
- Use icons from `@wix/wix-ui-icons-common` ONLY (NOT `@wix/design-system/icons`).
- VALIDATE every icon name against this safe palette before emitting code — the following icons are guaranteed to exist in `@wix/wix-ui-icons-common@4.x`:
  - Layout / framing: `Maximize`, `LayoutList`, `LayoutOneColumn`, `LayoutFull`, `Mobile`, `MobileHeader`, `Globe`, `Map`
  - Styling: `ColorDrop`, `ColorBucket`, `Design`, `DesignSettings`, `DesignSparkles`, `MagicWand`, `MagicWandSparkles`
  - Wiring: `Link`, `Settings`, `Visible`, `Publish`, `Date`, `DateAndTime`
  - Sentiment: `Premium`, `Star`, `StarFilled`, `Like`, `Confirm`, `Insight`
- **DO NOT use `Resize`, `Bulb`, `Save`, `Layout`, `Calendar`** — none of these exist in `@wix/wix-ui-icons-common` (the AI hallucinates them frequently). Use the substitutes from the safe palette above (`Maximize` instead of `Resize`, `Date` instead of `Calendar`, `Insight` instead of `Bulb`, `Confirm` instead of `Save`, `LayoutList`/`LayoutFull` instead of `Layout`).
- **Brand icons** live without a `Social` prefix: use `Icons.Facebook`, `Icons.Instagram`, `Icons.Twitter`, `Icons.Pinterest`, `Icons.LinkedIn`, `Icons.Youtube` (lower-case t). `Icons.SocialFacebook`, `Icons.SocialInstagram`, etc. DO NOT EXIST.
- **Rotation icons** are `Icons.RotateLeft` / `Icons.RotateRight`. `Icons.Rotate` (no direction) DOES NOT EXIST.
- **NEVER write `(Icons as any).Foo`** to silence TypeScript on an unknown icon. The cast hides the typo from the compiler, but at runtime `<Icons.Foo />` resolves to `<undefined />` and React UNMOUNTS THE WHOLE TAB SUBTREE — the only visible symptom is that clicking a tab shows a blank screen. The build pipeline strips this cast automatically; treat it as a bug if you ever feel the urge to write one.

### Slide 4 — Ready to Start

- Heading: `t('onboarding.slide4.title')` — e.g. "Ready to start?"
- Two large buttons in a row:
  - **"Configure Your First Product"** → `setOnboardingDismissed(true)`, `setActiveTab(0)`, scroll to config form.
  - **"Try a Demo"** → `setOnboardingDismissed(true)`, `setActiveTab(0)`, scroll to live preview.

Both buttons must call `setOnboardingDismissed(true)` BEFORE their action.

---

## Navigation (below slides)

Always visible regardless of slide:

- **Dot indicators** — 4 dots, the active one wider (24px vs 8px), clickable, with CSS transition `width 200ms ease`.
- **Slide 1**: single wide "Get Started" button (full nav width). NO Back.
- **Slides 2–3**: Back + Next buttons (`size="small"`).
- **Slide 4**: Back + "Skip to Dashboard" button (`skin="standard" priority="secondary"` — must be visible without hover).

```tsx
<Box direction="vertical" gap="SP3" align="center" verticalAlign="middle">
  <Box direction="horizontal" gap="SP1">
    {[0,1,2,3].map(i => (
      <button
        key={i}
        onClick={() => setOnboardingStep(i)}
        style={{
          width: i === onboardingStep ? 24 : 8,
          height: 8,
          borderRadius: 4,
          background: i === onboardingStep ? '#2B81CB' : '#cfd6dc',
          border: 'none',
          cursor: 'pointer',
          transition: 'width 200ms ease, background 200ms ease',
        }}
      />
    ))}
  </Box>

  {onboardingStep === 0 && (
    <Button size="medium" minWidth={200} onClick={() => setOnboardingStep(1)}>
      {t('onboarding.cta.start')}
    </Button>
  )}
  {onboardingStep > 0 && onboardingStep < 3 && (
    <Box direction="horizontal" gap="SP2">
      <Button size="small" priority="secondary" onClick={() => setOnboardingStep(s => s - 1)}>
        {t('onboarding.cta.back')}
      </Button>
      <Button size="small" onClick={() => setOnboardingStep(s => s + 1)}>
        {t('onboarding.cta.next')}
      </Button>
    </Box>
  )}
  {onboardingStep === 3 && (
    <Box direction="horizontal" gap="SP2">
      <Button size="small" priority="secondary" onClick={() => setOnboardingStep(2)}>
        {t('onboarding.cta.back')}
      </Button>
      <Button size="small" skin="standard" priority="secondary" onClick={() => setOnboardingDismissed(true)}>
        {t('onboarding.cta.skip')}
      </Button>
    </Box>
  )}
</Box>
```

---

## State

```tsx
const [onboardingStep, setOnboardingStep] = useState(0);    // 0..3
const [onboardingDismissed, setOnboardingDismissed] = ...;  // see localStorage gating above
```

---

## Translation keys

```json
{
  "onboarding.slide1.title":    "Welcome to {APP_NAME}",
  "onboarding.slide1.subtitle": "<short value prop>",
  "onboarding.slide2.title":      "How It Works",
  "onboarding.slide2.step1":      "Connect",
  "onboarding.slide2.step1.desc": "<one-sentence description of step 1>",
  "onboarding.slide2.step2":      "Configure",
  "onboarding.slide2.step2.desc": "<…>",
  "onboarding.slide2.step3":      "Customize",
  "onboarding.slide2.step3.desc": "<…>",
  "onboarding.slide2.step4":      "Publish",
  "onboarding.slide2.step4.desc": "<…>",
  "onboarding.slide3.title":    "What You Get",
  "onboarding.slide3.feat1.title": "...",
  "onboarding.slide3.feat1.desc":  "...",
  "onboarding.slide3.feat2.title": "...",
  "onboarding.slide3.feat2.desc":  "...",
  "onboarding.slide3.feat3.title": "...",
  "onboarding.slide3.feat3.desc":  "...",
  "onboarding.slide3.feat4.title": "...",
  "onboarding.slide3.feat4.desc":  "...",
  "onboarding.slide4.title":    "Ready to start?",
  "onboarding.slide4.cta.configure": "Configure Your First Product",
  "onboarding.slide4.cta.demo":      "Try a Demo",
  "onboarding.cta.start": "Get Started",
  "onboarding.cta.back":  "Back",
  "onboarding.cta.next":  "Next",
  "onboarding.cta.skip":  "Skip to Dashboard"
}
```

Translate to all 17 PRPL house locales (`da, de, en, es, fr, he, it, ja, ko, nl, pl, pt, ru, th, tr, uk, zh`).

---

## Critical rules

- Onboarding slideshow **replaces** the dashboard, it does NOT layer over it. Wrap the dashboard content in `{(!isFirstTime || onboardingDismissed || loading) && (...)}`.
- `localStorage[LS_ONBOARDING]` is set ONLY when the user explicitly dismisses (Skip / Configure / Demo / completion). NEVER set it implicitly on first dashboard mount.
- The three "exit" actions (Skip, Configure, Demo) ALL set `onboardingDismissed = true` BEFORE their other action, so refreshing during scroll doesn't re-show the slideshow.
- The slideshow is dashboard-only. The editor settings panel does NOT have onboarding.
- Validate `LS_ONBOARDING` is read inside a `try/catch` — site visitors with privacy mode block `localStorage`.
