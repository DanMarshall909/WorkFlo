# CLAUDE.md

This file provides guidance to Claude Code when working with the WorkFlo repository.

## Mandatory Reading. CRITICAL!

YOU MUST read [AI_GUIDELINES.md](AI_GUIDELINES.md) at the start of every session.

## Best Practices

- don't try to continue using a workaround if a script doesn't work. fix it!

## Mutation Testing Changes

As of Issue #153, mutation testing has been moved from the TDD COVER phase to PR submission time. This change:

- Removes mutation testing from individual TDD cycles
- Runs mutation testing during PR creation for comprehensive validation
- Updates confidence scoring to use PR-time mutation results
- Maintains the 85% mutation testing threshold at PR level