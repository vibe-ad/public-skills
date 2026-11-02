import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const GUARDRAILS_PATH = join(ROOT, "shared", "guardrails.md");
export const GUARDRAILS_START = "<!-- shared-guardrails:start -->";
export const GUARDRAILS_END = "<!-- shared-guardrails:end -->";

export function readGuardrails() {
  return readFileSync(GUARDRAILS_PATH, "utf8").trim();
}

export function listSkillFiles() {
  const skillsRoot = join(ROOT, "skills");
  return readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(skillsRoot, entry.name, "SKILL.md"))
    .filter((path) => existsSync(path))
    .sort();
}
