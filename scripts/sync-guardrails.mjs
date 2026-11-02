#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { relative } from "node:path";

import {
  GUARDRAILS_END,
  GUARDRAILS_START,
  ROOT,
  listSkillFiles,
  readGuardrails,
} from "./guardrails.mjs";

const guardrails = readGuardrails();

function withGuardrails(text) {
  const start = text.indexOf(GUARDRAILS_START);
  const end = text.indexOf(GUARDRAILS_END);
  if (start !== -1 && end > start) {
    return text.slice(0, start) + guardrails + text.slice(end + GUARDRAILS_END.length);
  }

  const firstSection = text.indexOf("\n## ");
  if (firstSection === -1) {
    return `${text.trimEnd()}\n\n${guardrails}\n`;
  }
  return `${text.slice(0, firstSection + 1)}${guardrails}\n\n${text.slice(firstSection + 1)}`;
}

for (const path of listSkillFiles()) {
  const text = readFileSync(path, "utf8");
  const updated = withGuardrails(text);
  if (updated !== text) {
    writeFileSync(path, updated);
    console.log(`updated ${relative(ROOT, path)}`);
  }
}
