# App setup and OAuth Authorization Code

Use this reference when creating a Vibe app, configuring consent, implementing OAuth, choosing scopes, or preparing Marketplace review.

## Start from current documentation

Resolve these pages through `https://developers.vibe.co/llms.txt` before acting:

- `https://developers.vibe.co/docs/start-your-oauth-flow.md`
- `https://developers.vibe.co/docs/submit-app-for-review-and-marketplace-listing.md`
- `https://developers.vibe.co/docs/universal-authorization.md`
- `https://developers.vibe.co/docs/api-versioning.md`

The live pages win over this reference if details change.

## Create or configure the app

When an authenticated browser is available, open the Vibe app, use the account menu to enter **Developer tool**, and navigate to **My applications**. Otherwise give the user the same path and the official documentation links.

Before clicking the final create, update, or submit action, preview:

- App name and stable slug.
- Private or public distribution.
- OAuth as the authentication method and Authorization Code as the grant.
- Every exact redirect URI.
- Requested scopes with a one-line justification for each.
- Marketplace category, support URL, privacy policy, terms, logo, and screenshots when public.

Ask for confirmation immediately before the final live action.

When the one-time client secret appears, have the user capture it directly into their server-side secret store. Do not copy it into chat, screenshots, source files, shell history, or notes.

## Private and public apps

- Every app starts private. Use a private app for the partner's own account, named customers, or a pilot.
- A public app is manually reviewed before it is visible in the Marketplace. Use it when many customer accounts need to install and authorize the integration.
- Start private, prove the end-to-end integration with a dedicated test advertiser, then submit publicly when ready.
- Account and advertiser provisioning scopes are access-restricted. Route those needs through the Vibe partner manager rather than assuming the app form can grant them.
- Verify review timelines, edit restrictions, and submission requirements in the live review guide; these operational details can change.

For a measurement integration, start with `advertisers:read` and `reporting:read` when those are the only calls. Add `audiences:read` or `audiences:write` only when audience functionality is implemented. Avoid speculative scopes.

## Authorization Code contract

1. Generate a high-entropy opaque `state`, bind it to the initiating browser session, and store it temporarily server-side or in a protected session cookie.
2. Redirect the user to `GET https://api.vibe.co/oauth2/auth` with `client_id`, exact `redirect_uri`, `response_type=code`, space-separated `scope`, and `state`.
3. On the callback, reject missing or mismatched state before exchanging the code. Handle `error` and `error_description` when the user denies consent.
4. Exchange the short-lived code server-side at `POST https://api.vibe.co/oauth2/token` using form encoding and HTTP Basic authentication with the client ID and secret.
5. Store the access token and refresh token only in protected server-side storage, associated with the correct installation or tenant.
6. Refresh server-side. A successful refresh rotates the refresh token, so persist the new token atomically before discarding the old value.

Do not add undocumented OAuth parameters. The `vibeco login` flow may use PKCE internally, but a partner application should implement the contract currently documented for its registered app.

OAuth authorization and token endpoints do not take `X-Vibe-Revision`. Resource API calls do.

## Token and error behavior

At the time of authoring, the live guide documents one-hour access tokens and 90-day refresh tokens. Recheck those values before implementing expiry logic.

OAuth endpoints use the RFC 6749-style `{ "error", "error_description" }` shape. Resource endpoints use Vibe's nested `{ "error": { "type", "message", "status", "detail", "request_id", "doc_url" } }` envelope. Parse and test both.

## Production-only testing

Vibe does not currently expose a partner sandbox in this skill. Use a dedicated test advertiser inside the real account, clearly label generated resources, minimize scopes, and never use customer data for initial validation.
