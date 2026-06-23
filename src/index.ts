#!/usr/bin/env bun
import * as p from "@clack/prompts";
import pc from "picocolors";
import { configure, colors, box, divider } from "@bdocs/dui";
import { renderAsciiLogo, renderDivider } from "./utils/ascii.ts";

configure({ prefix: "ia-tool" });

import { runInstall } from "./commands/install.ts";
import { runCommitAll } from "./commands/commit-all.ts";
import { runChangeset } from "./commands/changeset.ts";
import { runDoctor } from "./commands/doctor.ts";
import { runCommandAdd } from "./commands/command-add.ts";
import { runMcpAdd, runMcpCheck } from "./commands/mcp.ts";
import { runHookInstall } from "./commands/hook.ts";
import { runSync } from "./commands/sync.ts";

function getVersion(): string {
  try {
    const fs = require("node:fs");
    const path = require("node:path");
    const pkgPath = path.join(process.cwd(), "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    return pkg.version || "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function renderMenuHeader(): void {
  console.log("");
  console.log(colors.bold(colors.magenta("  Select an option:")));
  console.log("");
}

function renderMenuFooter(): void {
  const version = getVersion();
  console.log("");
  console.log(divider("─", 50, { color: "#444" }));
  console.log(colors.dim(`  @j3sus.dev/ia-tool v${version}`));
  console.log(colors.dim("  Press Ctrl+C to exit"));
  console.log("");
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command) {
    switch (command.toLowerCase()) {
      case "install":
      case "init":
        await runInstall(args[1]);
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
        if (args[1] === "check" || args[1] === "status") {
          await runMcpCheck();
        } else {
          await runMcpAdd();
        }
        break;
      case "hook":
        await runHookInstall();
        break;
      case "sync":
        await runSync();
        break;
      case "--help":
      case "-h":
        await renderAsciiLogo();
        console.log(colors.bold(colors.cyan("  Usage:")));
        console.log("");
        console.log(`    ${colors.green("bunx @j3sus.dev/ia-tool")}               ${colors.dim("Run interactively (recommended)")}`);
        console.log(`    ${colors.green("bunx @j3sus.dev/ia-tool install")}       ${colors.dim("Install AI agent & command configurations")}`);
        console.log(`    ${colors.green("bunx @j3sus.dev/ia-tool install <url>")} ${colors.dim("Install remote markdown configuration")}`);
        console.log(`    ${colors.green("bunx @j3sus.dev/ia-tool commit-all")}    ${colors.dim("Automatically stage and semantic commit")}`);
        console.log(`    ${colors.green("bunx @j3sus.dev/ia-tool changeset")}     ${colors.dim("Create a package release changeset")}`);
        console.log(`    ${colors.green("bunx @j3sus.dev/ia-tool doctor")}        ${colors.dim("Verify environment setups")}`);
        console.log(`    ${colors.green("bunx @j3sus.dev/ia-tool command")}       ${colors.dim("Create a custom OpenCode slash command")}`);
        console.log(`    ${colors.green("bunx @j3sus.dev/ia-tool mcp")}           ${colors.dim("Configure MCP servers in opencode.json")}`);
        console.log(`    ${colors.green("bunx @j3sus.dev/ia-tool mcp check")}     ${colors.dim("Audit and run diagnostics on MCP servers")}`);
        console.log(`    ${colors.green("bunx @j3sus.dev/ia-tool hook")}          ${colors.dim("Install Git commit assistant hook")}`);
        console.log(`    ${colors.green("bunx @j3sus.dev/ia-tool sync")}          ${colors.dim("Synchronize local & global config files")}`);
        console.log("");
        console.log(colors.bold(colors.cyan("  Options:")));
        console.log("");
        console.log(`    ${colors.yellow("-h, --help")}                 ${colors.dim("Show help details")}`);
        console.log("");
        break;
      default:
        console.log("");
        console.log(colors.bold(colors.red(`  Unknown command: ${command}`)));
        console.log(colors.dim(`  Run ${colors.cyan("ia-tool --help")} for usage details.`));
        console.log("");
        process.exit(1);
    }
    process.exit(0);
  }

  await renderAsciiLogo();

  renderMenuHeader();

  const action = await p.select({
    message: "What would you like to do?",
    options: [
      { value: "install", label: `${colors.cyan("🔧")} Install AI Agent & Command Configurations` },
      { value: "install-url", label: `${colors.blue("📥")} Install Remote Config from URL` },
      { value: "commit-all", label: `${colors.green("🚀")} Semantic Commit Assistant ${colors.dim("(commit-all)")}` },
      { value: "changeset", label: `${colors.magenta("📦")} Create Package Release Changeset` },
      { value: "doctor", label: `${colors.yellow("🔍")} Validate Environment ${colors.dim("(doctor)")}` },
      { value: "command", label: `${colors.cyan("🛠")}  Create OpenCode Custom Command` },
      { value: "mcp", label: `${colors.green("🔌")} Configure OpenCode MCP Servers` },
      { value: "mcp-check", label: `${colors.blue("📋")} Audit Configured MCP Servers ${colors.dim("(check)")}` },
      { value: "hook", label: `${colors.red("⚓")} Install Git Commit Hook` },
      { value: "sync", label: `${colors.yellow("🔄")} Synchronize Local-Global Configs` },
      { value: "exit", label: `${colors.red("❌")} Exit` },
    ],
    colors: {
      pointer: "#a855f7",
      selected: "#a855f7",
      label: "#fff",
      message: "#f472b6",
    },
  });

  if (p.isCancel(action) || action === "exit") {
    console.log("");
    console.log(colors.dim("  Goodbye! 👋"));
    console.log("");
    process.exit(0);
  }

  renderDivider();

  switch (action) {
    case "install":
      await runInstall();
      break;
    case "install-url":
      const url = await p.text({
        message: "Enter the remote configuration file URL:",
        placeholder: "https://gist.githubusercontent.com/...",
        validate(value) {
          if (!value.trim()) return "URL is required.";
          if (!value.startsWith("http://") && !value.startsWith("https://")) return "Invalid URL scheme.";
        },
      });
      if (!p.isCancel(url)) {
        await runInstall(url as string);
      }
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
    case "mcp-check":
      await runMcpCheck();
      break;
    case "hook":
      await runHookInstall();
      break;
    case "sync":
      await runSync();
      break;
  }

  renderMenuFooter();
}

main().catch((err) => {
  console.log("");
  console.log(colors.bold(colors.red("  An unexpected error occurred:")));
  console.log(colors.red(`  ${err.message || err}`));
  console.log("");
  process.exit(1);
});
