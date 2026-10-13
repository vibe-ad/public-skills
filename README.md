# Vibe Developer Platform agent skills

- [`vibeco`](skills/vibeco) helps partner engineers create Vibe apps,
  implement OAuth, use the Vibe Developer Platform API and CLI, and build
  reporting or audience integrations.
- [`vibeco-developers-schema-mapping`](skills/vibeco-developers-schema-mapping)
  maps a partner's existing data model onto Vibe API entities and report
  metrics before coding: a field-by-field table sourced from the live OpenAPI
  schema, the fields that belong to another entity or have no counterpart,
  starter code limited to confirmed fields, and one batched list of open
  questions.

The repository also contains OpenAI and Anthropic plugin manifests that package
the same skills without maintaining provider-specific copies. Each skill has its
evaluation cases in `evals/`: `evals.json` for `vibeco`, and
`<skill-name>.json` for the others, with fixtures under `evals/files/`.

## Local validation

```bash
npm ci
npm run check
claude plugin validate . --strict
npx skills add . --list
npm run build
```

The JavaScript tooling runs directly on Node.js 22 or newer, with no transpiler
or type-stripping step. The packaging command creates `dist/vibeco-openai.zip` and
`dist/vibeco-anthropic.zip`. CI runs the same checks and attaches both archives
to releases created from `v*` tags.

Public OpenAI and Anthropic directory submissions still require their initial
review forms. Skills.sh can install the public Git repository directly.
