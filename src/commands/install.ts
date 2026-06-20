import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import * as p from "@clack/prompts";
import pc from "picocolors";

function findPackageRoot(startDir: string): string {
  let dir = startDir;
  while (dir !== path.dirname(dir)) {
    const pkgPath = path.join(dir, "package.json");
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
        if (pkg.name === "ia-tool") {
          return dir;
        }
      } catch {}
    }
    dir = path.dirname(dir);
  }
  // Fallback
  return path.resolve(startDir, "../..");
}

export async function runInstall(): Promise<void> {
  p.intro(pc.cyan("🔧 Configuration Installer Wizard"));

  // 1. Resolve package root to find bundled agents and commands
  const currentFileDir = path.dirname(new URL(import.meta.url).pathname);
  const packageRoot = findPackageRoot(currentFileDir);
  
  const agentsSourceDir = path.join(packageRoot, "agents");
  const commandsSourceDir = path.join(packageRoot, "commands");

  // Read available agents
  let availableAgents: string[] = [];
  if (fs.existsSync(agentsSourceDir)) {
    availableAgents = fs.readdirSync(agentsSourceDir).filter(f => f.endsWith(".md"));
  }
  
  // Read available commands
  let availableCommands: string[] = [];
  if (fs.existsSync(commandsSourceDir)) {
    availableCommands = fs.readdirSync(commandsSourceDir).filter(f => f.endsWith(".md"));
  }

  if (availableAgents.length === 0 && availableCommands.length === 0) {
    p.cancel("No configuration files found in package root.");
    return;
  }

  // 2. Select AI tools to configure
  const tools = await p.multiselect({
    message: "Select AI tools to install configurations for:",
    options: [
      { value: "opencode", label: "OpenCode (Multiple agents & custom slash commands)" },
      { value: "claude", label: "Claude Code (Project CLAUDE.md instructions)" },
      { value: "cursor", label: "Cursor (.cursorrules configuration)" },
      { value: "copilot", label: "GitHub Copilot (.github/copilot-instructions.md)" },
      { value: "antigravity", label: "Gemini Antigravity (.agents/AGENTS.md)" },
    ],
    required: true,
  });

  if (p.isCancel(tools)) {
    p.cancel("Installation cancelled.");
    return;
  }

  // 3. Select which agents/commands to install
  let selectedAgents: string[] = [];
  if (availableAgents.length > 0) {
    const agentChoices = await p.multiselect({
      message: "Select which agents to include:",
      options: availableAgents.map(f => ({ value: f, label: path.basename(f, ".md") })),
      required: false,
    });
    if (p.isCancel(agentChoices)) {
      p.cancel("Installation cancelled.");
      return;
    }
    selectedAgents = agentChoices as string[];
  }

  let selectedCommands: string[] = [];
  if (availableCommands.length > 0 && tools.includes("opencode")) {
    const cmdChoices = await p.multiselect({
      message: "Select which custom commands to include (OpenCode only):",
      options: availableCommands.map(f => ({ value: f, label: `/${path.basename(f, ".md")}` })),
      required: false,
    });
    if (p.isCancel(cmdChoices)) {
      p.cancel("Installation cancelled.");
      return;
    }
    selectedCommands = cmdChoices as string[];
  }

  // 4. Perform the installation
  const s = p.spinner();
  s.start("Installing configurations...");

  try {
    for (const tool of tools) {
      if (tool === "opencode") {
        // Ask if global or project-specific
        s.stop("Selected OpenCode");
        const scope = await p.select({
          message: "Where would you like to install OpenCode configurations?",
          options: [
            { value: "project", label: "Project-specific (.opencode/)" },
            { value: "global", label: "Global (~/.config/opencode/)" },
          ],
        });

        if (p.isCancel(scope)) {
          p.cancel("Installation cancelled.");
          return;
        }

        s.start("Installing OpenCode configurations...");
        
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
            fs.copyFileSync(
              path.join(agentsSourceDir, agent),
              path.join(agentsTarget, agent)
            );
          }
        }

        if (selectedCommands.length > 0) {
          fs.mkdirSync(commandsTarget, { recursive: true });
          for (const cmd of selectedCommands) {
            fs.copyFileSync(
              path.join(commandsSourceDir, cmd),
              path.join(commandsTarget, cmd)
            );
          }
        }
      } else {
        // For unified-file tools, concatenate the agents' instructions
        let combinedContent = "# Custom AI Agent Instructions\n\n";
        combinedContent += "This file contains instructions compiled by ia-tool.\n\n";

        for (const agent of selectedAgents) {
          const raw = fs.readFileSync(path.join(agentsSourceDir, agent), "utf-8");
          // Remove frontmatter if present
          let content = raw;
          if (raw.startsWith("---")) {
            const parts = raw.split("---");
            if (parts.length >= 3) {
              content = parts.slice(2).join("---").trim();
            }
          }
          combinedContent += `## Agent: ${path.basename(agent, ".md").toUpperCase()}\n\n${content}\n\n---\n\n`;
        }

        if (tool === "claude") {
          const targetDir = path.join(process.cwd(), ".claude");
          fs.mkdirSync(targetDir, { recursive: true });
          fs.writeFileSync(path.join(targetDir, "CLAUDE.md"), combinedContent, "utf-8");
          // Also create root CLAUDE.md if not exists or link it
          fs.writeFileSync(path.join(process.cwd(), "CLAUDE.md"), combinedContent, "utf-8");
        }

        if (tool === "cursor") {
          fs.writeFileSync(path.join(process.cwd(), ".cursorrules"), combinedContent, "utf-8");
        }

        if (tool === "copilot") {
          const targetDir = path.join(process.cwd(), ".github");
          fs.mkdirSync(targetDir, { recursive: true });
          fs.writeFileSync(path.join(targetDir, "copilot-instructions.md"), combinedContent, "utf-8");
        }

        if (tool === "antigravity") {
          const targetDir = path.join(process.cwd(), ".agents");
          fs.mkdirSync(targetDir, { recursive: true });
          fs.writeFileSync(path.join(targetDir, "AGENTS.md"), combinedContent, "utf-8");
        }
      }
    }

    s.stop(pc.green("✔ Configurations successfully installed!"));
    p.outro("You are ready to use your new configurations. Enjoy!");
  } catch (error) {
    s.stop(pc.red("✖ Installation failed."));
    p.cancel(error instanceof Error ? error.message : String(error));
  }
}
