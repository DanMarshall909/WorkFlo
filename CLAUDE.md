# CLAUDE.md

This file provides guidance to Claude Code when working with the WorkFlo repository.

## Ultra-Minimal TDD Workflow

This repository enforces **ONE acceptance criteria at a time** with hard stops to prevent AI agents from "running off" and doing multiple things.

### Core Constraint

**🚫 HARD RULE: Work on exactly ONE acceptance criteria, write ONE test, then STOP.**

### TDD Command Usage

```bash
# Start TDD workflow for a GitHub issue
./tdd start <issue_number>

# Follow the enforced TDD cycle:
./tdd red        # Write ONE failing test for current criteria
./tdd green      # Minimal implementation to pass the test  
./tdd refactor   # Improve code quality (optional)
./tdd cover      # Add comprehensive test coverage + mutation testing
./tdd next       # Move to next criteria (HARD STOP - must be explicit)

# Check current status
./tdd status
```

### TDD Cycle Enforcement

**Required sequence (no skipping allowed):**
1. **RED** → Write ONE failing test for current acceptance criteria
2. **GREEN** → Minimal implementation to make test pass
3. **REFACTOR** → Improve code quality (optional)
4. **COVER** → Add comprehensive tests + mutation testing (85% threshold)
5. **NEXT** → Hard stop, must explicitly continue to next criteria

### Progressive Disclosure

- Only ONE acceptance criteria is visible at a time
- Hard stops between criteria prevent scope creep
- Each phase requires explicit command to continue
- All phases result in commits with structured messages

### Quality Gates

- **Tests must pass** before advancing phases
- **Mutation testing** required in COVER phase (85% threshold)
- **Automatic commits** for each TDD phase with structured messages
- **No skipping** of TDD phases allowed

### Issue Format Required

GitHub issues must have acceptance criteria in this format:

```markdown
- [ ] First acceptance criteria
- [ ] Second acceptance criteria  
- [ ] Third acceptance criteria
```

### Repository Structure

- `./tdd` - Ultra-minimal TDD command (main workflow)
- `legacy/` - All previous complex scripts (archived)
- `.tdd-state` - Current session state (auto-managed)

## Key Principles

1. **Tunnel Vision**: Only current criteria visible to AI
2. **Hard Stops**: Explicit commands required between criteria
3. **Phase Enforcement**: Must follow RED→GREEN→REFACTOR→COVER→NEXT
4. **Quality First**: Mutation testing and comprehensive coverage required
5. **Minimal Complexity**: Single 300-line script replaces entire complex system

## Prerequisites

- GitHub CLI (`gh`) with authentication
- `jq` for JSON processing: `sudo apt-get install jq`
- `bc` for calculations: `sudo apt-get install bc`
- .NET SDK for running tests and mutation testing

This system is designed to constrain AI agents to focused, high-quality development with built-in stops to prevent scope creep.