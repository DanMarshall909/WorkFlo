"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@oclif/core");
const auto_state_1 = require("../../auto-state");
const base_command_1 = require("../../base-command");
class AutoStatus extends base_command_1.BaseCommand {
    async run() {
        const { flags } = await this.parse(AutoStatus);
        try {
            const stateService = new auto_state_1.AutoWorkflowStateService();
            const state = await stateService.getCurrentState();
            if (!state) {
                if (flags.json) {
                    this.log(JSON.stringify({ active: false, message: 'No active auto workflow running' }, null, 2));
                }
                else {
                    this.log('No active auto workflow running');
                }
                return;
            }
            const data = {
                active: true,
                issue: state.issue,
                progress: {
                    current: state.currentAC,
                    total: state.totalACs,
                    percentage: Math.round((state.currentAC / state.totalACs) * 100)
                },
                currentPhase: state.currentPhase,
                status: state.status,
                created: state.createdAt,
                updated: state.updatedAt
            };
            if (flags.json) {
                this.log(JSON.stringify(data, null, 2));
            }
            else {
                this.log('📊 Auto Workflow Status');
                this.log(`Issue: #${state.issue}`);
                this.log(`Progress: ${state.currentAC}/${state.totalACs} acceptance criteria (${data.progress.percentage}%)`);
                this.log(`Current phase: ${state.currentPhase}`);
                this.log(`Status: ${state.status}`);
                this.log(`Created: ${new Date(state.createdAt).toLocaleString()}`);
                this.log(`Updated: ${new Date(state.updatedAt).toLocaleString()}`);
            }
        }
        catch (error) {
            this.handleError(error, 'Failed to get workflow status');
        }
    }
}
Object.defineProperty(AutoStatus, "description", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: 'Show current auto workflow status'
});
Object.defineProperty(AutoStatus, "examples", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: [
        '<%= config.bin %> <%= command.id %>',
        '<%= config.bin %> <%= command.id %> --json',
    ]
});
Object.defineProperty(AutoStatus, "flags", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: {
        json: core_1.Flags.boolean({ description: 'Output structured JSON for machine parsing' }),
    }
});
exports.default = AutoStatus;
//# sourceMappingURL=status.js.map