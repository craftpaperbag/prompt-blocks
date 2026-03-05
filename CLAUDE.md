# CLAUDE.md — Prompt Blocks

## Project Overview

Prompt Blocks is a single-page React application for composing AI prompts using a block-based (LEGO-like) visual builder. Users drag, reorder, and combine categorized prompt blocks into a canvas, fill in variables, and copy the resulting prompt. **No backend or AI integration** — scope ends at prompt text generation.

The UI is bilingual Japanese/English with Japanese as the primary language.

## Tech Stack

- **Framework:** React 18 (Create React App)
- **Language:** JavaScript (JSX) — no TypeScript
- **Icons:** lucide-react
- **Styling:** 100% inline styles (no CSS files/frameworks)
- **Storage:** localStorage only (no backend/database)
- **Auth:** Client-side mock authentication (simulated 6-digit codes)

## Project Structure

```
src/
  PromptBuilder.jsx  # Main application component (~700 lines, monolithic)
  App.js             # Thin wrapper component
  index.js           # React 18 entry point
public/
  index.html         # HTML template (lang="ja")
CORE.md              # Product philosophy and constraints (Japanese)
README.md            # Project overview (Japanese)
```

## Commands

```bash
npm install    # Install dependencies
npm start      # Run dev server (react-scripts start)
npm run build  # Production build (react-scripts build)
```

There are no tests, linters, or formatters configured beyond CRA defaults.

## Architecture & Key Patterns

### Single-Component Architecture

Nearly all logic lives in `src/PromptBuilder.jsx`. It contains:

- **23+ useState hooks** for all application state
- **Constants:** `DARK`/`LIGHT` (theme colors), `CAT` (6 block categories), `CATEGORIES` (36 preset blocks), `BI` (icon map), `ST` (localStorage wrapper), `Auth` (mock auth)
- **One sub-component:** `SC` (SavedCard) for rendering saved prompt previews
- **All styles** defined as inline JavaScript objects (`inp`, `gb`, `tb`, `pb`, `ov`, `ml`)

### Block Categories (CAT)

| Category      | Color   | Purpose                        |
|---------------|---------|--------------------------------|
| `role`        | #60A5FA | AI persona/expertise           |
| `input`       | #4ADE80 | Input data types               |
| `task`        | #C084FC | Operations to perform          |
| `output`      | #FBBF24 | Output format specification     |
| `constraint`  | #F472B6 | Rules and restrictions         |
| `technique`   | #22D3EE | Prompt engineering techniques  |

Each category has 6 preset blocks. Blocks use `{variable}` template syntax.

### Data Persistence (localStorage)

- `auth:p:{email}` — Pending login verification codes
- `auth:u` — Current user session
- `data:{email}` — User's custom blocks and saved prompts
- `pb-theme` — Dark/light mode preference
- `pb-hidden-blocks` — Hidden preset blocks

### Responsive Design

- **Desktop (≥768px):** Side-by-side layout (canvas + block selector sidebar)
- **Mobile (<768px):** Tab-based navigation with modal block selection
- `isMobile` state drives conditional rendering throughout
- Touch drag-to-reorder on mobile, mouse drag on desktop

### Theme System

- `isDark` state toggles between `DARK` and `LIGHT` color constant objects
- Active palette assigned to `C` variable used throughout all inline styles
- Persisted to `pb-theme` in localStorage

## Code Conventions

- **Constants:** UPPER_CASE (`DARK`, `LIGHT`, `CAT`, `CATEGORIES`, `ST`)
- **Functions:** camelCase (`addToCanvas`, `extractVars`, `getFilledOutput`)
- **Components:** PascalCase (`PromptBuilder`, `App`, `SC`)
- **React hooks:** `useCallback` for event handlers, `useMemo` for computed values, `useRef` for DOM references
- **No external CSS** — all styles are inline JS objects
- **No class names** — styling is entirely via `style` props

## Product Philosophy (from CORE.md)

- **Do:** Kind/accessible UX, plain-language explanations, physical metaphors (paper, LEGO), excellence within defined scope
- **Don't:** No AI integration, no programming/scripting features, no complex features outside core scope
- **Tone:** Non-technical, calm, accessible to users unfamiliar with digital tools
