"use strict";
// Functional state management
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInitialState = exports.requireActive = exports.toFile = exports.fromFile = exports.isComplete = exports.nextCriteria = exports.updatePhase = exports.updateCriteria = exports.hasActiveSession = exports.clearState = exports.saveState = exports.formatStateForSave = exports.loadState = exports.validateState = exports.parseStateContent = void 0;
const fs_1 = require("fs");
const result_1 = require("../types/core/result");
const parseStateContent = (content) => {
    const state = {};
    content.split('\n').forEach(line => {
        const match = line.match(/^(\w+)=(.+)$/);
        if (match) {
            const [, key, value] = match;
            const numValue = Number(value);
            state[key] = isNaN(numValue) ? value : numValue;
        }
    });
    return state;
};
exports.parseStateContent = parseStateContent;
const validateState = (partial) => {
    if (!partial.issue || typeof partial.criteria !== 'number' ||
        !partial.phase || typeof partial.total !== 'number') {
        return (0, result_1.Err)(new Error('Invalid state format'));
    }
    return (0, result_1.Ok)(partial);
};
exports.validateState = validateState;
const loadState = (stateFile) => {
    try {
        if (!(0, fs_1.existsSync)(stateFile)) {
            return (0, result_1.Ok)(null);
        }
        const content = (0, fs_1.readFileSync)(stateFile, 'utf8');
        const parsed = (0, exports.parseStateContent)(content);
        const validationResult = (0, exports.validateState)(parsed);
        if (validationResult.success) {
            return (0, result_1.Ok)(validationResult.data);
        }
        else {
            return (0, result_1.Ok)(null); // Invalid state treated as no state
        }
    }
    catch (error) {
        return (0, result_1.Err)(new Error(`Failed to load state: ${error}`));
    }
};
exports.loadState = loadState;
const formatStateForSave = (state) => {
    return `ISSUE=${state.issue}
CRITERIA=${state.criteria}
PHASE=${state.phase}
TOTAL=${state.total}
`;
};
exports.formatStateForSave = formatStateForSave;
const saveState = (stateFile, state) => {
    try {
        const content = (0, exports.formatStateForSave)(state);
        (0, fs_1.writeFileSync)(stateFile, content);
        return (0, result_1.Ok)(undefined);
    }
    catch (error) {
        return (0, result_1.Err)(new Error(`Failed to save state: ${error}`));
    }
};
exports.saveState = saveState;
const clearState = (stateFile) => {
    try {
        if ((0, fs_1.existsSync)(stateFile)) {
            (0, fs_1.unlinkSync)(stateFile);
        }
        return (0, result_1.Ok)(undefined);
    }
    catch (error) {
        return (0, result_1.Err)(new Error(`Failed to clear state: ${error}`));
    }
};
exports.clearState = clearState;
const hasActiveSession = (stateFile) => {
    return (0, fs_1.existsSync)(stateFile);
};
exports.hasActiveSession = hasActiveSession;
// State transformation functions
const updateCriteria = (state, criteria) => {
    return Object.assign(Object.assign({}, state), { criteria });
};
exports.updateCriteria = updateCriteria;
const updatePhase = (state, phase) => {
    return Object.assign(Object.assign({}, state), { phase });
};
exports.updatePhase = updatePhase;
const nextCriteria = (state) => {
    return Object.assign(Object.assign({}, state), { criteria: state.criteria + 1, phase: 'START' });
};
exports.nextCriteria = nextCriteria;
const isComplete = (state) => {
    return state.criteria > state.total;
};
exports.isComplete = isComplete;
// State pipeline functions  
const fromFile = (stateFile) => () => {
    return (0, exports.loadState)(stateFile);
};
exports.fromFile = fromFile;
const toFile = (stateFile) => (state) => {
    const saveResult = (0, exports.saveState)(stateFile, state);
    return saveResult.success ? (0, result_1.Ok)(state) : saveResult;
};
exports.toFile = toFile;
const requireActive = (state) => {
    if (!state) {
        return (0, result_1.Err)(new Error('No active TDD session. Run: tdd start <issue>'));
    }
    return (0, result_1.Ok)(state);
};
exports.requireActive = requireActive;
const createInitialState = (issue, total) => {
    return {
        issue,
        criteria: 1,
        phase: 'START',
        total
    };
};
exports.createInitialState = createInitialState;
