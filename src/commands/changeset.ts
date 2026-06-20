import fs from "node:fs";
import path from "node:path";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { isGitRepo, getModifiedFiles } from "../utils/git.ts";

function generateChangesetName(): string {
  const adjectives = ["happy", "quick", "brave", "calm", "gentle", "clever", "wise", "bright", "warm", "fresh"];
  const nouns = ["lion", "tiger", "eagle", "bear", "wolf", "deer", "fox", "owl", "frog", "seal"];
  const verbs = ["run", "jump", "fly", "walk", "sing", "dance", "read", "write", "code", "think"];

  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const verb = verbs[Math.floor(Math.random() * verbs.length)];
  return `${adj}-${noun}-${verb}`;
}

interface PackageInfo {
  name: string;
  dir: string;
}

function detectWorkspaces(): PackageInfo[] {
  const rootPkgPath = path.join(process.cwd(), "package.json");
  const packages: PackageInfo[] = [];

  if (fs.existsSync(rootPkgPath)) {
    try {
      const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, "utf-8"));
      
      // 1. PNPM Workspaces
      const pnpmWorkspacePath = path.join(process.cwd(), "pnpm-workspace.yaml");
      if (fs.existsSync(pnpmWorkspacePath)) {
        const content = fs.readFileSync(pnpmWorkspacePath, "utf-8");
        const lines = content.split("\n");
        const packageDirs: string[] = [];
        let inPackages = false;
        for (const line of lines) {
          if (line.trim().startsWith("packages:")) {
            inPackages = true;
            continue;
          }
          if (inPackages && line.trim().startsWith("-")) {
            const dirPattern = line.replace("-", "").trim().replace(/'/g, "").replace(/"/g, "");
            packageDirs.push(dirPattern);
          }
        }

        for (const pattern of packageDirs) {
          const cleanPattern = pattern.replace("/*", "");
          const targetPath = path.join(process.cwd(), cleanPattern);
          if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
            const subdirs = fs.readdirSync(targetPath);
            for (const subdir of subdirs) {
              const subpkgPath = path.join(targetPath, subdir, "package.json");
              if (fs.existsSync(subpkgPath)) {
                try {
                  const subpkg = JSON.parse(fs.readFileSync(subpkgPath, "utf-8"));
                  if (subpkg.name && !subpkg.private) {
                    packages.push({ name: subpkg.name, dir: path.join(cleanPattern, subdir) });
                  }
                } catch {}
              }
            }
          }
        }
      }
      
      // 2. NPM/Yarn Workspaces
      if (rootPkg.workspaces) {
        const workspacePatterns = Array.isArray(rootPkg.workspaces) 
          ? rootPkg.workspaces 
          : (rootPkg.workspaces.packages || []);
          
        for (const pattern of workspacePatterns) {
          const cleanPattern = pattern.replace("/*", "");
          const targetPath = path.join(process.cwd(), cleanPattern);
          if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
            const subdirs = fs.readdirSync(targetPath);
            for (const subdir of subdirs) {
              const subpkgPath = path.join(targetPath, subdir, "package.json");
              if (fs.existsSync(subpkgPath)) {
                try {
                  const subpkg = JSON.parse(fs.readFileSync(subpkgPath, "utf-8"));
                  if (subpkg.name && !subpkg.private) {
                    packages.push({ name: subpkg.name, dir: path.join(cleanPattern, subdir) });
                  }
                } catch {}
              }
            }
          }
        }
      }

      // Root package if not workspaces
      if (packages.length === 0 && rootPkg.name && !rootPkg.private) {
        packages.push({ name: rootPkg.name, dir: "." });
      }
    } catch {}
  }

  if (packages.length === 0) {
    packages.push({ name: path.basename(process.cwd()), dir: "." });
  }

  return packages;
}

function detectReleaseTool(): "changesets" | "semantic-release" | "none" {
  if (fs.existsSync(path.join(process.cwd(), ".changeset")) || fs.existsSync(path.join(process.cwd(), ".changeset", "config.json"))) {
    return "changesets";
  }

  const semanticReleaseConfigs = [
    ".releaserc",
    ".releaserc.json",
    ".releaserc.yaml",
    ".releaserc.yml",
    ".releaserc.js",
    ".releaserc.cjs",
    "release.config.js",
    "release.config.cjs",
  ];
  for (const config of semanticReleaseConfigs) {
    if (fs.existsSync(path.join(process.cwd(), config))) {
      return "semantic-release";
    }
  }

  const pkgPath = path.join(process.cwd(), "package.json");
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      if (pkg.release || (pkg.devDependencies && pkg.devDependencies["semantic-release"])) {
        return "semantic-release";
      }
    } catch {}
  }

  return "none";
}

export async function runChangeset(): Promise<void> {
  p.intro(pc.cyan("📦 Changeset & Release Coordinator"));

  if (!isGitRepo()) {
    p.cancel(pc.red("Error: Current directory is not a Git repository."));
    return;
  }

  const releaseTool = detectReleaseTool();
  
  if (releaseTool === "semantic-release") {
    p.log.info(pc.yellow("🔍 Semantic Release detected."));
    p.log.message("This project uses semantic-release. Bumps and changelogs are generated automatically via Conventional Commits.");
    const runCommit = await p.confirm({
      message: "Would you like to run 'commit-all' to create a semantic commit instead?",
      initialValue: true,
    });
    if (p.isCancel(runCommit)) return;
    if (runCommit) {
      const { runCommitAll } = await import("./commit-all.ts");
      await runCommitAll();
      return;
    }
  }

  const detected = detectWorkspaces();
  const modifiedFiles = getModifiedFiles();

  const suggestedPackages = detected.filter(pkg => {
    if (pkg.dir === ".") return true;
    return modifiedFiles.some(file => file.startsWith(pkg.dir));
  }).map(pkg => pkg.name);

  let selectedPackages: string[] = [];
  if (detected.length === 1) {
    selectedPackages = [detected[0].name];
  } else {
    const pkgSelection = await p.multiselect({
      message: "Select packages to include in this changeset:",
      options: detected.map(pkg => ({
        value: pkg.name,
        label: `${pkg.name} ${suggestedPackages.includes(pkg.name) ? pc.dim("(modified)") : ""}`,
      })),
      initialValues: suggestedPackages.length > 0 ? suggestedPackages : undefined,
      required: true,
    });

    if (p.isCancel(pkgSelection)) {
      p.cancel("Changeset cancelled.");
      return;
    }
    selectedPackages = pkgSelection as string[];
  }

  const bumpType = await p.select({
    message: "Select version bump type for these packages:",
    options: [
      { value: "patch", label: "patch (bug fixes / minor enhancements)" },
      { value: "minor", label: "minor (new backward-compatible features)" },
      { value: "major", label: "major (breaking changes)" },
    ],
  });

  if (p.isCancel(bumpType)) {
    p.cancel("Changeset cancelled.");
    return;
  }

  const descInput = await p.text({
    message: "Enter changeset release notes description:",
    placeholder: "fix memory leaks on connection retries",
    validate(value) {
      if (!value.trim()) return "Description is required.";
    },
  });

  if (p.isCancel(descInput)) {
    p.cancel("Changeset cancelled.");
    return;
  }
  const description = descInput as string;

  console.log(pc.bold("\nProposed Changeset:"));
  console.log(pc.gray("---"));
  selectedPackages.forEach(pkg => {
    console.log(pc.green(`"${pkg}": ${bumpType}`));
  });
  console.log(pc.gray("---"));
  console.log(pc.yellow(description));
  console.log("");

  const shouldCreate = await p.confirm({
    message: "Write this changeset file?",
    initialValue: true,
  });

  if (p.isCancel(shouldCreate) || !shouldCreate) {
    p.cancel("Changeset cancelled.");
    return;
  }

  try {
    const changesetDir = path.join(process.cwd(), ".changeset");
    if (!fs.existsSync(changesetDir)) {
      fs.mkdirSync(changesetDir, { recursive: true });
    }

    const slug = generateChangesetName();
    const filePath = path.join(changesetDir, `${slug}.md`);

    let fileContent = "---\n";
    selectedPackages.forEach(pkg => {
      fileContent += `"${pkg}": ${bumpType}\n`;
    });
    fileContent += "---\n\n";
    fileContent += `${description}\n`;

    fs.writeFileSync(filePath, fileContent, "utf-8");
    p.outro(pc.green(`✔ Changeset successfully created at .changeset/${slug}.md`));
  } catch (error) {
    p.cancel(pc.red(`Failed to write changeset: ${error instanceof Error ? error.message : String(error)}`));
  }
}
