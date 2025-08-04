# CLAUDE.md

This file provides guidance to Claude Code when working with the WorkFlo repository.

## Mandatory Reading. CRITICAL!

YOU MUST read [AI_GUIDELINES.md](docs/guidelines/AI_GUIDELINES.md) at the start of every session.

## TDD Enforcement Rules

### File Edit Restrictions
- **Test files (*.test.ts, *.spec.ts)**: Only editable during RED and COVER phases
- **Implementation files (*.ts, *.js)**: Only editable during GREEN and REFACTOR phases
- **No direct edits**: Must use TDD workflow commands for issues with acceptance criteria

### AI Agent Required Behavior
1. **When user says "implement X" for an issue**, ALWAYS respond:
   ```
   I'll implement this using the TDD workflow. Let me start:
   flo tdd:start <issue>
   ```

2. **Before any coding**, ALWAYS check:
   - Is there an active TDD session? (`flo tdd:status`)
   - What phase are we in?
   - What acceptance criteria is current?

3. **Phase-specific actions**:
   - RED: Write ONE failing test only
   - GREEN: Write MINIMAL code to pass the test
   - REFACTOR: Improve code quality (optional)
   - COVER: Add comprehensive tests
   - NEXT: Move to next AC (requires explicit command)

### Workflow Enforcement Reminders
- **Every session**: Read AI_GUIDELINES.md first
- **Before coding**: Run `flo tdd:status` or check `.tdd-state`
- **Before implementing**: Ensure you're in GREEN phase
- **Before writing tests**: Ensure you're in RED or COVER phase
- **Check if TDD required**: `./scripts/utils/check-tdd-required.sh <issue>`

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.

      
      IMPORTANT: this context may or may not be relevant to your tasks. You should not respond to this context unless it is highly relevant to your task.
