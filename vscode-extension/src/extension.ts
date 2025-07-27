import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
interface WorkFloStatus {
  active: boolean;
  issueNumber?: string;
  currentPhase?: string;
  currentCriteria?: string;
  issueTitle?: string;
  issueUrl?: string;
  issueBody?: string;
  issueState?: string;
  issueLabels?: Array<{ name: string; color: string }>;
  issueAssignees?: Array<{ login: string }>;
  issueCreatedAt?: string;
  issueUpdatedAt?: string;
  openIssues?: Array<{
    number: number;
    title: string;
    url: string;
    labels: Array<{ name: string; color: string }>;
    state: string;
  }>;
}

// Simple markdown to HTML converter
export function markdownToHtml(markdown: string): string {
  if (!markdown) return '';
  
  return markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold and italic
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Code blocks
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Links with VS Code styling
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: var(--vscode-textLink-foreground); text-decoration: none;">$1</a>')
    // Lists (handle task lists and regular lists)
    .replace(/^- \[ \] (.*$)/gim, '<li style="list-style: none; margin-bottom: 4px;"><input type="checkbox" disabled> $1</li>')
    .replace(/^- \[x\] (.*$)/gim, '<li style="list-style: none; margin-bottom: 4px;"><input type="checkbox" checked disabled> $1</li>')
    .replace(/^- (.*$)/gim, '<li style="margin-bottom: 4px;">$1</li>')
    .replace(/^\* (.*$)/gim, '<li style="margin-bottom: 4px;">$1</li>')
    // Wrap consecutive list items in ul tags
    .replace(/(<li[^>]*>.*?<\/li>)(\s*<li[^>]*>.*?<\/li>)*/gs, '<ul style="margin: 8px 0; padding-left: 20px;">$&</ul>')
    // Convert double line breaks to paragraph breaks, single line breaks to spaces
    .replace(/\n\n+/g, '</p><p>')
    .replace(/\n/g, ' ')
    // Wrap non-header, non-list content in paragraphs
    .split(/(<h[1-6]>.*?<\/h[1-6]>|<ul.*?<\/ul>|<pre>.*?<\/pre>)/g)
    .map(part => {
      if (part.match(/^<(h[1-6]|ul|pre)/)) {
        return part; // Don't wrap headers, lists, or code blocks
      }
      if (part.trim()) {
        return `<p>${part.trim()}</p>`;
      }
      return '';
    })
    .join('')
    // Clean up empty paragraphs and fix spacing
    .replace(/<p><\/p>/g, '')
    .replace(/<p>\s*<\/p>/g, '');
}

export class WorkFloStatusProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'workfloStatus';
  private _view?: vscode.WebviewView;
  private _status: WorkFloStatus = { active: false };
  public onStatusChanged?: (status: WorkFloStatus) => void;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  // Public getter for testing
  public get status(): WorkFloStatus {
    return this._status;
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    webviewView.webview.html = this._getHtmlForWebview();

    // Handle messages from webview
    webviewView.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case 'startIssue':
            this.startTDDSession(message.issueNumber);
            break;
          case 'createNewIssue':
            this.createNewIssue();
            break;
          case 'refreshIssues':
            this.refreshOpenIssues();
            break;
        }
      },
      undefined
    );

    // Initial refresh only
    this.refreshStatus();
  }

  private async refreshStatus() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      this._status = { active: false };
      this.updateWebview();
      return;
    }

    const tddStatePath = path.join(workspaceFolder.uri.fsPath, '.tdd-state');
    
    try {
      if (fs.existsSync(tddStatePath)) {
        const stateContent = fs.readFileSync(tddStatePath, 'utf8');
        const stateLines = stateContent.split('\n').filter(line => line.trim());
        
        if (stateLines.length > 0) {
          const issueNumber = this.extractValue(stateLines, 'ISSUE');
          this._status = {
            active: true,
            issueNumber: issueNumber,
            currentPhase: this.extractValue(stateLines, 'PHASE'),
            currentCriteria: this.extractValue(stateLines, 'CURRENT_CRITERIA'),
            // Set immediate fallback data for faster display
            issueTitle: `Issue #${issueNumber}`,
            issueBody: 'Loading issue content...'
          };
          
          // Update webview immediately with basic info
          this.updateWebview();
          
          // Fetch GitHub issue info asynchronously
          if (issueNumber) {
            this.fetchGitHubIssue(issueNumber, workspaceFolder.uri.fsPath);
          }
        } else {
          this._status = { active: false };
        }
      } else {
        this._status = { active: false };
        // Fetch open issues when no active session
        this.fetchOpenIssues(workspaceFolder.uri.fsPath);
      }
    } catch (error) {
      console.error('Error reading TDD state:', error);
      this._status = { active: false };
      this.updateWebview();
    }
  }

  private extractValue(lines: string[], key: string): string | undefined {
    // Handle both simple format (KEY=value) and complex format with line numbers and arrows (     1→KEY=value)
    const line = lines.find(l => l.startsWith(`${key}=`) || l.includes(`${key}=`));
    if (!line) return undefined;
    
    const equalIndex = line.indexOf(`${key}=`);
    if (equalIndex === -1) return undefined;
    
    const value = line.substring(equalIndex + key.length + 1);
    return value?.replace(/"/g, '') || undefined;
  }

  private async fetchGitHubIssue(issueNumber: string, workspacePath: string) {
    try {
      console.log(`Fetching GitHub issue #${issueNumber}`);
      
      // Add timeout to prevent hanging
      const timeout = 10000; // 10 seconds
      exec(`gh issue view ${issueNumber} --json title,url,body,state,assignees,labels,createdAt,updatedAt`, 
        { 
          cwd: workspacePath,
          timeout: timeout
        }, 
        (error, stdout, stderr) => {
          if (error) {
            console.error('Error fetching GitHub issue:', error);
            // Set fallback data to prevent empty display
            this._status.issueTitle = `Issue #${issueNumber}`;
            this._status.issueUrl = `https://github.com/owner/repo/issues/${issueNumber}`;
            this._status.issueBody = 'Failed to load issue content. Check GitHub CLI authentication.';
            this.updateWebview();
            return;
          }
          try {
            const issueData = JSON.parse(stdout);
            this._status.issueTitle = issueData.title;
            this._status.issueUrl = issueData.url;
            this._status.issueBody = issueData.body;
            this._status.issueState = issueData.state;
            this._status.issueLabels = issueData.labels;
            this._status.issueAssignees = issueData.assignees;
            this._status.issueCreatedAt = issueData.createdAt;
            this._status.issueUpdatedAt = issueData.updatedAt;
            console.log('GitHub issue fetched:', issueData);
            this.updateWebview();
          } catch (parseError) {
            console.error('Error parsing GitHub issue data:', parseError);
          }
        }
      );
    } catch (error) {
      console.error('Error in fetchGitHubIssue:', error);
    }
  }

  private async fetchOpenIssues(workspacePath: string) {
    try {
      console.log('Fetching open GitHub issues');
      
      const timeout = 10000; // 10 seconds
      exec(`gh issue list --state open --limit 10 --json number,title,url,labels,state`, 
        { 
          cwd: workspacePath,
          timeout: timeout
        }, 
        (error, stdout, stderr) => {
          if (error) {
            console.error('Error fetching open issues:', error);
            this._status.openIssues = [];
            this.updateWebview();
            return;
          }
          try {
            const issuesData = JSON.parse(stdout);
            this._status.openIssues = issuesData;
            console.log('Open issues fetched:', issuesData);
            this.updateWebview();
          } catch (parseError) {
            console.error('Error parsing open issues data:', parseError);
            this._status.openIssues = [];
            this.updateWebview();
          }
        }
      );
    } catch (error) {
      console.error('Error in fetchOpenIssues:', error);
    }
  }

  private async startTDDSession(issueNumber: number) {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('No workspace folder found');
      return;
    }

    const workFloPath = './tdd';
    try {
      console.log(`Starting TDD session for issue #${issueNumber}`);
      exec(`${workFloPath} start ${issueNumber}`, 
        { cwd: workspaceFolder.uri.fsPath }, 
        (error, stdout, stderr) => {
          if (error) {
            vscode.window.showErrorMessage(`Failed to start TDD session: ${error.message}`);
            return;
          }
          vscode.window.showInformationMessage(`Started TDD session for issue #${issueNumber}`);
          this.refreshStatus();
        }
      );
    } catch (error) {
      vscode.window.showErrorMessage(`Error starting TDD session: ${error}`);
    }
  }

  private async createNewIssue() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('No workspace folder found');
      return;
    }

    try {
      exec('gh issue create --web', 
        { cwd: workspaceFolder.uri.fsPath }, 
        (error, stdout, stderr) => {
          if (error) {
            vscode.window.showErrorMessage(`Failed to create issue: ${error.message}`);
            return;
          }
          vscode.window.showInformationMessage('Opening GitHub issue creation page...');
        }
      );
    } catch (error) {
      vscode.window.showErrorMessage(`Error creating issue: ${error}`);
    }
  }

  private async refreshOpenIssues() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      return;
    }
    
    this._status.openIssues = undefined; // Clear current issues to show loading
    this.updateWebview();
    this.fetchOpenIssues(workspaceFolder.uri.fsPath);
  }

  private updateWebview() {
    if (this._view) {
      this._view.webview.html = this._getHtmlForWebview();
    }
    // Notify status bar of changes
    if (this.onStatusChanged) {
      this.onStatusChanged(this._status);
    }
  }

  private _getHtmlForWebview(): string {
    const { active, issueNumber, currentPhase, currentCriteria, issueTitle, issueUrl, issueBody, issueState, issueLabels, openIssues } = this._status;

    const phaseColor: Record<string, string> = {
      start: '#ffd43b',
      red: '#ff6b6b',
      green: '#51cf66',
      refactor: '#339af0',
      cover: '#845ef7',
      next: '#ffd43b'
    };

    const phaseIcon: Record<string, string> = {
      start: '🟡',
      red: '🔴',
      green: '🟢',
      refactor: '🔵',
      cover: '🟣',
      next: '🟡'
    };

    // Convert markdown body to HTML
    const htmlBody = issueBody ? markdownToHtml(issueBody) : '';

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>WorkFlo Status</title>
        <style>
            body {
                font-family: var(--vscode-font-family);
                font-size: var(--vscode-font-size);
                color: var(--vscode-foreground);
                background-color: var(--vscode-editor-background);
                padding: 10px;
                margin: 0;
            }
            .phase-indicator {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 12px;
                padding: 8px;
                border: 1px solid var(--vscode-widget-border);
                border-radius: 6px;
                background-color: var(--vscode-textBlockQuote-background);
            }
            .phase-dot {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                display: inline-block;
            }
            .issue-header {
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 1px solid var(--vscode-widget-border);
            }
            .issue-title {
                font-size: 16px;
                font-weight: bold;
                margin-bottom: 8px;
                line-height: 1.3;
            }
            .issue-meta {
                font-size: 12px;
                color: var(--vscode-descriptionForeground);
                margin-bottom: 8px;
            }
            .issue-body {
                font-size: 13px;
                line-height: 1.5;
                max-height: 400px;
                overflow-y: auto;
                border: 1px solid var(--vscode-widget-border);
                border-radius: 4px;
                padding: 15px;
                background-color: var(--vscode-editor-background);
            }
            .issue-body h1, .issue-body h2, .issue-body h3 {
                margin-top: 0;
                margin-bottom: 10px;
                color: var(--vscode-foreground);
            }
            .issue-body h1 { font-size: 1.5em; }
            .issue-body h2 { font-size: 1.3em; }
            .issue-body h3 { font-size: 1.1em; }
            .issue-body p {
                margin-bottom: 10px;
            }
            .issue-body ul {
                margin: 10px 0;
                padding-left: 20px;
            }
            .issue-body li {
                margin-bottom: 5px;
            }
            .issue-body code {
                background-color: var(--vscode-textBlockQuote-background);
                padding: 2px 4px;
                border-radius: 3px;
                font-family: var(--vscode-editor-font-family);
            }
            .issue-body pre {
                background-color: var(--vscode-textBlockQuote-background);
                padding: 10px;
                border-radius: 4px;
                overflow-x: auto;
                margin: 10px 0;
            }
            .issue-body pre code {
                background: none;
                padding: 0;
            }
            .label {
                display: inline-block;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 11px;
                background-color: var(--vscode-badge-background);
                color: var(--vscode-badge-foreground);
                margin-right: 6px;
                margin-bottom: 4px;
            }
            .inactive {
                text-align: center;
                color: var(--vscode-descriptionForeground);
                font-style: italic;
                padding: 40px 20px;
            }
        </style>
    </head>
    <body>
        ${active ? `
            <div class="phase-indicator">
                <span class="phase-dot" style="background-color: ${currentPhase ? phaseColor[currentPhase.toLowerCase()] : '#666'}"></span>
                <strong>${currentPhase ? phaseIcon[currentPhase.toLowerCase()] : '⚪'} ${currentPhase?.toUpperCase() || 'UNKNOWN'} Phase</strong>
            </div>
            
            ${issueTitle ? `
                <div class="issue-header">
                    <div class="issue-title">
                        ${issueUrl ? `<a href="${issueUrl}" style="color: var(--vscode-textLink-foreground); text-decoration: none;">${issueTitle}</a>` : issueTitle}
                    </div>
                    <div class="issue-meta">
                        ${issueUrl ? `<a href="${issueUrl}" style="color: var(--vscode-textLink-foreground); text-decoration: none;">#${issueNumber}</a>` : `#${issueNumber}`}
                        ${issueState ? ` • ${issueState.toUpperCase()}` : ''}
                        ${issueLabels && issueLabels.length > 0 ? ' • ' + issueLabels.map(label => `<span class="label">${label.name}</span>`).join(' ') : ''}
                    </div>
                </div>
                
                ${htmlBody ? `
                    <div class="issue-body">${htmlBody}</div>
                ` : ''}
            ` : `
                <div class="issue-meta">
                    Issue: ${issueUrl ? `<a href="${issueUrl}" style="color: var(--vscode-textLink-foreground); text-decoration: none;">#${issueNumber}</a>` : `#${issueNumber}`}
                    ${currentCriteria ? ` • ${currentCriteria}` : ''}
                </div>
            `}
        ` : `
            <div class="inactive">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h3 style="margin: 0 0 10px 0; color: var(--vscode-foreground);">⚪ No active WorkFlo TDD session</h3>
                    <p style="margin: 0; color: var(--vscode-descriptionForeground);">Start a new session or select an open issue</p>
                </div>
                
                ${openIssues && openIssues.length > 0 ? `
                    <div style="margin-bottom: 20px;">
                        <h4 style="margin: 0 0 12px 0; color: var(--vscode-foreground); font-size: 14px;">📋 Open Issues</h4>
                        <div style="max-height: 300px; overflow-y: auto;">
                            ${openIssues.map(issue => `
                                <div style="
                                    border: 1px solid var(--vscode-widget-border);
                                    border-radius: 6px;
                                    padding: 12px;
                                    margin-bottom: 8px;
                                    background-color: var(--vscode-textBlockQuote-background);
                                    cursor: pointer;
                                    transition: background-color 0.2s;
                                " onclick="startIssue(${issue.number})">
                                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                                        <span style="
                                            color: var(--vscode-descriptionForeground);
                                            font-size: 12px;
                                            font-weight: bold;
                                        ">#${issue.number}</span>
                                        ${issue.labels && issue.labels.length > 0 ? 
                                            issue.labels.map(label => 
                                                `<span style="
                                                    background-color: var(--vscode-badge-background);
                                                    color: var(--vscode-badge-foreground);
                                                    padding: 2px 6px;
                                                    border-radius: 10px;
                                                    font-size: 10px;
                                                ">${label.name}</span>`
                                            ).join(' ') : ''
                                        }
                                    </div>
                                    <div style="
                                        font-size: 13px;
                                        line-height: 1.4;
                                        color: var(--vscode-foreground);
                                    ">${issue.title}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : `
                    <div style="text-align: center; margin: 20px 0; color: var(--vscode-descriptionForeground);">
                        <p>Loading open issues...</p>
                    </div>
                `}
                
                <div style="text-align: center;">
                    <button onclick="createNewIssue()" style="
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 8px 16px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 13px;
                        margin-right: 8px;
                    ">✨ Create New Issue</button>
                    <button onclick="refreshIssues()" style="
                        background-color: var(--vscode-button-secondaryBackground);
                        color: var(--vscode-button-secondaryForeground);
                        border: 1px solid var(--vscode-widget-border);
                        padding: 8px 16px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 13px;
                    ">🔄 Refresh</button>
                </div>
            </div>
            
            <script>
                const vscode = acquireVsCodeApi();
                
                function startIssue(issueNumber) {
                    vscode.postMessage({
                        command: 'startIssue',
                        issueNumber: issueNumber
                    });
                }
                
                function createNewIssue() {
                    vscode.postMessage({
                        command: 'createNewIssue'
                    });
                }
                
                function refreshIssues() {
                    vscode.postMessage({
                        command: 'refreshIssues'
                    });
                }
            </script>
        `}
    </body>
    </html>`;
  }

  dispose() {
    // Cleanup if needed
  }
}

export function activate(context: vscode.ExtensionContext) {
  const provider = new WorkFloStatusProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(WorkFloStatusProvider.viewType, provider)
  );
  
  // Create status bar item
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBarItem.command = 'workflo.showStatus';
  statusBarItem.text = '$(pulse) WorkFlo: No Session';
  statusBarItem.tooltip = 'Click to show WorkFlo TDD Status';
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);
  
  // Update status bar when provider status changes
  provider.onStatusChanged = (status) => {
    if (status.active) {
      const phaseIcon: Record<string, string> = { start: '🟡', red: '🔴', green: '🟢', refactor: '🔵', cover: '🟣', next: '🟡' };
      const icon = phaseIcon[status.currentPhase?.toLowerCase() || ''] || '⚪';
      statusBarItem.text = `$(pulse) WorkFlo: ${icon} ${status.currentPhase || 'UNKNOWN'} (#${status.issueNumber || '?'})`;
      const titleText = status.issueTitle ? ` - ${status.issueTitle}` : '';
      statusBarItem.tooltip = `WorkFlo TDD: ${status.currentPhase || 'UNKNOWN'} Phase - Issue #${status.issueNumber || '?'}${titleText}`;
    } else {
      statusBarItem.text = '$(pulse) WorkFlo: No Session';
      statusBarItem.tooltip = 'No active WorkFlo TDD session';
    }
  };
  
  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('workflo.showStatus', () => {
      vscode.commands.executeCommand('workfloStatus.focus');
    })
  );
  
  // Set context variable to show the view
  vscode.commands.executeCommand('setContext', 'workflo.active', true);
}

export function deactivate() {}