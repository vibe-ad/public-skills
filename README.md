<p align="center">
  <a href="https://www.vibe.co/">
    <img src="assets/vibe-logo.svg" alt="Vibe" width="56" height="56">
  </a>
</p>

<h1 align="center">Vibe Developers Skills</h1>

<p align="center">
  <a href="https://developers.vibe.co/"><img src="https://img.shields.io/badge/docs-developers.vibe.co-4F46E5" alt="Developer documentation"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT license"></a>
</p>

<p align="center">
  <strong>Skills that help AI coding agents build integrations with the Vibe API.</strong>
</p>

---

The skills follow the open [Agent Skills](https://agentskills.io/) format, so
they work in Claude Code, Codex, and any other agent that supports it. They
teach the agent how the platform fits together and send it to the live
documentation and OpenAPI schema for every detail, so its answers follow the
API as it changes.

## Skills

| Skill | What it helps with |
| --- | --- |
| [`vibeco-developers`](skills/vibeco-developers) | The entry point for any Vibe Developer Platform task, which routes to the specialized skills when they fit. Covers choosing between OAuth and API key apps, creating and configuring a Vibe app, implementing OAuth, calling the API or the [`vibeco` CLI](https://github.com/vibe-ad/vibe-cli), and building reporting or audience integrations in an existing codebase. |
| [`vibeco-developers-schema-mapping`](skills/vibeco-developers-schema-mapping) | Mapping your existing data model onto Vibe API entities and report metrics before you write integration code: a field-by-field table sourced from the live OpenAPI schema, the fields that belong to another entity or have no counterpart, starter code limited to confirmed fields, and one batched list of open questions. |

## Install

### Claude Code

```text
/plugin marketplace add vibe-ad/public-skills
/plugin install vibeco@vibe-co
```

### Codex

```bash
codex plugin marketplace add vibe-ad/public-skills
```

Then run `/plugins` in Codex and install **vibeco** from the Vibe.co tab.

### Other agents

Install with [skills.sh](https://skills.sh/):

```bash
npx skills add vibe-ad/public-skills
```

Or copy the directories under [`skills/`](skills) into the skills directory
of your agent.

## Example requests

| You say | Skill used |
| --- | --- |
| "Add Vibe OAuth with PKCE to our Express backend" | `vibeco-developers` |
| "Set up a Client Credentials app for our server-to-server sync" | `vibeco-developers` |
| "Our connector still sends `X-API-Key`, migrate it to the new API" | `vibeco-developers` |
| "Write a nightly job that loads Vibe campaign spend into our warehouse" | `vibeco-developers` |
| "Push hashed customer emails from our Python service to a Vibe audience" | `vibeco-developers` |
| "Here is our Prisma `Campaign` model, map it to the Vibe API before I write the connector" | `vibeco-developers-schema-mapping` |

## Repository structure

```
public-skills/
├── .agents/
│   └── plugins/
│       └── marketplace.json            # Codex marketplace
├── .claude-plugin/
│   ├── marketplace.json                # Claude Code marketplace
│   └── plugin.json                     # Claude Code plugin
├── .codex-plugin/
│   └── plugin.json                     # Codex plugin
├── skills/
│   ├── vibeco-developers/              # Apps, OAuth, API, CLI, reporting, audiences
│   │   ├── SKILL.md
│   │   ├── references/
│   │   ├── agents/openai.yaml
│   │   └── assets/
│   └── vibeco-developers-schema-mapping/   # Data model to Vibe API mapping
│       ├── SKILL.md
│       ├── references/
│       ├── scripts/flatten-schema.mjs
│       ├── agents/openai.yaml
│       └── assets/
├── evals/
│   ├── vibeco-developers.json          # Evaluation cases, one file per skill
│   ├── vibeco-developers-schema-mapping.json
│   └── files/                          # Fixtures used by the cases
├── scripts/                            # Validation and packaging
├── assets/                             # Repository assets (README logo)
├── LICENSE
└── README.md
```

The same skill files back every plugin, without provider-specific copies.

## Development

Validate and package the distribution locally with Node.js 22 or newer:

```bash
npm ci
npm run check
claude plugin validate . --strict
npx skills add . --list
npm run build
```

`npm run check` validates the skill frontmatter, the plugin and marketplace
manifests, the license, and the evaluation cases of every skill in `evals/<skill-name>.json`.
`npm run build` creates `dist/vibeco-openai.zip` and
`dist/vibeco-anthropic.zip`. CI runs the same checks on every change and
attaches both archives to releases created from `v*` tags.

## License

[MIT](LICENSE). The Vibe name and logos are trademarks of Vibe and are not
covered by this license.
