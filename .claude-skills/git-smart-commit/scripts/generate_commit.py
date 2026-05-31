#!/usr/bin/env python3
"""
Generate and execute a conventional commit based on change analysis.
"""

import subprocess
import json
import sys
from typing import Optional

def generate_subject(change_type: str, scope: str, files_count: int, detailed_changes: list) -> str:
    """Generate a commit subject line."""

    # If we have good descriptive changes, use them
    if detailed_changes:
        # Take the core action from first detailed change
        first_change = detailed_changes[0]

        # Extract main action
        if change_type == 'feat':
            # For features, use the action from the first change
            if 'Create' in first_change:
                return f"{first_change.split(' with ')[0]}" if ' with ' in first_change else first_change
            elif 'Add' in first_change:
                return first_change
            else:
                return f"Add {scope} features"

        elif change_type == 'style':
            # For styling, mention what was improved
            if 'Refine' in first_change or 'Update' in first_change:
                return first_change
            else:
                return f"Improve {scope} styling"

        elif change_type == 'fix':
            if 'Fix' in first_change:
                return first_change
            else:
                return f"Fix {scope} issues"

        elif change_type == 'refactor':
            if 'Refactor' in first_change:
                return first_change
            else:
                return f"Refactor {scope} code"

    # Fallback: Build generic subject
    verbs = {
        'feat': 'Add',
        'fix': 'Fix',
        'refactor': 'Refactor',
        'style': 'Improve',
        'test': 'Add tests for',
        'chore': 'Update',
        'docs': 'Document',
    }

    verb = verbs.get(change_type, 'Update')
    scope_name = scope if scope != 'chore' else 'project'

    if files_count == 1:
        return f"{verb} {scope_name}"
    else:
        return f"{verb} {scope_name} with multiple improvements"

def build_commit_message(analysis: dict) -> str:
    """Build the full commit message."""

    change_type = analysis['change_type']
    scope = analysis['scope']
    complexity = analysis['complexity']
    detailed_changes = analysis['detailed_changes']
    file_status = analysis.get('file_status', {})

    # Check if there are new files (adds more context)
    has_new_files = any(status == 'A' for status in file_status.values())

    # Generate subject
    subject = generate_subject(change_type, scope, analysis['files_count'], detailed_changes)

    # Build full subject line with scope
    if scope and scope != 'chore':
        # Make subject lowercase if it's just a generic phrase
        if any(verb in subject for verb in ['Add', 'Update', 'Improve', 'Refactor', 'Fix']):
            subject_lower = subject[0].lower() + subject[1:] if len(subject) > 1 else subject
        else:
            subject_lower = subject
        full_subject = f"{change_type}({scope}): {subject_lower}"
    else:
        full_subject = f"{change_type}: {subject[0].lower() + subject[1:] if len(subject) > 1 else subject}"

    # Build body - adjust detail based on complexity
    if complexity == 'simple':
        # Simple: 2-3 bullet points, concise
        body_lines = detailed_changes[:3]
    elif complexity == 'medium':
        # Medium: 4-6 bullet points, some detail
        body_lines = detailed_changes[:6]
    else:
        # Complex: all changes, more detailed
        body_lines = detailed_changes

    # For complex commits with new files, add context line
    if complexity == 'complex' and has_new_files:
        new_count = len([f for f, s in file_status.items() if s == 'A'])
        body = f"{new_count} new files with:\n\n" + \
               '\n'.join(f'- {line}' for line in body_lines)
    else:
        body = '\n'.join(f'- {line}' for line in body_lines)

    # Add footer
    footer = '\nCo-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>'

    # Assemble message
    message = f"{full_subject}\n\n{body}{footer}"

    return message

def commit_with_message(message: str) -> bool:
    """Create the git commit."""
    try:
        result = subprocess.run(
            ['git', 'commit', '-m', message],
            capture_output=True,
            text=True
        )

        if result.returncode == 0:
            print("\n✓ Commit created successfully!")
            print("\nCommit message:")
            print("─" * 60)
            print(message)
            print("─" * 60)
            return True
        else:
            print(f"\n✗ Commit failed: {result.stderr}")
            return False
    except Exception as e:
        print(f"\n✗ Error creating commit: {e}")
        return False

def main():
    if len(sys.argv) > 1:
        # Analysis data passed as JSON
        try:
            analysis = json.loads(sys.argv[1])
        except json.JSONDecodeError:
            print("Error: Invalid JSON input")
            sys.exit(1)
    else:
        print("Error: No analysis data provided")
        sys.exit(1)

    if not analysis.get('success'):
        print(f"Analysis failed: {analysis.get('error', 'Unknown error')}")
        sys.exit(1)

    # Generate message
    message = build_commit_message(analysis)

    # Output for review
    print("\n" + "=" * 60)
    print("PROPOSED COMMIT")
    print("=" * 60)
    print(f"\nScope: {analysis['scope']}")
    print(f"Type: {analysis['change_type']}")
    print(f"Complexity: {analysis['complexity']}")
    print(f"Files changed: {analysis['files_count']}")
    print(f"\n{message}")
    print("\n" + "=" * 60)

    # Return message for further processing
    print(f"\nMESSAGE_START\n{message}\nMESSAGE_END")

if __name__ == '__main__':
    main()
