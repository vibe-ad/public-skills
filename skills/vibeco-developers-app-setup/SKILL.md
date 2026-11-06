---
name: vibeco-developers-app-setup
description: Set up a Vibe Developer Platform app in the Vibe dashboard. Use when a partner has no Vibe account or app yet, must choose between an OAuth Connection app and a Client Credentials app, needs to pick scopes, has lost or leaked a client secret, or wants to make an app public through Vibe's review and Marketplace listing. NOT for writing authentication code (use vibeco-developers-auth), NOT for migrating code off the legacy X-API-Key header (use vibeco-developers-api-key-migration), and NOT for advertisers planning campaigns.
license: MIT
---

# Vibe app setup

Take a partner from no Vibe app to a configured app with the right authentication method and the minimum scopes. This skill covers the dashboard side only; implementing the token flow in code belongs to `vibeco-developers-auth`.

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

Resolve these through the index before acting; they win over this file if details change:

- `https://developers.vibe.co/docs/getting-started.md`
- `https://developers.vibe.co/docs/universal-authorization.md`
- `https://developers.vibe.co/docs/submit-app-for-review-and-marketplace-listing.md`

## Choose the authentication method

The method decides how the partner's customers connect their Vibe account, and it cannot be changed once the app is created. Warn the partner before they commit: a wrong choice means creating a new app. Ask one question: **how will customers connect their Vibe account?**

| Answer                                                                                                | Method                         |
| ----------------------------------------------------------------------------------------------------- | ------------------------------ |
| They click "Connect with Vibe" in the partner's product and approve access. Nothing to copy or paste. | **OAuth Connection** |
| Each customer creates a client ID and secret in Vibe and pastes them into the partner's product.      | **Client Credentials**         |
| The app only works on the partner's own Vibe account.                                                 | **Client Credentials**         |

Recommend OAuth Connection for any app other customers connect to: it scales to any number of customers with no credentials to exchange, at the cost of hosting a redirect URL. Recommend Client Credentials when the app only serves its owner, or when the partner's product already collects customer credentials and cannot host a redirect.

Do not reduce the choice to "a user is present" versus "server to server": an OAuth Connection app also runs unattended after the one-time consent, using refresh tokens. What matters is how each customer grants access.

The **Client Credentials** method has nothing to do with the legacy `X-API-Key` header. Keep the two distinct, and send partners who still use the header to `vibeco-developers-api-key-migration`.

## Create the app

Walk through these steps in order, starting at the first one not yet done. With an authenticated browser and the user's agreement, navigate yourself; otherwise give each step with its link.

1. **Account.** The partner signs up or signs in at `https://vibe.co` with the account that owns, or will own, the advertisers the integration touches. Never create an account for them.
2. **My applications.** Open `https://vibe.co/dashboard/settings/my-applications` (account menu → **Developer tool**).
3. **Developer terms.** The first visit shows a blocking terms dialog. The account user accepts it personally, even when you control the browser. Then select **Create app**.
4. **App details.** Fill in the form with the chosen method and the minimum scopes.
5. **Credentials.** The `client_id` and `client_secret` appear on creation. Have the user store them directly in their server-side secret store. If the secret is lost or may have leaked, regenerate it from the app rather than trying to recover it, and replace it everywhere: the previous secret stops working.
6. **Approval.** A new app is private and works only on the partner's own account. Before other customers can connect, with either method, it must be made public and approved through Vibe's review. Tell the partner before they build, and submit once the integration works end to end.

Before creating the app, regenerating its secret, or submitting it for review, preview the information entered, including the method and each requested scope with a one-line justification.

## Choose scopes

Request only the scopes the integration calls. Do not rely on a memorized list: each operation's reference page, and its entry in the documentation index, names the scope it needs, so derive the set from the operations the integration actually uses.

Account and advertiser provisioning scopes are access-restricted. Route those needs through the Vibe partner manager instead of assuming the app form can grant them.

## Handoff

Report the app's authentication method, the requested scopes with their justification, where the credentials are stored, whether the app is private or submitted for review, and the remaining manual steps. Point to `vibeco-developers-auth` for the code.
