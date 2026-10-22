---
trigger: always_on
description: Mandatory enforcement of nextjs-component-dev skill for all component creation and nextjs-page-dev skill for all page creation.
---

# Mandatory Next.js Component & Page Development Skill Enforcement

1. **Every New Component MUST Use `nextjs-component-dev`**:
   - Before creating, scaffolding, or implementing any new React/Next.js component (`.tsx`), you **MUST** read and execute `.agents/skills/nextjs-component-dev/SKILL.md`.
   - Never create ad-hoc component files. Every component requires: local Next.js docs check via `codebase-memory`, `implementation_plan.md`, `messages/[locale].json` dictionary population across all supported locales (zero hardcoded text), TDD unit tests (`[ComponentName].test.tsx`) authored before implementation, primary component (`[ComponentName].tsx`), matching Suspense skeleton (`[ComponentName]Skeleton.tsx`), barrel export (`index.ts`), semantic OKLCH tokens (`bg-background`, `text-foreground`, `border-border`, `text-muted-foreground`), Tailwind logical BiDi properties (`ms-`, `me-`, `ps-`, `pe-`, `start`, `end`), `verify-dev.ps1` execution, and `docs/plan/05-pages-and-components.md` checklist synchronization.

2. **Every New Page MUST Use `nextjs-page-dev`**:
   - Before creating, scaffolding, or implementing any new Next.js App Router page or route (`page.tsx`), you **MUST** read and execute `.agents/skills/nextjs-page-dev/SKILL.md`.
   - Every page requires: `docs/project.json` and `ROUTES` lookup, `messages/[locale].json` dictionary population across all supported locales, `loading.tsx` skeleton, async `params` in `page.tsx`, `generateMetadata()`, `generateStaticParams()`, `<JsonLd>` structured data (`schema-dts`), granular `<Suspense>` boundaries, `verify-page.ps1` execution, and `docs/plan/05-pages-and-components.md` checklist synchronization.
   - If building a page requires creating any new section or child components, you **MUST** read and execute `.agents/skills/nextjs-component-dev/SKILL.md` for each new component.
