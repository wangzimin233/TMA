---
name: openspec-new-change
description: Create a new OpenSpec change skeleton. Use when a workflow needs only the change directory and metadata before artifacts are written manually.
license: MIT
compatibility: Requires openspec CLI.
metadata:
  author: local-compat
  version: "1.0"
---

# OpenSpec New Change

Create an OpenSpec change skeleton without generating all artifacts at once.

## Input

The caller must provide a concrete kebab-case change name. If the name is missing or ambiguous, ask the user to choose the exact change name before creating files.

## Steps

1. Check active changes:

   ```bash
   openspec list --json
   ```

2. Create the change directory:

   ```bash
   openspec new change "<name>"
   ```

3. Inspect the created change:

   ```bash
   openspec status --change "<name>" --json
   ```

4. Use the returned `changeRoot`, `artifactPaths`, `planningHome`, and `actionContext` values as the source of truth. Do not assume hard-coded paths when the CLI gives resolved paths.

## Output

Report:

- Change name
- Change root
- Current artifact status
- The next artifact that should be created

Do not implement code. Do not generate proposal, design, tasks, or specs unless the calling workflow explicitly instructs you to do so after the skeleton exists.
