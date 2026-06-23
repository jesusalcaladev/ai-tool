#!/usr/bin/env bun
import { select, colors, divider } from "@bdocs/dui";
import { renderAsciiLogo, renderDivider } from "./utils/ascii.ts";
import { configure } from "@bdocs/dui";

configure({ prefix: "ia-tool" });

import { runInstall } from "./commands/install.ts";
import { runDoctor } from "./commands/doctor.ts";

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

function renderHelp(): void {
  const version = getVersion();
  console.log(`\n${colors.bold(colors.cyan("Usage:"))}\n`);
  console.log(`  ${colors.green("bunx @j3sus.dev/ia-tool")}          ${colors.dim("Run interactively")}`);
  console.log(`  ${colors.green("bunx @j3sus.dev/ia-tool init")}     ${colors.dim("Install AI configurations")}`);
  console.log(`  ${colors.green("bunx @j3sus.dev/ia-tool doctor")}   ${colors.dim("Check environment health")}`);
  console.log(`  ${colors.green("bunx @j3sus.dev/ia-tool --help")}   ${colors.dim("Show this help")}`);
  console.log(`\n${colors.bold(colors.cyan("Options:"))}\n`);
  console.log(`  ${colors.yellow("-h, --help")}    ${colors.dim("Show help details")}`);
  console.log(`  ${colors.yellow("-v, --version")} ${colors.dim("Show version")}`);
  console.log("");
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === "--help" || command === "-h") {
    await renderAsciiLogo();
    renderHelp();
    process.exit(0);
  }

  if (command === "--version" || command === "-v") {
    console.log(getVersion());
    process.exit(0);
  }

  if (command === "init" || command === "install") {
    await runInstall(args[1]);
    process.exit(0);
  }

  if (command === "doctor") {
    await runDoctor();
    process.exit(0);
  }

  if (command) {
    console.log(`\n${colors.red("✖")} Unknown command: ${colors.cyan(command)}`);
    console.log(colors.dim(`  Run ${colors.cyan("ia-tool --help")} for usage details.\n`));
    process.exit(1);
  }

  await renderAsciiLogo();

  const action = await select("What would you like to do?", {
    choices: [
      { label: `${colors.cyan("🔧")} Install AI Configurations ${colors.dim("(init)")}`, value: "init" },
      { label: `${colors.green("🔍")} Check Environment Health ${colors.dim("(doctor)")}`, value: "doctor" },
      { label: `${colors.yellow("📖")} Show Help`, value: "help" },
      { label: `${colors.red("❌")} Exit`, value: "exit" },
    ],
  });

  if (action === "exit") {
    console.log(`\n${colors.dim("  Goodbye!")}\n`);
    process.exit(0);
  }

  if (action === "help") {
    renderHelp();
    process.exit(0);
  }

  renderDivider();

  switch (action) {
    case "init":
      await runInstall();
      break;
    case "doctor":
      await runDoctor();
      break;
  }
}

main().catch((err) => {
  console.log(`\n${colors.bold(colors.red("  Error:"))} ${colors.red(err.message || err)}\n`);
  process.exit(1);
});
