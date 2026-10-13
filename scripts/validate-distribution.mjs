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
const SKILLS_ROOT = join(ROOT, "skills");
const EVALS_ROOT = join(ROOT, "evals");
const PRIMARY_SKILL = "vibeco-developers";
const MAX_DESCRIPTION_LENGTH = 1024;
const PLUGIN_NAME = "vibeco";
const MARKETPLACE_NAME = "vibe-co";
const LICENSE_ID = "MIT";
const REPOSITORY_GIT_URL = "https://github.com/vibe-ad/public-skills.git";
const CODEX_INSTALLATION_POLICIES = new Set(["AVAILABLE", "INSTALLED_BY_DEFAULT", "NOT_AVAILABLE"]);
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const SKILL_NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;
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

function listSkillNames() {
  return readdirSync(SKILLS_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function validateSkill(name, errors) {
  const skillRoot = join(SKILLS_ROOT, name);
  const label = `skills/${name}/SKILL.md`;
  const path = join(skillRoot, "SKILL.md");
  if (!existsSync(path)) {
    errors.push(`missing ${label}`);
    return;
  }

  const text = readFileSync(path, "utf8");
  if (!text.startsWith("---\n")) {
    errors.push(`${label} must start with YAML frontmatter`);
    return;
  }

  const end = text.indexOf("\n---", 4);
  if (end === -1) {
    errors.push(`${label} frontmatter is not closed`);
    return;
  }

  let frontmatter;
  try {
    frontmatter = parseYaml(text.slice(4, end));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`${label} frontmatter is invalid: ${message}`);
    return;
  }
  if (!isObject(frontmatter)) {
    errors.push(`${label} frontmatter must be an object`);
    return;
  }
  if (!SKILL_NAME.test(name)) {
    errors.push(`skills/${name} must be a lowercase kebab-case name`);
  }
  if (frontmatter.name !== name) {
    errors.push(`${label} name must be \`${name}\`, matching its directory`);
  }
  const description = requireText(frontmatter, "description", label, errors);
  if (description !== undefined && description.length > MAX_DESCRIPTION_LENGTH) {
    errors.push(`${label} description must be at most ${MAX_DESCRIPTION_LENGTH} characters`);
  }
  if (frontmatter.license !== LICENSE_ID) {
    errors.push(`${label} license must be \`${LICENSE_ID}\``);
  }

  for (const match of text.matchAll(REFERENCE_LINK)) {
    const reference = match[1];
    if (reference !== undefined && !existsSync(join(skillRoot, reference))) {
      errors.push(`${label} references missing file: ${reference}`);
    }
  }
}

function validateSkills(errors) {
  const names = listSkillNames();
  if (!names.includes(PRIMARY_SKILL)) {
    errors.push(`missing skills/${PRIMARY_SKILL}`);
  }
  for (const name of names) {
    validateSkill(name, errors);
  }
  return names;
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

function validateLicense(errors) {
  const path = join(ROOT, "LICENSE");
  if (!existsSync(path)) {
    errors.push("missing LICENSE");
  } else if (!readFileSync(path, "utf8").startsWith(`${LICENSE_ID} License`)) {
    errors.push(`LICENSE must contain the ${LICENSE_ID} License text`);
  }

  for (const [label, directory] of [
    ["OpenAI", ".codex-plugin"],
    ["Anthropic", ".claude-plugin"],
  ]) {
    const manifest = loadJson(join(ROOT, directory, "plugin.json"), errors);
    if (manifest.license !== LICENSE_ID) {
      errors.push(`${label} plugin license must be \`${LICENSE_ID}\``);
    }
  }
}

// The Claude entry points at the repository root, so .claude-plugin/plugin.json
// stays the only place that declares the plugin version.
function validateClaudeMarketplace(errors) {
  const label = "Anthropic marketplace";
  const marketplace = loadJson(join(ROOT, ".claude-plugin", "marketplace.json"), errors);
  if (Object.keys(marketplace).length === 0) {
    return;
  }
  if (marketplace.name !== MARKETPLACE_NAME) {
    errors.push(`${label} name must be \`${MARKETPLACE_NAME}\``);
  }
  if (!isObject(marketplace.owner)) {
    errors.push(`${label} owner must be an object`);
  } else {
    requireText(marketplace.owner, "name", `${label} owner`, errors);
  }

  const entries = Array.isArray(marketplace.plugins) ? marketplace.plugins : [];
  if (entries.length !== 1 || !isObject(entries[0])) {
    errors.push(`${label} must list exactly one plugin entry`);
    return;
  }
  const [entry] = entries;
  if (entry.name !== PLUGIN_NAME) {
    errors.push(`${label} plugin name must be \`${PLUGIN_NAME}\``);
  }
  if (entry.source !== "./") {
    errors.push(`${label} plugin source must be \`./\``);
  }
  if ("version" in entry) {
    errors.push(`${label} plugin entry must not declare a version`);
  }
  requireText(entry, "description", `${label} plugin`, errors);
}

function validateCodexMarketplace(errors) {
  const label = "OpenAI marketplace";
  const marketplace = loadJson(join(ROOT, ".agents", "plugins", "marketplace.json"), errors);
  if (Object.keys(marketplace).length === 0) {
    return;
  }
  if (marketplace.name !== MARKETPLACE_NAME) {
    errors.push(`${label} name must be \`${MARKETPLACE_NAME}\``);
  }
  if (!isObject(marketplace.interface)) {
    errors.push(`${label} interface must be an object`);
  } else {
    requireText(marketplace.interface, "displayName", `${label} interface`, errors);
  }

  const entries = Array.isArray(marketplace.plugins) ? marketplace.plugins : [];
  if (entries.length !== 1 || !isObject(entries[0])) {
    errors.push(`${label} must list exactly one plugin entry`);
    return;
  }
  const [entry] = entries;
  if (entry.name !== PLUGIN_NAME) {
    errors.push(`${label} plugin name must be \`${PLUGIN_NAME}\``);
  }
  if (
    !isObject(entry.source) ||
    entry.source.source !== "url" ||
    entry.source.url !== REPOSITORY_GIT_URL
  ) {
    errors.push(`${label} plugin source must be the URL \`${REPOSITORY_GIT_URL}\``);
  }
  if (!isObject(entry.policy) || !CODEX_INSTALLATION_POLICIES.has(entry.policy.installation)) {
    errors.push(`${label} plugin policy.installation must be a known Codex policy`);
  }
  requireText(entry, "category", `${label} plugin`, errors);
}

function validateEvals(skillNames, errors) {
  const expectedFiles = new Map(skillNames.map((name) => [`${name}.json`, name]));
  const actualFiles = readdirSync(EVALS_ROOT).filter((file) => extname(file) === ".json");
  for (const file of actualFiles) {
    if (!expectedFiles.has(file)) {
      errors.push(`evals/${file} does not belong to any skill`);
    }
  }
  for (const [file, skillName] of expectedFiles) {
    validateEvalsFile(file, skillName, errors);
  }
}

function validateEvalsFile(file, skillName, errors) {
  const label = `evals/${file}`;
  const payload = loadJson(join(EVALS_ROOT, file), errors);
  if (payload.skill_name !== skillName) {
    errors.push(`${label} skill_name must be \`${skillName}\``);
  }

  const cases = payload.evals;
  if (!Array.isArray(cases)) {
    errors.push(`${label} evals must be an array`);
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
    errors.push(`${label} evaluation IDs must be present and unique`);
  }

  const positive = cases.filter(
    (testCase) => isObject(testCase) && testCase.kind === "positive",
  ).length;
  const negative = cases.filter(
    (testCase) => isObject(testCase) && testCase.kind === "negative",
  ).length;
  if (positive < 5) {
    errors.push(`${label} needs at least five positive evaluation cases`);
  }
  if (negative < 3) {
    errors.push(`${label} needs at least three negative evaluation cases`);
  }

  for (const testCase of cases) {
    if (!isObject(testCase)) {
      errors.push(`${label} evaluation entries must be objects`);
      continue;
    }
    const caseLabel = `${label} evaluation ${String(testCase.id)}`;
    for (const field of ["prompt", "expected_output"]) {
      requireText(testCase, field, caseLabel, errors);
    }
    for (const fixture of testCase.files ?? []) {
      if (typeof fixture !== "string" || !existsSync(join(EVALS_ROOT, fixture))) {
        errors.push(`${caseLabel} lists a missing file: ${String(fixture)}`);
      }
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
const skillNames = validateSkills(errors);
validateManifests(errors);
validateLicense(errors);
validateClaudeMarketplace(errors);
validateCodexMarketplace(errors);
validateEvals(skillNames, errors);
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
