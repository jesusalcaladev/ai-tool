import { colors, colorize, stripAnsi, visibleLength, terminalWidth } from "@bdocs/dui";

const logoLines = [
  "  ___   _       _____ ___   ___  _     ",
  " |_ _| / \\     |_   _/ _ \\ / _ \\| |    ",
  "  | | / _ \\      | || | | | | | | |    ",
  "  | |/ ___ \\     | || |_| | |_| | |___ ",
  " |___/_/   \\_\\    |_| \\___/ \\___/|_____|",
];

const colorGradient = ["#d946ef", "#a855f7", "#3b82f6", "#06b6d4", "#06b6d4"];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function typeLine(line: string, color: string, charDelay = 8): Promise<void> {
  const colored = colorize(line, color);
  const chars = [...line];
  let output = "";

  for (const char of chars) {
    output += char;
    const visible = stripAnsi(output);
    process.stdout.write(`\r${output}`);
    await sleep(charDelay);
  }
  process.stdout.write("\n");
}

export async function renderAsciiLogo(): Promise<void> {
  console.log("");

  for (let i = 0; i < logoLines.length; i++) {
    await typeLine(logoLines[i], colorGradient[i], 6);
    await sleep(40);
  }

  console.log(
    colors.dim(`\n  ⚡ IA-TOOL CLI v1.0.0 — AI Configs & Smart Git Tools\n`)
  );
}
