# CLAUDE.md

WorkFlo is a comprehensive workflow automation and development assistant that enforces best practices through shell scripts and CI/CD integrations.

## Branching Strategy (Trunk-Based Development)

- **master** (trunk): Main development branch for feature merges
- **main**: Production branch (protected)
- **feature branches**: `feature/<issue>-<description>`
- **test branches**: `test/<issue>-<subissue>-<description>`

**Workflow**: feature → master → main (via PR)

## Key Scripts

- `./sw` - Start work (issue selection + board integration)
- `./qc` - Quality check (comprehensive pre-PR validation)  
- `./gb` - GitHub board operations
- `./sc` - Safe commit with quality checks

## 🚨 MANDATORY SESSION STARTUP

**BEFORE ANY DEVELOPMENT WORK:**

1. ✅ `./sw` - Interactive issue selection + board integration
2. ✅ Read PROGRESS.MD - Continue current issue unless explicitly overridden
3. ✅ Update PROGRESS.MD on significant changes
4. ✅ Confirm on `master` branch
5. ✅ Use enhanced TDD scripts with intelligent automation

## 🔴 CRITICAL ENFORCEMENT RULES

- **TEST-FIRST DEVELOPMENT**: Write failing tests before implementation. ONE AT A TIME!
- **COVERAGE MANDATORY**: 95% branch coverage EVERY COMMIT
- **MUTATION TESTING MANDATORY**: 85% kill rate EVERY PR
- **FULL REVIEW BEFORE PR**: Complete examination of all changes
- **DUPLICATE PREVENTION**: Check for duplicates before creating issues
- **FEATURE-BASED BRANCHING**: Each GitHub issue gets own feature branch
- **WORKFLOW-FIRST DEVELOPMENT**: CLI tools + git hooks developed with API backend
- **HOOK VALIDATION MANDATORY**: Test all git hooks in real repositories

## Test-Driven Development (MANDATORY)

**Red-Green-Refactor-Cover-Commit Cycle**:
- Write ONE failing test (RED)
- Minimal implementation to pass (GREEN)
- Refactor with test coverage (REFACTOR)
- Add next single test case (COVER)
- Commit when feature complete (COMMIT)

**Enhanced TDD Scripts**:
- `./scripts/tdd-auto-cycle.sh` - Phase detection & guidance
- `./scripts/tdd-test-watcher.sh watch` - Continuous monitoring

**Test Naming Rules**:
- Business scenarios, NOT technical implementation
- NEVER use "should" - describes intention, not behavior
- ❌ BAD: "should return user tasks"
- ✅ GOOD: "user can view their task list"

## GitHub Issue Creation Protocol

**Mandatory Issue Structure**:
```bash
gh issue create --title "Feature: [Component] - [Description]" --body "$(cat <<'EOF'
## 🎯 Business Objective
[Why this matters for developer productivity/code quality]

## 📋 Acceptance Criteria
- [ ] [Specific requirement 1]
- [ ] [Specific requirement 2]

## 🧪 Test Specification (MANDATORY)
### Unit Tests Required:
- [ ] **Test 1**: [Business scenario name]
  - **Scenario**: [Context and goal]
  - **Steps**: Given/When/Then

### Integration Tests Required:
- [ ] **Integration 1**: [Component interaction scenario]

## 🏗️ Technical Implementation Plan
- [ ] **Files to Create/Modify**: [List with purposes]
- [ ] **Dependencies Required**: [List new dependencies]

## ✅ Definition of Done
- [ ] All acceptance criteria met
- [ ] 95%+ test coverage achieved
- [ ] All tests pass
- [ ] Mutation testing 85%+ kill rate
- [ ] No TypeScript errors
EOF
)"
```

## Development Commands

### Full-Stack Development (MANDATORY)
```bash
# Issue-Driven Development
./sw                                     # Start Work
./scripts/start-dev.sh                   # Start dev environment

# Build & Run
dotnet build src/WorkFlo.Api/WorkFlo.Api.csproj  # Auto-generates TypeScript client
dotnet run --project src/WorkFlo.Api/WorkFlo.Api.csproj  # Backend
cd src/web && npm run dev                # Frontend

# Testing
dotnet test                              # Backend tests
cd src/web && npm test                   # Frontend tests
```

### Quality Control
```bash
./qc                                     # Comprehensive quality check
./scripts/pre-commit-quality-gate.sh     # Before every commit
./scripts/pr-quality-check.sh           # Before every PR
```

### Git Workflow
```bash
./sw                                     # Start Work - issue selection
./scripts/safe-commit.sh "message"       # Safe commit with checks
./gb show                                # View board status
./gb complete 73                         # Complete issue #73
./qc                                     # Pre-PR quality validation
```

## Component Completeness Checklist

**Before creating any PR, verify**:
1. ✅ All interfaces have concrete implementations
2. ✅ All services registered in DI container
3. ✅ All entities have repository implementations
4. ✅ All endpoints are testable (public classes)
5. ✅ All configuration sections defined

**TDD-Driven Dependency Discovery**:
1. Write failing business logic tests (RED)
2. Implement minimal handlers (GREEN)
3. Let test failures reveal missing dependencies
4. Write tests for dependencies (RED)
5. Implement dependencies (GREEN)
6. Add DI registration when integration tests reveal gaps

## Architecture Guidelines

### Backend (CQRS + FastEndpoints)
- **Commands**: `C<CommandName>` prefix
- **Queries**: `Q<QueryName>` prefix  
- **Handlers**: `H<CommandName>` prefix

### Frontend
- **State Management**: Zustand
- **Components**: Functional with external state
- **Testing**: React Testing Library with behavior-driven tests
- **UI**: Radix UI + Tailwind CSS

## Security Patterns (From Issue #78)

### JWT Token Security
1. **Purpose-Specific Tokens**: Add "purpose" claim to distinguish token types
2. **Configurable Expiry**: Different lifetimes for different token purposes
3. **Comprehensive Validation**: Signature, expiry, issuer/audience, purpose, claims
4. **Safe Error Handling**: Generic messages that don't leak information

### Privacy-First Implementation
1. **Email Hashing**: Hash emails before database storage
2. **Null Reference Safety**: Use null coalescing for error handling
3. **Rate Limiting**: Different limits for different operations

## Session Cleanup

**Before ending Claude session**:
1. ✅ `./scripts/stop-progress-tracker.sh` - Session cleanup
2. ✅ Update PROGRESS.md - Document current state
3. ✅ Verify GitHub board reflects current work state

## Domain Terms

- **Workflow Hook**: Git hooks that enforce development standards
- **Validation Rule**: Specific checks (file count, branch, commit format)
- **Enforcement Point**: Where validation occurs (pre-commit, commit-msg, pre-push)
- **CLI Tool**: Command-line interface for managing workflow enforcement
- **MCP Integration**: Model Context Protocol endpoints for AI agent interaction

---

**Remember**: Developer experience is our foundation. Every enforcement decision should improve code quality while maintaining development velocity.