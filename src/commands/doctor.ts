import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { colors, steps, createSpinner, divider } from "@bdocs/dui";

function isGitRepo(): boolean {
  try {
    execSync("git rev-parse --is-inside-work-tree", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

interface Check {
  label: string;
  status: "success" | "error" | "pending";
  detail?: string;
}

export async function runDoctor(): Promise<void> {
  console.log(`\n${colors.bold(colors.cyan("🔍 IA-TOOL Doctor Diagnostics"))}\n`);

  const spinner = createSpinner("Auditing development environment...");
  spinner.start();

  await new Promise((resolve) => setTimeout(resolve, 500));

  const checks: Check[] = [];

  if (isGitRepo()) {
    checks.push({ label: "Git Repository", status: "success" });
  } else {
    checks.push({
      label: "Git Repository",
      status: "error",
      detail: "Not a Git repo. Run 'git init' to enable version tracking.",
    });
  }

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
      status: "pending",
      detail: "Not detected in PATH. Install globally with: npm i -g opencode",
    });
  }

  const localOpencode = path.join(process.cwd(), ".opencode");
  checks.push({
    label: "OpenCode Config (.opencode/)",
    status: fs.existsSync(localOpencode) ? "success" : "pending",
    detail: fs.existsSync(localOpencode) ? undefined : "Run 'ia-tool init' to install",
  });

  const opencodeAgents = path.join(process.cwd(), ".opencode", "agents");
  const agentCount = fs.existsSync(opencodeAgents)
    ? fs.readdirSync(opencodeAgents).filter((f) => f.endsWith(".md")).length
    : 0;
  checks.push({
    label: "OpenCode Agents",
    status: agentCount > 0 ? "success" : "pending",
    detail: agentCount > 0 ? `${agentCount} agents installed` : "No agents installed",
  });

  const opencodeCommands = path.join(process.cwd(), ".opencode", "commands");
  const cmdCount = fs.existsSync(opencodeCommands)
    ? fs.readdirSync(opencodeCommands).filter((f) => f.endsWith(".md")).length
    : 0;
  checks.push({
    label: "OpenCode Commands",
    status: cmdCount > 0 ? "success" : "pending",
    detail: cmdCount > 0 ? `${cmdCount} commands installed` : "No commands installed",
  });

  const claudeMd = path.join(process.cwd(), "CLAUDE.md");
  const localClaude = path.join(process.cwd(), ".claude", "CLAUDE.md");
  checks.push({
    label: "Claude Code Config",
    status: fs.existsSync(claudeMd) || fs.existsSync(localClaude) ? "success" : "pending",
    detail:
      fs.existsSync(claudeMd) || fs.existsSync(localClaude)
        ? undefined
        : "Run 'ia-tool init' and select Claude Code",
  });

  const cursorrules = path.join(process.cwd(), ".cursorrules");
  checks.push({
    label: "Cursor Config",
    status: fs.existsSync(cursorrules) ? "success" : "pending",
    detail: fs.existsSync(cursorrules) ? undefined : "Run 'ia-tool init' and select Cursor",
  });

  const antigravity = path.join(process.cwd(), ".agents", "AGENTS.md");
  checks.push({
    label: "Gemini Antigravity Config",
    status: fs.existsSync(antigravity) ? "success" : "pending",
    detail: fs.existsSync(antigravity) ? undefined : "Run 'ia-tool init' and select Antigravity",
  });

  const copilot = path.join(process.cwd(), ".github", "copilot-instructions.md");
  checks.push({
    label: "GitHub Copilot Config",
    status: fs.existsSync(copilot) ? "success" : "pending",
    detail: fs.existsSync(copilot) ? undefined : "Run 'ia-tool init' and select Copilot",
  });

  spinner.stop("success", "Audit completed!");

  console.log("");
  console.log(
    steps(
      checks.map((c) => ({
        label: c.label,
        status: c.status,
        details: c.detail,
      }))
    )
  );

  const errors = checks.filter((c) => c.status === "error").length;
  const warnings = checks.filter((c) => c.status === "pending").length;

  console.log(divider("-", 50, { color: "#444" }));

  if (errors === 0 && warnings === 0) {
    console.log(`\n${colors.green("✔")} ${colors.bold("Everything looks great!")}\n`);
  } else if (errors === 0) {
    console.log(
      `\n${colors.yellow("⚠")} ${colors.bold(`${warnings} suggestions`)} available. Run ${colors.cyan("ia-tool init")} to install missing configs.\n`
    );
  } else {
    console.log(
      `\n${colors.red("✖")} ${colors.bold(`${errors} errors`)} and ${colors.yellow(`${warnings} suggestions`)} found.\n`
    );
  }
}
