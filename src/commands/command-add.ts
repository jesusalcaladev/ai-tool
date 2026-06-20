import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import * as p from "@clack/prompts";
import pc from "picocolors";

export async function runCommandAdd(): Promise<void> {
  p.intro(pc.cyan("🛠  Create OpenCode Custom Command"));

  // 1. Gather command details
  const name = await p.text({
    message: "Enter the command name (e.g., test-run, build-audit):",
    placeholder: "build-audit",
    validate(value) {
      const clean = value.trim().toLowerCase();
      if (!clean) return "Name is required.";
      if (/[^a-z0-9\-_]/.test(clean)) return "Name must be alphanumeric with dashes or underscores only.";
    },
  });

  if (p.isCancel(name)) {
    p.cancel("Cancelled.");
    return;
  }

  const cleanName = (name as string).trim().toLowerCase();

  const description = await p.text({
    message: "Enter a brief description (shown in OpenCode TUI autocomplete):",
    placeholder: "Run build audit and fix type checks",
    validate(value) {
      if (!value.trim()) return "Description is required.";
    },
  });

  if (p.isCancel(description)) {
    p.cancel("Cancelled.");
    return;
  }

  const agent = await p.select({
    message: "Select which agent should execute this command:",
    options: [
      { value: "build", label: "build (full operations enabled)" },
      { value: "plan", label: "plan (analytical, read-only)" },
      { value: "review", label: "reviewer (code reviews)" },
      { value: "debug", label: "debug (investigation)" },
    ],
  });

  if (p.isCancel(agent)) {
    p.cancel("Cancelled.");
    return;
  }

  const template = await p.text({
    message: "Enter the prompt template ($ARGUMENTS, !`command` and @file are supported):",
    placeholder: "Run build and verify output:\n!`bun run build`",
    validate(value) {
      if (!value.trim()) return "Template prompt is required.";
    },
  });

  if (p.isCancel(template)) {
    p.cancel("Cancelled.");
    return;
  }

  // 2. Select scope
  const scope = await p.select({
    message: "Choose installation scope:",
    options: [
      { value: "project", label: "Project-specific (.opencode/commands/)" },
      { value: "global", label: "Global (~/.config/opencode/commands/)" },
    ],
  });

  if (p.isCancel(scope)) {
    p.cancel("Cancelled.");
    return;
  }

  // 3. Write file
  try {
    let targetDir = "";
    if (scope === "global") {
      targetDir = path.join(os.homedir(), ".config", "opencode", "commands");
    } else {
      targetDir = path.join(process.cwd(), ".opencode", "commands");
    }

    fs.mkdirSync(targetDir, { recursive: true });
    const filePath = path.join(targetDir, `${cleanName}.md`);

    const fileContent = `---
description: ${description}
agent: ${agent}
---

${template}
`;

    fs.writeFileSync(filePath, fileContent, "utf-8");
    p.outro(pc.green(`✔ Command /${cleanName} created successfully at: ${filePath}`));
  } catch (error) {
    p.cancel(pc.red(`Failed to write command file: ${error instanceof Error ? error.message : String(error)}`));
  }
}
