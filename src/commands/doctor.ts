import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { isGitRepo } from "../utils/git.ts";

export async function runDoctor(): Promise<void> {
  p.intro(pc.cyan("🔍 IA-TOOL Doctor Diagnostics"));

  const s = p.spinner();
  s.start("Auditing development environment...");
  await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause for nice UX
  s.stop("Audit completed.");

  let issuesCount = 0;

  // 1. Check Git
  if (isGitRepo()) {
    p.log.success("Git: Repository is initialized.");
  } else {
    p.log.warn("Git: Current folder is not a Git repository. Run 'git init' to enable version tracking.");
    issuesCount++;
  }

  // 2. Check OpenCode CLI
  let opencodeInstalled = false;
  try {
    execSync("which opencode", { stdio: "ignore" });
    opencodeInstalled = true;
  } catch {}

  if (opencodeInstalled) {
    p.log.success("OpenCode: CLI is installed and available.");
  } else {
    p.log.warn("OpenCode: CLI not detected in system PATH. Install it globally via your package manager to use it.");
    issuesCount++;
  }

  // 3. Check Configurations
  const localOpencode = path.join(process.cwd(), ".opencode");
  if (fs.existsSync(localOpencode)) {
    p.log.success("OpenCode Config: Local folder '.opencode' detected.");
  } else {
    p.log.info("OpenCode Config: No local folder '.opencode' found. Run 'ia-tool install' to set it up.");
  }

  const cursorrules = path.join(process.cwd(), ".cursorrules");
  if (fs.existsSync(cursorrules)) {
    p.log.success("Cursor Config: '.cursorrules' file detected.");
  }

  const claudeMd = path.join(process.cwd(), "CLAUDE.md");
  const localClaude = path.join(process.cwd(), ".claude", "CLAUDE.md");
  if (fs.existsSync(claudeMd) || fs.existsSync(localClaude)) {
    p.log.success("Claude Code Config: 'CLAUDE.md' file detected.");
  }

  const antigravity = path.join(process.cwd(), ".agents", "AGENTS.md");
  if (fs.existsSync(antigravity)) {
    p.log.success("Gemini Antigravity Config: '.agents/AGENTS.md' detected.");
  }

  // 4. Check Commit Hooks
  const commitHook = path.join(process.cwd(), ".git", "hooks", "prepare-commit-msg");
  if (fs.existsSync(commitHook)) {
    const content = fs.readFileSync(commitHook, "utf-8");
    if (content.includes("ia-tool commit-all")) {
      p.log.success("Git Hooks: 'ia-tool commit-all' hook is configured.");
    } else {
      p.log.info("Git Hooks: A prepare-commit-msg hook exists, but it doesn't run 'ia-tool'.");
    }
  } else {
    p.log.info("Git Hooks: Commit hooks not configured. Run 'ia-tool hook install' to automate semantic commits.");
  }

  p.outro(
    issuesCount === 0
      ? pc.green("✔ Everything looks great! Your environment is healthy.")
      : pc.yellow(`⚠ Diagnostics completed with ${issuesCount} warnings. Check above for recommendations.`)
  );
}
