---
description: Run test suites and analyze failures or coverage reports
agent: build
---

Staged Changes files:
!`git diff --cached --name-only`

Test Results:
!`bun test || pnpm test || npm test`

Inspect the test execution logs above:
1. Map failing tests to their source files.
2. Formulate specific, actionable TypeScript/JavaScript fixes for any failed tests.
3. Suggest missing test cases (edge cases, parameter boundaries) for the modified files.
4. Output the coverage details and recommend how to resolve code coverage gaps.
