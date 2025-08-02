import { Flags } from '@oclif/core';
import { AutoWorkflowStateService } from '../../auto-state';
import { BaseCommand } from '../../base-command';

export default class AutoStatus extends BaseCommand {
  static override description = 'Show current auto workflow status';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --json',
  ];

  static override flags = {
    json: Flags.boolean({ description: 'Output structured JSON for machine parsing' }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(AutoStatus);

    try {
      const stateService = new AutoWorkflowStateService();
      const state = await stateService.getCurrentState();
      
      if (!state) {
        if (flags.json) {
          this.log(JSON.stringify({ active: false, message: 'No active auto workflow running' }, null, 2));
        } else {
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
      } else {
        this.log('📊 Auto Workflow Status');
        this.log(`Issue: #${state.issue}`);
        this.log(`Progress: ${state.currentAC}/${state.totalACs} acceptance criteria (${data.progress.percentage}%)`);
        this.log(`Current phase: ${state.currentPhase}`);
        this.log(`Status: ${state.status}`);
        this.log(`Created: ${new Date(state.createdAt).toLocaleString()}`);
        this.log(`Updated: ${new Date(state.updatedAt).toLocaleString()}`);
      }
    } catch (error: unknown) {
      this.handleError(error, 'Failed to get workflow status');
    }
  }
}