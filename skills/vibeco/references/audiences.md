# Audience lifecycle

Use this reference for listing, creating or upserting, populating, checking, and cancelling audiences. Audience deletion is intentionally excluded.

## Resolve the current schemas

Fetch `https://developers.vibe.co/llms.txt`, then read the live pages for:

- Audience overview and list.
- Create or upsert an audience.
- Create an audience sync.
- Upload an audience sync batch.
- Get audience sync status.
- Perform a sync lifecycle action.
- HEM normalization.
- Presigned CSV upload and create-from-upload when files are involved.

When using `vibeco`, find the exact operations with `vibeco operations`, then inspect each with `vibeco describe` and `vibeco schemas`.

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

Treat audience records as sensitive. Hash or normalize locally before they enter logs, fixtures, command output, or chat.

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

Do not print the presigned target, form fields, identifiers, or CSV contents. Remove temporary local copies when the task no longer needs them.

## Live write preview

Before upserting an audience, creating a sync, uploading a batch, initiating a CSV sync, or cancelling a sync, show:

- Production endpoint or exact CLI operation.
- Account, advertiser, audience, and sync identifiers as applicable.
- Record count and ingestion path, without raw audience members.
- Idempotency key strategy.
- Expected lifecycle transition.

Execute only after explicit confirmation. Never include an audience delete operation in the prepared plan or command.
