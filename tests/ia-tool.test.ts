import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

function createTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "ia-tool-test-"));
}

function removeTempDir(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true });
}

describe("Package Structure", () => {
  it("should have correct package.json", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf-8"));
    expect(pkg.name).toBe("@j3sus.dev/ia-tool");
    expect(pkg.version).toBe("2.0.0");
    expect(pkg.dependencies).toHaveProperty("@bdocs/dui");
    expect(pkg.dependencies).not.toHaveProperty("picocolors");
    expect(pkg.dependencies).not.toHaveProperty("@clack/prompts");
  });

  it("should have agents directory with markdown files", () => {
    const agentsDir = path.join(process.cwd(), "agents");
    expect(fs.existsSync(agentsDir)).toBe(true);
    const files = fs.readdirSync(agentsDir).filter((f) => f.endsWith(".md"));
    expect(files.length).toBeGreaterThan(0);
  });

  it("should have commands directory with markdown files", () => {
    const commandsDir = path.join(process.cwd(), "commands");
    expect(fs.existsSync(commandsDir)).toBe(true);
    const files = fs.readdirSync(commandsDir).filter((f) => f.endsWith(".md"));
    expect(files.length).toBeGreaterThan(0);
  });

  it("should not have removed command files", () => {
    const removedFiles = [
      "commit-all.ts",
      "changeset.ts",
      "hook.ts",
      "mcp.ts",
      "command-add.ts",
      "sync.ts",
    ];
    for (const file of removedFiles) {
      expect(fs.existsSync(path.join(process.cwd(), "src", "commands", file))).toBe(false);
    }
  });

  it("should not have git.ts utility", () => {
    expect(fs.existsSync(path.join(process.cwd(), "src", "utils", "git.ts"))).toBe(false);
  });
});

describe("Source Code", () => {
  it("should have index.ts with correct imports", () => {
    const indexContent = fs.readFileSync(path.join(process.cwd(), "src", "index.ts"), "utf-8");
    expect(indexContent).toContain('@bdocs/dui');
    expect(indexContent).not.toContain('picocolors');
    expect(indexContent).not.toContain('@clack/prompts');
  });

  it("should have install.ts with DUI imports", () => {
    const installContent = fs.readFileSync(path.join(process.cwd(), "src", "commands", "install.ts"), "utf-8");
    expect(installContent).toContain('@bdocs/dui');
    expect(installContent).not.toContain('picocolors');
    expect(installContent).not.toContain('@clack/prompts');
  });

  it("should have doctor.ts with DUI imports", () => {
    const doctorContent = fs.readFileSync(path.join(process.cwd(), "src", "commands", "doctor.ts"), "utf-8");
    expect(doctorContent).toContain('@bdocs/dui');
    expect(doctorContent).not.toContain('picocolors');
    expect(doctorContent).not.toContain('@clack/prompts');
  });

  it("should have ascii.ts with DUI imports", () => {
    const asciiContent = fs.readFileSync(path.join(process.cwd(), "src", "utils", "ascii.ts"), "utf-8");
    expect(asciiContent).toContain('@bdocs/dui');
    expect(asciiContent).not.toContain('picocolors');
  });
});

describe("Install Command", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    removeTempDir(tempDir);
  });

  it("should have findPackageRoot function", () => {
    const installContent = fs.readFileSync(path.join(process.cwd(), "src", "commands", "install.ts"), "utf-8");
    expect(installContent).toContain("findPackageRoot");
  });

  it("should have handleRemoteInstall function", () => {
    const installContent = fs.readFileSync(path.join(process.cwd(), "src", "commands", "install.ts"), "utf-8");
    expect(installContent).toContain("handleRemoteInstall");
  });

  it("should have handleLocalInstall function", () => {
    const installContent = fs.readFileSync(path.join(process.cwd(), "src", "commands", "install.ts"), "utf-8");
    expect(installContent).toContain("handleLocalInstall");
  });

  it("should support all platforms", () => {
    const installContent = fs.readFileSync(path.join(process.cwd(), "src", "commands", "install.ts"), "utf-8");
    expect(installContent).toContain("opencode");
    expect(installContent).toContain("claude");
    expect(installContent).toContain("cursor");
    expect(installContent).toContain("copilot");
    expect(installContent).toContain("antigravity");
  });
});

describe("Doctor Command", () => {
  it("should check OpenCode config", () => {
    const doctorContent = fs.readFileSync(path.join(process.cwd(), "src", "commands", "doctor.ts"), "utf-8");
    expect(doctorContent).toContain(".opencode");
    expect(doctorContent).toContain("OpenCode Config");
  });

  it("should check Claude Code config", () => {
    const doctorContent = fs.readFileSync(path.join(process.cwd(), "src", "commands", "doctor.ts"), "utf-8");
    expect(doctorContent).toContain("CLAUDE.md");
    expect(doctorContent).toContain("Claude Code Config");
  });

  it("should check Cursor config", () => {
    const doctorContent = fs.readFileSync(path.join(process.cwd(), "src", "commands", "doctor.ts"), "utf-8");
    expect(doctorContent).toContain(".cursorrules");
    expect(doctorContent).toContain("Cursor Config");
  });

  it("should check Copilot config", () => {
    const doctorContent = fs.readFileSync(path.join(process.cwd(), "src", "commands", "doctor.ts"), "utf-8");
    expect(doctorContent).toContain("copilot-instructions.md");
    expect(doctorContent).toContain("GitHub Copilot Config");
  });

  it("should check Antigravity config", () => {
    const doctorContent = fs.readFileSync(path.join(process.cwd(), "src", "commands", "doctor.ts"), "utf-8");
    expect(doctorContent).toContain("AGENTS.md");
    expect(doctorContent).toContain("Gemini Antigravity Config");
  });

  it("should check OpenCode agents count", () => {
    const doctorContent = fs.readFileSync(path.join(process.cwd(), "src", "commands", "doctor.ts"), "utf-8");
    expect(doctorContent).toContain("OpenCode Agents");
    expect(doctorContent).toContain("agents installed");
  });

  it("should check OpenCode commands count", () => {
    const doctorContent = fs.readFileSync(path.join(process.cwd(), "src", "commands", "doctor.ts"), "utf-8");
    expect(doctorContent).toContain("OpenCode Commands");
    expect(doctorContent).toContain("commands installed");
  });
});

describe("ASCII Logo", () => {
  it("should have renderAsciiLogo function", () => {
    const asciiContent = fs.readFileSync(path.join(process.cwd(), "src", "utils", "ascii.ts"), "utf-8");
    expect(asciiContent).toContain("renderAsciiLogo");
  });

  it("should have renderDivider function", () => {
    const asciiContent = fs.readFileSync(path.join(process.cwd(), "src", "utils", "ascii.ts"), "utf-8");
    expect(asciiContent).toContain("renderDivider");
  });

  it("should use DUI colorize", () => {
    const asciiContent = fs.readFileSync(path.join(process.cwd(), "src", "utils", "ascii.ts"), "utf-8");
    expect(asciiContent).toContain("colorize");
  });
});
