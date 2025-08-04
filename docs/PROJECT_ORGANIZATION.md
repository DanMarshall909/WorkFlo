# Project Organization

This document describes the organization of the WorkFlo project after restructuring for better maintainability.

## Directory Structure

### `/docs/` - Documentation
- **`guidelines/`** - Development and AI guidelines
  - `AI_GUIDELINES.md` - Guidelines for AI development
  - `TYPESCRIPT_BEST_PRACTICES.md` - TypeScript coding standards
  - `GEMINI.md` - Gemini AI provider documentation
- **`workflows/`** - Workflow and process documentation
  - `auto-tdd-workflow.md` - Automated TDD workflow documentation
  - `auto-subissue-pruning.md` - Subissue management workflow
  - `multi-ac-clean-flow.md` - Multi-acceptance criteria workflow
  - Status and review documents
- **`architecture/`** - Architecture documentation (future use)

### `/scripts/` - Shell Scripts and Utilities
- **`legacy/`** - Legacy bash scripts being migrated to TypeScript. ** DELETE AS THEY ARE REPLACED **
  - `tdd` - Original TDD workflow script
  - `tdd-auto` - Automated TDD script
  - `common.sh` - Common utilities
  - `project-detection.sh` - Project type detection
  - Other legacy helper scripts
- **`test/`** - Test-related shell scripts
  - `test-*.sh` - Various test automation scripts
- **`utils/`** - Utility scripts
  - `ai-loader.sh` - AI provider loading
  - `bulk-cleanup-subissues.sh` - Issue cleanup utilities
  - `generate-test-script.sh` - Test generation utilities
  - Build and maintenance scripts

### `/tests/` - Integration and System Tests
- BATS test files for system-level testing
- Legacy analysis tests
- Feature integration tests

### `/flo-cli/` - TypeScript CLI Application
- Well-organized TypeScript project
- `/src/commands/` - CLI command implementations
- `/src/services/` - Business logic services
- `/tests/` - Unit tests

### `/vscode-extension/` - VS Code Extension
- TypeScript-based VS Code extension
- Provides WorkFlo integration in VS Code

### `/ai-providers/` - AI Provider Configurations
- Shell scripts for different AI providers
- `claude.sh`, `gemini.sh`, `fallback.sh`

## Root Directory
Only essential files remain in the root:
- `README.md` - Main project documentation
- `CLAUDE.md` - Claude Code instructions
- `LICENSE` - Project license
- `package.json` - Root package configuration
- Configuration files (`.gitignore`, etc.)

## Migration Status
- ✅ Shell scripts organized by purpose
- ✅ Documentation categorized by type
- ✅ Test files consolidated
- ✅ Root directory cleaned up
- ✅ Documentation updated
- ✅ **PR Automation System** - Modern TypeScript implementation complete (Issue #325)
- 🔄 Legacy scripts being migrated to TypeScript CLI

## Recent Completions

### ✅ PR Automation with Modern GitHub Integration (Issue #325)
**Status**: Complete - All 7 acceptance criteria implemented

**Features Implemented**:
- **Command Interface**: Full PR automation flags (`--auto-pr`, `--no-pr`, `--draft-pr`, `--pr-template`, `--assign-reviewers`)
- **Intelligent PR Generation**: AI/template-based PR descriptions
- **Smart Templates**: Multiple templates based on issue type/size
- **Automatic Linking**: Related issues and dependencies detection
- **Branch Naming**: Configurable smart patterns
- **Draft Support**: Work-in-progress PR creation
- **Reviewer Assignment**: Automatic based on code changes
- **Flag Validation**: Conflict detection and proper error handling

**Command Examples**:
```bash
flo auto:run 312 --auto-pr                    # Enable auto-PR (default)
flo auto:run 312 --no-pr                      # Skip PR creation  
flo auto:run 312 --draft-pr                   # Create as draft PR
flo auto:run 312 --pr-template custom         # Use custom template
flo auto:run 312 --assign-reviewers           # Auto-assign reviewers
```

**Testing**: All 14 PR automation tests passing
**Integration**: Seamlessly integrated with autonomous TDD workflow

## Benefits of This Organization
1. **Clear separation of concerns** - Each directory has a specific purpose
2. **Easier navigation** - Developers can quickly find relevant files
3. **Better maintainability** - Related files are grouped together
4. **Cleaner root directory** - Only essential files at the top level
5. **Migration-friendly** - Clear path from legacy scripts to modern TypeScript CLI