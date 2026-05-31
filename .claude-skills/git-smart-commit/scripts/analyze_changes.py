#!/usr/bin/env python3
"""
Analyze git staged changes and generate conventional commit message.
"""

import subprocess
import json
import re
from pathlib import Path
from typing import NamedTuple, Optional

class ChangeAnalysis(NamedTuple):
    scope: str
    change_type: str
    files_changed: list[str]
    stats: dict
    detailed_changes: list[str]

def run_command(cmd: str) -> str:
    """Run shell command and return output."""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return result.stdout.strip()

def get_staged_diff() -> str:
    """Get the staged diff."""
    return run_command("git diff --cached")

def get_staged_files() -> list[str]:
    """Get list of staged files."""
    output = run_command("git diff --cached --name-only")
    return output.split('\n') if output else []

def get_staged_files_status() -> dict:
    """Get file status (added, modified, deleted)."""
    output = run_command("git diff --cached --name-status")
    status = {}
    for line in output.split('\n'):
        if line:
            parts = line.split('\t')
            if len(parts) == 2:
                status[parts[1]] = parts[0]  # {filename: status_letter}
    return status

def detect_scope(files: list[str]) -> str:
    """Detect the scope based on changed files."""
    scopes_count = {
        'frontend': 0,
        'backend': 0,
        'database': 0,
        'config': 0,
        'ui': 0,
        'types': 0,
    }

    scope_patterns = {
        'frontend': [r'^src/routes/', r'^src/lib/(?!api)', r'^src/hooks/'],
        'backend': [r'^server/', r'^src/routes/api\.'],
        'database': [r'^schema\.prisma$', r'^prisma/migrations/', r'\.sql$'],
        'config': [r'^\.env', r'^vite\.config', r'^tsconfig', r'^package\.json', r'^\.prettierrc'],
        'ui': [r'^src/styles/', r'^src/components/ui/', r'tailwind\.config'],
        'types': [r'^src/types/'],
    }

    for file in files:
        for scope, patterns in scope_patterns.items():
            if any(re.match(p, file) for p in patterns):
                scopes_count[scope] += 1

    # Return the most common scope, or multiple if tied
    max_count = max(scopes_count.values()) if scopes_count else 0
    if max_count == 0:
        return 'chore'

    # Get all scopes with max count
    primary_scopes = [s for s, c in scopes_count.items() if c == max_count]

    # If multiple scopes with same count, pick order of importance
    scope_priority = ['backend', 'database', 'frontend', 'ui', 'types', 'config']
    for scope in scope_priority:
        if scope in primary_scopes:
            return scope

    return primary_scopes[0]

def detect_change_type(diff: str, files: list[str], file_status: dict) -> str:
    """Detect the type of change based on diff content and file status."""

    # Check if any files are newly added (A status)
    added_files = [f for f, status in file_status.items() if status == 'A']

    # If there are newly added files, it's likely a feature
    if added_files:
        # But check if it's just test/doc files
        if all(f.endswith(('.test.ts', '.spec.ts', '.md')) for f in added_files):
            return 'test' if any('.test' in f or '.spec' in f for f in added_files) else 'docs'
        # Otherwise it's a feature
        return 'feat'

    # Check for deletions (might be refactor/cleanup)
    deletion_ratio = diff.count('\n-') / (diff.count('\n-') + diff.count('\n+') + 1)

    # Check for test files
    if any('test' in f or 'spec' in f for f in files):
        return 'test'

    # Check for docs
    if all(f.endswith('.md') for f in files if f):
        return 'docs'

    # Check for styling/formatting only
    if all(f.endswith('.css') or f.endswith('.scss') or 'style' in f for f in files if f):
        return 'style'

    # Check for major refactoring (lots of deletions)
    if deletion_ratio > 0.4:
        return 'refactor'

    # Check for bug fixes (look for error handling, specific keywords)
    fix_patterns = [
        r'\bfixed?\b', r'\berror\b', r'\bbug\b', r'\bhandle\b',
        r'\bcatch\b', r'\bthrow\b', r'\btry\b', r'\bvalidat'
    ]
    if any(re.search(p, diff.lower()) for p in fix_patterns):
        return 'fix'

    # Check for refactoring patterns
    refactor_patterns = [
        r'\brename\b', r'\brefactor\b', r'\brestructur',
        r'\boptimiz\b', r'\bimprove\b'
    ]
    if any(re.search(p, diff.lower()) for p in refactor_patterns):
        return 'refactor'

    # Default to feat for new functionality
    return 'feat'

def extract_meaningful_changes(diff: str, files: list[str], file_status: dict) -> list[str]:
    """Extract meaningful change descriptions from diff."""
    changes = []

    # Group changes by file with context
    file_sections = {}
    current_file = None
    current_hunk = []

    for line in diff.split('\n'):
        if line.startswith('diff --git'):
            # Save previous file
            if current_file and current_hunk:
                file_sections[current_file] = current_hunk

            # Start new file
            match = re.search(r'b/(.+)$', line)
            if match:
                current_file = match.group(1)
                current_hunk = []
        elif current_file and line.startswith('@@'):
            current_hunk.append(line)

    # Process files and generate descriptions
    for file in files:
        if not file:
            continue

        status = file_status.get(file, 'M')
        filename = Path(file).stem

        # Get diff stats for this file
        file_diff = run_command(f"git diff --cached {file}")
        added_count = file_diff.count('\n+') - file_diff.count('\n+++')
        removed_count = file_diff.count('\n-') - file_diff.count('\n---')

        # Generate description based on file type and changes
        if status == 'A':
            # New file
            if 'schema.prisma' in file:
                changes.append(f"Add database schema for new feature")
            elif file.endswith('.tsx'):
                changes.append(f"Create new {filename} component with complete UI")
            elif file.endswith('.ts'):
                if 'route' in file.lower():
                    changes.append(f"Create new {filename} API route handler")
                else:
                    changes.append(f"Create new {filename} utility module")
            elif file.endswith('.css'):
                changes.append(f"Add new styles for {filename}")
            else:
                changes.append(f"Add {filename}")
        else:
            # Modified file
            if 'schema.prisma' in file:
                changes.append(f"Update database schema ({added_count}+, {removed_count}-)")
            elif file.endswith('.tsx'):
                if added_count > removed_count * 2:
                    changes.append(f"Enhance {filename} component with new features ({added_count}+ lines)")
                elif removed_count > added_count:
                    changes.append(f"Refactor {filename} component ({removed_count}- lines)")
                else:
                    changes.append(f"Update {filename} component logic and styling")
            elif file.endswith('.css'):
                changes.append(f"Refine {filename} styles and theme tokens")
            elif file.endswith('.ts'):
                if 'type' in file.lower():
                    changes.append(f"Update type definitions with new models")
                elif 'middleware' in file.lower():
                    changes.append(f"Enhance {filename} middleware with additional checks")
                elif 'route' in file.lower():
                    changes.append(f"Update {filename} API endpoints")
                else:
                    changes.append(f"Improve {filename} implementation")
            else:
                changes.append(f"Update {filename}")

    return changes if changes else ["Update project files"]

def analyze() -> dict:
    """Main analysis function."""
    diff = get_staged_diff()
    files = get_staged_files()
    file_status = get_staged_files_status()
    files = [f for f in files if f]  # Remove empty strings

    if not files:
        return {
            'error': 'No staged changes found. Run `git add <files>` first.',
            'success': False
        }

    scope = detect_scope(files)
    change_type = detect_change_type(diff, files, file_status)
    detailed_changes = extract_meaningful_changes(diff, files, file_status)

    # Calculate stats
    stats = run_command("git diff --cached --stat")

    return {
        'success': True,
        'scope': scope,
        'change_type': change_type,
        'files_changed': files,
        'files_count': len(files),
        'file_status': file_status,
        'detailed_changes': detailed_changes,
        'complexity': 'simple' if len(files) <= 2 else 'medium' if len(files) <= 4 else 'complex',
        'stats': stats
    }

if __name__ == '__main__':
    import sys
    result = analyze()
    print(json.dumps(result, indent=2))
