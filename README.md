# Vibe Developer Platform agent skill

`vibeco` helps partner engineers create Vibe apps, implement OAuth, use the
Vibe Developer Platform API and CLI, and build reporting or audience
integrations.

The canonical skill is in [`skills/vibeco`](skills/vibeco). The repository also
contains OpenAI and Anthropic plugin manifests that package the same skill
without maintaining provider-specific copies.

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
