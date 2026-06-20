---
description: Diagnose error trace logs, map to files, and generate fixing diffs
agent: build
---

Error Logs / Stack Trace:
$ARGUMENTS

Staged git changes:
!`git diff --cached --name-only`

Diagnose the issue:
1. Pinpoint the file, class, method, or line number causing the stack trace.
2. Analyze why the error occurred (unhandled cases, null references, type mismatch, asynchronous races).
3. Draft a precise code correction.
4. Output the correction as a unified diff block.
5. Provide a test casing recommendation to prevent regressions.
