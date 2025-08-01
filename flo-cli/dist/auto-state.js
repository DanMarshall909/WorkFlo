"use strict";
/**
 * Auto workflow state management with filesystem-independent interface
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoWorkflowStateService = exports.FileSystemStateManager = void 0;
/**
 * Filesystem-based state manager implementation
 */
class FileSystemStateManager {
    constructor() {
        Object.defineProperty(this, "stateFile", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: '.auto-workflow-state.json'
        });
    }
    async save(state) {
        const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
        const updatedState = {
            ...state,
            updatedAt: new Date().toISOString()
        };
        await fs.writeFile(this.stateFile, JSON.stringify(updatedState, null, 2));
    }
    async load() {
        try {
            const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
            const content = await fs.readFile(this.stateFile, 'utf-8');
            return JSON.parse(content);
        }
        catch (error) {
            if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
                return null; // File doesn't exist
            }
            throw error;
        }
    }
    async exists() {
        try {
            const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
            await fs.access(this.stateFile);
            return true;
        }
        catch {
            return false;
        }
    }
    async clear() {
        try {
            const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
            await fs.unlink(this.stateFile);
        }
        catch (error) {
            if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
                return; // File already doesn't exist
            }
            throw error;
        }
    }
}
exports.FileSystemStateManager = FileSystemStateManager;
/**
 * Auto workflow state service
 */
class AutoWorkflowStateService {
    constructor(stateManager = new FileSystemStateManager()) {
        Object.defineProperty(this, "stateManager", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: stateManager
        });
    }
    async initializeState(issue, totalACs) {
        const state = {
            issue,
            totalACs,
            currentAC: 1,
            currentPhase: 'START',
            status: 'running',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        await this.stateManager.save(state);
        return state;
    }
    async getCurrentState() {
        return await this.stateManager.load();
    }
    async updatePhase(phase) {
        const state = await this.getCurrentState();
        if (state) {
            state.currentPhase = phase;
            await this.stateManager.save(state);
        }
    }
    async moveToNextAC() {
        const state = await this.getCurrentState();
        if (state) {
            state.currentAC += 1;
            state.currentPhase = 'START';
            if (state.currentAC > state.totalACs) {
                state.status = 'completed';
            }
            await this.stateManager.save(state);
        }
    }
    async markFailed() {
        const state = await this.getCurrentState();
        if (state) {
            state.status = 'failed';
            await this.stateManager.save(state);
        }
    }
    async clearState() {
        await this.stateManager.clear();
    }
    async hasActiveWorkflow() {
        return await this.stateManager.exists();
    }
}
exports.AutoWorkflowStateService = AutoWorkflowStateService;
//# sourceMappingURL=auto-state.js.map