---
name: vibeco-developers-cli
description: Run Vibe Developer Platform operations now with the vibeco CLI. Use when the agent must list, read, or change Vibe data on the user's behalf from the terminal, discover which operations and schemas exist, or when vibeco is missing, outdated, or not logged in. Other Vibe developer skills rely on it before any ad-hoc operation. NOT for application code that calls the API (use vibeco-developers-api-client), and NOT for advertisers planning campaigns.
license: MIT
---

# vibeco CLI

Use the installed `vibeco` CLI to discover and run Vibe API operations safely, without memorized commands.

<!-- shared-guardrails:start -->

## Guardrails

These rules are shared by every Vibe developer skill and take precedence over the rest of this file.

- **Live documentation over memory.** Fetch `https://developers.vibe.co/llms.txt` first, then the `.md` version of each page you rely on. Never guess operation IDs, request bodies, enum values, scopes, limits, or response shapes. When the docs are silent or carry an unresolved note, say so instead of filling the gap.
- **No secrets in the conversation.** Never ask the user to paste, and never print, log, commit, or screenshot, a client secret, access token, refresh token, authorization code, or CLI credential file. Use environment-variable placeholders in examples and keep token exchanges server-side.
- **Preview before every live write.** Authenticated reads may run when requested. Before any action that creates, changes, or submits something in Vibe, including creating an app, regenerating its secret, or submitting it for review, show the target account and advertiser, the operation, the request body without secrets, and the expected side effect, then wait for explicit confirmation. Code changes that implement a requested integration are not live writes.
- **No deletion.** Do not run or provide a ready-to-run delete call, even when the API exposes one. Explain the boundary and point to the official documentation.
- **Production only, isolated test data.** Use `https://api.vibe.co`. Test in a dedicated, clearly labeled advertiser of the partner's own account, never with customer data.
- **Partner data is sensitive.** Do not echo audience identifiers, sample payload values, report downloads, or signed URLs. Refer to fields by name and use synthetic values in examples.
<!-- shared-guardrails:end -->

## Check the CLI first

```bash
vibeco --version
vibeco whoami
```

- If `vibeco` is not installed, do not install it. Link to `https://github.com/vibe-ad/vibe-cli`, let the user decide, and fall back to the REST documentation meanwhile.
- `--version` reports the API revision the CLI pins and sends on every request. Do not run `vibeco --update` unless the user asks to change versions.
- If `whoami` shows no identity, run `vibeco login` only when the user wants an interactive session: it opens a browser and stores credentials locally. Never inspect, print, copy, or parse the credential file. Run `vibeco logout` only on request.

## Discover, then call

Copy operation names and parameters from the CLI's own registry rather than guessing them:

```bash
vibeco operations
vibeco describe <operation-from-the-list>
vibeco schemas <schema-returned-by-describe>
vibeco call <operation> [--path-or-query-param value ...] [--body '<json>'|@file|-]
```

- Run read-only calls when they are requested and the identity is clear.
- For a write, stop after preparing the exact command and sanitized body, and apply the preview rule above.
- Success is JSON on stdout. Failures are structured on stderr with a non-zero exit code: report the status, the safe error classification, and the `request_id`, never credentials.

## Handoff

Report the CLI version and pinned revision, the identity used, the operations run, and any write that is still waiting for confirmation.
