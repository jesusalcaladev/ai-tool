import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { select, multiselect, input, createSpinner, steps, colors, box } from "@bdocs/dui";

function findPackageRoot(startDir: string): string {
  let dir = startDir;
  while (dir !== path.dirname(dir)) {
    const pkgPath = path.join(dir, "package.json");
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
        if (pkg.name === "@j3sus.dev/ia-tool") {
          return dir;
        }
      } catch {}
    }
    dir = path.dirname(dir);
  }
  return path.resolve(startDir, "../..");
}

interface InstallOptions {
  platform?: string;
  scope?: string;
  agents?: string[];
  commands?: string[];
}

export async function runInstall(remoteUrl?: string): Promise<void> {
  if (remoteUrl) {
    await handleRemoteInstall(remoteUrl);
    return;
  }

  await handleLocalInstall();
}

async function handleRemoteInstall(remoteUrl: string): Promise<void> {
  const spinner = createSpinner("Downloading remote configuration...");
  spinner.start();

  try {
    const response = await fetch(remoteUrl);
    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }
    const text = await response.text();
    spinner.stop("success", "Downloaded successfully!");

    const targetType = await select("Where would you like to save this configuration?", {
      choices: [
        { label: "OpenCode Agent (.opencode/agents/)", value: "opencode-agent" },
        { label: "OpenCode Command (.opencode/commands/)", value: "opencode-command" },
        { label: "Global Agent (~/.config/opencode/agents/)", value: "global-agent" },
        { label: "Global Command (~/.config/opencode/commands/)", value: "global-command" },
      ],
    });

    let defaultName = "custom-config.md";
    try {
      const urlObj = new URL(remoteUrl);
      const basename = path.basename(urlObj.pathname);
      if (basename && basename.includes(".")) {
        defaultName = basename;
      }
    } catch {}

    const fileName = await input("Enter filename:", {
      default: defaultName,
      placeholder: defaultName,
      validate: (value) => (value.trim() ? true : "Filename is required."),
    });

    let destDir = "";
    switch (targetType) {
      case "opencode-agent":
        destDir = path.join(process.cwd(), ".opencode", "agents");
        break;
      case "opencode-command":
        destDir = path.join(process.cwd(), ".opencode", "commands");
        break;
      case "global-agent":
        destDir = path.join(os.homedir(), ".config", "opencode", "agents");
        break;
      case "global-command":
        destDir = path.join(os.homedir(), ".config", "opencode", "commands");
        break;
    }

    fs.mkdirSync(destDir, { recursive: true });
    const destPath = path.join(destDir, fileName);
    fs.writeFileSync(destPath, text, "utf-8");

    console.log(`\n${colors.green("✔")} Configuration saved to: ${colors.cyan(destPath)}\n`);
  } catch (err) {
    spinner.stop("fail", "Download failed");
    console.log(colors.red(`  ${err instanceof Error ? err.message : String(err)}\n`));
  }
}

async function handleLocalInstall(): Promise<void> {
  const currentFileDir = path.dirname(new URL(import.meta.url).pathname);
  const packageRoot = findPackageRoot(currentFileDir);

  const agentsSourceDir = path.join(packageRoot, "agents");
  const commandsSourceDir = path.join(packageRoot, "commands");

  let availableAgents: string[] = [];
  if (fs.existsSync(agentsSourceDir)) {
    availableAgents = fs.readdirSync(agentsSourceDir).filter((f) => f.endsWith(".md"));
  }

  let availableCommands: string[] = [];
  if (fs.existsSync(commandsSourceDir)) {
    availableCommands = fs.readdirSync(commandsSourceDir).filter((f) => f.endsWith(".md"));
  }

  if (availableAgents.length === 0 && availableCommands.length === 0) {
    console.log(colors.red("\n  No configuration files found in package.\n"));
    return;
  }

  const platform = await select("Select your AI platform:", {
    choices: [
      { label: "OpenCode (agents & slash commands)", value: "opencode" },
      { label: "Claude Code (CLAUDE.md instructions)", value: "claude" },
      { label: "Cursor (.cursorrules configuration)", value: "cursor" },
      { label: "GitHub Copilot (.github/copilot-instructions.md)", value: "copilot" },
      { label: "Gemini Antigravity (.agents/AGENTS.md)", value: "antigravity" },
    ],
  });

  let scope = "project";
  if (platform === "opencode") {
    scope = await select("Installation scope:", {
      choices: [
        { label: "Project-specific (.opencode/)", value: "project" },
        { label: "Global (~/.config/opencode/)", value: "global" },
      ],
    });
  }

  let selectedAgents: string[] = [];
  if (availableAgents.length > 0) {
    const agentChoices = await multiselect("Select agents to install:", {
      choices: availableAgents.map((f) => ({
        label: path.basename(f, ".md"),
        value: f,
      })),
      required: false,
    });
    selectedAgents = agentChoices as string[];
  }

  let selectedCommands: string[] = [];
  if (availableCommands.length > 0 && platform === "opencode") {
    const cmdChoices = await multiselect("Select commands to install:", {
      choices: availableCommands.map((f) => ({
        label: `/${path.basename(f, ".md")}`,
        value: f,
      })),
      required: false,
    });
    selectedCommands = cmdChoices as string[];
  }

  console.log(
    box(
      [
        `Platform:   ${colors.cyan(platform)}`,
        `Scope:      ${colors.cyan(scope)}`,
        `Agents:     ${colors.green(String(selectedAgents.length))} selected`,
        `Commands:   ${colors.green(String(selectedCommands.length))} selected`,
      ],
      {
        title: "Installation Summary",
        style: "round",
        color: "#8b5cf6",
      }
    )
  );

  const spinner = createSpinner("Installing configurations...");
  spinner.start();

  try {
    if (platform === "opencode") {
      let targetBase = "";
      if (scope === "global") {
        targetBase = path.join(os.homedir(), ".config", "opencode");
      } else {
        targetBase = path.join(process.cwd(), ".opencode");
      }

      const agentsTarget = path.join(targetBase, "agents");
      const commandsTarget = path.join(targetBase, "commands");

      if (selectedAgents.length > 0) {
        fs.mkdirSync(agentsTarget, { recursive: true });
        for (const agent of selectedAgents) {
          fs.copyFileSync(path.join(agentsSourceDir, agent), path.join(agentsTarget, agent));
        }
      }

      if (selectedCommands.length > 0) {
        fs.mkdirSync(commandsTarget, { recursive: true });
        for (const cmd of selectedCommands) {
          fs.copyFileSync(path.join(commandsSourceDir, cmd), path.join(commandsTarget, cmd));
        }
      }
    } else {
      let combinedContent = "# Custom AI Agent Instructions\n\n";
      combinedContent += "This file contains instructions compiled by ia-tool.\n\n";

      for (const agent of selectedAgents) {
        const raw = fs.readFileSync(path.join(agentsSourceDir, agent), "utf-8");
        let content = raw;
        if (raw.startsWith("---")) {
          const parts = raw.split("---");
          if (parts.length >= 3) {
            content = parts.slice(2).join("---").trim();
          }
        }
        combinedContent += `## Agent: ${path.basename(agent, ".md").toUpperCase()}\n\n${content}\n\n---\n\n`;
      }

      switch (platform) {
        case "claude": {
          const targetDir = path.join(process.cwd(), ".claude");
          fs.mkdirSync(targetDir, { recursive: true });
          fs.writeFileSync(path.join(targetDir, "CLAUDE.md"), combinedContent, "utf-8");
          fs.writeFileSync(path.join(process.cwd(), "CLAUDE.md"), combinedContent, "utf-8");
          break;
        }
        case "cursor": {
          fs.writeFileSync(path.join(process.cwd(), ".cursorrules"), combinedContent, "utf-8");
          break;
        }
        case "copilot": {
          const targetDir = path.join(process.cwd(), ".github");
          fs.mkdirSync(targetDir, { recursive: true });
          fs.writeFileSync(path.join(targetDir, "copilot-instructions.md"), combinedContent, "utf-8");
          break;
        }
        case "antigravity": {
          const targetDir = path.join(process.cwd(), ".agents");
          fs.mkdirSync(targetDir, { recursive: true });
          fs.writeFileSync(path.join(targetDir, "AGENTS.md"), combinedContent, "utf-8");
          break;
        }
      }
    }

    spinner.stop("success", "Configurations installed successfully!");
    console.log(`\n${colors.green("✔")} Ready to use your new configurations!\n`);
  } catch (error) {
    spinner.stop("fail", "Installation failed");
    console.log(colors.red(`  ${error instanceof Error ? error.message : String(error)}\n`));
  }
}
