---
name: vibeco-developers-auth
description: Implement Vibe Developer Platform authentication in a partner's code. Use when writing or debugging an OAuth Connection (Authorization Code flow with PKCE), the Client Credentials grant, token storage, refresh-token rotation, per-customer Client Credentials entered in the partner's product, mapping each Vibe authorization to the right tenant, or tests for any of these. NOT for creating or configuring the app in the Vibe dashboard (use vibeco-developers-app-setup), NOT for the legacy X-API-Key header (use vibeco-developers-api-key-migration), and NOT for calling resource endpoints once a token exists (use vibeco-developers-api-client).
license: MIT
---

# Vibe authentication in code

Implement how a partner's backend obtains, stores, and renews Vibe access tokens. The app must already exist; if it does not, or its authentication method is undecided, use `vibeco-developers-app-setup` first.

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

## Read the live pages

Resolve these through the index before writing code; they win over this file if details change:

- `https://developers.vibe.co/docs/start-your-oauth-flow.md`
- `https://developers.vibe.co/docs/start-your-client-credentials-flow.md`
- `https://developers.vibe.co/docs/universal-authorization.md`

## Fit the existing codebase

Inspect the runtime, HTTP client, configuration and secret loading, tenant or installation model, database transactions and encryption, logger, and test tools before editing. Reuse them, and add a dependency only when the stack cannot express the behavior.

Keep these concerns separate, whatever the project calls them:

1. **OAuth controller:** starts consent, binds state and the PKCE verifier to the initiating session, validates the callback, handles consent errors. Client Credentials integrations have none.
2. **Token service:** exchanges codes or requests Client Credentials tokens, encrypts tokens at rest, refreshes server-side, persists rotated refresh tokens atomically.
3. **Installation mapping:** links each Vibe authorization to the right partner tenant, Vibe account, scopes, and token record. For a distributed Client Credentials app, this includes the settings page where each customer enters their own client ID and secret.

The resource API client that uses these tokens belongs to `vibeco-developers-api-client`.

## OAuth Connection: Authorization Code with PKCE

1. Generate a high-entropy opaque `state` and a PKCE `code_verifier` per attempt, bound to the initiating browser session and kept server-side or in a protected session cookie.
2. Redirect to the documented authorization endpoint with the exact registered `redirect_uri`, the minimum scopes, `state`, `code_challenge`, and `code_challenge_method=S256`. Never use `plain`.
3. On the callback, reject a missing or mismatched `state` before exchanging the code, and handle `error` and `error_description` when the user denies consent.
4. Exchange the code server-side as the docs specify, sending the `code_verifier`, then discard the verifier. Never log it or put it in a URL.
5. Store access and refresh tokens only in protected server-side storage, tied to the installation.
6. Refresh server-side. A successful refresh rotates the refresh token: persist the new one atomically before discarding the old, so concurrent refreshes cannot overwrite a newer token. A refresh failing with `invalid_grant` marks the installation as disconnected and asks the customer to reconnect instead of retrying.

PKCE complements the client secret; it never replaces it.

## Client Credentials

1. Request the token server-side as the docs specify. There is no refresh token.
2. Cache the access token and renew it shortly before `expires_in` elapses, not once per call.
3. Use only credentials issued for the account being accessed. For a distributed Client Credentials app, store each customer's pair encrypted and separately, mapped to their tenant, with its own token cache. Validate a pair with a token request when the customer enters it. When a later request fails with `invalid_client`, the customer has probably rotated or revoked their credentials: stop retrying and ask for new ones.

## Errors

OAuth endpoints use the RFC 6749 `{ "error", "error_description" }` shape, unlike resource endpoints. Parse and test it separately. OAuth requests never receive the resource API's Bearer or revision headers.

## Tests

With mocked HTTP or the project's equivalent, verify the redirect parameters and per-attempt `S256` challenge, state rejection and consent denial, server-side form-encoded token requests, token caching until near expiry, atomic refresh-token rotation, the `invalid_grant` and `invalid_client` paths, the right token per installation, and logs free of secrets. Keep live credentials out of automated tests.

## Handoff

Report the flow implemented, where tokens are stored and how they are encrypted, how installations map to tenants, the routes added, the tests that passed, and the consent step left to verify against the dedicated test advertiser.
