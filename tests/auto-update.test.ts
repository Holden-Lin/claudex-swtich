import { describe, expect, test } from "bun:test";
import packageJson from "../package.json";
import {
  checkForLatestUpdate,
  compareVersions,
  detectInstallMethod,
  extractVersionFromReleaseUrl,
  getVersionCheck,
  installLatestUpdate,
  runAutoUpdateIfNeeded,
} from "../src/lib/update";

describe("auto update", () => {
  test("compares semantic versions correctly", () => {
    expect(compareVersions("1.2.0", "1.1.9")).toBe(1);
    expect(compareVersions("1.1.1", "v1.1.1")).toBe(0);
    expect(compareVersions("1.1.0", "1.1.1")).toBe(-1);
  });

  test("extracts release versions from redirect URLs", () => {
    expect(
      extractVersionFromReleaseUrl(
        "https://github.com/Holden-Lin/claudex-switch/releases/tag/v1.2.3",
      ),
    ).toBe("1.2.3");
    expect(
      extractVersionFromReleaseUrl(
        "https://github.com/Holden-Lin/claudex-switch/releases/latest",
      ),
    ).toBeNull();
  });

  test("reports when the installed version is already the latest", async () => {
    const result = await getVersionCheck(async () => packageJson.version);

    expect(result).toEqual({
      currentVersion: packageJson.version,
      latestVersion: packageJson.version,
      status: "latest",
    });
  });

  test("reports when an update is available", async () => {
    const result = await getVersionCheck(async () => "1.2.0");

    expect(result).toEqual({
      currentVersion: packageJson.version,
      latestVersion: "1.2.0",
      status: "outdated",
    });
  });

  test("reports unknown when the latest release cannot be checked", async () => {
    const result = await getVersionCheck(async () => null);

    expect(result).toEqual({
      currentVersion: packageJson.version,
      latestVersion: null,
      status: "unknown",
    });
  });

  test("detects a homebrew install from the executable path", () => {
    const commands: string[] = [];
    const method = detectInstallMethod(
      ["/opt/homebrew/bin/claudex-switch"],
      "/opt/homebrew/Cellar/claudex-switch/1.1.1/bin/claudex-switch",
      (command, args) => {
        commands.push(`${command} ${args.join(" ")}`);
        if (command === "brew") {
          return { status: 0, stdout: "/opt/homebrew\n" };
        }
        return { status: 1 };
      },
    );

    expect(method).toBe("brew");
    expect(commands).toEqual(["brew --prefix"]);
  });

  test("does not mis-detect homebrew when only node comes from homebrew", () => {
    const method = detectInstallMethod(
      [
        "/opt/homebrew/bin/node",
        "/Users/test/.bun/install/global/node_modules/claudex-switch/dist/claudex-switch.js",
      ],
      "/opt/homebrew/Cellar/node/24.0.0/bin/node",
      (command) => {
        if (command === "brew") {
          return { status: 0, stdout: "/opt/homebrew\n" };
        }

        if (command === "bun") {
          return { status: 0 };
        }

        return { status: 1 };
      },
    );

    expect(method).toBe("bun");
  });

  test("updates with bun and restarts the original command", async () => {
    const calls: string[] = [];

    const result = await runAutoUpdateIfNeeded({
      argv: ["node", "/tmp/claudex-switch.js", "list"],
      env: {},
      execPath: "/usr/local/bin/node",
      fetchLatestVersion: async () => "9.8.7",
      runCommand: (command, args, options) => {
        calls.push(`${command} ${args.join(" ")}`);

        if (command === "brew") {
          return { status: 1 };
        }

        if (
          command === "bun" &&
          args[0] === "--version"
        ) {
          return { status: 0 };
        }

        if (
          command === "bun" &&
          args[0] === "install"
        ) {
          expect(options?.env?.CLAUDEX_SKIP_AUTO_UPDATE).toBe("1");
          return { status: 0 };
        }

        if (command === "node") {
          expect(options?.env?.CLAUDEX_SKIP_AUTO_UPDATE).toBe("1");
          expect(args).toEqual(["/tmp/claudex-switch.js", "list"]);
          return { status: 0 };
        }

        throw new Error(`Unexpected command: ${command} ${args.join(" ")}`);
      },
    });

    expect(result).toEqual({ action: "restart", exitCode: 0 });
    expect(calls).toEqual([
      "brew --prefix",
      "bun --version",
      "bun install -g git+https://github.com/Holden-Lin/claudex-switch.git#v9.8.7",
      "node /tmp/claudex-switch.js list",
    ]);
  });

  test("manual update ignores the auto-update disable env flag", async () => {
    const calls: string[] = [];

    const available = await checkForLatestUpdate(
      {
        argv: ["node", "/tmp/claudex-switch.js", "update"],
        env: { CLAUDEX_DISABLE_AUTO_UPDATE: "1" },
        execPath: "/usr/local/bin/node",
        fetchLatestVersion: async () => "9.8.7",
        runCommand: (command, args, options) => {
          calls.push(`${command} ${args.join(" ")}`);

          if (command === "brew") {
            return { status: 1 };
          }

          if (command === "bun" && args[0] === "--version") {
            return { status: 0 };
          }

          if (command === "bun" && args[0] === "install") {
            expect(options?.env?.CLAUDEX_SKIP_AUTO_UPDATE).toBe("1");
            expect(options?.env?.CLAUDEX_DISABLE_AUTO_UPDATE).toBe("1");
            return { status: 0 };
          }

          throw new Error(`Unexpected command: ${command} ${args.join(" ")}`);
        },
      },
      { respectDisableEnv: false },
    );

    expect(available.status).toBe("available");

    if (available.status !== "available") {
      throw new Error(`Expected available update, received ${available.status}`);
    }

    const installed = installLatestUpdate(available);

    expect(installed.ok).toBe(true);
    expect(installed.env.CLAUDEX_SKIP_AUTO_UPDATE).toBe("1");
    expect(calls).toEqual([
      "brew --prefix",
      "bun --version",
      "bun install -g git+https://github.com/Holden-Lin/claudex-switch.git#v9.8.7",
    ]);
  });

  test("continues when auto update is disabled", async () => {
    const result = await runAutoUpdateIfNeeded({
      env: { CLAUDEX_DISABLE_AUTO_UPDATE: "1" },
      fetchLatestVersion: async () => {
        throw new Error("should not fetch");
      },
    });

    expect(result).toEqual({ action: "continue" });
  });
});
