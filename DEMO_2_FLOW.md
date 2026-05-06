# Demo 2: Guardrails + Subagents (Live Prompt Flow)

## Overview

This demo shows how Cursor Rules act as **guardrails** that automatically constrain AI behavior, and how the Agent naturally spawns **subagents** for complex multi-file features — all from a single natural language prompt.

## Pre-Demo Setup (do before the live session)

1. Make sure the dev server is running: `npm run dev`
2. Open Cursor with this project
3. Show the audience the 3 rules files briefly:
   - `.cursor/rules/architecture.mdc` — enforces component structure, hooks, file organization
   - `.cursor/rules/api-safety.mdc` — enforces validation, error handling, batch safety
   - `.cursor/rules/testing-and-quality.mdc` — enforces quality, accessibility, testing

## The Prompt (paste this into Agent view)

```
Add batch image processing to this app. Users should be able to select multiple files at once (up to 5), see them listed with individual status indicators, process all of them with a single button click, and view results in a grid layout. Each result card should show the original vs. processed metadata and have its own download button.

Create a new API endpoint at /api/batch-process that handles multiple files. The frontend should show real-time progress as each file completes.
```

## What the Audience Will See

### Guardrails in Action (point these out during the demo)

| Rule | What the Agent Does | Where to Look |
|------|---------------------|---------------|
| "Components in own file under `components/`" | Creates `components/BatchUploader.tsx`, `components/ResultGrid.tsx`, etc. — NOT inline in page.tsx | File tree |
| "Props as named `type` with `Props` suffix" | Defines `type ResultCardProps = {...}` | Component files |
| "Custom hooks in `hooks/`" | Creates `hooks/useBatchProcessing.ts` for state logic | File tree |
| "Shared types in `types/`" | Creates `types/processing.ts` with shared interfaces | File tree |
| "Validate magic bytes, not just MIME" | API route checks file signatures before processing | API route code |
| "Use `Promise.allSettled()` not `Promise.all()`" | Batch endpoint uses allSettled so one failure doesn't kill all | API route code |
| "Max 5 files, structured error codes" | API validates file count, returns `{ success, code, message }` | API route code |
| "JSDoc on all exports" | Every exported function has a doc comment | All new files |
| "Accessible labels, not color-only" | Status uses text + icons, not just color | Component code |

### Subagents in Action (point these out)

The task is complex enough (new API route + multiple components + hooks + types) that the Agent will likely:
1. Explore the existing codebase structure first
2. Potentially spawn subagents for parallel file creation
3. Run lint/typecheck validation at the end

## Talking Points During the Demo

1. **"I didn't tell it HOW to structure the code"** — The rules did that automatically
2. **"Watch the file tree"** — New files appear in `components/`, `hooks/`, `types/` as the rules dictate
3. **"Look at the API route"** — It uses `Promise.allSettled`, magic bytes validation, structured errors — all from rules
4. **"This is team-level governance"** — These rules are checked into the repo, every developer AND every AI agent follows them
5. **"The agent self-organized the work"** — It broke a complex task into parallel subtasks without being told to

## Follow-Up Prompt (optional, if time allows)

After the feature is built, paste this to show guardrails catching violations:

```
Actually, move all the component code back into page.tsx to keep things simple. Also change the API to use Promise.all instead of Promise.allSettled for better performance.
```

The agent should **push back** or at minimum reference the rules explaining why it won't do that. This shows guardrails aren't just suggestions — they actively prevent architectural drift.

## Key Narrative

> "Rules aren't documentation that gets ignored. They're executable constraints that every agent session respects. When your team has 50 engineers and 50 AI agents writing code, guardrails are how you maintain architectural consistency at scale."
