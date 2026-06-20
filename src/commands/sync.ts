import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import * as p from "@clack/prompts";
import pc from "picocolors";

function copyDirectoryContents(src: string, dest: string): number {
  if (!fs.existsSync(src)) return 0;
  fs.mkdirSync(dest, { recursive: true });

  const files = fs.readdirSync(src).filter(f => f.endsWith(".md"));
  let copied = 0;
  for (const file of files) {
    fs.copyFileSync(path.join(src, file), path.join(dest, file));
    copied++;
  }
  return copied;
}

export async function runSync(): Promise<void> {
  p.intro(pc.cyan("🔄 Configuration Sync Assistant"));

  const localBase = path.join(process.cwd(), ".opencode");
  const globalBase = path.join(os.homedir(), ".config", "opencode");

  const direction = await p.select({
    message: "Select synchronisation direction:",
    options: [
      { value: "local-to-global", label: "Local to Global (Export project configs to global ~/.config/opencode/)" },
      { value: "global-to-local", label: "Global to Local (Import global configs to local .opencode/)" },
    ],
  });

  if (p.isCancel(direction)) {
    p.cancel("Cancelled.");
    return;
  }

  const s = p.spinner();
  s.start("Syncing configurations...");
  
  let agentsCopied = 0;
  let commandsCopied = 0;

  try {
    if (direction === "local-to-global") {
      if (!fs.existsSync(localBase)) {
        s.stop("No local configurations found.");
        p.cancel("Failed: Local '.opencode' directory does not exist.");
        return;
      }
      
      agentsCopied = copyDirectoryContents(
        path.join(localBase, "agents"),
        path.join(globalBase, "agents")
      );
      
      commandsCopied = copyDirectoryContents(
        path.join(localBase, "commands"),
        path.join(globalBase, "commands")
      );
    } else {
      if (!fs.existsSync(globalBase)) {
        s.stop("No global configurations found.");
        p.cancel("Failed: Global '~/.config/opencode/' directory does not exist.");
        return;
      }

      agentsCopied = copyDirectoryContents(
        path.join(globalBase, "agents"),
        path.join(localBase, "agents")
      );
      
      commandsCopied = copyDirectoryContents(
        path.join(globalBase, "commands"),
        path.join(localBase, "commands")
      );
    }

    s.stop("Synchronisation completed.");
    p.outro(
      pc.green(`✔ Sync complete! Copied ${agentsCopied} agents and ${commandsCopied} commands successfully.`)
    );
  } catch (error) {
    s.stop("Failed.");
    p.cancel(error instanceof Error ? error.message : String(error));
  }
}
