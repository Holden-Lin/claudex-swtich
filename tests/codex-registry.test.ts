import { beforeEach, describe, expect, setSystemTime, test } from "bun:test";
import {
  loadRegistry,
  removeAccountFromRegistry,
  setActiveAccount,
} from "../src/providers/codex/registry";
import type { CodexRegistry } from "../src/types";
import { resetTestHome } from "./helpers";

function createRegistry(): CodexRegistry {
  return {
    schema_version: 3,
    active_account_key: null,
    active_account_activated_at_ms: null,
    auto_switch: {
      enabled: false,
      threshold_5h_percent: 10,
      threshold_weekly_percent: 5,
    },
    api: { usage: true, account: true },
    accounts: [
      {
        account_key: "account-1",
        chatgpt_account_id: "acct-1",
        chatgpt_user_id: "user-1",
        email: "dev@example.com",
        alias: "work",
        account_name: null,
        plan: "plus",
        auth_mode: "chatgpt",
        created_at: 1,
        last_used_at: null,
        last_usage: null,
        last_usage_at: null,
        last_local_rollout: null,
      },
    ],
  };
}

describe("codex registry", () => {
  beforeEach(async () => {
    await resetTestHome();
    setSystemTime();
  });

  test("returns a fresh default registry", async () => {
    const first = await loadRegistry();
    first.accounts.push({
      account_key: "mutated",
      chatgpt_account_id: "mutated",
      chatgpt_user_id: "mutated",
      email: "mutated@example.com",
      alias: "mutated",
      account_name: null,
      plan: null,
      auth_mode: "chatgpt",
      created_at: 1,
      last_used_at: null,
      last_usage: null,
      last_usage_at: null,
      last_local_rollout: null,
    });

    const second = await loadRegistry();
    expect(second.accounts).toHaveLength(0);
    expect(second.active_account_key).toBeNull();
  });

  test("updates active timestamps and clears active metadata on removal", () => {
    const now = new Date("2026-04-06T00:00:00.000Z");
    const registry = createRegistry();

    setSystemTime(now);
    setActiveAccount(registry, "account-1");

    expect(registry.active_account_key).toBe("account-1");
    expect(registry.active_account_activated_at_ms).toBe(now.getTime());
    expect(registry.accounts[0]?.last_used_at).toBe(
      Math.floor(now.getTime() / 1000),
    );

    expect(removeAccountFromRegistry(registry, "account-1")).toBe(true);
    expect(registry.accounts).toHaveLength(0);
    expect(registry.active_account_key).toBeNull();
    expect(registry.active_account_activated_at_ms).toBeNull();
  });
});
