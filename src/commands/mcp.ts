import fs from "node:fs";
import path from "node:path";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { execSync } from "node:child_process";

interface MCPServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

const MCP_TEMPLATES: Record<string, { label: string; command: string; args: string[]; desc: string }> = {
  sqlite: {
    label: "SQLite Server (Local database inspector)",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-sqlite", "--db", "./db.sqlite"],
    desc: "Inspect, query, and modify local SQLite database files.",
  },
  filesystem: {
    label: "Filesystem Server (Secure multi-directory explorer)",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem"],
    desc: "Allow secure, sandboxed read/write access to designated local folders.",
  },
  fetch: {
    label: "Fetch Server (Retrieve web contents safely)",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-fetch"],
    desc: "Allows the agent to fetch URL content and convert it into clean markdown.",
  },
  memory: {
    label: "Memory Server (Knowledge Graph Storage)",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-memory"],
    desc: "Provides persistent knowledge graph capabilities to store facts across sessions.",
  },
};

export async function runMcpAdd(): Promise<void> {
  p.intro(pc.cyan("🔌 Configure OpenCode MCP Servers"));

  let configPath = path.join(process.cwd(), "opencode.json");
  if (!fs.existsSync(configPath)) {
    if (fs.existsSync(path.join(process.cwd(), "opencode.jsonc"))) {
      configPath = path.join(process.cwd(), "opencode.jsonc");
    } else {
      const createNew = await p.confirm({
        message: "No local 'opencode.json' found. Initialize a new one in the project root?",
        initialValue: true,
      });

      if (p.isCancel(createNew) || !createNew) {
        p.cancel("Cancelled.");
        return;
      }
      fs.writeFileSync(configPath, JSON.stringify({ mcp: { servers: {} } }, null, 2), "utf-8");
    }
  }

  const serverKey = await p.select({
    message: "Select an MCP Server to configure:",
    options: Object.entries(MCP_TEMPLATES).map(([key, item]) => ({
      value: key,
      label: item.label,
      hint: item.desc,
    })),
  });

  if (p.isCancel(serverKey)) {
    p.cancel("Cancelled.");
    return;
  }

  const selectedKey = serverKey as string;
  const template = MCP_TEMPLATES[selectedKey];
  const finalArgs = [...template.args];

  if (selectedKey === "sqlite") {
    const dbPath = await p.text({
      message: "Specify SQLite database path relative to project root:",
      placeholder: "./db.sqlite",
      initialValue: "./db.sqlite",
    });
    if (p.isCancel(dbPath)) return;
    
    const dbIndex = finalArgs.indexOf("--db");
    if (dbIndex !== -1 && dbIndex + 1 < finalArgs.length) {
      finalArgs[dbIndex + 1] = dbPath as string;
    }
  } else if (selectedKey === "filesystem") {
    const allowedPath = await p.text({
      message: "Specify absolute path of directory to expose to MCP (e.g. /home/user/downloads):",
      placeholder: process.cwd(),
      initialValue: process.cwd(),
      validate(value) {
        if (!value.trim()) return "Path is required.";
      },
    });
    if (p.isCancel(allowedPath)) return;
    finalArgs.push(allowedPath as string);
  }

  const s = p.spinner();
  s.start(`Adding ${selectedKey} server to config...`);

  try {
    let content = fs.readFileSync(configPath, "utf-8");
    let parsed: any = {};
    try {
      const cleanJson = content.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
      parsed = JSON.parse(cleanJson);
    } catch {
      throw new Error(`Failed to parse ${path.basename(configPath)}. Ensure it is valid JSON/JSONC.`);
    }

    if (!parsed.mcp) {
      parsed.mcp = { servers: {} };
    }
    if (!parsed.mcp.servers) {
      parsed.mcp.servers = {};
    }

    parsed.mcp.servers[selectedKey] = {
      command: template.command,
      args: finalArgs,
    };

    fs.writeFileSync(configPath, JSON.stringify(parsed, null, 2), "utf-8");
    s.stop(`Server '${selectedKey}' added!`);
    p.outro(pc.green(`✔ Successfully configured '${selectedKey}' in: ${configPath}`));
  } catch (error) {
    s.stop("Failed.");
    p.cancel(error instanceof Error ? error.message : String(error));
  }
}

export async function runMcpCheck(): Promise<void> {
  p.intro(pc.cyan("🔌 OpenCode MCP Servers Diagnostics"));

  let configPath = path.join(process.cwd(), "opencode.json");
  if (!fs.existsSync(configPath)) {
    if (fs.existsSync(path.join(process.cwd(), "opencode.jsonc"))) {
      configPath = path.join(process.cwd(), "opencode.jsonc");
    } else {
      p.cancel(pc.yellow("No local 'opencode.json' or 'opencode.jsonc' configuration found."));
      return;
    }
  }

  let content = fs.readFileSync(configPath, "utf-8");
  let parsed: any = {};
  try {
    const cleanJson = content.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
    parsed = JSON.parse(cleanJson);
  } catch {
    p.cancel(pc.red(`Failed to parse ${path.basename(configPath)}. Ensure it is valid JSON/JSONC.`));
    return;
  }

  const servers = parsed.mcp?.servers;
  if (!servers || Object.keys(servers).length === 0) {
    p.log.warn("No MCP servers are configured in this project.");
    p.outro("Add a server using 'ia-tool mcp' first.");
    return;
  }

  const s = p.spinner();
  s.start("Auditing configured MCP servers...");
  await new Promise(resolve => setTimeout(resolve, 500));
  s.stop("Audit completed.");

  for (const [name, config] of Object.entries(servers)) {
    const mcpConfig = config as MCPServerConfig;
    const cmd = mcpConfig.command;
    
    // 1. Verify executable exists in path
    let commandExists = false;
    try {
      execSync(`command -v ${cmd}`, { stdio: "ignore" });
      commandExists = true;
    } catch {}

    if (!commandExists) {
      p.log.error(`[Red] Server '${name}': Command '${cmd}' not found in PATH.`);
      continue;
    }

    // 2. Perform a brief spawn check
    let spawnSuccess = true;
    let spawnError = "";
    try {
      // Spawn briefly and kill after 800ms to verify it starts up without throwing
      const proc = Bun.spawn([cmd, ...mcpConfig.args], {
        stdout: "ignore",
        stderr: "pipe",
      });

      // Brief delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Check if it exited prematurely with error
      if (proc.killed || (proc.exitCode !== null && proc.exitCode !== 0)) {
        spawnSuccess = false;
        const errOutput = await new Response(proc.stderr).text();
        spawnError = errOutput.trim() || `process exited with code ${proc.exitCode}`;
      }
      
      // Kill the process cleanly
      proc.kill();
    } catch (e) {
      spawnSuccess = false;
      spawnError = e instanceof Error ? e.message : String(e);
    }

    if (spawnSuccess) {
      p.log.success(`Server '${name}': Configured correctly and runs successfully.`);
    } else {
      p.log.error(`Server '${name}': Failed to run. Details: ${spawnError}`);
    }
  }

  p.outro(pc.green("✔ MCP diagnostics finished."));
}
