# CLAUDE.md

This file provides guidance to Claude Code when working with the WorkFlo repository.

## Mandatory Reading. CRITICAL!

YOU MUST read [AI_GUIDELINES.md](AI_GUIDELINES.md) at the start of every session.

## Best Practices

- don't try to continue using a workaround if a script doesn't work. fix it!

## Test Generation System (Issue #204)

As of Issue #204, the repository includes a comprehensive TypeScript test generator system:

### flo-cli Test Generator
- **Location**: `flo-cli/src/test-generator.ts`
- **Command**: `flo-cli generate-tests --issue <number> --output <path>`
- **Features**: AST-based test insertion, multiple strategies, Jest/TypeScript output
- **Integration**: Works with GitHub issues via `gh` CLI
- **Validation**: Input validation, error handling, automatic directory creation
- **Testing**: Comprehensive edge case and error scenario coverage

### AST-Based Test Insertion
The test generator supports four insertion strategies:
- `new-file`: Create new test files
- `insert-before-end`: Insert into existing describe blocks
- `insert-at-marker`: Insert at comment markers
- `insert-new-describe`: Add new describe blocks

### Usage Examples
```bash
# Generate tests from GitHub issue
flo-cli generate-tests --issue 204 --output tests/feature.test.ts

# Mark acceptance criteria complete
flo-mark-ac 204 "Create CLI command for generation"
```

## Mutation Testing Changes

As of Issue #153, mutation testing has been moved from the TDD COVER phase to PR submission time. This change:

- Removes mutation testing from individual TDD cycles
- Runs mutation testing during PR creation for comprehensive validation
- Updates confidence scoring to use PR-time mutation results
- Maintains the 85% mutation testing threshold at PR level