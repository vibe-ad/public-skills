# Mapping report template

The mapping table is the deliverable. Put it first, right after the sources line, and never replace it with prose or bullet lists. Everything after it supports it. Keep every Vibe fact traceable to a schema and its source URL.

```markdown
# <Partner model> → Vibe mapping

Sources: <page URLs> · Revision: <API revision> · Retrieved: <date>

## Mapping table

| Vibe field                                                       | Partner field         | Transformation    | Vibe rules                                                                             | Status         | Notes                                                        |
| ---------------------------------------------------------------- | --------------------- | ----------------- | -------------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------ |
| Campaign > Advertiser (`advertiser_id`)                          | `<partner field>`     | <rule, or "copy"> | required · uuid · not nullable                                                         | Confirmed      |                                                              |
| Campaign > Name (`name`)                                         | `<partner field>`     | <rule>            | required · string · not nullable · 10–100 chars                                        | Confirmed      |                                                              |
| Campaign > Goal (`goal`)                                         | `<partner field>`     | value map below   | required · enum · not nullable                                                         | Open (Q1)      | <partner value> has no Vibe counterpart                      |
| Campaign > Optimization goal > Value (`optimization_goal.value`) | `<partner field>`     | <rule>            | required · number · not nullable · ≥ 1 · USD                                           | Open (Q2)      | <e.g. partner stores the client's currency>                  |
| Campaign > Countries (`countries`)                               | —                     | —                 | required · array of string · not nullable · ISO 3166-1 alpha-3 · <verbatim constraint> | Blocked        | no partner source                                            |
| Campaign > Attribution window (`attribution_window`)             | —                     | —                 | optional · enum · not nullable · default: Not stated in schema                         | Not used       |                                                              |
| Strategy > Budget (`budget`)                                     | `<partner field>`     | <rule>            | required on Strategy · integer · not nullable · USD ≥ 1                                | Confirmed      | Campaign returns `budget` derived from strategies, read-only |
| Strategy > Start date (`starts_at`)                              | `<partner field>`     | <rule>            | required on Strategy · date-time · not nullable                                        | Open (Q3)      |                                                              |
| Report > Metric > Spend (`spend`)                                | `<partner metric>`    | <rule>            | `metrics` enum value · unit and currency: Not stated in schema                         | Open (Q4)      |                                                              |
| Report > Dimension > Strategy ID (`strategy_id`)                 | `<partner dimension>` | <rule>            | `dimensions` enum value                                                                | Confirmed      |                                                              |
| Report > Metric > <label> (`<metric>`)                           | —                     | —                 | `metrics` enum value                                                                   | Not used       | documented, no partner field                                 |
| —                                                                | `<partner field>`     | —                 | —                                                                                      | No counterpart | stays in the partner's system                                |

### Value mapping: Campaign > Goal

| Vibe value | Partner value     | Rule                           |
| ---------- | ----------------- | ------------------------------ |
| `SALES`    | `<partner value>` | <why these are the same thing> |
| —          | `<partner value>` | no exact counterpart, see Q1   |

## Read and update differences

Only when the partner reads back or updates:

- <e.g. written as `attribution_window` (enum), read as `attribution_window_in_hours` (number): convert explicitly>
- <e.g. no update field is nullable: omit a field instead of sending `null`; clearing is Q5>

## Open questions

One numbered, copy-paste-ready block. Only questions the docs and the partner's material cannot answer.

> **Q1. For Vibe · <operation> · <field>**
> The docs say: <quote or "nothing"> (<source URL>).
> Question: <one precise question>.
> Until answered, our code: <placeholder behavior>.
>
> **Q2. For <partner> · <topic>**
> Question: <business rule or decision only the partner can make>.
> Until answered, our code: <placeholder behavior>.
```

## Filling the table

- **Vibe field:** `<Entity> > <Field label>` followed by the API path in backticks, for example Strategy > Start date (`starts_at`), Campaign > Optimization goal > Type (`optimization_goal.type`), or Report > Dimension > Channel name (`channel_name`). Write the label in sentence case from the field name, or from the docs' label when the reference page gives one. Use `—` for a partner field with no Vibe counterpart.
- **Partner field:** the partner's field name or path exactly as it appears in their model. Use `—` when the partner has no source. Never put sample values here.
- **Transformation:** the rule that turns the partner value into the Vibe value, for example "alpha-2 → alpha-3", "date → ISO 8601 date-time, timezone Q3", "value map below", or "copy".
- **Vibe rules:** presence, type, nullability, enum or constraints, and default, copied from the schema and kept short, in that order. Nullability follows [reading-openapi.md](reading-openapi.md) ("not nullable" when the schema does not mark it). Write every element the schema is silent about as "Not stated in schema", word for word, never "—", "no enum" or "not defined". List enum values in the value-mapping table rather than in this cell when the enum is long.
- **Status:** one of the values below.
- **Notes:** what the partner must know about that row, such as derived or read-only behavior, a nullability gap between their model and Vibe, or the reason a partner field has no counterpart.

Group the rows by Vibe entity, following the object tree from top to bottom (Advertiser, Campaign, Strategy, Creative, Audience, Conversion, Report), then partner fields with no counterpart. Within an entity, put required fields first. Include every field of the main create schema of each entity the partner writes, every required field of any other entity a partner field lands on, every report metric and dimension the partner consumes, and every partner field.

Add one value-mapping table per enum the partner feeds. Map value by value and state the rule; a partner value with no exact counterpart gets `—` in the Vibe column and an open question or partner decision.

## Status values

- **Confirmed:** the schema fully determines the field, and the partner has a source for it with a stated transformation.
- **Blocked:** Vibe requires the field and the partner has no source for it.
- **Open (Q<n>):** the mapping depends on an open question; starter code uses a placeholder for it.
- **Not used:** an optional Vibe field the partner has no source for.
- **No counterpart:** a partner field with nothing to map to; the note says whether it is read-only in Vibe or stays in the partner's system.
