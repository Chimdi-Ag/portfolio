# GitHub Aggregation Engine — Design Spec
**Date:** 2026-05-23
**Status:** Approved

---

## 1. Objective

Add a "Code" section to the portfolio that aggregates public GitHub data from two profiles (Chimdi-Ag and chicode-dev) and renders a unified contribution heatmap and curated repository feed. All data fetching happens at Astro build time. No tokens, no server runtime, no client-side API calls.

---

## 2. Profiles

| Label | Username | Role |
|---|---|---|
| Active | `Chimdi-Ag` | Current profile |
| Legacy | `chicode-dev` | Historical profile |

Both profiles are fully public. No authentication tokens are required.

---

## 3. Architecture

### Data Sources

| Data | Source | Auth |
|---|---|---|
| Repo metadata | `https://api.github.com/users/{username}/repos?sort=updated&per_page=100` | None (public) |
| Daily contributions | `https://github-contributions-api.jogruber.de/v4/{username}` | None (public service) |

### Fetch Strategy

Both API calls happen inside Astro component frontmatter during `astro build`. The results are rendered to static HTML. No requests are made at runtime in the user's browser.

### Heatmap Merge Logic

1. Fetch contribution JSON for both profiles
2. Iterate through all dates in the last 52 weeks (364 days)
3. For each date, sum `count` from Chimdi-Ag and `count` from chicode-dev
4. Output a single flat array: `{ date: string, count: number }[]`

### Repo Filter

Uses an **explicit allowlist** rather than a filter algorithm. Only the repos listed in section 5 ever appear. The allowlist lives in `src/lib/github.ts` alongside the curated descriptions.

---

## 4. New Files

```
src/lib/github.ts                  Data fetching, types, allowlist config
src/components/CodeSection.astro   Parent section wrapper
src/components/ContributionGrid.astro  Heatmap grid
src/components/RepoCard.astro      Individual repo card
```

`src/pages/index.astro` gets one new import: `<CodeSection />`, placed between `<ProjectsSection />` and `<CredentialsSection />`.

No existing files are modified beyond `index.astro`.

---

## 5. Repo Allowlist and Descriptions

Descriptions are hardcoded in `github.ts`. They override whatever is on GitHub. All descriptions follow the no-em-dash rule: use colons, commas, or sentence splits instead.

| Repo | Profile | Language | Description |
|---|---|---|---|
| `skytrack-sa` | Active | Python | Flight price tracker for South African routes. Compares current fares against 30 days of history and gives you a straight answer: good deal, average, or overpriced. |
| `simple_shell` | Legacy | C | A Unix shell written from scratch in C. Handles command parsing, built-ins, environment variables, and history. No standard library shortcuts. |
| `monty` | Legacy | C | Bytecode interpreter for the Monty scripting language, built in C. Reads opcode files and executes stack and queue instructions through a hand-built virtual machine. |
| `My-bank-management-system` | Legacy | C | Console-based banking app in C. Covers account creation, deposits, withdrawals, and balance lookups through a clean terminal interface. |
| `SpellCheckerProject` | Legacy | Java | Spell checker in Java that flags errors against two dictionary structures, written to test the performance difference between them. |
| `RSA-Factoring-Challenge` | Legacy | Shell | Shell script that factors the large composites behind RSA encryption. A practical look at why prime factorization is the bottleneck of public-key security. |
| `sorting_algorithms` | Legacy | C | Eight sorting algorithms in C: bubble, insertion, selection, quick, merge, and more. Each annotated with its Big O time complexity. |
| `SnakeGame` | Legacy | Python | The classic Snake game in Python. Arrow key controls, score tracking, and a game loop that does exactly what it needs to. |
| `Collaborative_java_projects` | Legacy | Java | Three Java calculator implementations built as a team, including a Shunting Yard parser that handles operator precedence correctly. |
| `clara-image-genie` | Legacy | Python/Django | Built at a hackathon with a team, Clara is a local image search tool that uses a Vision Transformer, YOLOv3, and OCR to find photos by description, detected objects, or text in the image. Runs entirely offline. Took home an award. |

Cards are sorted by `updated_at` descending (newest first).

---

## 6. Visual Design

### Section Layout

```
[ Code ]                          ← section heading

[ Contributions across Chimdi-Ag · chicode-dev ]   ← subtitle

[ === contribution heatmap grid === ]              ← 52-week grid

[ repo card ]  [ repo card ]  [ repo card ]        ← 3-col responsive grid
[ repo card ]  [ repo card ]  [ repo card ]
...
```

### Heatmap

- 52 weeks wide, 7 rows tall (Mon-Sun)
- Month labels above columns
- Each cell is a small square with rounded corners
- Hover tooltip: `"3 contributions on Jan 14, 2024"`
- Color scale using Catppuccin Macchiato tokens:

| Level | Count | Color |
|---|---|---|
| 0 | 0 | `var(--surface0)` |
| 1 | 1-3 | `var(--green)` at 25% opacity |
| 2 | 4-6 | `var(--green)` at 50% opacity |
| 3 | 7-9 | `var(--green)` at 75% opacity |
| 4 | 10+ | `var(--green)` at 100% opacity |

### Repo Cards

Each card shows:
- Repo name (bold)
- Description (from allowlist config, never blank)
- Language dot (GitHub standard language colors) + language label
- Timestamp: relative format ("Updated 2 years ago") with full date on hover
- Source badge: `Legacy` tag (subtle, `surface1` background, `subtext0` text) on chicode-dev repos. No badge on active repos.

Card styling follows existing `Card.astro` patterns for consistency.

---

## 7. TypeScript Contracts

```typescript
// src/lib/github.ts

export interface RepoConfig {
  name: string;
  profile: 'active' | 'legacy';
  username: string;
  description: string;
}

export interface UnifiedRepo {
  name: string;
  description: string;
  htmlUrl: string;
  language: string | null;
  updatedAt: string;
  profile: 'active' | 'legacy';
}

export interface DailyContribution {
  date: string;   // YYYY-MM-DD
  count: number;
}
```

---

## 8. Error Handling

- If a GitHub API call fails at build time, log a warning and return an empty array for that profile
- The section renders with whatever data is available; a total failure of both calls renders the section with empty states
- No build-breaking errors: data failures are non-fatal

---

## 9. Success Criteria

- Heatmap shows combined daily contributions from both profiles for the last 52 weeks
- All 10 repos (minus any that fail to fetch) render with correct descriptions, language, timestamp, and profile badge
- No API calls happen in the browser
- No tokens or secrets required
- Section matches the existing Catppuccin Macchiato visual language
- Zero em dashes in any rendered copy
