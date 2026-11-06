# Choosing an app

Use this reference before creating a Vibe app, when the partner is unsure which authentication method to pick. Once the choice is made, create the app with [app-setup.md](app-setup.md).

Resolve `https://developers.vibe.co/llms.txt` first; the live OAuth and Client Credentials guides win over this reference.

## Frame the choice the way the Developer tool does

The authentication method decides how the partner's customers connect their Vibe account to the partner's app, and it cannot be changed once the app is created: warn the partner before they commit, because choosing wrongly means creating a new app. Ask one question: **how will customers connect their Vibe account?**

| Answer                                                                                                                                                               | Method                           |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| They sign in with their Vibe account: they click "Connect with Vibe" in the partner's product and approve access. Nothing to copy or paste.                          | **OAuth** (Authorization Code)   |
| They paste their own keys into the partner's product: each customer creates a client ID and secret in Vibe and enters them. The partner keeps one pair per customer. | **API key** (Client Credentials) |
| It is just for the partner's own account: the app only works on the partner's own Vibe account. The partner uses the credentials issued at creation.                 | **API key** (Client Credentials) |

Recommend **OAuth** for any app that other customers connect their Vibe account to. It works for any number of customers and customers have no keys to create or exchange. Its cost is that the partner's product must host a redirect URL.

Recommend **API key** when the app only serves its owner on their own Vibe account: it fully does the job there and is the simplest option, with no redirect or consent to build. Also recommend it when the partner's product already collects customer keys and cannot or will not host an OAuth redirect.

Every app starts private and works only on the partner's own Vibe account. Before any other customer can connect to it, with either method, the app must be made public and approved through Vibe's review. Tell the partner this before they build, and read `https://developers.vibe.co/docs/submit-app-for-review-and-marketplace-listing.md` for the requirements.

Do not reduce the choice to "a user is present" versus "server to server". An OAuth integration also runs unattended in the background after the one-time consent, using its refresh tokens. What matters is how each customer grants access.
