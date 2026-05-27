# Agent build instructions

This repo is the cloud-runtime scaffold for App Factory's "Via Agent" mode.

Your task is to generate a Wix app per the spec the user provides. Before
touching any file, read:

- `.cursor/skills/wix-app-foundation-system-blueprint/SKILL.md` — top-level
  rules, file layout, forbidden patterns.
- `.cursor/skills/wix-cli-orchestrator/SKILL.md` — category-specific
  scaffolding (this is a **full wix app with dashboard page, site widget, optional editor settings panel, and backend events.** scaffold).
- `.cursor/skills/supabase-app-schema/SKILL.md` — required Supabase tables.
- `.cursor/skills/ai-corrections/CORRECTIONS.md` — known anti-patterns to
  avoid.

When done, commit your changes and open a PR. Foundation's smoke harness
will run against your PR head — if it fails you'll be asked to fix specific
issues; obey those instructions literally.
