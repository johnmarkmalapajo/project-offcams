import { test } from "node:test";
import assert from "node:assert/strict";
import { pinHash } from "./pin.ts";

test("pin hash ignores student-number case/spaces and depends on the PIN", async () => {
  assert.equal(await pinHash(" 2023-ab1 ", "1234"), await pinHash("2023-AB1", "1234"));
  assert.notEqual(await pinHash("2023-AB1", "1234"), await pinHash("2023-AB1", "1235"));
  assert.notEqual(await pinHash("2023-AB1", "1234"), await pinHash("2023-AB2", "1234"));
});
