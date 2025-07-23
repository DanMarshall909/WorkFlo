# CI Monitoring Git Hooks

This directory contains git hooks that automatically monitor CI status to ensure work isn't considered "done" until CI passes.

## 🎯 Purpose

After experiencing the issue where local tests passed but CI failed, these hooks ensure:

1. **Pre-push awareness**: Check existing CI status before pushing
2. **Post-push monitoring**: Automatically track CI progress after pushing
3. **Work completion enforcement**: CI must pass before work is considered done
4. **Quality gates**: Run local checks before allowing push

## 📦 Components

### `pre-push-hook-enhanced`

Enhanced pre-push hook that:

- ✅ Enforces trunk-based workflow (blocks pushes to production main branch)
- ✅ Checks existing PR CI status before allowing new pushes
- ✅ Runs quality checks (build, test, format)
- ✅ Validates conventional commit format
- ✅ Sets up post-push CI monitoring

### `post-push-ci-monitor.sh`

Standalone CI monitoring script that:

- 🔄 Monitors CI progress in real-time
- ⏱️ Waits up to 5 minutes for CI completion
- 📊 Shows pass/fail/pending status summary
- ❌ Enforces that work is NOT complete until CI passes
- 🌐 Opens PR in browser for detailed review

### `install-ci-monitoring-hooks.sh`

One-command installation script that:

- 🔧 Installs both hooks with proper permissions
- 💾 Backs up existing hooks
- ✅ Verifies dependencies (GitHub CLI, .NET)
- ⚙️ Creates configuration file
- 📚 Provides usage instructions

## 🚀 Quick Start

```bash
# 1. Install the hooks (one-time setup)
./scripts/install-ci-monitoring-hooks.sh

# 2. Make sure GitHub CLI is authenticated
gh auth login

# 3. That's it! Now every push will:
#    - Run quality checks
#    - Monitor CI automatically
#    - Enforce CI success before considering work complete
```

## 📋 Workflow Example

```bash
# 1. Make changes on feature branch
git checkout -b feature/123-new-feature
# ... make changes ...

# 2. Commit with conventional format
git add .
git commit -m "fix: resolve CI formatting issues"

# 3. Push (triggers automatic CI monitoring)
git push origin dev

# Output:
# 🔍 Pre-push hook: Checking push rules for branch 'feature/123-new-feature'
# ✅ ALLOWED: Pushing to feature branch
# ℹ️ Found existing PR #39
# ⚠️ Previous CI run has 8 failing check(s)
# Are you pushing fixes for these failures? (y/N) y
# ✅ Pre-push checks completed successfully
#
# [Push completes]
#
# 🔄 Post-Push CI Monitoring
# ℹ️ Branch: dev
# ℹ️ Repository: DanMarshall909/WorkFlo
# ✅ Found PR #39
# ℹ️ Monitoring CI status for PR #39...
#
# ℹ️ CI Status Summary:
#   🔴 Failing: 8
#   🟡 Pending: 2
#   🟢 Passing: 25
#   📊 Total: 35
#
# ⏳ Checking CI... Failing: 3, Pending: 0, Passing: 32/35
#
# ❌ CI checks failed!
# ❌ CI Failures detected. Details:
#   ❌ build-and-test	fail	1m4s
#   ❌ Code Formatting Check	fail	1m15s
#   ❌ .NET Code Analysis	fail	53s
#
# ❌ Work is NOT complete until CI passes
# ℹ️ Fix the issues above and push again
```

## ⚙️ Configuration

Edit `.git/ci-monitor-config` to customize:

```bash
# Maximum time to wait for CI completion (seconds)
MAX_WAIT_TIME=300

# Check interval for CI status (seconds)
CHECK_INTERVAL=30

# Require CI success before considering work complete
REQUIRE_CI_SUCCESS=true

# Branches to monitor
MONITOR_BRANCHES=master  # or feature branches

# Enable post-push CI monitoring
ENABLE_CI_MONITOR=true
```

## 🛠️ Manual Commands

```bash
# Check CI status anytime
gh pr checks <PR_NUMBER>

# Monitor CI with live updates
gh pr checks <PR_NUMBER> --watch

# Run CI monitor manually
./scripts/post-push-ci-monitor.sh

# View PR in browser
gh pr view <PR_NUMBER> --web

# Check current PR for feature branch
gh pr list --head dev
```

## 🔍 Troubleshooting

### GitHub CLI Issues

```bash
# Check if authenticated
gh auth status

# Login if needed
gh auth login

# Test access
gh pr list
```

### Hook Not Running

```bash
# Check hook is installed and executable
ls -la .git/hooks/pre-push
ls -la .git/hooks/post-commit

# Reinstall if needed
./scripts/install-ci-monitoring-hooks.sh
```

### Quality Checks Failing

```bash
# Run quality checks manually
./scripts/pr-quality-check.sh

# Basic build check
dotnet build

# Basic test check
dotnet test
```

## 🎯 Benefits

1. **Prevents CI Surprises**: No more "tests pass locally but fail in CI"
2. **Enforces Completion**: Work isn't done until CI passes
3. **Early Detection**: Catch issues before wasting time
4. **Process Enforcement**: Maintains trunk-based development workflow
5. **Quality Gates**: Ensures basic checks before push
6. **Real-time Feedback**: See CI progress immediately

## 🔄 Integration with CLAUDE.md Rules

This system enforces several rules from CLAUDE.md:

- ✅ **Trunk-based workflow**: Feature branches merge to master, main is protected
- ✅ **Quality gates**: Runs build/test checks
- ✅ **Conventional commits**: Validates commit format
- ✅ **CI monitoring**: Tracks completion status
- ✅ **Work completion**: Enforces CI success

## 📚 Related Scripts

- `pr-quality-check.sh`: Comprehensive quality analysis
- `pre-push-hook`: Original push rules enforcement
- `start-dev.sh`: Development environment setup
- GitHub Actions workflows: `.github/workflows/`

---

**Remember**: With these hooks installed, **work is NOT complete until CI passes** ✅
