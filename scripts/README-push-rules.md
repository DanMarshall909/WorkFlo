# Push Rules Setup and Installation

This directory contains scripts and tools to enforce the dev branch strategy and maintain code quality.

## 🚀 Quick Setup

### 1. Install Pre-Push Hook (Recommended)

```bash
# Copy and install the pre-push hook
cp scripts/pre-push-hook .git/hooks/pre-push
chmod +x .git/hooks/pre-push

echo "✅ Pre-push hook installed successfully"
```

### 2. Test the Setup

```bash
# This should succeed (dev branch)
git checkout dev
echo "test" > test-file.txt
git add test-file.txt
git commit -m "test: verify push rules"
git push origin dev

# Clean up
git reset --hard HEAD~1
rm test-file.txt
```

### 3. Verify Rules Work

```bash
# This should be blocked (main branch)
git checkout main
git push origin main  # Should fail with pre-push hook

# This should be blocked (feature branch)
git checkout -b feature/test
git push origin feature/test  # Should fail with pre-push hook
```

## 📋 Available Scripts

### `pre-push-hook`

- **Purpose**: Local git hook to catch rule violations before they reach GitHub
- **Installation**: Copy to `.git/hooks/pre-push`
- **Features**:
  - Blocks pushes to main branch
  - Blocks pushes to feature branches
  - Runs quality checks on dev branch
  - Validates commit message format

### `pr-quality-check.sh --pre-push`

- **Purpose**: Lightweight quality checks for pre-push validation
- **Usage**: Called automatically by pre-push hook
- **Features**:
  - Fast build verification
  - Basic test run
  - Linting checks
  - Skips heavy operations (coverage, mutation testing)

## 🔧 Rule Enforcement Layers

### Layer 1: Local Pre-Push Hook (Optional but Recommended)

- **Speed**: Instant feedback
- **Scope**: Catches violations before push
- **Installation**: Manual (per developer)

### Layer 2: GitHub Actions (Mandatory)

- **Speed**: ~30 seconds after push
- **Scope**: Catches all violations with detailed error messages
- **Installation**: Automatic (repository-wide)

### Layer 3: Branch Protection (If Available)

- **Speed**: Immediate for protected branches
- **Scope**: GitHub Pro feature only
- **Installation**: Repository settings

## 🚨 Common Scenarios and Solutions

### Scenario 1: Accidentally Pushed to Main

```bash
# If caught by pre-push hook:
# Hook prevents the push - no action needed

# If pushed to GitHub:
# GitHub Actions will reject and provide instructions
git checkout dev
git cherry-pick <commit-hash>
git push origin dev
```

### Scenario 2: Working on Feature Branch

```bash
# Current state: feature/my-feature with changes

# Solution:
git checkout dev
git merge feature/my-feature
git branch -D feature/my-feature
git push origin dev
```

### Scenario 3: Need to Update Dev from Main

```bash
# After a release has been merged to main
git checkout dev
git pull origin main
git push origin dev
```

### Scenario 4: Quality Checks Fail in Pre-Push

```bash
# Fix the issues reported
./scripts/pr-quality-check.sh

# Or skip pre-push checks temporarily (not recommended)
git push origin dev --no-verify
```

## 🛠️ Customization

### Modify Pre-Push Hook

Edit `scripts/pre-push-hook` to:

- Add custom quality checks
- Modify branch rules
- Add team-specific validations

### Extend GitHub Actions

Edit `.github/workflows/push-rules-enforcement.yml` to:

- Add additional rule checks
- Modify error messages
- Add team notifications

### Configure Quality Checks

Edit `scripts/pr-quality-check.sh` to:

- Add new quality gates
- Modify thresholds
- Add project-specific checks

## 🔍 Troubleshooting

### Pre-Push Hook Not Working

```bash
# Check if hook is installed
ls -la .git/hooks/pre-push

# Check if hook is executable
chmod +x .git/hooks/pre-push

# Test hook manually
.git/hooks/pre-push
```

### Quality Checks Failing

```bash
# Run checks manually to see detailed output
./scripts/pr-quality-check.sh --pre-push

# Run individual components
dotnet build
dotnet test
dotnet format --verify-no-changes
```

### GitHub Actions Not Triggering

```bash
# Check workflow file syntax
gh workflow list

# Check recent runs
gh run list --limit 5

# View specific run
gh run view <run-id>
```

## 📊 Monitoring and Metrics

### Check Rule Compliance

```bash
# View recent push attempts
gh run list --workflow="Push Rules Enforcement"

# Check for violations
gh run list --status=failure --workflow="Push Rules Enforcement"
```

### Team Adoption

```bash
# Check which developers have pre-push hook installed
# (This requires team coordination - no automatic way to check)
```

## 🎯 Best Practices

### For Developers

1. **Install pre-push hook** for immediate feedback
2. **Work only on dev branch** - no exceptions
3. **Run quality checks** before pushing: `./scripts/pr-quality-check.sh`
4. **Use conventional commits** for better history
5. **Create PRs only when ready** for production

### For Team Leads

1. **Monitor GitHub Actions** for rule violations
2. **Review push rule documentation** with new team members
3. **Update rules as needed** based on team feedback
4. **Ensure CI/CD pipeline** reflects current rules

### For Repository Maintenance

1. **Keep workflows updated** with latest best practices
2. **Review and update documentation** regularly
3. **Monitor performance** of quality checks
4. **Collect feedback** from developers

## 📚 Related Documentation

- [Main Push Rules Documentation](../docs/push-rules.md)
- [Development Workflow](../CLAUDE.md#development-workflow)
- [Quality Check Scripts](./README.md)
- [GitHub Actions Workflows](../.github/workflows/README.md)

---

**Need Help?**

- Check the [troubleshooting section](#troubleshooting) above
- Review [GitHub Actions logs](https://github.com/DanMarshall909/WorkFlo/actions)
- Ask in team chat or create an issue
