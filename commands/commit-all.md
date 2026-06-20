---
description: Stage all changes and create a precise Conventional Commit message
agent: build
---

Staged Changes Git Diff:
!`git diff --cached`

Analyze the diff above and output a strictly formatted Conventional Commit message.
Follow these rules:
1. Format: <type>[optional scope]: <description>
2. Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert.
3. Description: lowercase, imperative present tense (e.g. "add parser", "fix connection leak").
4. Optional Body: explain the 'why' and 'what', not the 'how'.
5. Optional Footer: note breaking changes as "BREAKING CHANGE: <explanation>".

Output ONLY the raw commit message itself. Do not write markdown ticks, explanations, or backticks.
