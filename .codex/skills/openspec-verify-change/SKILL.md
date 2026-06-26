---
name: openspec-verify-change
description: Verify an OpenSpec change against its artifacts and tasks. Use when a workflow needs to confirm a change is valid before archive or closeout.
license: MIT
compatibility: Requires openspec CLI.
metadata:
  author: local-compat
  version: "1.0"
---

# OpenSpec Verify Change

Verify an OpenSpec change using the official CLI state and validation commands.

## Input

The caller must provide a concrete change name. If omitted and more than one active change exists, ask the user to choose.

## Steps

1. Inspect current status:

   ```bash
   openspec status --change "<name>" --json
   ```

2. Read the resolved artifact paths from the status JSON. Use those paths to review proposal, design, specs, and tasks when present.

3. Run validation:

   ```bash
   openspec validate "<name>" --type change --strict --json
   ```

4. Check task completion using the resolved tasks artifact path. All implementation tasks should be checked before a Comet verify pass.

5. If validation fails, report the exact failing command and CLI output. Do not mark the Comet verify result as passing.

## Output

Report:

- Change name
- Validation result
- Remaining unchecked tasks, if any
- Any spec or artifact issues found

Only report pass when validation succeeds and all required tasks are complete.
