# Migration Guide: Commander.js to oclif

This document outlines the breaking changes in the flo-cli refactoring from commander.js to oclif.

## Overview

The flo-cli has been completely refactored from a complex commander.js implementation with 16+ options to a clean oclif structure with focused subcommands. This change dramatically simplifies the CLI interface and improves maintainability.

## Breaking Changes

### Command Structure Changes

#### Auto Command
**Old (commander.js):**
```bash
flo-cli auto --status
flo-cli auto 123 --parse-only
flo-cli auto 123 --init-session
flo-cli auto 123 --orchestrator --delegate-orchestrator
```

**New (oclif):**
```bash
flo-cli auto:status
flo-cli auto:run 123 --parse-only
flo-cli auto:init 123
flo-cli auto:run 123  # Simplified - removed complex orchestrator options
```

#### Generate Tests Command
**Old:**
```bash
flo-cli generate-tests --issue 123 --output tests/output.test.ts
```

**New:**
```bash
flo-cli generate-tests 123 tests/output.test.ts
```

#### Parse AC Command
**Old:**
```bash
flo-cli parse-ac --issue 123
```

**New:**
```bash
flo-cli parse-ac 123
```

### Removed Options

The following options have been removed as part of the simplification:
- `--red-phase`
- `--init-state` 
- `--execute-phases`
- `--execute-red`
- `--sequential`
- `--check-sequential`
- `--orchestrator`
- `--delegate-orchestrator`
- `--compatibility`
- `--tdd-integration`

These complex workflow options were consolidated into the simpler `auto:init` and `auto:run` commands.

### JSON Output

JSON output is now consistently available with the `--json` flag on all commands:
```bash
flo-cli auto:status --json
flo-cli auto:run 123 --parse-only --json
flo-cli parse-ac 123 --json
```

## Migration Steps

1. **Update Scripts**: Search for any scripts using the old command syntax and update them
   ```bash
   # Find old usage
   grep -r "flo-cli auto --" .
   grep -r "flo-cli generate-tests --issue" .
   ```

2. **Update CI/CD**: Update any CI/CD pipelines using the old commands

3. **Update Documentation**: Update any documentation referencing the old command structure

## Benefits of the New Structure

1. **Clearer Intent**: Subcommands like `auto:status` and `auto:init` are more explicit
2. **Better Help**: Each subcommand has its own focused help text
3. **Type Safety**: oclif provides better TypeScript integration
4. **Extensibility**: Easier to add new commands without option conflicts
5. **Consistency**: All commands follow the same patterns

## Getting Help

View available commands:
```bash
flo-cli --help
```

View auto subcommands:
```bash
flo-cli auto --help
```

View specific command help:
```bash
flo-cli auto:status --help
flo-cli generate-tests --help
```

## Support

If you encounter issues during migration, please report them at:
https://github.com/anthropics/claude-code/issues