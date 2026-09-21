# Project instructions

Before each task, inspect the available skills in `.agents/skills` and apply
only those relevant to the current problem. Preserve Expo, React Native,
TypeScript, Firebase and existing patterns; do not replace technologies without
a concrete need. Keep code simple, organized and documented. Run lint, type
checks and relevant tests before finishing.

Investigate errors before fixing them. Never loosen security to hide an error,
and never use `allow read, write: if true`. Authorization belongs in Firestore
rules and trusted backend code. Never put administrative credentials in the app.
Keep customer-visible documents separate from internal workshop information.
Preserve existing data and provide a reversible migration when models change.

## Ponytail — active (full)

Use Ponytail full mode for coding tasks in this project. Read
`C:/Users/Wd/.agents/skills/ponytail/SKILL.md` when available.

Understand the task and trace the affected code before making changes. Prefer,
in order: avoiding unnecessary work, reusing existing code, the standard library,
native platform features, installed dependencies, then the smallest correct
implementation. Fix root causes and check affected callers. Avoid unrequested
abstractions, dependencies, and speculative features.

Preserve security, accessibility, validation, and error handling. Verify changes
with the smallest meaningful check. Keep explanations concise and in Portuguese
unless the user requests otherwise.

The user can change the mode with `ponytail lite`, `ponytail full`, or
`ponytail ultra`, and disable it with `stop ponytail` or `normal mode`.
