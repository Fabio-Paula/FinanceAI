---
name: commit
description: Quick commit helper - create a smart conventional commit with a single command. Type `/commit` to analyze staged changes and generate a commit message automatically. Works with the git-smart-commit skill to provide instant commit creation. Use whenever you want to commit staged changes without typing a full explanation.
compatibility: Requires git, git-smart-commit skill
---

# /commit Command

Quick command to create a smart conventional commit in one step.

## Usage

Simply type:
```
/commit
```

That's it! Claude will:
1. Analyze your staged git changes
2. Detect scope and change type
3. Generate a descriptive commit message
4. Ask for approval
5. Create the commit automatically

## Examples

```bash
# Stage your changes
git add src/components/Button.tsx

# Then just type in Claude:
/commit

# Claude responds with proposed commit message and confirms before creating it
```

## What It Does

This is a shorthand for the full `git-smart-commit` skill. Instead of describing your changes, you just type `/commit` and Claude handles everything:

- Analyzes `git diff --cached`
- Detects conventional commit type (feat, fix, style, etc.)
- Identifies scope (frontend, backend, database, etc.)
- Generates contextual bullet points
- Proposes the commit message
- Asks for confirmation

## Tips

- **Stage first**: Make sure to `git add` your changes before using `/commit`
- **Group changes**: Commit related changes together for better context
- **Review**: Always review the proposed message before confirming
- **Customize**: You can ask Claude to adjust the message before committing

## Advanced Usage

You can also add context:
```
/commit - but emphasize the refactoring aspect
/commit - add more technical details
/commit - use lowercase style
```

## See Also

- `git-smart-commit` - Full skill with detailed analysis
- `/commit-help` - Show this help message again
