import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { steps, colors, box } from "@bdocs/dui";
import { isGitRepo } from "../utils/git.ts";

export async function runDoctor(): Promise<void> {
  p.intro(pc.cyan("🔍 IA-TOOL Doctor Diagnostics"));

  const s = p.spinner();
  s.start("Auditing development environment...");
  await new Promise((resolve) => setTimeout(resolve, 500));
  s.stop("Audit completed.");

  const checks: Array<{ label: string; status: "success" | "error" | "pending"; detail?: string }> = [];

  // 1. Check Git
  if (isGitRepo()) {
    checks.push({ label: "Git Repository", status: "success" });
  } else {
    checks.push({
      label: "Git Repository",
      status: "error",
      detail: "Not a Git repo. Run 'git init' to enable version tracking.",
    });
  }

  // 2. Check OpenCode CLI
  let opencodeInstalled = false;
  try {
    execSync("which opencode", { stdio: "ignore" });
    opencodeInstalled = true;
  } catch {}

  if (opencodeInstalled) {
    checks.push({ label: "OpenCode CLI", status: "success" });
  } else {
    checks.push({
      label: "OpenCode CLI",
      status: "error",
      detail: "Not detected in PATH. Install it globally.",
    });
  }

  // 3. Check Configurations
  const localOpencode = path.join(process.cwd(), ".opencode");
  checks.push({
    label: "OpenCode Config (.opencode/)",
    status: fs.existsSync(localOpencode) ? "success" : "pending",
  });

  const cursorrules = path.join(process.cwd(), ".cursorrules");
  checks.push({
    label: "Cursor Config (.cursorrules)",
    status: fs.existsSync(cursorrules) ? "success" : "pending",
  });

  const claudeMd = path.join(process.cwd(), "CLAUDE.md");
  const localClaude = path.join(process.cwd(), ".claude", "CLAUDE.md");
  checks.push({
    label: "Claude Code Config (CLAUDE.md)",
    status: fs.existsSync(claudeMd) || fs.existsSync(localClaude) ? "success" : "pending",
  });

  const antigravity = path.join(process.cwd(), ".agents", "AGENTS.md");
  checks.push({
    label: "Gemini Antigravity Config",
    status: fs.existsSync(antigravity) ? "success" : "pending",
  });

  // 4. Check Commit Hooks
  const commitHook = path.join(process.cwd(), ".git", "hooks", "prepare-commit-msg");
  if (fs.existsSync(commitHook)) {
    const content = fs.readFileSync(commitHook, "utf-8");
    checks.push({
      label: "Git Commit Hook",
      status: content.includes("ia-tool commit-all") ? "success" : "pending",
    });
  } else {
    checks.push({
      label: "Git Commit Hook",
      status: "pending",
    });
  }

  // Render all checks as steps
  console.log(
    steps(
      checks.map((c) => ({
        label: c.label,
        status: c.status,
        details: c.detail,
      }))
    )
  );

  const issuesCount = checks.filter((c) => c.status === "error").length;

  p.outro(
    issuesCount === 0
      ? pc.green("✔ Everything looks great! Your environment is healthy.")
      : pc.yellow(`⚠ Diagnostics completed with ${issuesCount} warnings. Check above for recommendations.`)
  );
}
