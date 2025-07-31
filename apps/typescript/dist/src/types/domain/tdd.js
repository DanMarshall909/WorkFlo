"use strict";
// TDD domain types
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLAUDE_MD_FULL_CONSTRAINTS = exports.CLAUDE_MD_KEY_POINTS = exports.PHASE_TRANSITIONS = exports.TDD_PHASES = void 0;
// TDD Constants
exports.TDD_PHASES = ['START', 'RED', 'GREEN', 'REFACTOR', 'COVER'];
exports.PHASE_TRANSITIONS = {
    'START': ['red'],
    'RED': ['green'],
    'GREEN': ['refactor', 'cover'],
    'REFACTOR': ['cover'],
    'COVER': ['next']
};
exports.CLAUDE_MD_KEY_POINTS = `🚫 HARD RULE: Work on exactly ONE acceptance criteria, write ONE test, then STOP.

Required sequence (no skipping allowed):
1. RED → Write ONE failing test for current acceptance criteria
2. GREEN → Minimal implementation to make test pass
3. REFACTOR → Improve code quality (optional)
4. COVER → Add comprehensive tests + mutation testing (85% threshold)
5. NEXT → Hard stop, must explicitly continue to next criteria

Key constraints:
- Only ONE acceptance criteria is visible at a time
- Hard stops between criteria prevent scope creep
- Each phase requires explicit command to continue`;
exports.CLAUDE_MD_FULL_CONSTRAINTS = `🚫 CLAUDE.md TDD CONSTRAINTS REMINDER 🚫

📋 ULTRA-MINIMAL SELF-CONTAINED TDD WORKFLOW:
- Work on exactly ONE acceptance criteria at a time
- Hard stops between criteria prevent scope creep  
- No skipping phases allowed

🔄 REQUIRED SEQUENCE (RED-GREEN-REFACTOR-COVER-NEXT):
1. RED → Write ONE failing test for current acceptance criteria
2. GREEN → Minimal implementation to make test pass
3. REFACTOR → Improve code quality (optional)
4. COVER → Add comprehensive tests + mutation testing (85% threshold)
5. NEXT → Hard stop, must explicitly continue to next criteria

🛑 KEY CONSTRAINTS:
- Only ONE acceptance criteria is visible at a time
- Hard stops between criteria prevent scope creep
- Each phase requires explicit command to continue
- Tests must pass before advancing phases
- Mutation testing required in COVER phase (85% threshold)
- No manual git/gh commands - everything is automated
- Self-contained workflow with progressive disclosure

Remember: TUNNEL VISION on current criteria only!`;
