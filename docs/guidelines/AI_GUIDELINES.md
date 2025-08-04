# AI_GUIDELINES.md

**🤖 CRITICAL: AI agents MUST read this file at the start of every session.**

## 🚨 MANDATORY TDD WORKFLOW ENFORCEMENT

### CRITICAL: Direct File Editing Prohibited
**NEVER edit implementation files directly when working on issues with acceptance criteria.**

### Required Workflow:
1. **ALWAYS start with**: `flo tdd:start <issue>` or `node flo-cli/dist/cli.js tdd:start <issue>`
2. **ONLY write code during appropriate TDD phases**:
   - Test files (*.test.ts): Only during RED and COVER phases
   - Implementation files: Only during GREEN and REFACTOR phases
3. **NEVER skip TDD phases** - each phase builds on the previous
4. **NEVER implement without failing tests first** - RED must come before GREEN

### Enforcement Checklist:
- [ ] Did you run `flo tdd:start` before any coding?
- [ ] Are you in the RED phase before writing tests?
- [ ] Are you in the GREEN phase before writing implementation?
- [ ] Did you complete all phases before moving to next AC?
- [ ] Did you use `flo tdd:next` to advance criteria?

### When User Requests Implementation:
```bash
# WRONG: Directly editing files
❌ "Let me implement the PR automation feature..."

# CORRECT: Using TDD workflow
✅ "I'll implement this using the TDD workflow. Let me start:
    flo tdd:start 325"
```

## Session Startup (Optimized)

1. **Read AI_GUIDELINES.md** (this file) - MANDATORY
2. **Check git status** - understand current branch/staged changes
3. **Check TDD status** - `flo auto:status` or `./scripts/legacy/tdd status`
4. **View current issue** - `gh issue view <number>` if working on specific issue
5. **Fix build issues** - `npm run build` in root, fix flo CLI module errors

### Avoid Time-Wasting
- ❌ Reading docs without purpose
- ❌ Extensive exploration without goals  
- ❌ Planning when continuing existing work
- ❌ Re-analyzing if already organized

### Session Context Recognition
- **Staged changes**: Commit immediately
- **TDD active**: Continue from current phase
- **Build errors**: Fix before development
- **Issue branch**: Continue specific issue work

## Core Rules

- **ONE acceptance criteria at a time** - Hard stops prevent scope creep
- **Fix broken scripts** - Don't workaround, fix the issue
- **Follow TypeScript standards** - See [TYPESCRIPT_BEST_PRACTICES.md](TYPESCRIPT_BEST_PRACTICES.md)
- **Unit tests in TDD** - Integration tests at PR stage only
- **Use TodoWrite** - Track progress with structured todos

## Latest Workflow Commands

```bash
# Modern TypeScript CLI (flo-cli) - Latest Features
flo auto:run <issue> --execute         # Execute full autonomous TDD workflow
flo auto:run <issue> --criteria 3      # Target specific criteria number
flo auto:run <issue> --criteria 2-4    # Target criteria range  
flo auto:run <issue> --auto-pr         # Auto-create PR after completion
flo auto:run <issue> --monitor         # Real-time progress monitoring
flo auto:run <issue> --dry-run         # Validate without execution

# Legacy TDD (scripts/legacy/tdd) - Fallback if flo CLI unavailable
flo tdd:start <issue>    # Start TDD for issue
flo tdd:red             # 🔴 Write failing test
flo tdd:green           # 🟢 Minimal implementation  
flo tdd:refactor        # 🔵 Improve code quality
flo tdd:cover           # 📊 Add test coverage
flo tdd:document        # 📝 Document learnings
flo tdd:next            # ➡️ Next criteria (HARD STOP)
```

## Detailed Guidelines

- **TDD Details**: [TDD_WORKFLOW.md](TDD_WORKFLOW.md)
- **CLI Patterns**: [CLI_PATTERNS.md](CLI_PATTERNS.md)
- **TypeScript**: [TYPESCRIPT_BEST_PRACTICES.md](TYPESCRIPT_BEST_PRACTICES.md)
- **Testing**: [TESTING_PATTERNS.md](TESTING_PATTERNS.md)

## Prerequisites

- Node.js 16+, GitHub CLI (`gh`), `jq`, `bc`, .NET SDK