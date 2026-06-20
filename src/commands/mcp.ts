import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import * as p from "@clack/prompts";
import pc from "picocolors";

interface MCPServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

// Pre-defined premium MCP configurations
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

  // 1. Resolve configuration file path
  let configPath = path.join(process.cwd(), "opencode.json");
  if (!fs.existsSync(configPath)) {
    if (fs.existsSync(path.join(process.cwd(), "opencode.jsonc"))) {
      configPath = path.join(process.cwd(), "opencode.jsonc");
    } else {
      // Ask where to create/find config
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

  // 2. Select MCP server to add
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

  // 3. Customize parameters based on selection
  if (selectedKey === "sqlite") {
    const dbPath = await p.text({
      message: "Specify SQLite database path relative to project root:",
      placeholder: "./db.sqlite",
      initialValue: "./db.sqlite",
    });
    if (p.isCancel(dbPath)) return;
    
    // Replace '--db' arg value
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

  // 4. Update configuration file
  const s = p.spinner();
  s.start(`Adding ${selectedKey} server to config...`);

  try {
    let content = fs.readFileSync(configPath, "utf-8");
    
    // Basic JSONC clean to prevent parse crash on comments (simple stripping)
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
