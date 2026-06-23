import { colors, colorize, divider } from "@bdocs/dui";

const logoLines = [
  "  ___   _       _____ ___   ___  _     ",
  " |_ _| / \\     |_   _/ _ \\ / _ \\| |    ",
  "  | | / _ \\      | || | | | | | | |    ",
  "  | |/ ___ \\     | || |_| | |_| | |___ ",
  " |___/_/   \\_\\    |_| \\___/ \\___/|_____|",
];

const colorGradient = ["#f472b6", "#c084fc", "#818cf8", "#38bdf8", "#22d3ee"];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function typeLine(line: string, color: string, charDelay = 6): Promise<void> {
  const chars = [...line];
  let output = "";

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    output += char;
    const coloredOutput = colorize(output, color);
    process.stdout.write(`\r${coloredOutput}`);
    await sleep(charDelay);
  }
  process.stdout.write("\n");
}

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

export async function renderAsciiLogo(): Promise<void> {
  console.log("");

  for (let i = 0; i < logoLines.length; i++) {
    await typeLine(logoLines[i], colorGradient[i], 5);
    await sleep(30);
  }

  const version = getVersion();

  console.log("");
  console.log(`  ${colors.bold(colors.magenta("IA-TOOL CLI"))} ${colors.dim(`v${version}`)}`);
  console.log(`  ${colors.cyan("AI Configs & Smart Git Tools")}`);
  console.log("");
}

export function renderDivider(): void {
  console.log(divider("-", 50, { color: "#666" }));
}

export function renderSectionHeader(title: string, emoji: string): void {
  console.log(`\n${colors.bold(colors.cyan(`${emoji} ${title}`))}`);
  console.log(divider("-", 40, { color: "#444" }));
}
