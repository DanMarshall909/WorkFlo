# WorkFlo - Ultra-Minimal TDD Workflow

AI-powered workflow enforcement system that constrains agents to **ONE acceptance criteria at a time** with hard stops.

## Quick Start

```bash
# Install prerequisites
sudo apt-get install jq bc

# Start TDD workflow on a GitHub issue
./tdd start <issue_number>

# Follow the enforced TDD cycle
./tdd red        # Write ONE failing test
./tdd green      # Minimal implementation  
./tdd refactor   # Improve code quality (optional)
./tdd cover      # Add comprehensive tests + mutation testing
./tdd next       # Move to next criteria (HARD STOP)
```

## Core Constraint

**🚫 Work on exactly ONE acceptance criteria, write ONE test, then STOP.**

This prevents AI agents from "running off" and doing multiple things at once.

## Repository Structure

```
/
├── tdd              # Ultra-minimal TDD command (main workflow)
├── CLAUDE.md        # Instructions for Claude Code
├── README.md        # This file
└── legacy/          # All previous complex scripts (archived)
```

## Key Features

- **Progressive Disclosure**: Only current criteria visible to AI
- **Hard Stops**: Explicit commands required between criteria  
- **Phase Enforcement**: Must follow RED→GREEN→REFACTOR→COVER→NEXT
- **Quality Gates**: Mutation testing (85% threshold) required
- **Minimal Complexity**: Single 300-line script replaces entire complex system

## Requirements

- GitHub CLI (`gh`) with authentication
- `jq` for JSON processing  
- `bc` for calculations
- .NET SDK for tests and mutation testing

## Issue Format

GitHub issues must have acceptance criteria in this format:

```markdown
- [ ] First acceptance criteria
- [ ] Second acceptance criteria  
- [ ] Third acceptance criteria
```

---

**Built to constrain AI agents to focused, high-quality development with built-in stops to prevent scope creep.**