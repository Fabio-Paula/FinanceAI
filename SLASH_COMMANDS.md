# Slash Commands Setup

## Status: ✅ Installed and Ready

The `/commit` command is installed and ready to use in your project.

## The Situation

In Claude Code, custom slash commands need to be registered with the system to appear in the autocomplete list. The command is fully functional and installed, but may not show up in the `/` suggestions immediately.

## How to Use It Anyway

**Good news:** You can use `/commit` even if it doesn't appear in autocomplete!

### Method 1: Type It Directly (Recommended)
```
1. Stage your changes: git add <files>
2. Type in Claude: /commit
3. Press Enter
4. Claude runs the command!
```

### Method 2: Use as Skill
```
1. Stage changes: git add <files>
2. Ask Claude: "run the commit skill"
3. Or: "use the commit command"
```

### Method 3: Full Syntax
```
/commit

# Or for debugging/testing:
/skill commit
```

## What `/commit` Does

```
Input:  /commit (with staged git changes)

Process:
  1. Analyzes git diff --cached
  2. Detects scope (frontend, backend, etc.)
  3. Classifies type (feat, fix, style, etc.)
  4. Generates commit message
  5. Shows proposal and asks for approval
  6. Creates commit automatically

Output: A new git commit with conventional message
```

## Example

```bash
# 1. Make changes
vim src/components/Button.tsx

# 2. Stage them
git add src/components/Button.tsx

# 3. In Claude, type:
/commit

# 4. Claude responds with:
#
# ════════════════════════════════════════
# PROPOSED COMMIT
# ════════════════════════════════════════
# 
# Scope: frontend
# Type: style
# Complexity: simple
# Files changed: 1
#
# style(ui): improve button component styling
#
# - Improve button component styling and layout
# 
# Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
# ════════════════════════════════════════
#
# Ready to commit? Approve/edit/cancel?

# 5. Say "yes" or "approve" and the commit is created!
```

## Registration Details

The command is registered in:
- `.claude/commands.json` - Command definitions
- `.claude/init.md` - Initialization instructions
- `.claude-skills/commit/SKILL.md` - Skill definition
- `CLAUDE.md` - Project documentation

## Troubleshooting

### Q: Slash command not in autocomplete?
**A:** That's ok! Type `/commit` directly and it will work.

### Q: Command not running?
**A:** Make sure you:
1. Have staged changes (`git add` first)
2. Are in the FinanceAI project directory
3. Have the skills installed (they should be)

### Q: Want it in autocomplete list?
**A:** Try these:
1. Reload Claude Code
2. Check if there's a "Refresh Commands" option in Claude menu
3. Or type `/help` to refresh the command list

## Skills Involved

Two skills work together for the `/commit` command:

### `commit` (Quick Command)
- File: `.claude-skills/commit/SKILL.md`
- Purpose: `/commit` shorthand
- Uses: Calls git-smart-commit internally

### `git-smart-commit` (Full Analysis)
- File: `.claude-skills/git-smart-commit/SKILL.md`
- Purpose: Detailed git analysis and commit generation
- Scripts: Python scripts for analysis and generation

## Aliases

You can also try these variations:

```bash
/commit              # Main command
/c                   # Short alias (if registered)
/smart-commit        # Alternative name
commit skill         # Natural language
```

## Full Documentation

- `.COMMIT_HELP.md` - Quick reference
- `.claude-skills/git-smart-commit/README.md` - Full skill documentation
- `CLAUDE.md` - Project guidelines

## Next Steps

1. **Try it now:**
   ```bash
   git add some-file.tsx
   /commit
   ```

2. **If autocomplete still missing:**
   - Just type `/commit` directly (it works!)
   - Or ask Claude: "create a smart commit"

3. **All set!**
   - Use `/commit` regularly
   - The command works globally too

## Support

If the command isn't working:
1. Check that changes are staged (`git status`)
2. Verify you're in the FinanceAI directory
3. Try typing `/commit` directly (bypass autocomplete)
4. Or ask Claude for help with "git commit"

---

**TL;DR:** Type `/commit` after staging changes. Even if not in autocomplete, it works! 🚀
