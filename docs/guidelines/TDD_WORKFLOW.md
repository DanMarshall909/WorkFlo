# TDD_WORKFLOW.md

## Ultra-Minimal Self-Contained TDD Workflow

**🚫 HARD RULE: Work on exactly ONE acceptance criteria, write ONE test, then STOP.**

### Complete Workflow
```bash
flo board:create         # Create issue with acceptance criteria (if needed)
flo tdd:start <issue>    # Start TDD workflow for GitHub issue  
flo tdd:red             # 🔴 Write ONE failing test for current criteria
flo tdd:green           # 🟢 Minimal implementation to pass the test  
flo tdd:refactor        # 🔵 Improve code quality (optional)
flo tdd:cover           # 📊 Add comprehensive test coverage (unit tests only)
flo tdd:document        # 📝 Document learnings for future AI agents
flo tdd:next            # ➡️ Move to next criteria (HARD STOP - must be explicit)
flo tdd:status          # Check current status
flo board:list          # See board with TDD phases
```

### TDD Cycle Enforcement
**Required sequence (no skipping):**
1. **🔴 RED** → Write ONE failing test for current acceptance criteria
2. **🟢 GREEN** → Minimal implementation to make test pass
3. **🔵 REFACTOR** → Improve code quality (optional)  
4. **📊 COVER** → Add comprehensive unit tests (integration tests at PR stage)
5. **📝 DOCUMENT** → Document learnings and patterns for future AI agents
6. **➡️ NEXT** → Hard stop, must explicitly continue to next criteria

### Progressive Disclosure
- Only ONE acceptance criteria is visible at a time
- Hard stops between criteria prevent scope creep
- Each phase requires explicit command to continue
- All phases result in commits with structured messages

### Quality Gates & Automation
- **Unit tests must pass** before advancing phases
- **Integration tests + mutation testing** run at PR stage (not during TDD cycles)
- **Automatic commits** for each TDD phase with structured messages (🔴RED, 🟢GREEN, etc.)
- **Automatic board updates** track TDD phase progress  
- **Automatic issue completion** when all criteria finished
- **No manual git/gh commands** required by user
- **No skipping** of TDD phases allowed

### Issue Format Required
```markdown
- [ ] First acceptance criteria
- [ ] Second acceptance criteria  
- [ ] Third acceptance criteria
```

### Repository Structure
- `flo-cli/` - TypeScript CLI application (main workflow)
- `./tdd` - Legacy TDD script (being migrated to TypeScript)
- `.tdd-state` - Current session state (auto-managed)

### Git Workflow Patterns  
```bash
# Each AC should complete full cycle before next AC
AC1: RED→GREEN→REFACTOR→COVER→DOCUMENT→[PR→REVIEW→MERGE]
AC2: RED→GREEN→REFACTOR→COVER→DOCUMENT→[PR→REVIEW→MERGE]

# OR accumulate ACs on feature branch, then single PR
AC1,AC2,AC3 → Single PR with all ACs
```

### Commit Message Patterns
```bash
🔴RED: criteria 1 - Add auto subcommand
🟢GREEN: criteria 1 - implement minimal auto command  
🔵REFACTOR: criteria 1 - improve error handling
📊COVER: criteria 1 - add comprehensive test coverage
📝DOCUMENT: criteria 1 - document CLI patterns
```