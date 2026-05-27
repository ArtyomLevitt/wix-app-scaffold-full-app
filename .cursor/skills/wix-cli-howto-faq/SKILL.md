---
name: wix-cli-howto-faq
description: "Add an Interactive Guide iframe and collapsible FAQ accordion to the How to Use tab of a Wix CLI dashboard page. Use when the user wants to add a GuideJar embed, FAQ section, interactive guide, or collapsible questions to an existing dashboard How to Use tab."
---

# Add Interactive Guide & FAQ to How to Use Tab

> Load `wix-app-blueprint` FIRST — it owns the 3-tab dashboard structure (`Manage` / `Plan & Settings` / `How to Use`) that this skill extends. This skill assumes the How to Use tab already exists and has at least one Steps card.

Adds two new Card sections **above** the existing Steps card in the `howToUse` tab:

1. **Interactive Guide** — GuideJar iframe
2. **FAQ** — collapsible WDS Accordion

Final order in the tab: **Guide → FAQ → Steps**.

## Prerequisites

The user MUST provide:

1. **GuideJar embed URL** — record a guide on https://guidejar.com → publish → copy the `src` from the embed iframe (typically `https://app.guidejar.com/share/<id>?embed=true`).
2. **FAQ content** — questions and answers specific to the app's actual features. If the user doesn't supply them, **read the dashboard page code first** to understand what the app does, then write 5–8 focused Q/As. Do NOT use generic filler ("How do I install this app?").

## Implementation Steps

### Step 1 — Add `Accordion` to WDS imports

In the dashboard page file (usually `src/dashboard/pages/page.tsx`), add `Accordion` to the `@wix/design-system` import. `Card`, `Cell`, and `Text` should already be there (they're part of the existing How to Use tab). For Accordion props lookup, defer to the `wix-design-system` skill.

### Step 2 — Insert two cards ABOVE the existing Steps card

Find the How to Use tab section (look for `howToUse` in the tab / `dashboardTab` condition). Insert the two new `<Cell span={12}>` blocks **before** the existing Steps card.

#### Card 1: Interactive Guide (iframe)

```jsx
<Cell span={12}>
  <Card>
    <Card.Header title={t("guide.title")} subtitle={t("guide.subtitle")} />
    <Card.Divider />
    <Card.Content>
      <div
        style={{
          position: 'relative',
          height: 0,
          width: '100%',
          overflow: 'hidden',
          zIndex: 0,
          borderRadius: '6px',
          boxSizing: 'border-box',
          paddingBottom: 'calc(54.06666667% + 32px)',
        }}
      >
        <iframe
          src="GUIDEJAR_EMBED_URL_HERE"
          width="100%"
          height="100%"
          style={{ position: 'absolute', inset: 0 }}
          title={t("guide.title")}
          loading="lazy"
          allowFullScreen
          frameBorder="0"
        />
      </div>
    </Card.Content>
  </Card>
</Cell>
```

Why these attributes:

- `zIndex: 0` (NOT `99999`) — high z-index covers the dashboard's sticky header.
- `title={t("guide.title")}` — required for screen readers.
- `loading="lazy"` — defers the iframe until the user opens the How to Use tab; keeps the Manage tab fast.

#### Card 2: FAQ Accordion

```jsx
<Cell span={12}>
  <Card>
    <Card.Header title={t("faq.title")} />
    <Card.Divider />
    <Card.Content>
      <Accordion
        multiple
        size="small"
        items={Array.from({ length: N }, (_, i) => ({
          title: t(`faq.q${i + 1}`),
          children: <Text size="small" secondary>{t(`faq.a${i + 1}`)}</Text>,
        }))}
      />
    </Card.Content>
  </Card>
</Cell>
```

Replace `N` with the number of FAQ items (typically 5–8).

#### Multi-paragraph or rich FAQ answers

If an answer needs paragraphs, links, or a list, swap the `children` from a single `<Text>` to a fragment with multiple `<Text>` blocks:

```jsx
items={[
  {
    title: t("faq.q1"),
    children: (
      <>
        <Text size="small" secondary>{t("faq.a1.p1")}</Text>
        <Text size="small" secondary>{t("faq.a1.p2")}</Text>
      </>
    ),
  },
  // ...other items
]}
```

For inline links inside an answer, use the WDS `<TextButton as="a" href="..." target="_blank">` — never a raw `<a>`.

#### Empty FAQ fallback

If the user wants only the iframe and no FAQ, ship Card 1 and skip Card 2 entirely. Do NOT render an empty Accordion.

### Step 3 — Add keys to `en.json` (PRPL house style: en-first)

Per the blueprint's locale policy, only `en.json` is hand-written. Other locales are generated. Add to `src/intl/messages/en.json`:

```json
{
  "guide.title":    "Interactive Guide",
  "guide.subtitle": "Follow along step by step",
  "faq.title":      "Frequently Asked Questions",
  "faq.q1": "<Question 1 — specific to the app>",
  "faq.a1": "<Answer 1 — specific to the app>",
  "faq.q2": "...",
  "faq.a2": "..."
}
```

Then generate the other 16 locales:

```bash
wix translate
```

This creates / updates `da, de, es, fr, he, it, ja, ko, nl, pl, pt, ru, th, tr, uk, zh`.

#### Optional fast path — pre-translated boilerplate

The 3 boilerplate keys (`guide.title`, `guide.subtitle`, `faq.title`) are stable across apps. If `wix translate` is unavailable, paste these directly:

| Key | en | da | de | es | fr | he |
|-----|----|----|----|----|----|----|
| guide.title | Interactive Guide | Interaktiv guide | Interaktive Anleitung | Guía interactiva | Guide interactif | מדריך אינטראקטיבי |
| guide.subtitle | Follow along step by step | Følg med trin for trin | Schritt für Schritt folgen | Sigue el proceso paso a paso | Suivez les étapes une par une | עקוב צעד אחר צעד |
| faq.title | Frequently Asked Questions | Ofte stillede spørgsmål | Häufig gestellte Fragen | Preguntas frecuentes | Questions fréquemment posées | שאלות נפוצות |

| Key | it | ja | ko | nl | pl | pt |
|-----|----|----|----|----|----|----|
| guide.title | Guida interattiva | インタラクティブガイド | 인터랙티브 가이드 | Interactieve gids | Interaktywny przewodnik | Guia interativo |
| guide.subtitle | Segui passo dopo passo | ステップごとに進めましょう | 단계별로 따라하세요 | Volg stap voor stap | Śledź krok po kroku | Acompanhe passo a passo |
| faq.title | Domande frequenti | よくある質問 | 자주 묻는 질문 | Veelgestelde vragen | Często zadawane pytania | Perguntas frequentes |

| Key | ru | th | tr | uk | zh |
|-----|----|----|----|----|-----|
| guide.title | Интерактивное руководство | คู่มือแบบอินเทอร์แอคทีฟ | Etkileşimli Kılavuz | Інтерактивний посібник | 互动指南 |
| guide.subtitle | Следуйте шаг за шагом | ทำตามทีละขั้นตอน | Adım adım takip edin | Слідкуйте крок за кроком | 一步步跟着操作 |
| faq.title | Часто задаваемые вопросы | คำถามที่พบบ่อย | Sıkça Sorulan Sorular | Часті запитання | 常见问题 |

`faq.q*` / `faq.a*` are app-specific — write them in `en.json` first, then `wix translate`.

### Step 4 — Validate JSON

After editing locale files, verify every file parses:

```bash
for f in src/intl/messages/*.json; do
  python3 -c "import json; json.load(open('$f'))" 2>&1 && echo "$f: OK" || echo "$f: FAILED"
done
```

## Anti-patterns

| Don't | Do |
|---|---|
| `zIndex: 99999` on the iframe wrapper (covers the dashboard sticky header) | `zIndex: 0` |
| Iframe with no `title` attribute (a11y violation) | `title={t("guide.title")}` |
| Eager-load the iframe (slows the Manage tab on first paint) | `loading="lazy"` |
| Hand-translate every key for all 17 locales | Write `en.json` first; run `wix translate` for the other 16 |
| Chinese curly quotes `\u201c…\u201d` inside `zh.json` strings | Corner brackets `「…」` (curly quotes break JSON) |
| Hardcode FAQ text in JSX | Wire every string through `t()` + `en.json` |
| Raw `<a href="...">` for FAQ links | WDS `<TextButton as="a" href="..." target="_blank">` inside a `<Text>` |
| Generic FAQ ("How do I install this app?") without reading the code | Read the dashboard page first; write Q/As that match real features |
| Insert new Cards AFTER the existing Steps card | Order: Guide → FAQ → Steps (top-down) |
| Render an empty Accordion when there are no FAQs | Skip Card 2 entirely |

## Completion Checklist

Before reporting completion, verify:

- [ ] `Accordion` added to the `@wix/design-system` import.
- [ ] Two new `<Cell span={12}>` Cards inserted **ABOVE** the existing Steps card in the `howToUse` tab.
- [ ] Iframe has `title`, `loading="lazy"`, `zIndex: 0`, and the user-supplied GuideJar URL.
- [ ] FAQ Accordion uses `multiple` and `size="small"`; every Q/A wired through `t()`.
- [ ] `en.json` has all new keys (`guide.title`, `guide.subtitle`, `faq.title`, `faq.q1..N`, `faq.a1..N`).
- [ ] Other 16 locale files populated via `wix translate` (or via the boilerplate table for the 3 stable keys).
- [ ] All locale files parse as valid JSON (Step 4 command passes).
- [ ] Manual smoke test: open dashboard → How to Use tab → iframe renders → Accordion expands/collapses.

## Reference links

- [`wix-app-blueprint/references/TABS_BLUEPRINT.md`](../wix-app-blueprint/references/TABS_BLUEPRINT.md) — defines the 3-tab structure that contains the How to Use tab.
- [`wix-app-blueprint/examples/INDEX.md`](../wix-app-blueprint/examples/INDEX.md) — locale policy ("en.json only by default; `wix translate` for the rest").
- `wix-design-system` skill — Accordion / Card / Cell / Text / TextButton props lookup.
- GuideJar — https://guidejar.com (record + publish the guide before scaffolding).
