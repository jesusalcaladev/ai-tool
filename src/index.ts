#!/usr/bin/env bun
import * as p from "@clack/prompts";
import pc from "picocolors";
import { renderAsciiLogo } from "./utils/ascii.ts";
import { runInstall } from "./commands/install.ts";
import { runCommitAll } from "./commands/commit-all.ts";
import { runChangeset } from "./commands/changeset.ts";
import { runDoctor } from "./commands/doctor.ts";
import { runCommandAdd } from "./commands/command-add.ts";
import { runMcpAdd } from "./commands/mcp.ts";
import { runHookInstall } from "./commands/hook.ts";
import { runSync } from "./commands/sync.ts";

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command) {
    switch (command.toLowerCase()) {
      case "install":
      case "init":
        await runInstall();
        break;
      case "commit-all":
        await runCommitAll();
        break;
      case "changeset":
        await runChangeset();
        break;
      case "doctor":
        await runDoctor();
        break;
      case "command":
        await runCommandAdd();
        break;
      case "mcp":
        await runMcpAdd();
        break;
      case "hook":
        await runHookInstall();
        break;
      case "sync":
        await runSync();
        break;
      case "--help":
      case "-h":
        renderAsciiLogo();
        console.log("Usage:");
        console.log("  bunx ia-tool               Run interactively (recommended)");
        console.log("  bunx ia-tool install       Install AI agent & command configurations");
        console.log("  bunx ia-tool commit-all    Automatically stage and semantic commit");
        console.log("  bunx ia-tool changeset     Create a package release changeset");
        console.log("  bunx ia-tool doctor        Verify environment setups");
        console.log("  bunx ia-tool command       Create a custom OpenCode slash command");
        console.log("  bunx ia-tool mcp           Configure MCP servers in opencode.json");
        console.log("  bunx ia-tool hook          Install Git commit assistant hook");
        console.log("  bunx ia-tool sync          Synchronize local & global config files");
        console.log("\nOptions:");
        console.log("  -h, --help                 Show help details");
        break;
      default:
        console.log(pc.red(`Unknown command: ${command}`));
        console.log(`Run ${pc.cyan("ia-tool --help")} for usage details.`);
        process.exit(1);
    }
    process.exit(0);
  }

  // Interactive flow when running without args (npx ia-tool)
  renderAsciiLogo();

  const action = await p.select({
    message: "What would you like to do?",
    options: [
      { value: "install", label: "🔧 Install AI Agent & Command Configurations" },
      { value: "commit-all", label: "🚀 Semantic Commit Assistant (commit-all)" },
      { value: "changeset", label: "📦 Create Package Release Changeset" },
      { value: "doctor", label: "🔍 Validate Environment (doctor)" },
      { value: "command", label: "🛠  Create OpenCode Custom Command" },
      { value: "mcp", label: "🔌 Configure OpenCode MCP Servers" },
      { value: "hook", label: "⚓ Install Git Commit Hook" },
      { value: "sync", label: "🔄 Synchronize Local-Global Configs" },
      { value: "exit", label: "❌ Exit" },
    ],
  });

  if (p.isCancel(action) || action === "exit") {
    p.outro("Goodbye!");
    process.exit(0);
  }

  switch (action) {
    case "install":
      await runInstall();
      break;
    case "commit-all":
      await runCommitAll();
      break;
    case "changeset":
      await runChangeset();
      break;
    case "doctor":
      await runDoctor();
      break;
    case "command":
      await runCommandAdd();
      break;
    case "mcp":
      await runMcpAdd();
      break;
    case "hook":
      await runHookInstall();
      break;
    case "sync":
      await runSync();
      break;
  }
}

main().catch((err) => {
  console.error(pc.red("\nAn unexpected error occurred:"));
  console.error(err);
  process.exit(1);
});
