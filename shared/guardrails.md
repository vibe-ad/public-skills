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
