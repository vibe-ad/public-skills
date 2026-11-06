# App setup and OAuth

Use this reference when a partner needs a Vibe account, creates or configures a Vibe app, or chooses scopes. To implement the token flow in code, use the `vibeco-developers-auth` skill. When the partner has not yet decided which kind of app to build, read [choosing-an-app.md](choosing-an-app.md) first.

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

## Production-only testing

Vibe does not currently expose a partner sandbox in this skill. Use a dedicated test advertiser inside the real account, clearly label generated resources, minimize scopes, and never use customer data for initial validation.
