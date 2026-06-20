---
description: Analyze modifications and suggest package release updates (Changesets/Semantic-Release)
agent: plan
---

Workspace Files:
!`find . -maxdepth 3 -name "package.json" -o -name "pnpm-workspace.yaml" -o -name ".releaserc*" -o -name "release.config.*"`

Staged Git Diff:
!`git diff --cached`

Analyze the workspace layout and git diff:
1. Identify which npm packages are modified.
2. Determine if the project uses Changesets (uses `.changeset/*.md`) or Semantic-Release (uses git tags and conventional commits).
3. If Changesets:
   - Identify dependent workspace packages that need version bumps.
   - Suggest a changeset markdown block with the correct package names and bump types (major, minor, patch).
   - Write a clear, user-friendly changelog entry.
4. If Semantic-Release:
   - Formulate the exact Conventional Commit header that will trigger the correct version bump.
   - Describe the release notes summary.
