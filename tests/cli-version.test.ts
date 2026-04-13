import { describe, expect, test } from "bun:test";
import { spawnSync } from "child_process";
import packageJson from "../package.json";

function runCli(args: string[]) {
  return spawnSync(process.execPath, ["src/index.ts", ...args], {
    cwd: process.cwd(),
    encoding: "utf-8",
    env: {
      ...process.env,
      CLAUDEX_DISABLE_AUTO_UPDATE: "1",
      NO_COLOR: "1",
    },
  });
}

describe("cli version flags", () => {
  test("prints the current version for --version", () => {
    const result = runCli(["--version"]);

    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe(packageJson.version);
    expect(result.stderr).toBe("");
  });

  test("prints the current version for -V", () => {
    const result = runCli(["-V"]);

    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe(packageJson.version);
    expect(result.stderr).toBe("");
  });

  test("does not treat -version as a supported flag", () => {
    const result = runCli(["-version"]);
    const output = `${result.stderr}${result.stdout}`;

    expect(result.status).toBe(1);
    expect(output).toContain('Unknown command: "-version"');
  });
});
