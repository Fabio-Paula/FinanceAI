# Git Smart Commit Skill

A Claude skill that analyzes git changes and creates intelligent, well-structured commit messages following the Conventional Commits format.

## Features

- **Automatic Scope Detection**: Identifies which part of your project changed (frontend, backend, database, ui, config, types)
- **Smart Type Classification**: Detects change type (feat, fix, refactor, style, test, chore, docs)
- **Context-Aware Descriptions**: Generates meaningful bullet points based on actual code changes
- **Complexity-Adjusted Detail**: Varies the level of detail in commit message based on number and type of files changed
- **New File Recognition**: Automatically marks and summarizes new files in the commit message
- **Co-Author Support**: Automatically includes co-author information

## Installation

### Option 1: Automatic (Recommended)
The skill file `git-smart-commit.skill` can be installed directly into Claude Code.

### Option 2: Manual
Copy the `.claude-skills/git-smart-commit` directory to your project.

## How to Use

### Basic Usage
1. Stage your changes:
   ```bash
   git add <files>
   ```

2. Ask Claude to create a commit:
   ```
   "Create a smart commit for these changes"
   ```

3. Claude will:
   - Analyze the staged changes
   - Display the proposed commit message
   - Ask for approval or edits

### Examples

**Styling Changes**
```
Input: Made styling updates to globals.css
Output: style(ui): Refine globals styles and theme tokens
```

**New Backend Feature**
```
Input: Created new API route for recurring transactions
Output: feat(backend): Create new recurrents API route handler
```

**Complex Multi-Feature Work**
```
Input: Updated schema, created utilities, enhanced components
Output: feat: implement recurring transactions with full data model and UI

2 new files with:
- Update database schema with Recurrence model
- Create new month-context utility for monthly filtering
- Enhance dashboard with recurring transaction display
- Create new recurrentes page with complete UI
- Update type definitions with recurring models
```

## Configuration

The skill auto-detects scopes based on file patterns:

| Scope | File Patterns |
|-------|--------------|
| `frontend` | `src/routes/`, `src/lib/` (non-API), `src/hooks/` |
| `backend` | `server/`, API endpoints |
| `database` | `schema.prisma`, migrations, `.sql` files |
| `ui` | `src/styles/`, `src/components/ui/` |
| `types` | `src/types/` |
| `config` | `.env`, config files, `package.json` |

## How It Works

### 1. Analysis Phase
The skill runs `git diff --cached` to understand what changed in your staged files.

### 2. Detection Phase
- Analyzes file names and patterns
- Examines diff content for keywords and patterns
- Checks file status (added, modified, deleted)

### 3. Classification Phase
- Determines commit type (feat, fix, refactor, etc.)
- Detects primary scope
- Assesses complexity (simple, medium, complex)

### 4. Generation Phase
- Creates descriptive, context-aware bullet points
- Generates appropriate subject line
- Adjusts detail level based on complexity

### 5. Review Phase
- Shows proposed message to user
- Allows edits or adjustments before committing
- User confirms to create commit

## Scripts

### `analyze_changes.py`
Analyzes staged git changes and returns:
- Detected scope and change type
- List of files changed with their status
- Detailed change descriptions
- Complexity level
- Git diff statistics

### `generate_commit.py`
Takes analysis output and generates:
- Conventional commit formatted message
- Subject line with appropriate scope
- Detailed body with bullet points
- Co-author footer

## Requirements

- Git (2.0+)
- Python 3.6+
- Bash/Zsh (or any shell supporting git commands)

## Examples of Generated Commits

### Example 1: Styling Updates
```
style(ui): improve global CSS styling with better semantic tokens and color consistency

- Refine globals styles and theme tokens
- Update semantic tokens for better visual hierarchy
- Standardize color naming and improve readability

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
```

### Example 2: Backend Feature
```
feat(backend): add recurring transactions route and integrate with API

- Create new recurrents API route handler
- Mount recurring transactions endpoints
- Support CRUD operations for recurring rules

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
```

### Example 3: Complex Change
```
feat: implement recurring transactions with full data model and UI

2 new files with:

- Update database schema with Recurrence model and relationships
- Create new month-context utility for monthly filtering logic
- Enhance dashboard with recurring transaction display
- Create new recurring transactions page with management UI
- Update type definitions with recurring transaction models

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
```

## Tips

1. **Stage Changes First**: The skill only analyzes staged changes, so use `git add` before asking
2. **Group Related Changes**: Commit related changes together for better context
3. **Review Before Committing**: Always review the proposed message before confirming
4. **Use Real Commits**: The skill learns from actual project patterns over time

## Troubleshooting

### "No staged changes found"
- Run `git add <files>` to stage changes before using the skill

### Incorrect Scope Detected
- The skill detects scope from file paths; ensure files are in standard locations
- You can always edit the scope in the proposed message

### Generic Descriptions
- The skill extracts context from actual code changes
- More specific changes lead to more specific descriptions

## Project Integration

This skill is optimized for the FinanceAI project with:
- React + Vite frontend structure
- Hono + Node.js backend
- Prisma ORM and PostgreSQL
- TanStack Router and Query

## Support

For issues or improvements, edit the Python scripts or SKILL.md directly.
