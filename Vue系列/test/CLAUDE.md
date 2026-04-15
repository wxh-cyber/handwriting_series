# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
npm install        # install dependencies
npm run dev        # start dev server (Vite)
npm run build      # type-check + build for production
npm run build-only # build without type-check
npm run type-check # run vue-tsc type checking only
npm run preview    # preview production build
```

No linting or test runner is configured.

## Architecture

This is a minimal Vue 3 sandbox used for experimenting with Vue concepts as part of the "手写函数系列/Vue系列" (Handwritten Functions / Vue Series) study project.

**Stack:**
- **Vue** — beta channel (all `@vue/*` packages pinned to `beta` via `overrides`)
- **Vue Router** v5 (beta)
- **TypeScript** ~6.0, type-checked by `vue-tsc` (not `tsc`)
- **Vite** v8 with `vite-plugin-vue-devtools`

**Path alias:** `@` → `./src`

**Entry points:**
- `src/main.ts` — creates the app, registers the router, mounts to `#app`
- `src/router/index.ts` — empty `routes` array; add routes here
- `src/App.vue` — root component (currently a placeholder)

Because this is a beta Vue environment, API surface may differ from the stable Vue 3 docs. Prefer checking the Vue beta changelog or source when APIs behave unexpectedly.
