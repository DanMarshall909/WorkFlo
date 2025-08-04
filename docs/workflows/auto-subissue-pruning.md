# Automatic Subissue Pruning and Test Traceability

WorkFlo includes automatic cleanup features to maintain a clean issue tracker and improve test traceability.

## Automatic Subissue Pruning

When a TDD workflow completes all acceptance criteria, WorkFlo automatically cleans up orphaned test subissues.

### How It Works

1. **Completion Detection**: When `tdd next` advances past the final criteria, the workflow detects completion
2. **Auto-Cleanup**: The system automatically runs `cleanup-orphaned-subissues.sh`
3. **Selective Cleanup**: Only subissues whose parent issues are closed get pruned
4. **Graceful Handling**: Cleanup runs silently in the background without disrupting the workflow

### Manual Cleanup

You can also run cleanup manually:

```bash
./cleanup-orphaned-subissues.sh
```

### Features

- **Rate Limited**: Includes automatic rate limiting (100ms delays) to avoid GitHub API limits
- **Accurate Counting**: Uses process substitution to avoid subshell issues with counters
- **Safe Operation**: Only closes subissues when parent issue is confirmed closed
- **Detailed Logging**: Provides comprehensive feedback about cleanup operations

## Issue Number Embedding in Tests

All test scripts now include embedded issue numbers for easy traceability.

### Test Script Structure

Generated test scripts include:

```bash
#!/bin/bash
# Test description
# Related to issue #168: Issue title from GitHub

# Test implementation...
echo "📋 Issue: #168 - Issue title"
```

### Easy Lookup

Find all tests related to a specific issue:

```bash
# Find tests for issue #168
grep -r '#168' test-*.sh

# Example output:
test-cover-phase.sh:# Related to issue #168: URGENT: Fix COVER and REFACTOR phases
test-refactor-phase.sh:# Related to issue #168: URGENT: Fix COVER and REFACTOR phases
```

## Test Script Generation

Use the `generate-test-script.sh` utility to create standardized test scripts:

### Usage

```bash
./generate-test-script.sh <issue_number> <test_name> [description]
```

### Examples

```bash
# Generate a test script for issue #168
./generate-test-script.sh 168 test-refactor-phase "Test REFACTOR phase functionality"

# Creates: test-refactor-phase.sh with embedded issue number
```

### Features

- **Automatic Issue Title Fetching**: Retrieves issue title from GitHub API
- **Name Sanitization**: Removes special characters from test file names
- **Template Integration**: Includes test assertion library integration
- **Standard Structure**: Consistent format across all generated tests

## Benefits

1. **Reduced Clutter**: Completed subissues don't accumulate in your issue tracker
2. **Better Traceability**: Easy to find tests related to specific issues
3. **Automated Maintenance**: No manual cleanup required
4. **Consistent Format**: All test scripts follow the same structure
5. **Zero Disruption**: Features work automatically without changing existing workflows

## Integration Points

- **TDD Workflow**: Auto-pruning integrated at natural completion points
- **Test Generation**: Issue numbers embedded automatically in all new tests
- **GitHub Integration**: Uses GitHub CLI for safe, authenticated operations
- **Error Handling**: Graceful fallbacks when GitHub API is unavailable