"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateManager = void 0;
const fs_1 = require("fs");
class StateManager {
    constructor(stateFile = '.tdd-state') {
        this.stateFile = stateFile;
    }
    hasActiveSession() {
        return (0, fs_1.existsSync)(this.stateFile);
    }
    loadState() {
        if (!(0, fs_1.existsSync)(this.stateFile)) {
            return null;
        }
        try {
            const stateContent = (0, fs_1.readFileSync)(this.stateFile, 'utf8');
            const state = {};
            stateContent.split('\n').forEach(line => {
                const match = line.match(/^(\w+)=(.+)$/);
                if (match) {
                    const [, key, value] = match;
                    const numValue = Number(value);
                    state[key] = isNaN(numValue) ? value : numValue;
                }
            });
            // Validate required fields
            if (state.ISSUE && typeof state.CRITERIA === 'number' &&
                state.PHASE && typeof state.TOTAL === 'number') {
                return state;
            }
            return null;
        }
        catch (error) {
            return null;
        }
    }
    saveState(state) {
        const stateContent = `ISSUE=${state.ISSUE}
CRITERIA=${state.CRITERIA}
PHASE=${state.PHASE}
TOTAL=${state.TOTAL}
`;
        (0, fs_1.writeFileSync)(this.stateFile, stateContent);
    }
    clearState() {
        if ((0, fs_1.existsSync)(this.stateFile)) {
            (0, fs_1.unlinkSync)(this.stateFile);
        }
    }
    updateCriteria(criteria) {
        const state = this.loadState();
        if (state) {
            state.CRITERIA = criteria;
            this.saveState(state);
        }
    }
    updatePhase(phase) {
        const state = this.loadState();
        if (state) {
            state.PHASE = phase;
            this.saveState(state);
        }
    }
    getCurrentCriteria() {
        var _a;
        const state = this.loadState();
        return (_a = state === null || state === void 0 ? void 0 : state.CRITERIA) !== null && _a !== void 0 ? _a : null;
    }
    getCurrentPhase() {
        var _a;
        const state = this.loadState();
        return (_a = state === null || state === void 0 ? void 0 : state.PHASE) !== null && _a !== void 0 ? _a : null;
    }
    getCurrentIssue() {
        var _a;
        const state = this.loadState();
        return (_a = state === null || state === void 0 ? void 0 : state.ISSUE) !== null && _a !== void 0 ? _a : null;
    }
    getTotalCriteria() {
        var _a;
        const state = this.loadState();
        return (_a = state === null || state === void 0 ? void 0 : state.TOTAL) !== null && _a !== void 0 ? _a : null;
    }
    isComplete() {
        const state = this.loadState();
        if (!state)
            return false;
        return state.CRITERIA > state.TOTAL;
    }
}
exports.StateManager = StateManager;
