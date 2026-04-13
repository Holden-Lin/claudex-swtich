import { describe, expect, test } from "bun:test";
import { spawnSync } from "child_process";
import {
  mkdtemp,
  mkdir,
  rm,
  writeFile,
} from "fs/promises";
import { tmpdir } from "os";
import { dirname, join, resolve } from "path";

async function run(command: string, args: string[], cwd: string) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf-8",
    env: process.env,
  });

  if (result.status !== 0) {
    throw new Error(
      `Command failed: ${command} ${args.join(" ")}\n${result.stderr || result.stdout}`,
    );
  }
}

async function writeRepoFile(
  rootDir: string,
  relativePath: string,
  content: string,
): Promise<void> {
  await mkdir(dirname(join(rootDir, relativePath)), { recursive: true });
  await writeFile(join(rootDir, relativePath), content);
}

async function initRepo(
  version: string,
): Promise<string> {
  const rootDir = await mkdtemp(
    join(tmpdir(), "claudex-switch-release-guard-"),
  );

  await run("git", ["init"], rootDir);
  await run("git", ["config", "user.name", "Test User"], rootDir);
  await run("git", ["config", "user.email", "test@example.com"], rootDir);

  await writeRepoFile(
    rootDir,
    "package.json",
    JSON.stringify({ name: "claudex-switch", version }, null, 2),
  );
  await writeRepoFile(rootDir, "src/index.ts", 'console.log("hello");\n');
  await writeRepoFile(rootDir, "Formula/claudex-switch.rb", 'class ClaudexSwitch < Formula\nend\n');

  await run("git", ["add", "."], rootDir);
  await run("git", ["commit", "-m", "initial"], rootDir);

  return rootDir;
}

function runGuard(rootDir: string, latestTag: string) {
  const scriptPath = resolve(process.cwd(), "scripts/check-release-state.sh");

  return spawnSync(
    "bash",
    [scriptPath],
    {
      cwd: rootDir,
      encoding: "utf-8",
      env: {
        ...process.env,
        CLAUDEX_RELEASE_GUARD_LATEST_TAG: latestTag,
      },
    },
  );
}

describe("check-release-state.sh", () => {
  test("passes when package.json version is ahead of the latest release", async () => {
    const rootDir = await initRepo("1.1.1");

    try {
      await run("git", ["tag", "v1.1.1"], rootDir);
      await writeRepoFile(
        rootDir,
        "package.json",
        JSON.stringify({ name: "claudex-switch", version: "1.1.2" }, null, 2),
      );
      await writeRepoFile(rootDir, "src/index.ts", 'console.log("updated");\n');
      await run("git", ["add", "."], rootDir);
      await run("git", ["commit", "-m", "prepare release"], rootDir);

      const result = runGuard(rootDir, "v1.1.1");

      expect(result.status).toBe(0);
      expect(result.stdout).toContain("release prep looks intentional");
    } finally {
      await rm(rootDir, { recursive: true, force: true });
    }
  });

  test("fails when main is ahead of the latest release without a version bump", async () => {
    const rootDir = await initRepo("1.1.1");

    try {
      await run("git", ["tag", "v1.1.1"], rootDir);
      await writeRepoFile(rootDir, "src/index.ts", 'console.log("updated");\n');
      await run("git", ["add", "."], rootDir);
      await run("git", ["commit", "-m", "feature"], rootDir);

      const result = runGuard(rootDir, "v1.1.1");

      expect(result.status).toBe(1);
      expect(result.stderr).toContain("Unreleased files since v1.1.1");
      expect(result.stderr).toContain("src/index.ts");
      expect(result.stderr).toContain("Bump package.json and publish a new release tag");
    } finally {
      await rm(rootDir, { recursive: true, force: true });
    }
  });

  test("ignores the workflow-generated Homebrew formula commit", async () => {
    const rootDir = await initRepo("1.1.1");

    try {
      await run("git", ["tag", "v1.1.1"], rootDir);
      await writeRepoFile(
        rootDir,
        "Formula/claudex-switch.rb",
        'class ClaudexSwitch < Formula\n  version "1.1.2"\nend\n',
      );
      await run("git", ["add", "."], rootDir);
      await run("git", ["commit", "-m", "release formula"], rootDir);

      const result = runGuard(rootDir, "v1.1.1");

      expect(result.status).toBe(0);
      expect(result.stdout).toContain("main matches the latest release");
    } finally {
      await rm(rootDir, { recursive: true, force: true });
    }
  });
});
