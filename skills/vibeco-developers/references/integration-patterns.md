# Integration implementation patterns

Use this reference when designing or modifying a Vibe integration in any application stack.

## Inspect before editing

Identify the codebase's existing:

- Runtime, server framework, and HTTP client.
- Configuration and secret-loading conventions.
- Tenant or installation model.
- Database transaction and encryption facilities.
- Logger, error model, tests, and mocking tools.

Reuse them. Add a new dependency only when the existing stack cannot express the required behavior.

## Recommended boundaries

Keep these concerns separate even if the project names them differently:

1. **OAuth controller:** starts consent, binds high-entropy state and a PKCE verifier to the initiating session, validates the callback, and handles consent errors. Client Credentials integrations have no controller.
2. **Token service:** exchanges codes or requests Client Credentials tokens, encrypts tokens at rest, refreshes server-side, and atomically persists rotated refresh tokens.
3. **Vibe API client:** calls the resource endpoints with the pinned revision; use the `vibeco-developers-api-client` skill.
4. **Installation mapping:** associates each Vibe authorization with the correct partner tenant, Vibe account, scopes, and token record. For a distributed API key app, this includes the settings page where each customer enters their own client ID and secret.
5. **Domain service:** implements reporting, audience, campaign, or other requested behavior without knowing token-storage details.

OAuth authorization and token requests are exceptions: they do not receive the resource API's Bearer or revision headers.

## Configuration

Use placeholders in committed examples:

```dotenv
VIBE_CLIENT_ID=
VIBE_CLIENT_SECRET=
VIBE_API_REVISION=<published-revision>
VIBE_OAUTH_REDIRECT_URI=https://partner.example.com/integrations/vibe/callback
```

`VIBE_OAUTH_REDIRECT_URI` applies only to OAuth apps and must match a URI registered on the app exactly; local development typically uses a separately registered `http://localhost:<port>/...` callback.

Commit only an example file. Ignore the real environment file, and prefer the deployment platform's secret store for `VIBE_CLIENT_SECRET` and encryption keys. A pinned revision is configuration, not a secret.

## Tests that earn confidence

Use mocked HTTP or the project's equivalent to verify:

- The authorization redirect contains the exact registered callback, requested minimum scopes, a non-reused state, and an `S256` code challenge derived from a per-attempt verifier that the code exchange sends back.
- The callback rejects missing or mismatched state and handles consent denial.
- Code exchange, refresh, and Client Credentials token requests happen server-side with form encoding and Basic client authentication.
- Access tokens are cached until close to expiry rather than requested per call.
- Refresh-token rotation is persisted atomically and concurrent refreshes cannot overwrite a newer token.
- A refresh failing with `invalid_grant` marks the OAuth installation as disconnected and prompts the customer to reconnect, instead of retrying.
- For a distributed API key app, a customer's keys are validated with a token request when entered, and `invalid_client` later marks their keys as needing an update instead of retrying.
- OAuth error envelopes are parsed separately from resource error envelopes.
- Logs and snapshots never contain secrets, raw audience members, or signed download URLs.
- Write paths can be exercised with mocks without mutating Vibe production.

For audience code, also test idempotency keys, ordered batch indexes, final-batch marking, and malformed digest rejection. For reporting, test terminal states and the polling interval from the live docs.

## Implementation handoff

State the app's authentication method, which scopes it needs, where the revision is pinned, how installations map to tenants, where tokens are stored, which callbacks or routes were added, what tests passed, and which live confirmation step remains. Do not claim an integration works end-to-end until it has been authorized and verified against the dedicated Vibe test advertiser.
