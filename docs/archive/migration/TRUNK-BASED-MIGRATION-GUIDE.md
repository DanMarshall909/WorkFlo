# Migration Guide: Trunk-Based Development

**Status**: ✅ COMPLETED - This migration has been successfully completed.

This guide documents the migration from dev-branch workflow to trunk-based development that was completed as part of issues #23, #24, and #25.

## Overview

WorkFlo has successfully migrated from a dev-branch workflow to trunk-based development. This document serves as a reference for understanding the changes and helping existing contributors adapt to the new workflow.

## What Changed

### Before (Dev-Branch Workflow)
- **dev branch**: Main development branch where all work happened
- **main branch**: Production branch, only updated through dev → main merges
- **Workflow**: All changes made on dev, then merged to main periodically

### After (Trunk-Based Development)
- **master branch**: Main development branch (trunk) where feature branches merge
- **main branch**: Production branch (unchanged, still protected)
- **feature branches**: Short-lived branches for individual features/issues
- **test branches**: Optional sub-branches for complex features
- **Workflow**: feature → master → main (periodically)

## Branch Structure

```
main (production)
 ↑
master (trunk/development)
 ↑
feature/123-add-new-feature
 ↑
test/123-1-implement-core (optional)
test/123-2-add-tests (optional)
```

## New Workflow Process

### 1. Starting Work on a New Issue

**Old Way:**
```bash
git checkout dev
git pull origin dev
# Work directly on dev branch
```

**New Way:**
```bash
git checkout master  # or use ./scripts/sw <issue_number>
git pull origin master
git checkout -b feature/123-add-new-feature
```

### 2. Making Changes

**Old Way:**
```bash
# Work on dev branch
git add .
git commit -m "feat: add new feature"
git push origin dev
```

**New Way:**
```bash
# Work on feature branch
git add .
git commit -m "feat: add new feature"
git push origin feature/123-add-new-feature
```

### 3. Creating Pull Requests

**Old Way:**
```bash
# PR: dev → main (when ready for production)
gh pr create --base main --head dev
```

**New Way:**
```bash
# PR: feature → master (for review and integration)
gh pr create --base master --head feature/123-add-new-feature

# Later: master → main (periodic production releases)
# This is typically done by maintainers
```

## Script Updates

All WorkFlo scripts have been updated to support the new workflow:

### Key Changes
- **Default branch**: Scripts now default to `master` instead of `dev`
- **Configurable**: Use `WORKFLO_MAIN_BRANCH` environment variable to override defaults
- **Backward compatible**: Scripts still work if you have legacy setup

### Updated Scripts
- ✅ `enhanced-start-work.sh` (./sw) - Creates feature branches from master
- ✅ `safe-commit.sh` (./sc) - Validates commits on feature branches
- ✅ `dev-workflow.sh` - Now works with master as trunk
- ✅ `merge-to-main.sh` - Merges master → main (for production releases)
- ✅ `complete-subissue.sh` - Manages test → feature branch workflow
- ✅ `create-feature-branches.sh` - Creates feature branch structure

## Environment Configuration

The migration introduces the `WORKFLO_MAIN_BRANCH` environment variable:

```bash
# Current default (trunk-based development)
export WORKFLO_MAIN_BRANCH=master

# Legacy compatibility (if needed)
export WORKFLO_MAIN_BRANCH=dev
```

Add this to your shell profile (`.bashrc`, `.zshrc`, etc.) if you need to override the default.

## Documentation Updates

All documentation has been updated to reflect trunk-based development:

- ✅ **CLAUDE.md** - Updated with new branching strategy and workflow instructions
- ✅ **scripts/README.md** - Updated enforcement documentation
- ✅ **scripts/README-CI-Monitoring.md** - Updated monitoring examples
- ✅ **scripts/README-push-rules.md** - Updated push rules documentation
- ✅ **PROGRESS.md** - Reflects completed migration status

## Common Tasks - Quick Reference

### Starting New Work
```bash
# Use the enhanced start-work script (recommended)
./scripts/sw 123  # Automatically creates feature/123-<title> branch

# Or manually:
git checkout master
git pull origin master  
git checkout -b feature/123-description
```

### Committing Changes
```bash
# Use safe-commit for quality checks (recommended)
./scripts/sc "feat: implement new feature"

# Or standard git:
git add .
git commit -m "feat: implement new feature"
```

### Creating Pull Requests
```bash
# Feature branch to master (most common)
gh pr create --base master --title "feat: implement issue #123"

# Master to main (for production releases - usually done by maintainers)
gh pr create --base main --head master --title "release: deploy latest changes"
```

### Quality Checks
```bash
# Run quality checks (works on any branch)
./scripts/pr-quality-check.sh

# Development workflow (with quality checks)
./scripts/dev-workflow.sh
```

## Troubleshooting

### "Not on master branch" Errors
If you see errors about being on the wrong branch:
1. Check current branch: `git branch --show-current`
2. Switch to master: `git checkout master`
3. Update: `git pull origin master`
4. Create feature branch: `git checkout -b feature/your-feature`

### Legacy References
If you encounter references to "dev branch" in:
- **Error messages**: Update the script (they should all be updated now)
- **Documentation**: Please report as an issue - they should all be updated
- **Your own notes/bookmarks**: Update them to use master instead of dev

### Environment Variables
If scripts seem to be using the wrong branch:
```bash
# Check current setting
echo $WORKFLO_MAIN_BRANCH

# Set to master (trunk-based development)
export WORKFLO_MAIN_BRANCH=master

# Make permanent by adding to your shell profile
echo 'export WORKFLO_MAIN_BRANCH=master' >> ~/.bashrc  # or ~/.zshrc
```

## FAQ

### Q: What happened to the dev branch?
**A:** The dev branch workflow has been replaced by trunk-based development. The master branch now serves as the main development trunk.

### Q: Can I still use the old workflow?
**A:** The scripts maintain backward compatibility, but the new trunk-based workflow is recommended. Set `WORKFLO_MAIN_BRANCH=dev` if you need to use legacy workflow temporarily.

### Q: What about existing feature branches based on dev?
**A:** Existing branches can be rebased onto master or merged using the legacy workflow. Contact maintainers if you need help with migration.

### Q: How often is master merged to main?
**A:** Master is merged to main periodically for production releases, typically when a set of features is ready for production deployment.

### Q: Do I need to change my local setup?
**A:** Minimal changes needed:
1. Switch your default branch from dev to master
2. Update any personal scripts/aliases that reference dev branch
3. Set `WORKFLO_MAIN_BRANCH=master` in your environment (optional, it's the default)

### Q: What about CI/CD workflows?
**A:** CI/CD has been updated to work with the new branch structure. Feature branches run tests, master gets additional integration tests, main has production deployment workflows.

## Migration Checklist for Contributors

- [ ] Update local repository: `git checkout master && git pull origin master`
- [ ] Set environment variable: `export WORKFLO_MAIN_BRANCH=master` (optional)
- [ ] Update personal scripts/aliases that reference dev branch
- [ ] Create feature branches for new work instead of working on dev
- [ ] Update bookmarks/documentation to reference new workflow
- [ ] Test the new workflow with a small change

## Support

If you encounter issues with the migration:

1. Check this guide for common solutions
2. Verify your environment variables: `echo $WORKFLO_MAIN_BRANCH`
3. Update to latest scripts: `git pull origin master`
4. Create an issue in the repository if problems persist

## Migration Timeline

- **Phase 1** (Issue #24): ✅ Updated enforcement scripts for configurable branches
- **Phase 2** (Issue #25): ✅ Updated all documentation for trunk-based development  
- **Phase 3**: ✅ Migration completed, all systems using trunk-based development

**Migration Status**: ✅ **COMPLETED** - The repository now fully uses trunk-based development.