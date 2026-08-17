// Unit tests for check-confidential-paths.js using Node 22 built-in test runner
// Run: node --test scripts/check-confidential-paths.test.js

import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const SCRIPT = new URL("./check-confidential-paths.js", import.meta.url).pathname;

function run(filePath, keywords, extraArgs = []) {
  const args = [SCRIPT, filePath, keywords, ...extraArgs];
  return spawnSync(process.execPath, args, { encoding: "utf8" });
}

function withSpec(paths) {
  const dir = mkdtempSync(join(tmpdir(), "jsr-test-"));
  const file = join(dir, "mapped-openapi.json");
  writeFileSync(file, JSON.stringify({ openapi: "3.0.0", paths }));
  return { file, cleanup: () => rmSync(dir, { recursive: true }) };
}

test("exact segment match fails and counts 1", () => {
  const { file, cleanup } = withSpec({ "/admin/users": {} });
  const result = run(file, "admin,administrator");
  cleanup();
  assert.notEqual(result.status, 0);
});

test("substring-embedded keyword matches", () => {
  const { file, cleanup } = withSpec({
    "/api/adminugerHUGK897UYeilhefes/contacts": {},
  });
  const result = run(file, "admin", ["--count-only"]);
  cleanup();
  assert.equal(result.stdout.trim(), "1");
});

test("case-insensitive matching", () => {
  const { file, cleanup } = withSpec({ "/Admin/Users": {} });
  const result = run(file, "ADMIN", ["--count-only"]);
  cleanup();
  assert.equal(result.stdout.trim(), "1");
});

test("trailing #N dedup suffix is stripped before matching", () => {
  const { file, cleanup } = withSpec({
    "/api/x/{e}#2": {},
    "/api/contact": {},
  });
  const result = run(file, "x", ["--count-only"]);
  cleanup();
  assert.equal(result.stdout.trim(), "1");
});

test("comma-separated keywords parse correctly", () => {
  const { file, cleanup } = withSpec({ "/administrator/panel": {} });
  const result = run(file, "admin,administrator", ["--count-only"]);
  cleanup();
  assert.equal(result.stdout.trim(), "1");
});

test("newline-separated keywords parse correctly", () => {
  const { file, cleanup } = withSpec({ "/administrator/panel": {} });
  const result = run(file, "admin\nadministrator", ["--count-only"]);
  cleanup();
  assert.equal(result.stdout.trim(), "1");
});

test("empty paths object counts 0 and exits 0", () => {
  const { file, cleanup } = withSpec({});
  const result = run(file, "admin", ["--count-only"]);
  cleanup();
  assert.equal(result.stdout.trim(), "0");
  assert.equal(result.status, 0);
});

test("empty keywords string is a no-op", () => {
  const { file, cleanup } = withSpec({ "/admin/users": {} });
  const result = run(file, "", ["--count-only"]);
  cleanup();
  assert.equal(result.stdout.trim(), "0");
  assert.equal(result.status, 0);
});

test("no match exits 0", () => {
  const { file, cleanup } = withSpec({ "/api/contact": {} });
  const result = run(file, "admin");
  cleanup();
  assert.equal(result.status, 0);
});

test("missing file exits 0", () => {
  const result = run("/nonexistent/mapped-openapi.json", "admin", [
    "--count-only",
  ]);
  assert.equal(result.stdout.trim(), "0");
  assert.equal(result.status, 0);
});
