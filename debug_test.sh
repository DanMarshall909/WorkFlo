#!/bin/bash
set -e

error() { echo "Error" >&2; exit 1; }

validate_issue_param() {
    local issue="$1"
    local command="$2"
    echo "Validating: issue='$issue' command='$command'"
    [[ -z "$issue" ]] && error "Usage: tdd $command <issue_number>"
    echo "Validation passed"
}

handle_complete_command() {
    local issue="$1"
    echo "In handle_complete_command with issue: '$issue'"
    validate_issue_param "$issue" "complete"
    echo "After validation"
    echo "Creating pull request automatically"
    echo "All acceptance criteria completed"
    echo "PR #123"
}

echo "Testing with argument: '$1'"
handle_complete_command "$1"