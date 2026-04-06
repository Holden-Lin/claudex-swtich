import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { mock } from "bun:test";
import * as os from "os";

const testHome = mkdtempSync(join(tmpdir(), "claudex-switch-test-home-"));

process.env.HOME = testHome;
process.env.USERPROFILE = testHome;
process.env.CLAUDEX_TEST_HOME = testHome;
process.env.NO_COLOR = "1";

mock.module("os", () => ({
  ...os,
  homedir: () => testHome,
}));

process.on("exit", () => {
  rmSync(testHome, { recursive: true, force: true });
});
