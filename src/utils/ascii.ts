import pc from "picocolors";

export function renderAsciiLogo(): void {
  const logo = [
    "  ___   _       _____ ___   ___  _     ",
    " |_ _| / \\     |_   _/ _ \\ / _ \\| |    ",
    "  | | / _ \\      | || | | | | | | |    ",
    "  | |/ ___ \\     | || |_| | |_| | |___ ",
    " |___/_/   \\_\\    |_| \\___/ \\___/|_____|",
  ];

  // We can apply a color gradient from Violet/Purple to Cyan line-by-line
  const colors = [
    pc.magenta,
    pc.violet,
    pc.blue,
    pc.cyan,
    pc.cyan,
  ];

  console.log("");
  logo.forEach((line, index) => {
    const color = colors[index] || pc.cyan;
    console.log(pc.bold(color(line)));
  });
  
  console.log(
    pc.dim(`\n  ⚡ IA-TOOL CLI v1.0.0 — AI Configs & Smart Git Tools\n`)
  );
}
