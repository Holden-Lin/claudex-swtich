import { mkdir, rm } from "fs/promises";

export const TEST_HOME = process.env.CLAUDEX_TEST_HOME ?? "";

export async function resetTestHome(): Promise<void> {
  if (!TEST_HOME) {
    throw new Error("CLAUDEX_TEST_HOME is not set");
  }

  await rm(TEST_HOME, { recursive: true, force: true });
  await mkdir(TEST_HOME, { recursive: true });
}

export function fileMode(mode: number): number {
  return mode & 0o777;
}

export function makeJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(
    JSON.stringify({ alg: "none", typ: "JWT" }),
  ).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.`;
}
