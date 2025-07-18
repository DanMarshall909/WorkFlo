# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the WorkFlo repository - an AI-powered workflow enforcement and development assistant.

# ⚠️ IMMEDIATE ACTIONS - READ FIRST ⚠️

## 🚨 MANDATORY SESSION STARTUP (DO THIS FIRST)

**BEFORE ANY DEVELOPMENT WORK, CLAUDE MUST:**

1. ✅ **Start workflow**: `./sw` (interactive issue selection + board integration)
2. ✅ **Check current feature**: Read from PROGRESS.MD. If the current issue (from GitHub) is not completed always continue until done unless explicitly overridden.
3. ✅ **Update PROGRESS.MD**: Update whenever significant changes occur (feature completion, major milestones, session transitions)
4. ✅ **Confirm branch**: `git branch` (should be on `master`)
5. ✅ **Acknowledge TDD requirement**: Red-Green-Refactor-Cover-Commit cycle with intelligent automation
6. ✅ **Enable enhanced TDD scripts**: Use `./scripts/tdd-auto-cycle.sh` and `./scripts/tdd-test-watcher.sh`
7. ✅ **Enable learning mode**: Explain advanced patterns during implementation

### 🎯 FEATURE SELECTION PROTOCOL

**When user says "next task" or requests a new task:**

1. ✅ **Interactive issue selection**: `./sw` (shows available issues + board status)
2. ✅ **Check current feature**: Read from PROGRESS.MD. If not completed always continue until done unless explicitly overridden.
3. ✅ **Identify next sequential task** (e.g., CLI Phase 2, API Phase 3, MCP Integration, etc.)
4. ✅ **Start issue work**: `./gb start <ISSUE_NUMBER>` (view details + begin work)
5. ✅ **Confirm task scope** with user before proceeding
6. ✅ **Use enhanced TDD scripts** for implementation with intelligent automation

### 📝 NEW GITHUB ISSUE CREATION PROTOCOL

**When creating a new GitHub issue for development work:**

#### 🔴 MANDATORY ISSUE STRUCTURE

```bash
# Create issue with required structure
gh issue create --title "Feature: [Component/Area] - [Brief Description]" --body "$(cat <<'EOF'
## 🎯 Business Objective
[Why this workflow enforcement feature matters - developer productivity, code quality, team collaboration]

## 📋 Acceptance Criteria
- [ ] [Specific behavioral requirement 1]
- [ ] [Specific behavioral requirement 2]
- [ ] [Specific behavioral requirement 3]
## 🧪 Test Specification (MANDATORY)
**All test cases MUST be defined before implementation. Use business-focused, scenario-based names as described in [Enterprise Craftsmanship: "You Naming Tests Wrong"](https://enterprisecraftsmanship.com/posts/you-naming-tests-wrong/).**

### Unit Tests Required:

- [ ] **Test 1**: [Short business scenario, e.g., "developer installs git hooks"]
  - **Scenario**: [Describe the workflow enforcement context and goal]
  - **Steps**:
    1. [Given: initial state/context]
    2. [When: action performed]
    3. [Then: expected outcome]

- [ ] **Test 2**: [Short business scenario, e.g., "hook blocks oversized commit"]
  - **Scenario**: [Describe the business context and goal]
  - **Steps**:
    1. [Given: initial state/context]
    2. [When: action performed]
    3. [Then: expected outcome]

> **Naming Rule:**
> - Name tests after business scenarios, not technical details.
> - Avoid "should" or technical phrasing.
> - Example:
>   - ❌ BAD: "should return tasks when API succeeds"
>   - ✅ GOOD: "user sees their task list after login"

### Integration Tests Required:
- [ ] **Integration 1**: [Component interaction scenario]
- [ ] **Integration 2**: [API/service interaction scenario]

## 🏗️ Technical Implementation Plan
- [ ] **Files to Create/Modify**:
  - `src/path/to/component.tsx` - [Purpose]
  - `src/path/to/hook.ts` - [Purpose]
  - `__tests__/path/to/test.test.ts` - [Test coverage]

- [ ] **Dependencies Required**: [List any new dependencies]
- [ ] **Breaking Changes**: [None/List any breaking changes]

## ✅ Definition of Done
- [ ] All acceptance criteria met
- [ ] 95%+ test coverage achieved
- [ ] All tests pass (unit + integration)
- [ ] Mutation testing 85%+ kill rate
- [ ] No TypeScript errors
- [ ] Component documented in Storybook (if applicable)
- [ ] Accessibility compliance verified
- [ ] Performance impact assessed

## 🔗 Related Issues
- Blocks: #[issue_number]
- Depends on: #[issue_number]
- Related to: #[issue_number]
EOF
)"
```

#### 🔴 ISSUE QUALITY GATES

**BEFORE creating any GitHub issue, VERIFY:**

1. ✅ **Business value is clear** - Why does this matter to users?
2. ✅ **Acceptance criteria are specific** - No vague requirements
3. ✅ **Test cases are comprehensive** - Cover all business scenarios
4. ✅ **Technical scope is bounded** - Clearly defined what's in/out
5. ✅ **Dependencies are identified** - What needs to be done first?
6. ✅ **Breaking changes are documented** - Impact on existing code

#### 🔴 ISSUE LABELING (MANDATORY)

```bash
# Issue management handled by scripts
./gb complete <ISSUE_NUMBER>              # Complete and close issue
./gb start <ISSUE_NUMBER>                 # Start work on issue (auto-labels)

# Label Categories (auto-applied by scripts):
# Type: feature, bug, enhancement, docs, refactor
# Priority: critical, high, medium, low
# Area: frontend, backend, testing, docs, devops
# Size: xs, small, medium, large, xl
```

### 🔴 CRITICAL ENFORCEMENT RULES

- **ALWAYS prioritize fixing existing PRs over new features**
- **ONLY work on `master` branch - NO feature branches**
- **WORKFLOW-FIRST DEVELOPMENT** - CLI tools and git hooks must be developed together with API backend
- **HOOK VALIDATION MANDATORY** - All git hooks must be tested in real git repositories
- **TEST-FIRST development - write failing tests before implementation. ONE AT A TIME!**
- **COVERAGE MANDATORY** - No commits without 95% branch coverage
- **FULL REVIEW OF ALL CHANGES BEFORE PR** - No PRs without full examination of changes.
- **MUTATION TESTING MANDATORY** - No PRs without 85% kill rate
- **GH CLEANUP** - Close the task once done, update PROGRESS.MD to the next suggested issue, but only once the ticket has be double checked for completeness. All features in the issue should be reviewed. ALL new code MUST be tested and those test MUST be justified against the issue.

### 🔴 DISCOVERY & ISSUE CREATION RULES

- **CREATE ISSUES FOR DISCOVERED WORK** - If something needs to be done that isn't in the current issue, create a new issue or sub-issue immediately
- **COMPLETE CURRENT WORK FIRST** - Don't interrupt current issue unless impractical to continue (e.g., blocking dependency discovered)
- **ADDRESS AMBIGUITY IMMEDIATELY** - Stop and clarify any ambiguous requirements with user before proceeding
- **NO SILENT ASSUMPTIONS** - All unclear requirements must be discussed and documented in the issue

### 🔍 MISSING COMPONENT DETECTION & DEPENDENCY VALIDATION

**BEFORE CREATING ANY PR, CLAUDE MUST:**

#### 🔴 Component Completeness Checklist

1. ✅ **Interface Implementations**: Every interface must have a concrete implementation

   - Example: `IEmailVerificationTokenService` → `EmailVerificationTokenService`
   - Validate all interfaces in `Application.Common.Interfaces` have implementations

2. ✅ **Dependency Injection Registration**: All services must be registered in DI container

   - Check `Configuration/*ServiceExtensions.cs` files
   - Verify all `AddScoped<IInterface, Implementation>()` registrations exist
   - Test DI resolution in integration tests

3. ✅ **Database Dependencies**: All entities must have repository implementations

   - Verify `IUserRepository`, `ITaskRepository`, etc. have implementations
   - Check Entity Framework configurations are complete

4. ✅ **API Endpoint Accessibility**: All endpoints must be testable

   - Change `internal` to `public` for endpoint classes
   - Verify endpoint tests can instantiate classes

5. ✅ **Configuration Dependencies**: All configuration sections must be defined
   - JWT settings, email service settings, database connections
   - Add default values for optional configurations

#### 🔴 Implementation Order (TDD-Driven Discovery)

**Always follow TDD cycle to discover dependencies naturally:**

1. **Write Failing Business Logic Tests** (RED) - Start with what the user needs
2. **Implement Minimal Handlers** (GREEN) - Just enough to make tests pass
3. **Discover Missing Dependencies** - Let test failures reveal what's needed
4. **Write Tests for Dependencies** (RED) - Test the discovered interface/service
5. **Implement Dependencies** (GREEN) - Minimal implementation to pass tests
6. **Add DI Registration** - When integration tests reveal missing registrations
7. **Refactor and Expand Coverage** - Clean up and add comprehensive tests

**Key Principle**: Let the TDD cycle drive dependency discovery, not upfront analysis.

#### 🔴 Pre-PR Validation Commands

```bash
# Component completeness validation
./scripts/validate-dependencies.sh      # Check all interfaces have implementations
./scripts/validate-di-registration.sh   # Check all services are registered
./scripts/validate-configuration.sh     # Check all config sections are defined

# Or use comprehensive validation
./qc                                    # Quality check includes dependency validation
```

#### 🔴 Common Missing Components (Learned from Issue #78)

**Watch for these frequently missed components:**

1. **Token Services**: JWT generation, validation, expiry handling
2. **Email Services**: SMTP configuration, template rendering
3. **Validation Services**: Input validation, business rule validation
4. **Configuration Services**: Settings binding, environment variables
5. **Background Services**: Scheduled tasks, queue processing
6. **Caching Services**: Redis, in-memory caching implementations
7. **Logging Services**: Structured logging, correlation IDs
8. **Security Services**: Authentication, authorization, encryption

### 🔚 MANDATORY SESSION CLEANUP

**BEFORE ENDING CLAUDE SESSION, CLAUDE MUST:**

1. ✅ **Session cleanup**: `./scripts/stop-progress-tracker.sh` (includes status check)
2. ✅ **Update PROGRESS.md**: Document current state for session continuity
3. ✅ **Verify board status**: Ensure GitHub board reflects current work state

### 📚 MANDATORY END-OF-ISSUE PROCESS LEARNINGS

**AFTER COMPLETING EACH ISSUE, CLAUDE MUST:**

1. ✅ **Document Process Learnings**: Capture what worked well and what could be improved
2. ✅ **Update CLAUDE.md**: Add learnings to benefit future development sessions
3. ✅ **Create Process Improvement PR**: Submit improvements to development workflow
4. ✅ **Validate Component Dependencies**: Ensure all required components are implemented and registered

#### 🎯 Process Learning Categories

**Document learnings in these areas:**

- **TDD Workflow**: Script effectiveness, test patterns, dependency discovery through tests
- **Architecture Patterns**: Component design, TDD-driven architecture, integration points
- **Quality Assurance**: Coverage gaps, testing strategies, review processes
- **Development Efficiency**: Script usage, workflow optimization, tool effectiveness
- **Security Considerations**: Privacy patterns, token management, validation approaches
- **Dependency Discovery**: How TDD cycle naturally reveals needed components

---

## 📋 SESSION ACKNOWLEDGMENT

**Confirm understanding of:**

- [ ] Session starts with `./sw` (requires `jq` installed: `sudo apt-get install jq`)
- [ ] Enhanced TDD workflow using intelligent automation scripts:
  - [ ] `./scripts/tdd-auto-cycle.sh` for phase detection and guidance
  - [ ] `./scripts/tdd-test-watcher.sh watch` for continuous monitoring
  - [ ] Configurable via environment variables (`WATCH_INTERVAL`, `TEST_TIMEOUT`, `PROGRESS_FILE`)
  - [ ] Smart change detection and resource optimization
- [ ] Quality checks using `./qc` script
- [ ] GitHub board synchronization via `./gb` commands
- [ ] Session ends with `./scripts/stop-progress-tracker.sh`
- [ ] User is learning advanced React/TypeScript concepts

**🔧 Dependencies Required:**

- `jq` - JSON processor for GitHub API interactions: `sudo apt-get install jq`

**📊 GitHub Board Integration:** See [Board Integration Guide](scripts/README-github-board-integration.md)
**⚡ Quick Commands:** See [Quick Commands Reference](docs/quick-commands-reference.md)

---

### **Best Practices to Apply**

- **Enterprise Architecture**: Clean architecture, SOLID principles
- **Functional Programming**: Pure components, immutable state
- **Performance**: React.memo, proper dependency arrays
- **Testing**: Property-based testing, behavior-driven tests
- **State Machines**: useReducer for complex state transitions

---

# Essential Development Information

## Core Principles

### Developer Experience (MANDATORY)

- **Rationale-first explanations**: Always explain WHY before WHAT
- **Workflow transparency**: Help developers understand enforcement decisions
- **Depth-on-demand**: Provide details only when requested

### Test-Driven Development (MANDATORY)

- **Red-Green-Refactor-Cover-Commit cycle**: No exceptions
- **ONE TEST AT A TIME**: Never write multiple tests simultaneously
  - Write ONE failing test (RED)
  - Write minimal implementation to pass (GREEN)
  - Refactor only if tests exist for that behavior (REFACTOR)
  - Add next single test case (COVER)
  - Commit when feature complete (COMMIT)
- **INTELLIGENT TDD AUTOMATION**: Use enhanced scripts for optimal workflow
  - **`./scripts/tdd-auto-cycle.sh`**: Automatically detects current TDD phase and suggests next steps
  - **`./scripts/tdd-test-watcher.sh watch`**: Continuous monitoring with smart change detection
  - **Dependency validation**: Scripts check for required tools (dotnet, grep, awk, sed)
  - **Configurable intervals**: Optimize resource usage with `WATCH_INTERVAL` environment variable
  - **Smart change detection**: Only runs tests when source files actually change
  - **Build validation**: Distinguishes between build failures and test failures
  - **Timeout protection**: Prevents hanging tests with configurable `TEST_TIMEOUT`

#### 🎯 TDD WORKFLOW LEARNINGS (From Issue #78)

**Enhanced TDD patterns that proved highly effective:**

1. **Test Configuration Management**

   - **Problem**: NSubstitute mocking of `IConfiguration.GetValue<T>()` is complex
   - **Solution**: Use `ConfigurationBuilder` with `AddInMemoryCollection()` for cleaner tests
   - **Example**:
     ```csharp
     var config = new ConfigurationBuilder()
         .AddInMemoryCollection(new Dictionary<string, string?> { ["Key"] = "Value" })
         .Build();
     ```

2. **JWT Token Testing Patterns**

   - **Problem**: Testing token expiry is difficult with real-time constraints
   - **Solution**: Create helper methods for expired token generation in tests
   - **Pattern**: Manual JWT creation with past expiry dates for deterministic testing

3. **TDD-Driven Dependency Discovery**

   - **Problem**: Building dependencies upfront leads to over-engineering
   - **Solution**: Let failing tests reveal exactly what dependencies are needed
   - **Order**: Business Tests → Handler → Missing Dependency Tests → Implementation → DI Registration

4. **Security Token Validation**

   - **Pattern**: Purpose-specific claims in JWT tokens prevent token misuse
   - **Implementation**: Add "purpose" claim to distinguish token types
   - **Validation**: Check purpose claim during token validation

5. **Test Naming Excellence**
   - **Pattern**: Business scenario names instead of technical "should" statements
   - **Example**: `user_can_verify_email_with_valid_token` not `should_verify_email_successfully`
   - **Benefit**: Tests read like business requirements documentation

- **UPFRONT TEST PLANNING**: All tests must be specified in GitHub issue before implementation
  - Every business rule documented with test cases
  - Complete test specification before any code
  - No implementation without comprehensive test plan
- **TEST NAMING RULES**: Focus on business scenarios, NOT technical implementation
  - **NEVER use "should"** - describes intention, not behavior
  - **Name the scenario being tested** - business-focused, not technical
  - **Format**: "Given [context] when [action] then [outcome]" or simplified scenario descriptions
  - **Examples**:
    - ❌ BAD: "should return user tasks" (technical focus)
    - ❌ BAD: "returns user tasks when API succeeds" (technical implementation detail)
    - ✅ GOOD: "user can view their task list" (business scenario)
    - ❌ BAD: "should handle API errors gracefully" (technical concern)
    - ✅ GOOD: "user sees empty state when tasks unavailable" (business outcome)
    - ❌ BAD: "should debounce save operations" (technical detail)
    - ✅ GOOD: "rapid changes save without data loss" (business value)
- **Coverage requirements**: 95% branch coverage EVERY COMMIT
- **Mutation testing**: 85% kill rate EVERY PR (local execution)
- **Test-first approach**: Write failing tests before implementation
- **NO COMMITS without coverage validation**
- **NO PRs without mutation testing**
- **AUTOMATED TDD WORKFLOW**: Use enhanced scripts for consistency and efficiency
- **ENFORCE SINGLE TEST RULE**: Claude must never add multiple test cases in one action

## Development Commands

### 🔄 FULL-STACK DEVELOPMENT (MANDATORY WORKFLOW)

**⚠️ IMPORTANT: Frontend and backend MUST be developed together as a single unit**

```bash
# Issue-Driven Development (RECOMMENDED)
./sw                                     # Start Work - GitHub issue selection + board integration
./scripts/start-dev.sh                   # Then start development environment

# Manual Start (if needed)
# 1. Build backend (automatically generates TypeScript API client)
dotnet build src/WorkFlo.Api/WorkFlo.Api.csproj  # Auto-generates TypeScript client

# 2. Start both services together
# Terminal 1: Backend API
dotnet run --project src/WorkFlo.Api/WorkFlo.Api.csproj
# Terminal 2: Frontend
cd src/web && npm run dev

# 3. Test both layers together
dotnet test                    # Backend tests
cd src/web && npm run test     # Frontend tests
```

### Frontend Development

```bash
cd src/web
npm run dev          # Start development server
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # MANDATORY before every commit
npm run test:mutation # MANDATORY before every PR
npm run format       # Format code
npm run lint         # Check code quality
```

### Backend Development

```bash
dotnet build         # Build solution + auto-generate TypeScript client
dotnet test          # Run tests
dotnet test --collect:"XPlat Code Coverage" # MANDATORY before every commit
dotnet stryker       # MANDATORY before every PR (mutation testing)
dotnet format        # Format code
```

### Quality Control (AUTOMATED)

```bash
# Use these scripts instead of manual commands:
./scripts/pre-commit-quality-gate.sh     # Before every commit
./scripts/pr-quality-check.sh           # Before every PR
./scripts/local-ci.sh                   # Full CI pipeline locally
```

### 🧪 Quality Assurance Patterns (Learned from Issue #78)

#### Test Architecture Excellence

1. **Comprehensive Test Coverage Strategy**

   - **Business Logic Tests**: 12 tests covering all CQRS command scenarios
   - **Infrastructure Tests**: 11 tests covering JWT token service security
   - **API Tests**: 6 tests covering endpoint construction and validation
   - **Total**: 29 tests with 95%+ branch coverage

2. **Security-Focused Testing**

   - **Token Validation**: Test expired tokens, invalid signatures, wrong purposes
   - **Rate Limiting**: Test endpoint throttling and abuse prevention
   - **Input Validation**: Test malformed requests and edge cases
   - **Privacy**: Test email hashing and PII protection

3. **Test Configuration Patterns**
   - **In-Memory Configuration**: Use `ConfigurationBuilder` for clean test setup
   - **Deterministic Testing**: Manual JWT creation for time-based scenarios
   - **Isolated Testing**: Each test creates fresh configuration and services
   - **Realistic Testing**: Use actual JWT library instead of mocking

#### PR Review Quality Gates

1. **Component Completeness Review**

   - **Interface Implementations**: Verify all interfaces have concrete implementations
   - **DI Registration**: Check all services are properly registered
   - **Configuration**: Validate all required configuration sections exist
   - **Testing**: Ensure all components are thoroughly tested

2. **Security Review Checklist**

   - **Token Security**: Verify JWT implementation follows security best practices
   - **Input Validation**: Check all user inputs are properly validated
   - **Error Handling**: Ensure errors don't leak sensitive information
   - **Rate Limiting**: Verify abuse prevention measures are in place

3. **Code Quality Standards**
   - **Null Reference Safety**: All potential null references handled
   - **Async/Await**: Proper async patterns with ConfigureAwait(false)
   - **Exception Handling**: Comprehensive exception handling with logging
   - **Code Style**: Consistent naming, formatting, and documentation

### 🔄 API Client Generation (AUTOMATIC)

**TypeScript API client is automatically generated when building the API project:**

```bash
# Manual generation (if needed)
./generate-client.sh

# Automatic generation happens during:
dotnet build src/WorkFlo.Api/WorkFlo.Api.csproj
```

### Git Workflow (AUTOMATED + GITHUB BOARD INTEGRATED)

```bash
# Session Start (MANDATORY) - Issue-Driven Development
./sw                                     # Start Work - GitHub issue selection + board integration
./scripts/start-progress-tracker.sh      # Opens progress monitoring dashboard

# Branch management handled by ./sw script
# ./sw automatically ensures you're on dev branch and pulls latest changes

# Development (USE QUICK COMMANDS) - Auto-updates GitHub board
./tdh hook-name "description"            # For React hooks
./tdd feature-name "description"         # For features
./scripts/safe-commit.sh "message"       # For basic commits

# Manual board operations (if needed)
./gb show                                # View board status
./gb complete 73                         # Complete specific issue

# Pre-PR Quality Check (MANDATORY)
./qc                                     # Comprehensive quality validation

# Create PR only when ready for production: dev → main
./qc                                     # First run comprehensive quality check
# PR creation handled by quality check script or manual process

# Session End
./scripts/stop-progress-tracker.sh      # Cleanup and session summary
```

### Essential Scripts (MANDATORY)

#### 🚀 Quick Commands (2-3 Letters)

```bash
# Core Workflow
./sw                                     # Start Work - interactive issue selection + board integration
./gb show                                # GitHub Board - view current board status
./gb start 73                            # Start work on issue #73
./gb complete 73                         # Complete and close issue #73

# TDD Development (Enhanced with Automation)
./tdd start feature-name                 # Start new TDD cycle with auto-detection
./tdd status                             # Check current TDD phase with smart analysis
./tdd red                                # Mark RED phase complete
./tdd green                              # Mark GREEN phase complete
./tdd refactor                           # Mark REFACTOR phase complete
./tdd cover                              # Mark COVER phase complete
./tdd commit                             # Complete TDD cycle and commit
./scripts/tdd-auto-cycle.sh              # Intelligent TDD phase detection & advancement
./scripts/tdd-test-watcher.sh watch      # Continuous test monitoring with change detection
./qc                                     # Quality Check - comprehensive pre-PR validation
```

#### 📝 Full Script Paths (Alternative)

```bash
# Session & Issue Management (GitHub Board Integrated)
./scripts/enhanced-start-work.sh         # Interactive issue selection + board integration
./scripts/start-progress-tracker.sh      # Start Claude session with progress monitoring
./scripts/stop-progress-tracker.sh       # End session and cleanup

# GitHub Board Operations
./scripts/gh-board-sync.sh show          # View current board status
./scripts/gh-board-sync.sh start 73      # Start work on issue #73
./scripts/gh-board-sync.sh complete 73   # Complete and close issue #73

# TDD Development Workflow (Enhanced with Intelligence)
./scripts/tdd-auto-cycle.sh [FEATURE_NAME]                  # Intelligent TDD cycle management with auto-detection
./scripts/tdd-test-watcher.sh once                          # Single test run with smart analysis
./scripts/tdd-test-watcher.sh watch [INTERVAL]              # Continuous monitoring with change detection
./scripts/tdd-hooks-commit.sh HOOK_NAME "description"        # React hooks with full TDD cycle
./scripts/tdd-phase-4-commit.sh FEATURE_NAME "description"   # Features with full TDD cycle
./scripts/tdd-complete-cycle.sh FEATURE_NAME "description"   # Complete TDD workflow
./scripts/safe-commit.sh "message"                          # Basic commit with quality checks

# Quality Control
./scripts/pr-quality-check.sh            # Comprehensive pre-PR quality checks
./scripts/local-pre-merge-check.sh       # Pre-merge validation
./scripts/pre-commit-quality-gate.sh     # Pre-commit quality gate

# Development Workflow
./scripts/start-dev.sh                   # Start full-stack development environment
./scripts/dev-workflow.sh               # Automated development workflow
./scripts/local-ci.sh                   # Local continuous integration
```

### 🔧 TDD Script Configuration

The enhanced TDD scripts support configuration via environment variables for optimal workflow customization:

#### 📋 Environment Variables

```bash
# TDD Auto-Cycle Configuration
export PROGRESS_FILE="PROGRESS.md"        # Override progress file location
export TEST_TIMEOUT=30                     # Test execution timeout in seconds

# TDD Test Watcher Configuration
export WATCH_INTERVAL=10                   # Watch interval in seconds (default: 10)
export PROGRESS_FILE="PROGRESS.md"        # Progress file location

# Usage Examples
WATCH_INTERVAL=15 ./scripts/tdd-test-watcher.sh watch    # Watch with 15s interval
TEST_TIMEOUT=60 ./scripts/tdd-auto-cycle.sh feature-name  # 60s test timeout
```

#### 🚀 Intelligent TDD Workflow

```bash
# Start a new TDD cycle with auto-detection
./scripts/tdd-auto-cycle.sh new-feature-name

# Check current TDD phase with smart analysis
./scripts/tdd-auto-cycle.sh

# Continuous monitoring with change detection (recommended)
./scripts/tdd-test-watcher.sh watch

# Single test run with enhanced analysis
./scripts/tdd-test-watcher.sh once

# Get help for any script
./scripts/tdd-test-watcher.sh help
```

#### 🔍 Script Features

- **Dependency Validation**: Automatically checks for required tools
- **Smart Change Detection**: Only runs tests when source files change
- **Build Validation**: Distinguishes build failures from test failures
- **Timeout Protection**: Prevents hanging tests with configurable timeouts
- **Resource Optimization**: Configurable intervals to prevent system overload
- **Comprehensive Error Handling**: Clear error messages and recovery guidance
- **Progress Tracking**: Integrates with PROGRESS.md for session continuity

## Architecture Guidelines

### CQRS + FastEndpoints (Backend)

- **Commands**: Use `C<CommandName>` prefix (e.g., `CCreateTask`)
- **Queries**: Use `Q<QueryName>` prefix (e.g., `QGetTask`)
- **Handlers**: Use `H<CommandName>` prefix (e.g., `HCreateTask`)

### Frontend Architecture

- **State Management**: Zustand for client state
- **Components**: Functional components with external state
- **Testing**: React Testing Library with behavior-driven tests
- **UI**: Radix UI + Tailwind CSS

### 🔐 Security Patterns (Learned from Issue #78)

#### JWT Token Security Best Practices

1. **Purpose-Specific Tokens**

   - **Pattern**: Add "purpose" claim to distinguish token types
   - **Implementation**: `new Claim("purpose", "email_verification")`
   - **Validation**: Check purpose claim during token validation
   - **Benefit**: Prevents token misuse across different authentication flows

2. **Configurable Token Expiry**

   - **Pattern**: Use configuration for different token lifetimes
   - **Implementation**: `configuration.GetValue<int>("EmailVerification:TokenExpiryHours", 24)`
   - **Security**: Email verification tokens expire faster than access tokens
   - **Flexibility**: Different expiry times for different token purposes

3. **Comprehensive Token Validation**

   - **Signature**: Validate JWT signature to prevent tampering
   - **Expiry**: Check token expiry with zero clock skew
   - **Issuer/Audience**: Validate token source and destination
   - **Purpose**: Verify token is being used for correct purpose
   - **Claims**: Extract and validate required claims

4. **Error Handling Security**
   - **Pattern**: Consistent error messages that don't leak information
   - **Implementation**: Generic "Invalid token" instead of specific failure reasons
   - **Benefit**: Prevents information disclosure attacks

#### Privacy-First Implementation Patterns

1. **Email Hashing for Privacy**

   - **Pattern**: Hash emails before database storage
   - **Implementation**: Use `IEmailHashingService` for consistent hashing
   - **Benefit**: Protects PII even if database is compromised

2. **Null Reference Safety**

   - **Pattern**: Use null coalescing for error handling
   - **Implementation**: `tokenResult.Error ?? "Invalid token"`
   - **Benefit**: Prevents null reference exceptions in production

3. **Rate Limiting for Security**
   - **Pattern**: Different rate limits for different operations
   - **Implementation**: Stricter limits for email sending vs. token verification
   - **Configuration**: Disable rate limiting in tests for reliable testing

## Privacy-First Development

- **Data Minimization**: Store only essential data
- **Local-First**: All processing happens client-side by default
- **No PII**: Automatic detection and sanitization required

## Domain Terms

- **Workflow Hook**: Git hooks that enforce development standards
- **Validation Rule**: Specific checks (file count, branch, commit format)
- **Enforcement Point**: Where validation occurs (pre-commit, commit-msg, pre-push)
- **Workflow Event**: Logged action for analysis and improvement
- **CLI Tool**: Command-line interface for managing workflow enforcement
- **MCP Integration**: Model Context Protocol endpoints for AI agent interaction

---

**Remember**: Developer experience is not a feature, it's our foundation. Every enforcement decision should improve code quality while maintaining development velocity.
