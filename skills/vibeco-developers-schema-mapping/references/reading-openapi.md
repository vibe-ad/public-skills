# Reading a Vibe OpenAPI schema

Use these rules to classify every field. Each classification must point to a keyword in the schema; if none applies, the answer is "Not stated in schema".

## Where the schema lives

Each reference page on `developers.vibe.co` embeds an OpenAPI JSON block under "OpenAPI definition". The operation is under `paths`, and the schemas it uses are under `components.schemas`. Follow every `$ref` to its component; the page only contains the components that operation uses.

## Presence

| Schema says | Classification |
| --- | --- |
| The field is listed in its parent object's `required` array | **required** |
| The field is not listed there | **optional** |
| The parent object is itself optional | The field is required only when the parent is sent |

`required` is per operation. A field required on create can be optional on update, and a response schema marks as required every field the server always returns, which says nothing about what a client must send.

## Nullability

| Schema says | Classification |
| --- | --- |
| `nullable: true` (OpenAPI 3.0 style) | **nullable** |
| `"null"` among the values of `type` (OpenAPI 3.1 style) | **nullable** |
| Neither | **not nullable** (OpenAPI default) |

Presence and nullability are independent. An optional field can still reject `null`, and a required field can accept it. Never treat "optional" as "may be null", or "absent" as the same as `null`.

## Absent versus null on writes

The schema defines which values are valid, not what the server does with them. Unless the operation's description or the reference page says so:

- What happens when an optional field is omitted on create is stated only by `default`. Without `default`, it is "Not stated in schema".
- Whether omitting a field on update leaves it unchanged, and whether sending `null` clears it, is "Not stated in schema". Ask it as an open question for each update field the partner needs to clear.
- How the server reacts to a value the schema does not allow, such as `null` on a field that is not nullable, is also "Not stated in schema": rejected, ignored or coerced, and with which status code. The schema only tells you the payload is invalid.

## Values and constraints

- `enum`: the complete list of accepted values, case-sensitive. Copy it verbatim; do not add, merge, or reorder values.
- `format` (`uuid`, `date-time`, `date`, `email`, `uri`...): the expected string shape.
- `minLength`, `maxLength`, `minimum`, `maximum`, `exclusiveMinimum`, `exclusiveMaximum`, `pattern`, `minItems`, `maxItems`, `uniqueItems`: hard limits to validate before sending.
- `default`: the value the server applies when the field is omitted on that operation.
- `readOnly`: returned but never accepted. Treat response-only fields the same way: a field present in the response schema but absent from every request schema is read-only for the partner.
- `description`: prose from the schema. It can state rules that no keyword expresses, such as an exact accepted set or a unit. Quote it and mark the constraint as "stated in description".

## Composition

- `{ "allOf": [{ "$ref": ... }] }` with a single entry, possibly next to `nullable` or `default`: the referenced schema, with the sibling keywords applied on top.
- `allOf` with several entries: the field must satisfy all of them; merge their constraints.
- `oneOf` or `anyOf`: the field accepts one of several shapes. List each shape and, if present, the `discriminator`. If the schema does not say how to choose, ask.
- `additionalProperties`: whether keys outside `properties` are accepted. When it is absent, the schema does not state whether unknown keys are rejected or ignored.

## Request and response naming

Compare the request and response schemas field by field. When the same concept has different names or types, such as an enum on write and a number of hours on read, map both directions explicitly and never round-trip a response value into a request without converting it.
