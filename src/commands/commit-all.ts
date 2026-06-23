import * as p from "@clack/prompts";
import pc from "picocolors";
import { box, colors } from "@bdocs/dui";
import {
  isGitRepo,
  hasUnstagedChanges,
  hasStagedChanges,
  stageAllChanges,
  runGitCommit,
} from "../utils/git.ts";

const CONVENTIONAL_TYPES = [
  { value: "feat", label: "feat: A new feature" },
  { value: "fix", label: "fix: A bug fix" },
  { value: "docs", label: "docs: Documentation only changes" },
  { value: "refactor", label: "refactor: Code refactoring without fixes/features" },
  { value: "perf", label: "perf: A code change that improves performance" },
  { value: "test", label: "test: Adding/correcting tests" },
  { value: "style", label: "style: Code styling (formatting, semicolons, etc.)" },
  { value: "chore", label: "chore: Build process, dependencies, auxiliary tools" },
  { value: "build", label: "build: Build system, external packages" },
  { value: "ci", label: "ci: CI setup, pipelines, workflows" },
  { value: "revert", label: "revert: Reverting previous commit" },
];

export async function runCommitAll(): Promise<void> {
  p.intro(pc.cyan("🚀 Conventional Commit Assistant (commit-all)"));

  if (!isGitRepo()) {
    p.cancel(pc.red("Error: Current directory is not a Git repository."));
    return;
  }

  if (hasUnstagedChanges()) {
    const shouldStage = await p.confirm({
      message: "You have unstaged changes. Stage all changes now? (git add -A)",
      initialValue: true,
    });

    if (p.isCancel(shouldStage)) {
      p.cancel("Commit cancelled.");
      return;
    }

    if (shouldStage) {
      stageAllChanges();
      p.log.success("All changes staged successfully.");
    }
  }

  if (!hasStagedChanges()) {
    p.cancel(pc.yellow("No staged changes found. Stage files to commit them."));
    return;
  }

  let commitMessage = "";

  // Manual creation flow
  const type = await p.select({
    message: "Select Conventional Commit type:",
    options: CONVENTIONAL_TYPES,
  });

  if (p.isCancel(type)) {
    p.cancel("Commit cancelled.");
    return;
  }

  const scope = await p.text({
    message: "Scope (optional, e.g. parser, auth, router):",
    placeholder: "leave empty for none",
  });

  if (p.isCancel(scope)) {
    p.cancel("Commit cancelled.");
    return;
  }

  const subject = await p.text({
    message: "Commit description (imperative, present tense, lowercase, <72 chars):",
    placeholder: "implement user session caching",
    validate(value) {
      if (!value.trim()) return "Description is required.";
      if (value.length > 72) return "Description must be under 72 characters.";
    },
  });

  if (p.isCancel(subject)) {
    p.cancel("Commit cancelled.");
    return;
  }

  const body = await p.text({
    message: "Commit body details (optional):",
    placeholder: "leave empty for none",
  });

  if (p.isCancel(body)) {
    p.cancel("Commit cancelled.");
    return;
  }

  const isBreaking = await p.confirm({
    message: "Does this contain a breaking change?",
    initialValue: false,
  });

  if (p.isCancel(isBreaking)) {
    p.cancel("Commit cancelled.");
    return;
  }

  let breakingExplanation = "";
  if (isBreaking) {
    const expl = await p.text({
      message: "Describe the breaking change (BREAKING CHANGE: <explanation>):",
      validate(value) {
        if (!value.trim()) return "An explanation is required for breaking changes.";
      },
    });
    if (p.isCancel(expl)) {
      p.cancel("Commit cancelled.");
      return;
    }
    breakingExplanation = expl as string;
  }

  // Assemble commit message
  const scopeStr = scope ? `(${scope})` : "";
  const breakingMark = isBreaking ? "!" : "";
  commitMessage = `${type}${scopeStr}${breakingMark}: ${subject}`;
  
  if (body) {
    commitMessage += `\n\n${body}`;
  }
  
  if (isBreaking) {
    commitMessage += `\n\nBREAKING CHANGE: ${breakingExplanation}`;
  }

  // Show commit preview in a styled box
  console.log(
    box([colors.green(commitMessage)], {
      title: "Proposed Commit",
      style: "double",
      color: "#22c55e",
    })
  );

  const options = [
    { value: "commit", label: "✔ Commit with this message" },
    { value: "edit", label: "✏ Edit message manually" },
    { value: "cancel", label: "❌ Cancel" },
  ];

  const action = await p.select({
    message: "What would you like to do?",
    options,
  });

  if (p.isCancel(action) || action === "cancel") {
    p.cancel("Commit cancelled.");
    return;
  }

  if (action === "commit") {
    try {
      runGitCommit(commitMessage);
      p.outro(pc.green("✔ Committed successfully!"));
      return;
    } catch (err) {
      p.cancel(pc.red(`Failed to commit: ${err instanceof Error ? err.message : String(err)}`));
      return;
    }
  } else if (action === "edit") {
    const edited = await p.text({
      message: "Edit commit message:",
      initialValue: commitMessage,
      validate(value) {
        if (!value.trim()) return "Commit message cannot be empty.";
      },
    });

    if (p.isCancel(edited)) {
      p.cancel("Commit cancelled.");
      return;
    }
    
    commitMessage = edited as string;
    
    try {
      runGitCommit(commitMessage);
      p.outro(pc.green("✔ Committed successfully!"));
      return;
    } catch (err) {
      p.cancel(pc.red(`Failed to commit: ${err instanceof Error ? err.message : String(err)}`));
      return;
    }
  }
}
