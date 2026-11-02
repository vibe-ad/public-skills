# API and CLI operations

Use this reference for API discovery, basic reads, and safe ad-hoc operations with `vibeco`. For direct REST calls and application code, use the `vibeco-developers-api-client` skill.

## Discover before calling

Start with `https://developers.vibe.co/llms.txt`, then open only the relevant Markdown guide or reference page. For the CLI, use its generated registry rather than memorized commands:

```bash
vibeco --version
vibeco whoami
vibeco operations
vibeco describe <operation-from-the-list>
vibeco schemas <schema-returned-by-describe>
```

The CLI version reports its pinned API revision and sends it on every resource request. Do not run `vibeco --update` unless the user explicitly asks to change versions.

If `vibeco` is not installed, do not install it. Offer `https://github.com/vibe-ad/vibe-cli` and continue with the official REST documentation.

## Authenticate the CLI

Use `vibeco login` only when the user wants an interactive CLI session. It opens a browser and stores credentials locally. Do not inspect, print, copy, or parse the credential file.

Use `vibeco whoami` to verify the cached identity without exposing tokens. Use `vibeco logout` only when the user asks because it changes local authentication state.

## Make calls safely

The CLI call shape is:

```bash
vibeco call <operation> [--path-or-query-param value ...] [--body '<json>'|@file|-]
```

Before forming the command, copy the exact operation name and parameter schema from `operations` and `describe`. Resolve referenced request schemas with `schemas`.

- Run authenticated read-only calls when they are directly requested and the identity is clear.
- For any live write, stop after preparing the exact command and sanitized body. Preview the target and side effect, then obtain confirmation before running it.
- Do not run or provide ready-to-run deletion calls in this skill.
- Successful output is JSON on stdout. CLI failures are structured on stderr with a non-zero exit code; report the safe classification without leaking credentials.

## Capability order

Use this order when orienting a partner, while following the user's actual task:

1. Accounts and advertisers: establish the visible account and advertiser IDs.
2. Audiences: list, upsert, and synchronize targeting data; read [audiences.md](audiences.md).
3. Campaigns, strategies, and creatives: inspect the object hierarchy and implement only requested controls.
4. Reporting: create an asynchronous report, poll no more than the documented frequency, then download the signed result when `READY`.
5. Conversions: resolve the current Conversion API reference and its authentication separately from the Developer Platform resource APIs.
6. Reference data: resolve valid targeting catalogs instead of hard-coding channel, device, geography, demographic, or interest identifiers.
7. Impression tracking: use only if the current documentation index exposes the needed operation and schema; do not infer an endpoint from an older catalog.

For reporting, the current docs describe asynchronous jobs, a maximum request window, terminal `READY` or `FAILED` states, and expiring signed download URLs. Re-fetch `reporting.md`, `createreport.md`, and `getreport.md` before implementing those details.
