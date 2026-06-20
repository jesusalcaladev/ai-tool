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

*   **Remote Configuration Download**:
    *   You can run `bunx ia-tool install <url>` to download and install a custom agent or command markdown configuration file directly from a remote URL (such as a GitHub Gist or raw file path).

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

### 5. Diagnostics Audit (`ia-tool doctor`)
*   Checks paths and tool configurations. Verifies if OpenCode is in the system PATH, checks for local config folders (`.opencode/`), and audits git setups.

### 6. Command Builder (`ia-tool command`)
*   An interactive prompt wizard that builds custom OpenCode slash commands and saves them directly to `.opencode/commands/[name].md`.

### 7. MCP Server Configurator (`ia-tool mcp` / `ia-tool mcp check`)
*   **mcp**: Interactively configure SQLite, Filesystem, Fetch, or Memory MCP servers in your `opencode.json`.
*   **mcp check** / **mcp status**: Diagnoses your configured MCP servers. Checks if the command executables exist in system `PATH` and spawns the processes briefly to confirm they run successfully.

### 8. Git Hook Installer (`ia-tool hook`)
*   Installs Git hooks:
    *   `prepare-commit-msg` to trigger `ia-tool commit-all` on standard git commit.
    *   `pre-commit` to automatically run code verification (formatting/linting scripts like `npm run format` or `bun run format`) on staged files, aborting commits on failures.

### 9. Synchronizer (`ia-tool sync`)
*   Syncs all custom agents and commands between project-local configuration (`.opencode/`) and global directories (`~/.config/opencode/`).

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
