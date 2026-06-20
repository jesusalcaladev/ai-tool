# ⚡ IA-TOOL CLI

A modern, high-speed offline CLI tool developed using **Bun** and **TypeScript** to bootstrap and manage AI developer environments (OpenCode, Claude Code, Cursor, GitHub Copilot, and Gemini Antigravity) alongside automating Conventional Commits and package release changesets.

---

## 🚀 Instant Execution

No installation required. You can run it instantly using your favorite package runner:

```bash
# Run interactively (recommended)
bunx ia-tool
# or
npx ia-tool
# or
pnpx ia-tool
```

---

## 🔧 Core Features & Commands

### 1. Unified Interactive Menu
Running `bunx ia-tool` without arguments launches a beautiful, styled console dashboard powered by `@clack/prompts`. It lets you select commands interactively with built-in spinners and color-coded statuses.

### 2. Configuration Installer (`ia-tool install` / `ia-tool init`)
Dynamically audits your current workspace environment and installs premium, **token-optimized** markdown agents and custom commands.
*   **Supported Platforms**:
    *   **OpenCode**: Installs multiple agents to `.opencode/agents/` and slash commands to `.opencode/commands/` (with global `~/.config/opencode/` support).
    *   **Claude Code**: Generates/updates `.claude/CLAUDE.md` and root `CLAUDE.md`.
    *   **Cursor**: Writes a unified `.cursorrules` file.
    *   **GitHub Copilot**: Writes to `.github/copilot-instructions.md`.
    *   **Gemini Antigravity**: Writes to `.agents/AGENTS.md`.

*   **Available Agents**:
    *   `refactor`: SOLID improvements and code cleanups.
    *   `reviewer`: Actionable read-only code review with blocker/critical/nit severity metrics.
    *   `security`: General language-agnostic OWASP top-10 security audit.
    *   `architect`: API contracts, component boundaries, and structural coupling.
    *   `database`: Schema migration plans, deadlock prevention, and query tuning.
    *   `tester`: Unit, integration, and E2E coverage.
    *   `seo`: HTML5 markup semantics, og:tags, and structured JSON-LD data.
    *   `performance`: Bundle splitting, re-render avoidance, and event loop blocks.
    *   `benchmark`: Test script generators (Tinybench, Mitata) with warmups.

*   **Custom slash commands (OpenCode)**:
    *   `/commit-all`: Automatically stages changes and creates conventional commits.
    *   `/changeset`: Suggests release packages and bump details.
    *   `/test`: Runs tests, isolates failures, and recommends coverage fixes.
    *   `/doc`: Auto-documents modules with JSDoc/TSDoc specifications.
    *   `/explain`: Explains file execution flows and global side-effects.
    *   `/debug`: Analyzes error logs, diagnoses roots, and generates quick fixing diffs.

### 3. Conventional Commit Assistant (`ia-tool commit-all`)
An interactive helper that strictly adheres to the **Conventional Commits v1.0.0** specification.
*   Runs `git status` and offers to stage all unstaged files (`git add -A`).
*   Guides you through a step-by-step interactive selection flow (select type, scope, subject <72 chars, long body, breaking change warnings).
*   Enters a confirmation stage allowing you to commit or manually edit before applying.

### 4. Changeset Coordinator (`ia-tool changeset`)
Automates npm release preparation for single packages or monorepos (PNPM / Yarn / NPM workspaces).
*   Scans package dependency graphs and release frameworks (Changesets vs Semantic-Release).
*   Pinpoints exactly which package directories have modified files.
*   Guides selection of major/minor/patch bump types.
*   Generates a standardized `.changeset/random-slug.md` file containing version settings and your release notes description.

---

## 🛠️ Local Development & Testing

1.  Clone this repository.
2.  Install dependencies:
    ```bash
    bun install
    ```
3.  Run in development mode:
    ```bash
    bun run src/index.ts
    ```
4.  Build production bundle:
    ```bash
    bun run build
    ```
5.  Link globally for local testing:
    ```bash
    bun link
    # now you can run 'ia-tool' anywhere on your machine
    ia-tool
    ```
