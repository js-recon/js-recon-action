#!/usr/bin/env node
// check-confidential-paths.js <mapped-openapi.json> <keywords> [--count-only]
// keywords: comma- and/or newline-separated list of confidential keywords.
// Exits with the count of OpenAPI paths whose segments match a keyword.
// Exit code 0 if no matches; non-zero equal to the count (capped at 255) otherwise.

import { readFileSync, existsSync } from "fs";
import { argv, exit } from "process";

const filePath = argv[2] || "";
const rawKeywords = argv[3] || "";
const countOnly = argv.includes("--count-only");

function parseKeywords(raw) {
  return raw
    .split(/[,\n]+/)
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);
}

const keywords = parseKeywords(rawKeywords);

if (keywords.length === 0) {
  if (!countOnly) {
    console.log("[js-recon] No confidential-paths keywords configured. Skipping.");
  } else {
    console.log("0");
  }
  exit(0);
}

if (!filePath || !existsSync(filePath)) {
  if (!countOnly) {
    console.log(
      "[js-recon] No mapped-openapi.json found. Skipping confidential paths check.",
    );
  } else {
    console.log("0");
  }
  exit(0);
}

let spec;
try {
  spec = JSON.parse(readFileSync(filePath, "utf8"));
} catch {
  if (!countOnly) {
    console.log("[js-recon] mapped-openapi.json is empty or invalid. Skipping.");
  } else {
    console.log("0");
  }
  exit(0);
}

const paths = Object.keys(spec.paths || {});

const matched = [];
for (const path of paths) {
  const clean = path.replace(/#\d+$/, "");
  const segments = clean.split("/").filter(Boolean);
  for (const segment of segments) {
    const lower = segment.toLowerCase();
    const keyword = keywords.find((k) => lower.includes(k));
    if (keyword) {
      matched.push({ path, segment, keyword });
      break;
    }
  }
}

if (countOnly) {
  console.log(String(matched.length));
  exit(0);
}

if (matched.length === 0) {
  console.log("[js-recon] No confidential path keywords detected.");
  exit(0);
}

console.log(
  `[js-recon] ${matched.length} confidential path(s) detected:\n`,
);
console.log(`${"Path".padEnd(50)} ${"Segment".padEnd(20)} Keyword`);
console.log("-".repeat(90));
for (const m of matched) {
  console.log(
    `${m.path.substring(0, 49).padEnd(50)} ${m.segment.substring(0, 19).padEnd(20)} ${m.keyword}`,
  );
}

console.log(
  `\n[js-recon] ERROR: ${matched.length} confidential path(s) detected matching keywords: ${keywords.join(", ")}.`,
);
console.log(
  `           Set break-on-confidential-paths: false to suppress.`,
);

exit(matched.length > 255 ? 255 : matched.length);
