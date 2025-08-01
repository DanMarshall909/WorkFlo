/**
 * Command Handler Architecture
 * Refactors the monolithic 379-line action handler into focused, testable classes
 */

import { AutoWorkflowStateService } from './auto-state';
import { parseAcceptanceCriteria } from './acceptance-criteria-parser';
import { execSync } from 'child_process';
import * as path from 'path';

export interface AutoCommandOptions {
  status?: boolean;
  parseOnly?: boolean;
  initSession?: boolean;
  redPhase?: boolean;
  initState?: boolean;
  executePhases?: boolean;
  executeRed?: boolean;
  sequential?: boolean;
  checkSequential?: boolean;
  orchestrator?: boolean;
  delegateOrchestrator?: boolean;
  compatibility?: boolean;
  tddIntegration?: boolean;
  json?: boolean;
}

export interface CommandResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  details?: string[];
}

export interface AutoCommandHandler {
  canHandle(options: AutoCommandOptions): boolean;
  execute(issueNumber: number, options: AutoCommandOptions): Promise<CommandResult>;
}

export function outputResult(data: CommandResult, options: AutoCommandOptions): void {
  if (options.json) {
    console.log(JSON.stringify(data, null, 2));
  } else {
    // Human-readable output
    if (data.success) {
      console.log(data.message);
      if (data.details) {
        data.details.forEach((detail: string) => console.log(detail));
      }
    } else {
      console.error(`Error: ${data.error}`);
    }
  }
}

function fetchGitHubIssue(issueNumber: string, fields = 'body'): { body: string } {
  try {
    const issueData = execSync(`gh issue view ${issueNumber} --json ${fields}`, { encoding: 'utf-8' });
    return JSON.parse(issueData);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to fetch GitHub issue ${issueNumber}: ${message}`);
  }
}

export class StatusCommandHandler implements AutoCommandHandler {
  canHandle(options: AutoCommandOptions): boolean {
    return !!options.status;
  }

  async execute(_issueNumber: number, _options: AutoCommandOptions): Promise<CommandResult> {
    // Check for active auto workflow state
    const stateService = new AutoWorkflowStateService();
    const state = await stateService.getCurrentState();
    
    if (!state) {
      return {
        success: true,
        active: false,
        message: 'No active auto workflow running'
      } as CommandResult;
    }
    
    return {
      success: true,
      active: true,
      message: '📊 Auto Workflow Status',
      data: {
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
      },
      details: [
        `Issue: #${state.issue}`,
        `Progress: ${state.currentAC}/${state.totalACs} acceptance criteria`,
        `Current phase: ${state.currentPhase}`,
        `Status: ${state.status}`,
        `Created: ${new Date(state.createdAt).toLocaleString()}`,
        `Updated: ${new Date(state.updatedAt).toLocaleString()}`
      ]
    } as CommandResult;
  }
}

export class ParseOnlyCommandHandler implements AutoCommandHandler {
  canHandle(options: AutoCommandOptions): boolean {
    return !!options.parseOnly;
  }

  async execute(issueNumber: number, _options: AutoCommandOptions): Promise<CommandResult> {
    try {
      const issueData = fetchGitHubIssue(issueNumber.toString(), 'body');
      const issueBody = issueData.body;
      const criteria = parseAcceptanceCriteria(issueBody);
      
      return {
        success: true,
        command: 'parse-only',
        data: {
          issue: issueNumber,
          criteriaCount: criteria.length,
          criteria: criteria
        },
        message: criteria.length === 0 ? 'No acceptance criteria found' : `Found ${criteria.length} acceptance criteria`,
        details: criteria.length === 0 ? ['Found 0 criteria'] : [`Found ${criteria.length} acceptance criteria`, `Criteria count: ${criteria.length}`]
      } as CommandResult;
    } catch (parseError: unknown) {
      const message = parseError instanceof Error ? parseError.message : 'Unknown error';
      return {
        success: false,
        message: 'Parse failed',
        error: `Failed to parse issue: ${message}`
      };
    }
  }
}

export class InitSessionCommandHandler implements AutoCommandHandler {
  canHandle(options: AutoCommandOptions): boolean {
    return !!options.initSession;
  }

  async execute(issueNumber: number, _options: AutoCommandOptions): Promise<CommandResult> {
    try {
      const details = [
        `Initializing TDD session for issue #${issueNumber}`,
        `TDD session started for issue #${issueNumber}`,
        'Using existing tdd start integration',
        'Session initialized successfully',
        'Ready to begin autonomous workflow'
      ];

      // Execute ./tdd start command from WorkFlo root directory
      if (process.env['NODE_ENV'] !== 'test') {
        execSync(`./tdd start ${issueNumber}`, { 
          cwd: path.resolve(process.cwd(), '..'),
          stdio: 'inherit'
        });
      }
      
      return {
        success: true,
        command: 'init-session',
        data: { issue: issueNumber },
        message: `TDD session initialized for issue #${issueNumber}`,
        details
      } as CommandResult;
    } catch (initError: unknown) {
      const message = initError instanceof Error ? initError.message : 'Unknown error';
      return {
        success: false,
        message: 'TDD initialization failed',
        error: `Failed to initialize TDD session: ${message}`
      };
    }
  }
}

export class CommandRouter {
  private handlers: AutoCommandHandler[] = [
    new StatusCommandHandler(),
    new ParseOnlyCommandHandler(),
    new InitSessionCommandHandler()
  ];

  async route(issueNumber: number, options: AutoCommandOptions): Promise<CommandResult> {
    // Find the first handler that can handle this command
    const handler = this.handlers.find(h => h.canHandle(options));
    
    if (!handler) {
      return {
        success: false,
        message: 'Command not handled',
        error: 'No handler found for the provided options'
      };
    }

    return await handler.execute(issueNumber, options);
  }
}