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

1. **OAuth controller:** starts consent, binds high-entropy state to the initiating session, validates the callback, and handles consent errors.
2. **Token service:** exchanges codes, encrypts tokens at rest, refreshes server-side, and atomically persists rotated refresh tokens.
3. **Vibe API client:** applies `https://api.vibe.co`, Bearer authentication, the project's pinned `X-Vibe-Revision`, JSON handling, and safe error parsing to resource requests.
4. **Installation mapping:** associates each Vibe authorization with the correct partner tenant, Vibe account, scopes, and token record.
5. **Domain service:** implements reporting, audience, campaign, or other requested behavior without knowing token-storage details.

OAuth authorization and token requests are exceptions: they do not receive the resource API's Bearer or revision headers.

## Portable HTTP baseline

Use cURL when explaining or validating the language-neutral request contract. Resolve the exact method, path, query parameters, and body from the live documentation before replacing the placeholders.

```bash
curl --request GET \
  "https://api.vibe.co/<documented-resource-path>" \
  --header "Authorization: Bearer $VIBE_ACCESS_TOKEN" \
  --header "X-Vibe-Revision: $VIBE_API_REVISION"
```

For a documented request with a JSON body, also send `Content-Type: application/json` and prefer a protected input file over putting sensitive data directly in shell history:

```bash
curl --request "<documented-method>" \
  "https://api.vibe.co/<documented-resource-path>" \
  --header "Authorization: Bearer $VIBE_ACCESS_TOKEN" \
  --header "X-Vibe-Revision: $VIBE_API_REVISION" \
  --header "Content-Type: application/json" \
  --data @request.json
```

Do not add the resource API's Bearer or revision headers to OAuth endpoints, presigned storage uploads, or other endpoints whose live contract specifies different authentication. Do not use `-v`, shell tracing, or copied request dumps around credentials. A cURL example documents the wire contract; application code should use the codebase's existing HTTP client rather than spawning cURL.

## TypeScript example when needed

Use this example only when the project uses TypeScript/Node, the user asks for TypeScript, or typed client structure materially clarifies the implementation. Adapt it to the project's existing HTTP and error abstractions:

```ts
type VibeRequest = {
  accessToken: string;
  revision: string;
  method?: string;
  body?: unknown;
};

export async function requestVibe<T>(
  resourcePath: string,
  request: VibeRequest,
): Promise<T> {
  const response = await fetch(`https://api.vibe.co${resourcePath}`, {
    method: request.method ?? "GET",
    headers: {
      Authorization: `Bearer ${request.accessToken}`,
      "X-Vibe-Revision": request.revision,
      ...(request.body === undefined
        ? {}
        : { "Content-Type": "application/json" }),
    },
    body: request.body === undefined ? undefined : JSON.stringify(request.body),
  });

  const payload = response.status === 204 ? undefined : await response.json();
  if (!response.ok) {
    // Convert the documented Vibe envelope into the project's safe error type.
    throw new Error(`Vibe API request failed (${response.status})`);
  }
  return payload as T;
}
```

Do not log `request`, headers, tokens, or audience bodies. Preserve `error.request_id` in the real error adapter.

## Configuration

Use placeholders in committed examples:

```dotenv
VIBE_CLIENT_ID=
VIBE_CLIENT_SECRET=
VIBE_API_REVISION=<published-revision>
VIBE_OAUTH_REDIRECT_URI=https://partner.example.com/integrations/vibe/callback
```

Commit only an example file. Ignore the real environment file, and prefer the deployment platform's secret store for `VIBE_CLIENT_SECRET` and encryption keys. A pinned revision is configuration, not a secret.

## Tests that earn confidence

Use mocked HTTP or the project's equivalent to verify:

- The authorization redirect contains the exact registered callback, requested minimum scopes, and a non-reused state.
- The callback rejects missing or mismatched state and handles consent denial.
- Code exchange and refresh happen server-side with the expected content type and Basic client authentication.
- Refresh-token rotation is persisted atomically and concurrent refreshes cannot overwrite a newer token.
- Every resource request sends the pinned revision and the right installation's access token.
- OAuth and resource error envelopes are parsed separately; resource `request_id` survives safe wrapping.
- Logs and snapshots never contain secrets, raw audience members, or signed download URLs.
- Write paths can be exercised with mocks without mutating Vibe production.

For audience code, also test idempotency keys, ordered batch indexes, final-batch marking, and malformed digest rejection. For reporting, test terminal states and the polling interval from the live docs.

## Implementation handoff

State which scopes the app needs, where the revision is pinned, how installations map to tenants, where tokens are stored, which callbacks or routes were added, what tests passed, and which live confirmation step remains. Do not claim an integration works end-to-end until it has been authorized and verified against the dedicated Vibe test advertiser.
