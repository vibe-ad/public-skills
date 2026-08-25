#!/usr/bin/env node

import {
  existsSync,
  readFileSync,
  readdirSync,
  realpathSync,
  statSync,
} from "node:fs";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { parse as parseYaml } from "yaml";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ROOT_REAL = realpathSync(ROOT);
const SKILL_ROOT = join(ROOT, "skills", "vibeco");
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const REFERENCE_LINK = /\]\((references\/[^)#]+)(?:#[^)]+)?\)/g;

function displayPath(path) {
  return relative(ROOT, path) || ".";
}

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function loadJson(path, errors) {
  if (!existsSync(path)) {
    errors.push(`missing ${displayPath(path)}`);
    return {};
  }

  try {
    const value = JSON.parse(readFileSync(path, "utf8"));
    if (!isObject(value)) {
      errors.push(`${displayPath(path)} must contain a JSON object`);
      return {};
    }
    return value;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`invalid JSON in ${displayPath(path)}: ${message}`);
    return {};
  }
}

function requireText(value, field, label, errors) {
  const candidate = value[field];
  if (typeof candidate !== "string" || candidate.trim().length === 0) {
    errors.push(`${label}.${field} must be a non-empty string`);
    return undefined;
  }
  return candidate;
}

function validateSkill(errors) {
  const path = join(SKILL_ROOT, "SKILL.md");
  if (!existsSync(path)) {
    errors.push("missing skills/vibeco/SKILL.md");
    return;
  }

  const text = readFileSync(path, "utf8");
  if (!text.startsWith("---\n")) {
    errors.push("SKILL.md must start with YAML frontmatter");
    return;
  }

  const end = text.indexOf("\n---", 4);
  if (end === -1) {
    errors.push("SKILL.md frontmatter is not closed");
    return;
  }

  let frontmatter;
  try {
    frontmatter = parseYaml(text.slice(4, end));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`SKILL.md frontmatter is invalid: ${message}`);
    return;
  }
  if (!isObject(frontmatter)) {
    errors.push("SKILL.md frontmatter must be an object");
    return;
  }
  if (frontmatter.name !== "vibeco") {
    errors.push("SKILL.md name must be `vibeco`");
  }
  requireText(frontmatter, "description", "SKILL.md", errors);

  for (const match of text.matchAll(REFERENCE_LINK)) {
    const reference = match[1];
    if (reference !== undefined && !existsSync(join(SKILL_ROOT, reference))) {
      errors.push(`SKILL.md references missing file: ${reference}`);
    }
  }
}

function validateHttpsUrl(value, field, errors) {
  try {
    const parsed = new URL(typeof value === "string" ? value : "");
    if (parsed.protocol !== "https:" || parsed.hostname.length === 0) {
      throw new Error("not an absolute HTTPS URL");
    }
  } catch {
    errors.push(`${field} must be an absolute HTTPS URL`);
  }
}

function validateAsset(value, field, errors) {
  if (typeof value !== "string" || !value.startsWith("./")) {
    errors.push(`${field} must be a relative path beginning with \`./\``);
    return;
  }

  const path = resolve(ROOT, value);
  if (!existsSync(path) || !statSync(path).isFile()) {
    errors.push(`${field} points to a missing or external file`);
    return;
  }
  const actualPath = realpathSync(path);
  if (actualPath !== ROOT_REAL && !actualPath.startsWith(`${ROOT_REAL}${sep}`)) {
    errors.push(`${field} points to a missing or external file`);
  }
}

function validateManifests(errors) {
  const openai = loadJson(join(ROOT, ".codex-plugin", "plugin.json"), errors);
  const anthropic = loadJson(join(ROOT, ".claude-plugin", "plugin.json"), errors);
  const versions = [];

  for (const [label, manifest] of [
    ["OpenAI", openai],
    ["Anthropic", anthropic],
  ]) {
    if (Object.keys(manifest).length === 0) {
      continue;
    }
    if (manifest.name !== "vibeco") {
      errors.push(`${label} plugin name must be \`vibeco\``);
    }
    const version = requireText(manifest, "version", `${label} plugin`, errors);
    if (version !== undefined) {
      versions.push(version);
      if (!SEMVER.test(version)) {
        errors.push(`${label} plugin version must be strict semver`);
      }
    }
    requireText(manifest, "description", `${label} plugin`, errors);
  }

  if (new Set(versions).size > 1) {
    errors.push("OpenAI and Anthropic plugin versions must match");
  }

  if (Object.keys(openai).length === 0) {
    return;
  }
  if (openai.skills !== "./skills/") {
    errors.push("OpenAI plugin skills path must be `./skills/`");
  }
  if (!isObject(openai.interface)) {
    errors.push("OpenAI plugin interface must be an object");
    return;
  }

  const pluginInterface = openai.interface;
  for (const field of [
    "displayName",
    "shortDescription",
    "longDescription",
    "developerName",
    "category",
  ]) {
    requireText(pluginInterface, field, "OpenAI plugin interface", errors);
  }
  for (const field of ["websiteURL", "privacyPolicyURL", "termsOfServiceURL"]) {
    validateHttpsUrl(pluginInterface[field], `OpenAI plugin interface.${field}`, errors);
  }
  for (const field of ["composerIcon", "logo"]) {
    validateAsset(pluginInterface[field], `OpenAI plugin interface.${field}`, errors);
  }

  const prompts = pluginInterface.defaultPrompt;
  if (
    !Array.isArray(prompts) ||
    prompts.length < 1 ||
    prompts.length > 3 ||
    !prompts.every((prompt) => typeof prompt === "string" && prompt.trim().length > 0)
  ) {
    errors.push("OpenAI defaultPrompt must contain one to three strings");
  } else if (prompts.some((prompt) => prompt.length > 128)) {
    errors.push("OpenAI defaultPrompt entries must be at most 128 characters");
  }
}

function validateEvals(errors) {
  const payload = loadJson(join(ROOT, "evals", "evals.json"), errors);
  if (payload.skill_name !== "vibeco") {
    errors.push("evals/evals.json skill_name must be `vibeco`");
  }

  const cases = payload.evals;
  if (!Array.isArray(cases)) {
    errors.push("evals/evals.json evals must be an array");
    return;
  }

  const identifiers = cases.map((testCase) =>
    isObject(testCase) ? testCase.id : undefined,
  );
  const validIdentifiers = identifiers.filter(
    (identifier) =>
      (typeof identifier === "string" && identifier.length > 0) ||
      (typeof identifier === "number" && Number.isFinite(identifier)),
  );
  if (
    validIdentifiers.length !== cases.length ||
    new Set(validIdentifiers).size !== validIdentifiers.length
  ) {
    errors.push("evaluation IDs must be present and unique");
  }

  const positive = cases.filter(
    (testCase) => isObject(testCase) && testCase.kind === "positive",
  ).length;
  const negative = cases.filter(
    (testCase) => isObject(testCase) && testCase.kind === "negative",
  ).length;
  if (positive < 5) {
    errors.push("at least five positive evaluation cases are required");
  }
  if (negative < 3) {
    errors.push("at least three negative evaluation cases are required");
  }

  for (const testCase of cases) {
    if (!isObject(testCase)) {
      errors.push("evaluation entries must be objects");
      continue;
    }
    for (const field of ["prompt", "expected_output"]) {
      requireText(testCase, field, `evaluation ${String(testCase.id)}`, errors);
    }
  }
}

function listValidationFiles(directory) {
  const skippedDirectories = new Set([".git", "dist", "node_modules"]);
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      return skippedDirectories.has(entry.name) ? [] : listValidationFiles(path);
    }
    return entry.isFile() ? [path] : [];
  });
}

function validateNoPlaceholders(errors) {
  const suffixes = new Set([".json", ".js", ".mjs", ".md", ".yaml", ".yml"]);
  const placeholder = "[" + "TODO:";
  for (const path of listValidationFiles(ROOT).sort()) {
    if (!suffixes.has(extname(path))) {
      continue;
    }
    if (readFileSync(path, "utf8").includes(placeholder)) {
      errors.push(`${displayPath(path)} contains a TODO placeholder`);
    }
  }
}

const errors = [];
validateSkill(errors);
validateManifests(errors);
validateEvals(errors);
validateNoPlaceholders(errors);

if (errors.length > 0) {
  console.error("Distribution validation failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log("Distribution validation passed");
}
