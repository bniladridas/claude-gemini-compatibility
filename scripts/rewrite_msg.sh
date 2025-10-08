#!/bin/bash

# Script to rewrite commit messages for conventional commit standards
# Makes messages lowercase and truncates to ≤60 characters

set -e

echo "Rewriting commit messages to follow conventional commit standards..."

# Function to rewrite a single commit message
rewrite_commit() {
    local commit_hash=$1

    # Get current message
    local msg=$(git show -s --format=%B "$commit_hash")

    # Skip merge commits
    if git show --no-patch --format="%p" "$commit_hash" | grep -q " "; then
        echo "Skipping merge commit $commit_hash"
        return
    fi

    # Extract first line
    local first_line=$(echo "$msg" | head -n1)

    # Check if already follows conventional format
    if echo "$first_line" | grep -qE '^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\(.+\))?: '; then
        # Already conventional, just ensure lowercase body and length
        local type_part=$(echo "$first_line" | sed 's/\([a-z]*\([^:]*\): \)\(.*\)/\1/')
        local body_part=$(echo "$first_line" | sed 's/^[a-z]*\([^:]*\): //' | tr '[:upper:]' '[:lower:]')
        local new_first_line="$type_part$body_part"

        # Truncate if too long
        if [ ${#new_first_line} -gt 60 ]; then
            new_first_line="${new_first_line:0:57}..."
        fi
    else
        # Convert to conventional format
        # Try to infer type from content
        if echo "$first_line" | grep -qi "fix\|bug\|error\|issue"; then
            local type="fix"
        elif echo "$first_line" | grep -qi "add\|new\|feature\|implement"; then
            local type="feat"
        elif echo "$first_line" | grep -qi "doc\|readme\|comment"; then
            local type="docs"
        elif echo "$first_line" | grep -qi "test\|spec"; then
            local type="test"
        elif echo "$first_line" | grep -qi "refactor\|clean\|improve"; then
            local type="refactor"
        elif echo "$first_line" | grep -qi "style\|format\|lint"; then
            local type="style"
        elif echo "$first_line" | grep -qi "ci\|build\|deploy\|workflow"; then
            local type="ci"
        elif echo "$first_line" | grep -qi "perf\|performance\|optimize"; then
            local type="perf"
        elif echo "$first_line" | grep -qi "chore\|update\|bump\|version"; then
            local type="chore"
        else
            local type="chore"  # Default fallback
        fi

        # Create new message with lowercase body
        local body=$(echo "$first_line" | tr '[:upper:]' '[:lower:]')
        local new_first_line="$type: $body"

        # Truncate if too long
        if [ ${#new_first_line} -gt 60 ]; then
            new_first_line="${new_first_line:0:57}..."
        fi
    fi

    # Create new message
    local new_msg="$new_first_line"
    if [ $(echo "$msg" | wc -l) -gt 1 ]; then
        new_msg="$new_first_line

$(echo "$msg" | tail -n +2)"
    fi

    # Rewrite the commit
    echo "Rewriting $commit_hash: '$first_line' -> '$new_first_line'"
    git commit --amend -m "$new_msg" --allow-empty --no-verify
}

# Get all commit hashes in reverse chronological order
commits=$(git log --reverse --format=%H)

# Rewrite each commit
for commit in $commits; do
    git checkout "$commit" --detach
    rewrite_commit "$commit"
done

echo "Commit message rewriting complete!"
echo "Run 'git push --force-with-lease' to update the remote repository"