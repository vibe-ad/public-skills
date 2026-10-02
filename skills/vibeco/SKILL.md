---
name: vibeco
description: Build and operate partner integrations for the Vibe Developer Platform. Use when an engineer needs to choose, create, or configure a Vibe.co app, implement OAuth, call the API or vibeco CLI, or add Vibe support to an application. Do not use for ordinary campaign advice or Vibe UI tasks unrelated to the Developer Platform.
---

# Vibe Developer Platform

Help partner engineers set up apps, explore the API, perform operations, and implement Vibe integrations.

## Route the request

Read only the references needed for the current task:

- For choosing between OAuth and API key authentication, or for migrating from a legacy `X-API-Key`, read [references/choosing-an-app.md](references/choosing-an-app.md).
- For getting a Vibe account, creating or configuring an app, OAuth or Client Credentials, or scopes, read [references/app-setup.md](references/app-setup.md). Read it first whenever the partner has no Vibe account or app yet, before any API work.
- For API discovery, `vibeco` usage, direct REST calls, or basic data retrieval, read [references/api-and-cli.md](references/api-and-cli.md).
- For creating, populating, checking, or cancelling audience syncs, read [references/audiences.md](references/audiences.md).
- For adding Vibe to a partner codebase, read [references/integration-patterns.md](references/integration-patterns.md).

Combine references only when the request genuinely spans those workflows.

To map a partner's existing data model onto Vibe entities before coding, with a field-by-field table and batched open questions, use the `vibeco-developers-schema-mapping` skill.

## Resolve the live contract

Treat Vibe's live documentation and OpenAPI schema as the source of truth because endpoints and revisions evolve.

1. Fetch `https://developers.vibe.co/llms.txt` and select the relevant official page.
2. Fetch the Markdown form linked by that index. A documentation page can also be read by appending `.md` to its URL.
3. For CLI work, inspect the installed CLI with `vibeco --version`, `vibeco operations`, `vibeco describe <operation>`, and `vibeco schemas <schema>` before forming a call.
4. Pin a published API revision. Never derive a production revision from `latest`; preserve the project's existing pinned revision unless the user requests a migration. The published revisions and the breaking changes in each are listed at `https://developers.vibe.co/changelog`; read it before a revision migration instead of relying on a remembered history.

Do not guess operation IDs, request bodies, enum values, scopes, limits, or response shapes. If the official docs contain a placeholder or unresolved verification note, surface that uncertainty instead of presenting it as settled behavior.

## Choose the execution surface

Use the surface that best matches the task:

1. If callable Vibe MCP tools are actually available, inspect their schemas and use them for the supported semantic operations. Do not assume a server name or tool shape.
2. Use `vibeco` for authentication, discovery, and authenticated ad-hoc operations when it is already installed.
3. Use cURL for language-neutral REST examples, request validation, and ad-hoc calls when the CLI is unavailable or unsuitable.
4. When implementing inside an existing codebase, translate the same HTTP contract into its established HTTP client. Provide TypeScript examples only when the project uses TypeScript/Node or they materially clarify the implementation.
5. Use an authenticated browser session for Developer tool setup when browser control is available and the user wants it. Otherwise provide the direct dashboard link `https://vibe.co/dashboard/settings/my-applications` and the documentation links.

Do not install or update `vibeco` automatically. If it is absent, link to `https://github.com/vibe-ad/vibe-cli` and let the user choose whether to install it.

## Respect authorization boundaries

- Existing authenticated read-only operations may run without an additional confirmation.
- Before a live write, show the resolved production target, operation or endpoint, relevant account and advertiser, request body with secrets removed, and expected side effect. Ask for explicit confirmation immediately before execution.
- Creating an app and regenerating its secret are live writes and follow the same preview rule. Never sign up or accept developer terms on the user's behalf.
- Code edits that implement a requested integration are not live API writes; implement and test them normally.
- Deletion is outside this skill. Do not execute or provide a ready-to-run delete command, even if the API exposes one. Explain the boundary and point to the official documentation when useful.
- Use production `https://api.vibe.co` only. Keep test data isolated in a dedicated advertiser within the user's real account.

## Protect credentials and partner data

- Never ask the user to paste a client secret, access token, refresh token, authorization code, or CLI credential file into chat.
- Never print, screenshot, log, commit, or place secrets in generated examples. Use environment-variable placeholders and add real environment files to ignore rules.
- Keep client secrets and token exchanges server-side.
- Store refresh tokens encrypted and replace the stored value atomically after every successful refresh.
- Treat audience identifiers and report downloads as sensitive partner data. Avoid echoing raw identifiers and remove temporary exports when they are no longer needed.

## Work in an existing codebase

Inspect the repository's language, HTTP client, configuration, secret management, logging, and test conventions before editing. Reuse those patterns instead of introducing an unrelated framework or dependency.

Implement only the requested capabilities. Validate observable behavior with unit tests or mocked HTTP responses before suggesting a live call. Keep live credentials out of automated tests.

## Finish with a useful handoff

Report:

- What was configured, queried, or implemented.
- The app's authentication method, the pinned API revision, and requested scopes.
- Any manual dashboard, secret-storage, or consent steps that remain.
- Validation performed and any official-doc uncertainty.
- For API failures, the status, safe error classification, and `request_id`; never include tokens or raw sensitive payloads.
