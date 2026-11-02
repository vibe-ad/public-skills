---
name: vibeco-developers-api-key-migration
description: Migrate a Vibe integration off the legacy X-API-Key header of the older Vibe Reporting API onto the Developer Platform, which uses Bearer tokens and the X-Vibe-Revision header. Use when a partner's code, config, or docs still send X-API-Key to Vibe, or when they ask how to replace their old Vibe reporting API key. Only the legacy X-API-Key is in scope. The Developer Platform's Client Credentials method, formerly also called "API key", is the replacement, not the thing to migrate. NOT for new integrations (use vibeco-developers).
license: MIT
---

# Migrate off the legacy X-API-Key

Before the Developer Platform, Vibe reporting was called with a per-account key in an `X-API-Key` header. That mechanism is being retired. Move the partner to a Developer Platform app and Bearer tokens without breaking their reporting.

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

## Legacy X-API-Key versus Client Credentials

This skill only concerns the legacy `X-API-Key` header. "API key" in this skill always means that legacy key.

The Developer Platform has its own server-to-server method, which issues a client ID and secret for the OAuth 2.0 Client Credentials grant and returns Bearer tokens. It used to be called "API key" too, and is now called **Client Credentials** to avoid the confusion. Partners, older pages, or the dashboard may still use the former name: when they say "API key", work out from the context which of the two they mean, and ask when it is unclear.

Client Credentials is one of the two methods to migrate to, never something to migrate away from. In explanations, variable names, and code comments, write "legacy `X-API-Key`" for the old key and "Client Credentials" for the new method, never a bare "API key".

## Migrate

1. Read `https://developers.vibe.co/docs/migration-guide-from-api-key.md`. It is the source of truth for the old-to-new mapping and any retirement date.
2. Inventory every place the partner sends `X-API-Key` and every legacy endpoint it calls, without printing the key itself.
3. Get a Developer Platform app: choose OAuth Connection or Client Credentials exactly as for a new app, with `vibeco-developers`.
4. Implement token acquisition with `vibeco-developers-auth`.
5. Replace the legacy calls with the endpoints the migration guide names, sending a Bearer token and a pinned `X-Vibe-Revision`, with `vibeco-developers-api-client`. Map response fields from the guide, and flag any field it leaves unmapped instead of assuming an equivalent.
6. Cover the new calls with mocked tests, then compare one known period's results between the old and new paths in the dedicated test advertiser before switching over.
7. Remove the legacy key from configuration only once the new path is live, and tell the partner to stop using it.

## Handoff

Report the call sites migrated, the app and authentication method chosen, the pinned revision, the fields the guide left unmapped, how the results were compared, and whether the legacy key is still configured anywhere.
