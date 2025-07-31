#!/usr/bin/env bats
# Tests for TDD DOCUMENT phase functionality

setup() {
    # Create a temporary directory for testing
    TEST_DIR=$(mktemp -d)
    cd "$TEST_DIR"
    
    # Initialize a git repository
    git init
    git config user.name "Test User"
    git config user.email "test@example.com"
    
    # Copy necessary files
    cp "$BATS_TEST_DIRNAME"/../tdd ./
    mkdir -p lib
    cp "$BATS_TEST_DIRNAME"/../lib/document-phase.sh ./lib/document-phase.sh
    chmod +x ./tdd
    chmod +x ./lib/document-phase.sh
    
    # Create a basic CLAUDE.md file
    cat > CLAUDE.md << 'EOF'
# CLAUDE.md

This file provides guidance to Claude Code when working with the repository.

## Best Practices

- Follow TDD workflow
EOF
    
    # Create TDD state for testing
    cat > .tdd-state << 'EOF'
ISSUE=247
CRITERIA=1
PHASE=COVER
TOTAL=1
EOF
    
    git add .
    git commit -m "Initial test setup"
}

teardown() {
    # Clean up temporary directory
    cd /
    rm -rf "$TEST_DIR"
}

@test "tdd document command exists and requires active TDD session" {
    # Given: No TDD state
    rm -f .tdd-state
    
    # When: Running tdd document
    run ./tdd document
    
    # Then: Should fail with error message
    [ "$status" -ne 0 ]
    [[ "$output" =~ "No active TDD session" ]]
}

@test "tdd document validates phase order" {
    # Given: TDD state in wrong phase
    cat > .tdd-state << 'EOF'
ISSUE=247
CRITERIA=1
PHASE=RED
TOTAL=1
EOF
    
    # When: Running tdd document
    run ./tdd document
    
    # Then: Should fail with phase validation error
    [ "$status" -ne 0 ]
    [[ "$output" =~ "After RED: tdd green" ]]
}

@test "tdd document runs successfully from COVER phase" {
    # Given: TDD state in COVER phase
    cat > .tdd-state << 'EOF'
ISSUE=247
CRITERIA=1
PHASE=COVER
TOTAL=1
EOF
    
    # When: Running tdd document with no input (skip documentation)
    run bash -c 'echo "" | ./tdd document'
    
    # Then: Should handle empty input gracefully
    [ "$status" -eq 0 ]
    [[ "$output" =~ "DOCUMENT Phase" ]]
}

@test "document phase script requires TDD state" {
    # Given: No TDD state file
    rm -f .tdd-state
    
    # When: Running document phase script directly
    run ./lib/document-phase.sh
    
    # Then: Should fail with error
    [ "$status" -ne 0 ]
    [[ "$output" =~ "No TDD state found" ]]
}

@test "document phase script requires git repository" {
    # Given: Not in a git repository
    cd $(mktemp -d)
    
    # Copy script to non-git directory
    cp "$TEST_DIR/lib/document-phase.sh" ./
    chmod +x ./document-phase.sh
    
    # When: Running document phase script
    run ./document-phase.sh
    
    # Then: Should fail with git error
    [ "$status" -ne 0 ]
    [[ "$output" =~ "Not in a git repository" ]]
}

@test "document phase updates CLAUDE.md when documentation provided" {
    # Given: TDD state and initial CLAUDE.md
    original_content=$(cat CLAUDE.md)
    
    # When: Running document phase with test input
    run bash -c 'echo -e "Test pattern discovered\n\nTest gotcha found\n\n\n\n\ny" | ./lib/document-phase.sh'
    
    # Then: Should update CLAUDE.md
    [ "$status" -eq 0 ]
    [[ "$output" =~ "Documentation added to CLAUDE.md" ]]
    
    # And: CLAUDE.md should contain new content
    updated_content=$(cat CLAUDE.md)
    [[ "$updated_content" != "$original_content" ]]
    [[ "$updated_content" =~ "Issue #247 Documentation" ]]
    [[ "$updated_content" =~ "Test pattern discovered" ]]
    [[ "$updated_content" =~ "Test gotcha found" ]]
}

@test "document phase commits changes to git" {
    # Given: Clean git state
    git_commits_before=$(git rev-list --count HEAD)
    
    # When: Running document phase with test input
    run bash -c 'echo -e "Test documentation\n\n\n\n\n\ny" | ./lib/document-phase.sh'
    
    # Then: Should create a new commit
    [ "$status" -eq 0 ]
    git_commits_after=$(git rev-list --count HEAD)
    [ "$git_commits_after" -gt "$git_commits_before" ]
    
    # And: Commit message should mention the issue
    latest_commit_msg=$(git log -1 --pretty=%s)
    [[ "$latest_commit_msg" =~ "issue #247" ]]
}

@test "document phase updates TDD state to DOCUMENT" {
    # Given: TDD state in COVER phase  
    cat > .tdd-state << 'EOF'
ISSUE=247
CRITERIA=1
PHASE=COVER
TOTAL=1
EOF
    
    # When: Running tdd document with no input
    run bash -c 'echo "" | ./tdd document'
    
    # Then: TDD state should be updated
    [ "$status" -eq 0 ]
    source .tdd-state
    [ "$PHASE" = "DOCUMENT" ]
}

@test "tdd help shows document command and updated workflow" {
    # When: Running tdd help
    run ./tdd help
    
    # Then: Should show document command
    [ "$status" -eq 0 ]
    [[ "$output" =~ "document.*Capture project learnings" ]]
    [[ "$output" =~ "RED → GREEN → REFACTOR → COVER → DOCUMENT → NEXT" ]]
}