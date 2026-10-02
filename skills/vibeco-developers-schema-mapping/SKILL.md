---
name: vibeco-developers-schema-mapping
description: Map a partner's existing data model onto the Vibe Developer Platform API before writing integration code. Use when a developer shares a data model, database schema, type definitions, connector spec, or sample payload and wants to know how it maps to Vibe advertisers, campaigns, strategies, creatives, audiences, conversions, or report metrics and dimensions; which Vibe fields are required, optional, nullable, or enum-constrained; which of their fields belong to another Vibe entity or have no counterpart; starter code limited to confirmed fields; or one batched list of open schema questions. NOT for advertisers planning campaigns, NOT for OAuth or app setup, and NOT for running an audience sync or pulling a report.
---

# Vibe schema mapping

Help a partner developer see how their data model maps onto Vibe's API before they build against a wrong assumption. Everything about Vibe comes from the live documentation and its OpenAPI definitions. When they are silent, say "Not stated in schema" and turn the gap into a question; never fill it with a plausible guess, general ad-tech knowledge, or what another platform does.

The mapping covers every part of the public API the partner's model touches: what they write (advertisers, campaigns, strategies and their targeting, creatives, audiences, conversions) and what they read (entity read models, report metrics and dimensions).

## Get the partner's model first

Work from what the partner provides: type definitions, ORM models, a database schema, an OpenAPI file, a connector spec, a CSV header, existing integration code, or a sample payload.

The partner side of every mapping must come from that material, because a mapping against an imagined model gives the partner confidence in decisions nobody made. When no model is shared, do not improvise one: no invented partner field names, types, tables, columns, or sample payloads, and no mapping table with hypothetical partner columns. Instead:

- If they ask you to map their model or write code for it, ask for the model in one message, saying which formats work, what they want to do with Vibe, and their language if they want code. Then stop, without fetching docs or drafting anything.
- If they ask a precise question about Vibe's schema, such as whether a field is required, or share something narrower than a model, such as a payload to check or a list of questions, answer from the live schema with sources. Work only with what they shared and do not extend it into a model.
- If they ask what their own type or table should look like to store Vibe data, describe Vibe's response and request shapes field by field under Vibe's names, with the conversions between them. Leave the partner-side naming, extra fields, and storage choices to them, and ask for their model if they want them mapped.

Identify what the partner wants to do with Vibe, because it decides which operations to map: push objects, read them back, edit them, send conversions, or pull reporting.

Treat sample payloads as possibly real customer data. Refer to fields by name, never echo their values, and use synthetic values in examples.

## Resolve the live schema

1. Fetch `https://developers.vibe.co/llms.txt` first, then the `.md` version of every page you rely on. Read `https://developers.vibe.co/docs/api-concepts.md` for the object tree, base URL, authentication, and revision header, and build on that current API only. The legacy `X-API-Key` reporting API is being retired; see `https://developers.vibe.co/docs/migration-guide-from-api-key.md` only to migrate a partner off it.
2. Find the reference pages for each partner concept in the index. Common starting points:

   | Partner concept | Vibe reference pages |
   | --- | --- |
   | Client, brand, account | `createadvertiser-1`, `getadvertiser-1`, `listadvertisers-1` |
   | Campaign | `createcampaign-1`, `updatecampaign-1`, `getcampaign-1` |
   | Ad set, ad group, line item, budget, flight, targeting | `createstrategy-1`, `updatestrategy-1`, `getstrategy-1`, and the targeting catalogs (`listinterestsegments-1`, `listgeolocations-1`, `listchannels-1`...) |
   | Ad, asset, creative | `createvideocreative-1`, `listcreatives-1`, `replacestrategycreatives-1` |
   | Segment, audience, customer list | `createaudience-1`, `createaudiencesync-1`, `docs/hem-format` |
   | Conversion, postback, event | `conversions` and the pages it links |
   | Reporting, insights, performance, cost | `createreport-1`, `getreport-1` |

   Each lives at `https://developers.vibe.co/reference/<page>.md` (docs pages under `/docs/`). If a page has moved, find it again through the index.
3. Flatten each schema with the bundled script rather than reading nested JSON by eye:

   ```bash
   node ${CLAUDE_SKILL_DIR}/scripts/flatten-schema.mjs https://developers.vibe.co/reference/createstrategy-1.md
   node ${CLAUDE_SKILL_DIR}/scripts/flatten-schema.mjs https://developers.vibe.co/reference/createstrategy-1.md StrategyCreate
   ```

   The first command lists the operation, its parameters, and its request and response schemas; the second prints one schema as a field table. If Node.js is unavailable, apply [references/reading-openapi.md](references/reading-openapi.md) to the OpenAPI JSON on the page by hand.
4. If a page you need cannot be fetched, say so, mark what depended on it "Not stated in schema", and add it to the open questions. Never fill it from memory.
5. Record the URL of every page used and the API revision. Read [references/reading-openapi.md](references/reading-openapi.md) before classifying any field.

Map against the **request** schemas for writes and the **response** schemas for reads. They differ: a field can be writable under one name and returned under another, or returned but never writable.

## Keep absent and null apart

On a write, a field is in one of three states: absent (the key is not sent), `null`, or a value. An empty string or empty list is a value. Partners often collapse these states, for example by sending `None` for everything the user left empty, and the result is a payload the schema rejects or an edit that does something different from what the user meant.

- The schema says which states are allowed, field by field: optional means the key may be absent, nullable means `null` is accepted, and neither implies the other ([references/reading-openapi.md](references/reading-openapi.md)). State both for every request field in the mapping table.
- What the server *does* with each state is behavior, not schema. Examples: whether an absent field keeps its current value on update, whether `null` clears it, and how an invalid `null` is rejected. Each is "Not stated in schema" unless a page says so. Do not predict an outcome or an error code, even with a hedge ("expect a 400"), and do not state "omitting keeps the current value" as a fact.
- Check how the partner's model tells "not edited" apart from "cleared by the user". If one value such as `None` means both, the code cannot tell them apart. Say so, and ask the partner how to distinguish them.
- Clearing a field that is not nullable, with no page documenting how to clear it, is an open question for Vibe, asked per field.

## Place each partner field on the right entity

A partner field that sits on the wrong Vibe entity costs the most when found late, so place every field before mapping it, using the object tree from the API concepts page. Partner hierarchies rarely match Vibe's one to one:

- A partner field with no counterpart on the entity you expected may live on another one. Look for it on the other entities' reference pages before calling it unmatched.
- A field one entity returns but does not accept, for example one whose description says it is derived from strategies, is owned by another entity: map the partner field to that entity's request field.
- A partner object with no Vibe entity of its own, such as an ad that pairs one asset with one ad set, maps to the combination of Vibe identifiers that represents it on writes and in reports. Say so explicitly.
- Configuration that the public docs index does not cover is "Not stated in schema", not a reason to describe how it probably works.

## Produce the mapping table

The main output is one mapping table, built with [references/report-template.md](references/report-template.md). Whenever the partner shares a model, put the table first, before any prose, and never replace it with lists. Its columns, in this order:

1. **Vibe field:** `<Entity> > <Field label>` with the API path in backticks, for example Strategy > Start date (`starts_at`) or Report > Metric > Spend (`spend`).
2. **Partner field:** the field in the partner's model that feeds it or receives it, or `—`.
3. **Transformation:** the rule that turns one into the other.
4. **Vibe rules:** presence, type, nullability, enum or constraints, and default, taken from the schema. Write each element the schema is silent about as "Not stated in schema", word for word, rather than "—", "no enum", or "not defined": the partner and any reviewer search for that exact phrase.
5. **Status:** Confirmed, Blocked, Open (Q<n>), Not used, or No counterpart.
6. **Notes.**

Group the rows by Vibe entity. The table holds every field of the main create schema of each entity the partner writes, every required field of any other entity a partner field lands on, every report metric and dimension the partner consumes, and every partner field, including those with no Vibe counterpart (`—` in the first column).

Map enum values explicitly, in a value-mapping table under the main one. A partner value with no exact Vibe counterpart is an open question or a partner decision, not a nearest match. Never map by similarity of names alone: state the rule that makes each mapping true.

After the table, add the read and update differences when the partner reads back or edits, then one batched, copy-paste-ready list of open questions.

## Map reporting metrics and dimensions

When the partner pulls performance, cost, or delivery data, map their reporting model onto the report request schema of `createreport-1`:

- Map each partner metric to a value of the `metrics` enum and each partner dimension or breakdown to a value of the `dimensions` enum, as `Report > Metric > <label>` and `Report > Dimension > <label>` rows. A partner metric or dimension with no enum value has no counterpart.
- Do not infer a metric's definition, unit, currency, formula, or additivity from its name. Each is "Not stated in schema" unless the page states it. Ratios such as CPM or ROAS can only be recomputed at another grain from additive bases that the report provides.
- List the documented metrics and dimensions the partner has no field for, so they can decide whether to add them.
- When the partner computes a metric that Vibe also reports under a similar name, such as ROAS, CPI, or conversions, explain why the two can differ using only documented parameters: attribution window, time zone, grain, or what the metric counts. Tell them which one to use for what instead of only advising against Vibe's.
- Compare the partner's reporting settings with the report parameters: a time zone outside the `timezone` enum, an attribution window different from the default `attribution_window`, a granularity, or a filter the `filters` enum does not support. Choose an accepted value and state what the partner must convert, such as re-bucketing days into their own time zone.
- Take the asynchronous flow, polling interval, date-range rules, and rate limits from the report pages, and size the partner's sync schedule and backfill against them.

When the partner sends conversions, map their events and payload onto the conversion pages the same way, and relay the documented warnings, such as using one measurement source per advertiser.

## Write starter code from confirmed fields only

Only when the partner wants code, and after the mapping table:

- Write in the language the partner states, or the language of the existing code they share, and follow that code's conventions: its interfaces, HTTP client, secret loading, retries, logging, errors, constants, and placeholder markers. Do not assume a language from the format of a data model alone. If the language is not stated and no code is shared, either ask before writing code or give clearly labeled language-neutral pseudocode, and put the language question first in the open questions.
- Never invent the partner's internal interfaces, SDK classes, package layout, or helpers. Use only what they showed or described.
- Include only fields whose mapping is fully resolved. Represent every unresolved field as a clearly marked placeholder that fails loudly, such as a thrown error or a TODO in the project's own style naming the open question ID. Never substitute a default the schema does not state, and never fabricate a value for a required field.
- Do not carry over logic from another platform's integration that has no counterpart in Vibe.
- Build each request body from the fields the partner actually set, and leave unset fields out instead of sending `null`. A field that is merely absent stays absent: it is not a request to clear it, and must never block the call.
- Send `null` only when the schema marks the field nullable and the partner means to clear it. When the partner means to clear a field that is not nullable and has no documented way to be cleared, fail loudly for that case only, naming the open question. Do not send `null`, and do not silently drop the field in its place either, since what omission does is not stated.
- Validate enum values and stated constraints before sending, using the values from the schema.
- Keep credentials out of the code, take the base URL and authentication from the docs, and pin the revision in a constant. Hard-code only values, field names, enums, headers, and endpoints that a fetched page or the partner's material states.
- Do not make live API calls. Creating or updating Vibe objects is a write that needs the partner's explicit confirmation and is outside this skill.

## Keep the open questions honest

Before adding a question, check the schema and the reference page once more. A question the docs answer is a fact to state, with its source, not a question. Keep only:

- Behavior the schema does not define, such as whether `null` clears a field on update, what applies when an optional field without a default is omitted, which combinations of related enum values are accepted, or how a metric is defined.
- Contradictions between pages, or between the schema and the prose.
- Business rules and decisions that depend on the partner's product, such as how to split one budget across several strategies or which event counts as their primary conversion.

End with one numbered block, never questions scattered through the answer. Address each question to the party who can answer it: Vibe, the partner, or the partner's own customer when the decision is theirs, such as which of an advertiser's events counts as a purchase. Write each so that it can be answered without reading the rest of the answer: the field and operation, what the docs say with the source, the exact question, and what the partner's code does until it is answered.

## Finish with a handoff

Report the pages and revision used, the counts of confirmed, blocked, open, and unmatched rows in the mapping table, the open questions list, and whether starter code was written and which placeholders remain. Suggest the partner sends the questions for Vibe in a single message.
