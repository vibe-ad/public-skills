---
name: vibeco-developers-api-client
description: Write application code against the Vibe Developer Platform REST API. Use when building or changing a Vibe API client in a partner's codebase, showing a portable cURL request, pinning the X-Vibe-Revision header, handling pagination or Vibe error envelopes, or migrating an integration to a newer published API revision. NOT for obtaining or refreshing tokens (use vibeco-developers-auth), NOT for running operations now from the terminal (use vibeco-developers-cli), and NOT for the legacy X-API-Key header (use vibeco-developers-api-key-migration).
license: MIT
---

# Vibe API client

Call Vibe's resource endpoints from a partner's code with a pinned revision and safe error handling. Tokens come from the code built with `vibeco-developers-auth`.

<!-- shared-guardrails:start -->

## Guardrails

These rules are shared by every Vibe developer skill and take precedence over the rest of this file.

- **Live documentation over memory.** Fetch `https://developers.vibe.co/llms.txt` first, then the `.md` version of each page you rely on. Never guess operation IDs, request bodies, enum values, scopes, limits, or response shapes. When the docs are silent or carry an unresolved note, say so instead of filling the gap.
- **No secrets in the conversation.** Never ask the user to paste, and never print, log, commit, or screenshot, a client secret, access token, refresh token, authorization code, or CLI credential file. Use environment-variable placeholders in examples and keep token exchanges server-side.
- **Preview before every live write.** Authenticated reads may run when requested. Before any action that creates, changes, or submits something in Vibe, including creating an app, regenerating its secret, or submitting it for review, show the target account and advertiser, the operation, the request body without secrets, and the expected side effect, then wait for explicit confirmation. Code changes that implement a requested integration are not live writes.
- **No deletion.** Do not run or provide a ready-to-run delete call, even when the API exposes one. Explain the boundary and point to the official documentation.
- **Production only, isolated test data.** Use `https://api.vibe.co`. Test in a dedicated, clearly labeled advertiser of the partner's own account, never with customer data.
- **Partner data is sensitive.** Do not echo audience identifiers, sample payload values, or signed URLs. Refer to fields by name and use synthetic values in examples.
<!-- shared-guardrails:end -->

## Read the live contract

Read `https://developers.vibe.co/docs/api-concepts.md` and `https://developers.vibe.co/docs/api-versioning.md`, then the reference page of each operation the code calls, for its method, path, parameters, body, response, and required scope.

## Pin a revision

Every resource request sends `Authorization: Bearer <token>` and an explicit `X-Vibe-Revision`. Never derive a production revision from `latest`. Keep the project's existing pinned revision unless the user asks for a migration, and treat it as configuration, not a secret.

To migrate, read `https://developers.vibe.co/changelog` for the breaking changes between the current and target revisions instead of relying on a remembered history. Update the code and its mocked tests together, and make no live call.

## Show the wire contract

When no language or HTTP client has been chosen, show the request with cURL as a portable example, not as something application code should shell out to:

```bash
curl --request GET "https://api.vibe.co/<documented-resource-path>" \
  --header "Authorization: Bearer $VIBE_ACCESS_TOKEN" \
  --header "X-Vibe-Revision: $VIBE_API_REVISION"
```

Requests with a JSON body add `Content-Type: application/json`; prefer `--data @request.json` over inline data. Never use `-v`, shell tracing, or copied request dumps around credentials.

OAuth endpoints, presigned storage uploads, and any endpoint whose page specifies other authentication do not get the Bearer or revision headers.

## Fit the existing codebase

Inspect the project's runtime, HTTP client, configuration, logger, error model, and test tools, and translate the contract into them. Keep the domain logic (audiences, campaigns) separate from the client and unaware of token storage.

Commit only an example environment file with placeholders, such as `VIBE_API_REVISION=<published-revision>`, and ignore the real one.

## Pagination and errors

Use the pagination each list endpoint documents, and only as much as the task needs.

Resource errors use Vibe's nested envelope, documented with the API concepts. Capture the HTTP status and `error.type`, and keep `error.request_id` through any wrapping so it can be sent to Vibe. Treat `401` as missing, invalid, or expired authentication and `403` as a missing scope. Never log the Authorization header or sensitive request bodies.

## Tests

With mocked HTTP, verify that every request sends the pinned revision and the right installation's token, that the error envelope is parsed and `request_id` survives, that logs and snapshots contain no secrets or signed URLs, and that write paths run without touching Vibe production.

## Handoff

Report the pinned revision and where it is configured, the operations the client calls with their scopes, the tests that passed, and any documentation uncertainty.
