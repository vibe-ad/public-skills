#!/usr/bin/env node

// Flattens one schema from a Vibe API reference page into a field table.
// Every cell comes from the OpenAPI definition; nothing is inferred.

import { readFileSync } from "node:fs";

const USAGE = `Usage: node flatten-schema.mjs <reference-url-or-file> [schema-name]

  <reference-url-or-file>  A developers.vibe.co/reference/<page>.md URL, or a
                           local .md or .json file containing the OpenAPI JSON.
  [schema-name]            A component schema, e.g. CampaignCreate. Omit it to
                           list the operation and its request and response schemas.`;

const NOT_STATED = "Not stated in schema";

async function loadDefinition(source) {
  const text = /^https?:\/\//.test(source)
    ? await fetch(source, { signal: AbortSignal.timeout(20_000) }).then((response) => {
        if (!response.ok) {
          throw new Error(`${source} returned HTTP ${response.status}`);
        }
        return response.text();
      })
    : readFileSync(source, "utf8");

  const fenced = text.match(/```json\n([\s\S]*?)\n```/);
  const definition = JSON.parse(fenced ? fenced[1] : text);
  if (!definition.openapi) {
    throw new Error("no OpenAPI definition found in the source");
  }
  return definition;
}

function pageHeader(source, definition) {
  return [
    `Source: ${source}`,
    `API version (info.version): ${definition.info?.version ?? NOT_STATED}`,
    `OpenAPI: ${definition.openapi}`,
  ].join("\n");
}

function resolveRef(definition, ref) {
  const path = ref.replace(/^#\//, "").split("/");
  const target = path.reduce((node, key) => node?.[key], definition);
  if (target === undefined) {
    throw new Error(`unresolved $ref ${ref}`);
  }
  return { schema: target, name: path.at(-1) };
}

// A property wrapped as { allOf: [{ $ref }] } plus siblings such as nullable
// or default is one schema: merge the siblings over the referenced schema.
function unwrap(definition, schema) {
  let current = schema;
  let refName;
  const siblings = {};
  for (let depth = 0; depth < 10; depth += 1) {
    const { $ref, allOf, ...rest } = current;
    Object.assign(siblings, rest);
    if ($ref) {
      const resolved = resolveRef(definition, $ref);
      refName ??= resolved.name;
      current = resolved.schema;
    } else if (Array.isArray(allOf) && allOf.length === 1) {
      current = allOf[0];
    } else {
      return { schema: { ...current, ...siblings }, refName };
    }
  }
  throw new Error("schema nesting is too deep");
}

function typeOf(schema) {
  const types = [schema.type].flat().filter((type) => type && type !== "null");
  if (schema.oneOf || schema.anyOf || (schema.allOf && schema.allOf.length > 1)) {
    return `composite (${schema.oneOf ? "oneOf" : schema.anyOf ? "anyOf" : "allOf"}) — read the definition`;
  }
  return types.join(" | ") || NOT_STATED;
}

// OpenAPI makes a field non-nullable unless it says otherwise: `nullable: true`
// in 3.0, or "null" among the types in 3.1.
function nullable(schema) {
  if (schema.nullable === true || [schema.type].flat().includes("null")) {
    return "yes";
  }
  return schema.nullable === false ? "no" : "no (OpenAPI default)";
}

function constraints(schema) {
  const keys = [
    "format",
    "minLength",
    "maxLength",
    "minimum",
    "maximum",
    "exclusiveMinimum",
    "exclusiveMaximum",
    "pattern",
    "minItems",
    "maxItems",
    "uniqueItems",
  ];
  const stated = keys.filter((key) => schema[key] !== undefined).map((key) => `${key}: ${schema[key]}`);
  if (schema.readOnly) stated.push("readOnly");
  if (schema.writeOnly) stated.push("writeOnly");
  return stated.join(", ") || "—";
}

function cell(value) {
  return String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
}

function flatten(definition, schema, prefix, rows, seen) {
  const { schema: object, refName } = unwrap(definition, schema);
  if (refName && seen.has(refName)) {
    return;
  }
  const nextSeen = refName ? new Set([...seen, refName]) : seen;
  const required = new Set(object.required ?? []);

  for (const [name, raw] of Object.entries(object.properties ?? {})) {
    const { schema: field, refName: fieldRef } = unwrap(definition, raw);
    const path = prefix ? `${prefix}.${name}` : name;
    const isArray = [field.type].flat().includes("array");
    const items = isArray && field.items ? unwrap(definition, field.items).schema : undefined;
    const enumValues = field.enum ?? items?.enum;

    rows.push([
      path,
      isArray ? `array of ${items ? typeOf(items) : NOT_STATED}` : typeOf(field),
      required.has(name) ? "required" : "optional",
      nullable(field),
      enumValues ? enumValues.join(", ") : "—",
      constraints(field),
      field.default === undefined ? NOT_STATED : JSON.stringify(field.default),
      fieldRef ?? "—",
      field.description ?? "—",
    ]);

    if (field.properties) {
      flatten(definition, field, path, rows, nextSeen);
    } else if (items?.properties) {
      flatten(definition, items, `${path}[]`, rows, nextSeen);
    }
  }
  if (object.additionalProperties !== undefined) {
    rows.push([
      prefix ? `${prefix}.*` : "*",
      "additionalProperties",
      "—",
      "—",
      "—",
      JSON.stringify(object.additionalProperties),
      "—",
      "—",
      "Extra keys: see additionalProperties",
    ]);
  }
}

function describeOperations(definition) {
  const lines = [];
  for (const [path, methods] of Object.entries(definition.paths ?? {})) {
    for (const [method, operation] of Object.entries(methods)) {
      lines.push(`${method.toUpperCase()} ${path} — operationId: ${operation.operationId ?? NOT_STATED}`);
      for (const parameter of operation.parameters ?? []) {
        lines.push(
          `  parameter ${parameter.in}.${parameter.name}: ${parameter.required ? "required" : "optional"}` +
            (parameter.description ? ` — ${parameter.description}` : ""),
        );
      }
      const body = operation.requestBody?.content?.["application/json"]?.schema;
      if (body) {
        const name = body.$ref ? body.$ref.split("/").at(-1) : "inline";
        lines.push(`  request body (${operation.requestBody.required ? "required" : "optional"}): ${name}`);
      }
      for (const [status, response] of Object.entries(operation.responses ?? {})) {
        const schema = response.content?.["application/json"]?.schema;
        const name = schema?.$ref ? schema.$ref.split("/").at(-1) : schema ? "inline" : "no body";
        lines.push(`  response ${status}: ${name}`);
      }
    }
  }
  lines.push("", `component schemas: ${Object.keys(definition.components?.schemas ?? {}).join(", ")}`);
  return lines.join("\n");
}

const [source, schemaName] = process.argv.slice(2);
if (!source || source === "--help") {
  console.log(USAGE);
  process.exit(source ? 0 : 1);
}

try {
  const definition = await loadDefinition(source);
  if (!schemaName) {
    console.log(`${pageHeader(source, definition)}\n`);
    console.log(describeOperations(definition));
  } else {
    const schema = definition.components?.schemas?.[schemaName];
    if (!schema) {
      throw new Error(`schema ${schemaName} not found`);
    }
    const header = ["field", "type", "presence", "nullable", "enum", "constraints", "default", "ref", "description"];
    const rows = [];
    flatten(definition, schema, "", rows, new Set());
    console.log(`${pageHeader(source, definition)}\nSchema: ${schemaName}\n`);
    console.log(`| ${header.join(" | ")} |\n| ${header.map(() => "---").join(" | ")} |`);
    for (const row of rows) {
      console.log(`| ${row.map(cell).join(" | ")} |`);
    }
  }
} catch (error) {
  console.error(`flatten-schema: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
