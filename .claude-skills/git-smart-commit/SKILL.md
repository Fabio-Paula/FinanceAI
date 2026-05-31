---
name: git-smart-commit
description: Analyze git changes and create conventional commits with detailed, context-aware messages. Use this skill whenever you need to commit staged changes and want a well-structured commit message that follows conventional commit format. Perfect for projects where you want commits automatically analyzed and described based on what actually changed — include specific file patterns, the type of work (feat/fix/refactor), and complexity-adjusted detail levels in the commit body.
compatibility: Requires git, bash/zsh
---

# Git Smart Commit

Analyze staged git changes and generate conventional commit messages automatically. This skill examines `git diff --cached`, understands the scope and type of changes, and creates a detailed commit message that follows the Conventional Commits format.

## How it works

1. **Analyze staged changes**: Reads `git diff --cached` to understand what code changed
2. **Detect scope**: Identifies which part of the project changed (frontend, backend, database, etc.)
3. **Classify change type**: Determines if it's a `feat`, `fix`, `refactor`, `chore`, `style`, `test`, or `docs` change
4. **Generate message**: Creates a conventional commit with a title and detailed body, adjusting detail level based on complexity
5. **Review & confirm**: Shows you the proposed message before committing
6. **Commit**: Once approved, creates the commit with proper formatting

## Conventional Commit Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type**: `feat` (feature), `fix` (bug fix), `refactor` (code restructure), `chore` (maintenance), `style` (formatting/styling), `test` (test additions), `docs` (documentation)

**Scope**: Auto-detected from changed files:
- `frontend` — src/routes, src/components, src/lib (non-API)
- `backend` — server/ files, API endpoints
- `database` — schema.prisma, migrations
- `config` — env, vite.config, tsconfig, package.json
- `ui` — src/styles, tailwind config, component styling
- `types` — src/types

**Body**: Bullet points describing each meaningful change. Level of detail depends on:
- **Simple** (1-2 files, obvious intent): 2-3 bullet points
- **Medium** (3-4 files or cross-concern): 4-6 bullet points, some explanation
- **Complex** (5+ files or significant refactor): Detailed breakdown, rationale where needed

**Footer**: Includes `Co-Authored-By` if applicable

## Step-by-step usage

1. Stage your changes:
   ```bash
   git add <files>
   ```

2. Run this skill with no arguments, or with specific instructions:
   ```
   "I just made changes to the dashboard component"
   "commit these category badge improvements"
   ```

3. The skill will:
   - Show the detected scope and change type
   - Display the proposed commit message
   - Ask for approval

4. Review the message. You can:
   - Press Enter/confirm to commit as-is
   - Suggest edits ("add more detail about X", "change type to fix")
   - Cancel if something is wrong

5. Once approved, the commit is created automatically.

## Examples

### Simple styling update
```
style(ui): Refine globals styles and theme tokens

- Refine globals styles and theme tokens with improved color consistency
- Update semantic tokens for better visual hierarchy
- Standardize color naming and variable organization
```

### Backend feature
```
feat(backend): Create new recurrents API route handler

- Create new recurrents API route handler with CRUD operations
- Mount recurring transactions endpoints in main router
- Support recurring transaction rule management
```

### Complex multi-feature
```
feat: implement recurring transactions with full data model and UI

2 new files with:

- Update database schema with Recurrence model and relationships
- Create new month-context utility for monthly filtering logic
- Enhance _app.dashboard component with recurring transaction display
- Create new _app.recorrentes component with complete management UI
- Update type definitions with recurring transaction models
```

## Notes

- The skill works only with staged changes (`git add` first)
- It respects `.gitignore` and won't analyze ignored files
- Co-author is automatically included (configure in project CLAUDE.md)
- If you cancel, no commit is made — staged changes remain intact
- Descriptions are extracted from actual code changes, not generic templates
