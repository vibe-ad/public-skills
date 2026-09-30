# App setup and OAuth

Use this reference when a partner needs a Vibe account, creates or configures a Vibe app, implements an OAuth grant, or chooses scopes. When the partner has not yet decided which kind of app to build, read [choosing-an-app.md](choosing-an-app.md) first.

## Start from current documentation

Resolve these pages through `https://developers.vibe.co/llms.txt` before acting:

- `https://developers.vibe.co/docs/getting-started.md`
- `https://developers.vibe.co/docs/start-your-oauth-flow.md`
- `https://developers.vibe.co/docs/start-your-client-credentials-flow.md`
- `https://developers.vibe.co/docs/universal-authorization.md`
- `https://developers.vibe.co/docs/api-versioning.md`
- `https://developers.vibe.co/docs/submit-app-for-review-and-marketplace-listing.md`

The live pages win over this reference if details change.

## Create the app step by step

Walk the partner through these steps in order, starting at the first one that is not yet done. When an authenticated browser is available and the user wants it, perform the navigation yourself; otherwise give each step with its direct link.

1. **Vibe account.** A partner without an account signs up at `https://vibe.co`. A partner who already has one signs in. Use the same account that owns, or will own, the advertisers the integration touches. Never create an account on the partner's behalf.
2. **My applications.** Open `https://vibe.co/dashboard/settings/my-applications` (account menu → **Developer tool**).
3. **Developer terms.** On the first visit, that page shows a blocking developer terms dialog. The account user accepts it personally; do not accept terms for them, even with browser control. Then select **Create app**.
4. **App details.** Fill in the information the form asks for. Settle the authentication method with [choosing-an-app.md](choosing-an-app.md) beforehand, and request only the minimum scopes (see below).
5. **Credentials.** On creation, the app's `client_id` and `client_secret` become available. Have the user store them directly in their server-side secret store. Do not copy the secret into chat, screenshots, source files, shell history, or notes. If the secret is lost or may have leaked, regenerate it from the app rather than asking the user to recover it, and replace it wherever it is stored: the previous secret stops working.
6. **Approval.** The new app is private and works only on the partner's own account. When other customers will connect to it, the app must be made public and approved through Vibe's review before they can: follow `https://developers.vibe.co/docs/submit-app-for-review-and-marketplace-listing.md` once the integration works end to end. Submitting for review is a live action and follows the same preview rule.

Before the final create, update, or secret-regeneration action, preview the information entered, including the authentication method and the requested scopes with a one-line justification for each.

Ask for confirmation immediately before the final live action.

## Choose scopes

Request only the scopes the integration calls, and be ready to justify each one in a sentence.

Do not rely on a memorized scope list. Every operation's reference page lists its required scope, and the documentation index repeats it next to each operation. Derive the scope set from the operations the integration actually uses. For example, a measurement integration that only reads advertisers and reports needs `advertisers:read` and `reporting:read`; add `audiences:read` or `audiences:write` only when audience functionality is implemented.

Account and advertiser provisioning scopes are access-restricted. Route those needs through the Vibe partner manager rather than assuming the app form can grant them.

## Authorization Code contract

1. Generate a high-entropy opaque `state` and a PKCE `code_verifier`, bind both to the initiating browser session, and store them temporarily server-side or in a protected session cookie.
2. Redirect the user to `GET https://api.vibe.co/oauth2/auth` with `client_id`, exact `redirect_uri`, `response_type=code`, space-separated `scope`, `state`, `code_challenge`, and `code_challenge_method=S256`.
3. On the callback, reject missing or mismatched state before exchanging the code. Handle `error` and `error_description` when the user denies consent.
4. Exchange the short-lived code server-side at `POST https://api.vibe.co/oauth2/token` using form encoding, HTTP Basic authentication with the client ID and secret, and the `code_verifier`.
5. Store the access token and refresh token only in protected server-side storage, associated with the correct installation or tenant.
6. Refresh server-side. A successful refresh rotates the refresh token, so persist the new token atomically before discarding the old value.

### PKCE

Use PKCE with `S256` on every Authorization Code flow, in addition to the client secret and `state`, as current OAuth security best practice recommends for all clients, including server-side ones.

- Generate a new `code_verifier` for each authorization attempt with a cryptographically secure random generator: 43 to 128 characters from `A-Z a-z 0-9 - . _ ~`.
- Send `code_challenge` (the unpadded base64url SHA-256 of the verifier) and `code_challenge_method=S256` at authorization. Never use `plain`.
- Keep the verifier server-side with the session, send it as `code_verifier` in the code exchange, then discard it. Never log it or put it in a URL.
- PKCE complements the client secret; it never replaces it, and the secret still never leaves the server.

## Client Credentials contract

1. Request a token server-side at `POST https://api.vibe.co/oauth2/token` with form-encoded `grant_type=client_credentials`, an optional space-separated `scope`, and HTTP Basic authentication with the client ID and secret.
2. The response has no refresh token. Cache the access token and request a new one when it expires or shortly before, rather than once per API call.
3. Use only credentials issued for the account being accessed: the partner's own pair for its own account, or the pair a customer created and entered in the partner's product for that customer's account. Never reuse one customer's credentials for another account.

For a distributed API key app, each customer creates a client ID and secret in Vibe, which inherit the scopes selected on the app, and enters them in the partner's settings page. Store each customer's pair encrypted and separately, mapped to the right tenant, with its own token cache. When a token request fails with `invalid_client`, the customer has probably rotated or revoked their keys: stop retrying and ask them to enter new keys.

## Token and error behavior

Drive access-token expiry from the `expires_in` value of each token response rather than a hard-coded lifetime, and refresh a little before it elapses.

OAuth endpoints use the RFC 6749-style `{ "error", "error_description" }` shape. Resource endpoints use Vibe's nested `{ "error": { "type", "message", "status", "detail", "request_id", "doc_url" } }` envelope. Parse and test both.

## Production-only testing

Vibe does not currently expose a partner sandbox in this skill. Use a dedicated test advertiser inside the real account, clearly label generated resources, minimize scopes, and never use customer data for initial validation.
