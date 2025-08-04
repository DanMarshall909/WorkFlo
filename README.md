# WorkFlo: The AI-Native TDD Workflow Engine

**WorkFlo is a universal, AI-native workflow engine designed to bring structure, quality, and automation to your development process. It combines a powerful TypeScript CLI tool (`flo-cli`) with a seamless VS Code extension to create a comprehensive TDD environment for any project type.**

## What is WorkFlo?

WorkFlo is an opinionated Test-Driven Development (TDD) workflow system built for the modern, AI-assisted development era. It enforces a strict, one-task-at-a-time workflow, ensuring that developers (both human and AI) stay focused and produce high-quality, well-tested code.

The system is built around the `flo-cli` TypeScript command-line tool, which provides a rich set of commands for managing your entire development lifecycle, from creating issues and running quality checks to managing pull requests and automating feature development.

## Key Features

*   **Universal Project Support:** Works out-of-the-box with any project type, including web apps, APIs, mobile apps, console tools, and libraries.
*   **Strict TDD Enforcement:** The RED-GREEN-REFACTOR-COVER-NEXT cycle is enforced with hard stops, preventing scope creep and ensuring a disciplined workflow.
*   **AI-Powered Automation:** Automate the entire feature development process, from creating branches and running tests to generating pull requests.
*   **Seamless VS Code Integration:** A dedicated VS Code extension provides real-time status updates, TDD phase tracking, and integrated commands.
*   **Comprehensive Project Management:** Manage your GitHub issues, labels, and project boards directly from the command line.
*   **Built-in Quality Gates:** Run project-specific builds, tests, and quality checks with a single command.
*   **Extensible and Customizable:** Easily add new commands and workflows to fit your project's specific needs.

## Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/) (version 16 or higher)
*   [GitHub CLI (`gh`)](https://cli.github.com/)
*   `jq`
*   `bc`

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/DanMarshall909/WorkFlo.git
    ```
2.  Build and install the TypeScript CLI:
    ```bash
    cd WorkFlo/flo-cli
    npm install
    npm run build
    npm link  # Makes 'flo' command globally available
    ```

### Basic Usage

1.  **Start a new TDD session:**
    ```bash
    flo tdd:start <issue-number>
    ```
2.  **Follow the TDD cycle:**
    *   `flo tdd:red`: Write a failing test.
    *   `flo tdd:green`: Write the minimum code to make the test pass.
    *   `flo tdd:refactor`: Improve the code quality.
    *   `flo tdd:cover`: Add more tests and ensure full coverage.
    *   `flo tdd:next`: Move to the next acceptance criteria.
3.  **Automate feature development:**
    ```bash
    flo auto:run <issue-number>
    ```

## Core Concepts

### The TDD Workflow

WorkFlo enforces a strict TDD workflow with the following phases:

1.  **RED:** Write a single failing test for one acceptance criterion.
2.  **GREEN:** Write the minimal amount of code required to make the test pass.
3.  **REFACTOR:** Improve the code's design and readability without changing its behavior.
4.  **COVER:** Add comprehensive tests to ensure full coverage and robustness.
5.  **NEXT:** Move to the next acceptance criterion. This is a **HARD STOP** that prevents you from working on multiple things at once.

### Hard Stops

The concept of "Hard Stops" is central to WorkFlo. After completing each phase of the TDD cycle, the workflow stops, and you must explicitly run the next command to proceed. This deliberate friction is designed to:

*   **Prevent Scope Creep:** By focusing on one task at a time, you avoid the temptation to add extra features or fix unrelated bugs.
*   **Improve Focus:** The workflow forces you to concentrate on the current task, leading to higher-quality code.
*   **Enforce Discipline:** The structured process ensures that you follow the TDD methodology correctly.

## Commands

The `flo-cli` TypeScript tool provides a wide range of commands to manage your workflow:

### TDD Commands
| Command | Description |
| --- | --- |
| `flo tdd:start <issue>` | Start a new TDD session for a GitHub issue. |
| `flo tdd:red` | Enter the RED phase (write a failing test). |
| `flo tdd:green` | Enter the GREEN phase (write minimal code). |
| `flo tdd:refactor` | Enter the REFACTOR phase (improve code quality). |
| `flo tdd:cover` | Enter the COVER phase (add comprehensive tests). |
| `flo tdd:next` | Move to the next acceptance criterion. |
| `flo tdd:status` | Show the current TDD session status. |

### Auto Workflow Commands
| Command | Description |
| --- | --- |
| `flo auto:init <issue>` | Initialize auto workflow state for an issue. |
| `flo auto:run <issue>` | Run autonomous TDD workflow for multiple acceptance criteria. |
| `flo auto:status` | Show current auto workflow progress. |

### Board Management Commands
| Command | Description |
| --- | --- |
| `flo board:list` | List all issues on the project board. |
| `flo board:show <id>` | Show the details of a specific issue. |
| `flo board:create` | Create a new issue. |
| `flo board:search <query>` | Search for issues on the board. |
| `flo board:archive <issue>` | Archive completed issue. |

### Issue Management Commands
| Command | Description |
| --- | --- |
| `flo mark-ac <issue> "<description>"` | Mark an acceptance criterion as complete in a GitHub issue. |
| `flo parse-ac <issue>` | Parse acceptance criteria from GitHub issue. |
| `flo update-issue-ac <issue> <criteria>` | Update acceptance criteria status in GitHub issue. |

### Project Commands
| Command | Description |
| --- | --- |
| `flo feature <issue>` | Complete end-to-end automated feature development. |
| `flo qc` | Run quality checks (build, test, etc.). |
| `flo test` | Run the project's tests. |
| `flo build` | Build the project. |
| `flo generate-tests` | Generate comprehensive tests from GitHub issue acceptance criteria. |
| `flo help` | Show the help message. |

## VS Code Extension

The WorkFlo VS Code extension provides a seamless integration with the `flo-cli` workflow:

*   **Real-time Status:** A dedicated view in the activity bar shows the current TDD session status, including the current issue, phase, and progress.
*   **TDD Phase Tracking:** The extension automatically updates the status as you move through the TDD cycle.
*   **Integrated Commands:** Run `flo-cli` commands directly from the VS Code command palette.
*   **Auto-Refresh:** The status automatically refreshes, keeping you up-to-date with the latest changes.

## Project Structure

```
/
├── flo-cli/           # TypeScript CLI application
│   ├── src/           # TypeScript source code
│   │   ├── commands/  # CLI command implementations
│   │   └── services/  # Business logic services
│   ├── tests/         # Jest unit tests
│   └── dist/          # Compiled JavaScript output
├── vscode-extension/  # VS Code extension
├── scripts/           # Shell scripts and utilities
│   ├── legacy/        # Legacy bash scripts (being migrated)
│   ├── test/          # Test scripts
│   └── utils/         # Utility scripts
├── tests/             # Integration and system tests
├── docs/              # Documentation
│   ├── guidelines/    # Development guidelines
│   ├── workflows/     # Workflow documentation
│   └── architecture/  # Architecture documentation
├── ai-providers/      # AI provider configurations
└── README.md          # This file
```

## Motivation

WorkFlo was born out of the need for a structured, disciplined, and automated TDD workflow that can be used by both human and AI developers. In a world of increasingly complex software and AI-assisted development, it's more important than ever to have a system that enforces best practices and ensures high-quality, well-tested code.

By combining a powerful TypeScript CLI with a seamless VS Code extension, WorkFlo provides a comprehensive solution for modern software development that is both flexible and opinionated, powerful and easy to use.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
