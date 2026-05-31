#!/usr/bin/env python3
"""
/commit command - Quick shorthand for git-smart-commit skill
"""

import subprocess
import json
import sys
from pathlib import Path

def run_git_smart_commit():
    """Run the git-smart-commit skill."""

    # Path to git-smart-commit scripts
    skill_dir = Path(__file__).parent.parent.parent / "git-smart-commit"
    analyze_script = skill_dir / "scripts" / "analyze_changes.py"
    generate_script = skill_dir / "scripts" / "generate_commit.py"

    if not analyze_script.exists() or not generate_script.exists():
        print("Error: git-smart-commit skill not found")
        print("Make sure git-smart-commit is installed in .claude-skills/")
        return False

    # Run analysis
    try:
        result = subprocess.run(
            [sys.executable, str(analyze_script)],
            capture_output=True,
            text=True
        )

        if result.returncode != 0:
            print("Analysis failed:", result.stderr)
            return False

        analysis = json.loads(result.stdout)

        if not analysis.get('success'):
            print("Error:", analysis.get('error'))
            return False

        # Run generation
        result = subprocess.run(
            [sys.executable, str(generate_script), json.dumps(analysis)],
            capture_output=True,
            text=True
        )

        if result.returncode != 0:
            print("Generation failed:", result.stderr)
            return False

        # Output the message
        print(result.stdout)
        return True

    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    success = run_git_smart_commit()
    sys.exit(0 if success else 1)
