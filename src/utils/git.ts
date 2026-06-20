import { execSync } from "node:child_process";

export function isGitRepo(): boolean {
  try {
    execSync("git rev-parse --is-inside-work-tree", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export function hasUnstagedChanges(): boolean {
  try {
    const output = execSync("git status --porcelain", { encoding: "utf-8" }).trim();
    if (!output) return false;
    
    // Check if there are lines not starting with 'M ' or 'A ' (which represent staged changes)
    // porcelain status format:
    // ' M filename' -> unstaged modification
    // '?? filename' -> untracked
    const lines = output.split("\n");
    return lines.some(line => {
      const status = line.slice(0, 2);
      return status.includes("?") || status.startsWith(" ") || status.endsWith("M");
    });
  } catch {
    return false;
  }
}

export function hasStagedChanges(): boolean {
  try {
    const output = execSync("git diff --cached --name-only", { encoding: "utf-8" }).trim();
    return output.length > 0;
  } catch {
    return false;
  }
}

export function stageAllChanges(): void {
  execSync("git add -A", { stdio: "inherit" });
}

export function getStagedDiff(): string {
  try {
    return execSync("git diff --cached", { encoding: "utf-8" }).trim();
  } catch {
    return "";
  }
}

export function runGitCommit(message: string): void {
  // Use spawn or execSync. To avoid shell injection issues with message, we can pass it safely.
  // Using execSync with a command array or custom escaping is safer.
  // Bun.spawnSync is extremely safe for passing arguments. Let's use Bun.spawnSync for committing safely!
  const proc = Bun.spawnSync(["git", "commit", "-m", message]);
  if (!proc.success) {
    throw new Error(proc.stderr?.toString() || "Failed to commit");
  }
}

export function getModifiedFiles(): string[] {
  try {
    const output = execSync("git status --porcelain", { encoding: "utf-8" }).trim();
    if (!output) return [];
    return output.split("\n").map(line => line.slice(3).trim());
  } catch {
    return [];
  }
}
