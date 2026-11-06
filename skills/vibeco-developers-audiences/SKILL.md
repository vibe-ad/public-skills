---
name: vibeco-developers-audiences
description: Create, populate, check, or cancel Vibe audience syncs on the Vibe Developer Platform, from the terminal or in a partner's code. Use when a partner pushes customer lists or identifiers to a Vibe audience, upserts an audience by an external key, normalizes and hashes emails (HEM), sends API batches or a CSV upload, polls a sync, or validates match counts. NOT for deleting audiences, NOT for mapping a partner's audience model onto Vibe fields before coding (use vibeco-developers-schema-mapping), and NOT for advertisers choosing targeting for a campaign.
license: MIT
---

# Vibe audience syncs

Take partner audience data into Vibe safely: upsert the audience, run one sync through API batches or a CSV upload, and check that it actually matched. Audience deletion is intentionally out of scope.

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

## Resolve the current schemas

From the documentation index, read the live pages for:

- Audience overview and list.
- Create or upsert an audience.
- Create an audience sync.
- Upload an audience sync batch.
- Get audience sync status.
- Perform a sync lifecycle action.
- HEM normalization.
- Presigned CSV upload and create-from-upload when files are involved.

To run these operations now from the terminal, use `vibeco` through `vibeco-developers-cli`. To call them from a partner's code, build on `vibeco-developers-api-client`, with tokens from `vibeco-developers-auth`.

## Lifecycle

1. Resolve the target account and advertiser with read-only calls.
2. List existing audiences and upsert by a stable partner-controlled `external_audience_key` when available. This prevents duplicate Vibe audiences across retries.
3. Create a sync with a stable idempotency key.
4. Populate the sync through either API batches or the documented presigned CSV upload path.
5. Mark the final API batch with `last_batch_flag: true`.
6. Poll the sync at the documented rate until it reaches a terminal state.
7. Validate the final state, matched count, and targetable audience size. A technically successful sync with unexpectedly low or zero matches is not a successful integration outcome.
8. Cancel a non-terminal sync only when requested, after showing the target and obtaining write confirmation.

At the time of authoring, Vibe documents one non-terminal sync per audience, expiry after 24 hours of inactivity, a maximum of 10,000 records and 1 MB per API batch, and one batch request per second. Recheck the live pages before relying on these values.

## Identifier preparation

Hash or normalize audience records locally, before they enter logs, fixtures, command output, or chat.

For hashed email:

- Fetch `https://developers.vibe.co/docs/hem-format.md` at the time of implementation.
- Follow the documented normalization order exactly, then SHA-256 encode as lowercase hexadecimal with no salt.
- Reject malformed input before upload and verify every digest is exactly 64 lowercase hexadecimal characters.
- Test a known, consented record in the dedicated test advertiser and confirm it matches before scaling.

The public HEM page has previously contained example placeholders and a verification note. If either remains, flag it and confirm the ambiguous normalization rule with Vibe rather than turning it into partner code.

The batch schema may also accept hashed phone numbers, caller-defined external IDs, IP addresses, and advertising identifiers. Read the current schema and apply the relevant privacy, consent, retention, and normalization rules; do not infer them from the email format.

## API batches

Use sequential zero-based `batch_index` values, an accurate `record_count`, a stable per-batch idempotency key, and the exact member schema returned by the live docs. Set `last_batch_flag` only on the final batch.

If a batch fails, do not blindly start another sync. Inspect the error and current sync state, then retry the same logical batch with its idempotency key only when the API contract permits it.

## CSV upload

When the user already has a suitable CSV or the payload is too large for convenient API batches:

1. Request the presigned upload target.
2. Upload directly to that target with every returned form field and the file field; do not add the Vibe Bearer header to the storage upload.
3. Use the returned file identifier to create and start the audience sync with a stable idempotency key.
4. Poll and validate exactly as for API batches.

Do not print the presigned target, form fields, or CSV contents. Remove temporary local copies when the task no longer needs them.

## Live write preview

Before upserting an audience, creating a sync, uploading a batch, initiating a CSV sync, or cancelling a sync, show:

- Production endpoint or exact CLI operation.
- Account, advertiser, audience, and sync identifiers as applicable.
- Record count and ingestion path, without raw audience members.
- Idempotency key strategy.
- Expected lifecycle transition.

## Tests

In code, cover with mocked HTTP: stable idempotency keys, ordered zero-based batch indexes, final-batch marking, and rejection of malformed digests before upload.

## Handoff

Report the audience and sync targeted, the ingestion path, the record count sent, the final sync state with matched count and targetable size, any HEM uncertainty, and any write still waiting for confirmation.
