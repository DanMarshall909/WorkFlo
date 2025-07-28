# WorkFlo: The AI-Native TDD Workflow Engine

**WorkFlo is a universal, AI-native workflow engine designed to bring structure, quality, and automation to your development process. It combines a powerful CLI tool (`flo`) with a seamless VS Code extension to create a comprehensive TDD environment for any project type.**

## What is WorkFlo?

WorkFlo is an opinionated Test-Driven Development (TDD) workflow system built for the modern, AI-assisted development era. It enforces a strict, one-task-at-a-time workflow, ensuring that developers (both human and AI) stay focused and produce high-quality, well-tested code.

The system is built around the `flo` command-line tool, which provides a rich set of commands for managing your entire development lifecycle, from creating issues and running quality checks to managing pull requests and automating feature development.

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

*   [GitHub CLI (`gh`)](https://cli.github.com/)
*   `jq`
*   `bc`

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/DanMarshall909/WorkFlo.git
    ```
2.  Add the `flo` script to your `PATH`:
    ```bash
    cd WorkFlo
    export PATH=$PWD:$PATH
    ```

### Basic Usage

1.  **Start a new TDD session:**
    ```bash
    flo start <issue-number>
    ```
2.  **Follow the TDD cycle:**
    *   `flo red`: Write a failing test.
    *   `flo green`: Write the minimum code to make the test pass.
    *   `flo refactor`: Improve the code quality.
    *   `flo cover`: Add more tests and ensure full coverage.
    *   `flo next`: Move to the next acceptance criteria.
3.  **Automate feature development:**
    ```bash
    flo feature <issue-number>
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

The `flo` tool provides a wide range of commands to manage your workflow:

| Command | Description |
| --- | --- |
| `flo start <issue>` | Start a new TDD session for a GitHub issue. |
| `flo red` | Enter the RED phase (write a failing test). |
| `flo green` | Enter the GREEN phase (write minimal code). |
| `flo refactor` | Enter the REFACTOR phase (improve code quality). |
| `flo cover` | Enter the COVER phase (add comprehensive tests). |
| `flo next` | Move to the next acceptance criterion. |
| `flo status` | Show the current TDD session status. |
| `flo feature <issue>` | Automate the entire feature development workflow. |
| `flo board list` | List all issues on the project board. |
| `flo board show <id>` | Show the details of a specific issue. |
| `flo board create` | Create a new issue. |
| `flo issue create` | Create a new GitHub issue. |
| `flo label create` | Create a new GitHub label. |
| `flo qc` | Run quality checks (build, test, etc.). |
| `flo test` | Run the project's tests. |
| `flo build` | Build the project. |
| `flo pr create` | Create a new pull request. |
| `flo pr review` | Review the current changes. |
| `flo info` | Show project information and available commands. |
| `flo help` | Show the help message. |

## VS Code Extension

The WorkFlo VS Code extension provides a seamless integration with the `flo` workflow:

*   **Real-time Status:** A dedicated view in the activity bar shows the current TDD session status, including the current issue, phase, and progress.
*   **TDD Phase Tracking:** The extension automatically updates the status as you move through the TDD cycle.
*   **Integrated Commands:** Run `flo` commands directly from the VS Code command palette.
*   **Auto-Refresh:** The status automatically refreshes, keeping you up-to-date with the latest changes.

## Project Structure

```
/
├── flo              # Main workflow command
├── tdd              # Core TDD logic (used by flo)
├── board            # Project board management script
├── lib/             # Helper scripts and libraries
├── tests/           # BATS tests for the workflow scripts
├── vscode-extension/  # VS Code extension source code
├── docs/            # Documentation
└── README.md        # This file
```

## Motivation

WorkFlo was born out of the need for a structured, disciplined, and automated TDD workflow that can be used by both human and AI developers. In a world of increasingly complex software and AI-assisted development, it's more important than ever to have a system that enforces best practices and ensures high-quality, well-tested code.

By combining a powerful CLI with a seamless VS Code extension, WorkFlo provides a comprehensive solution for modern software development that is both flexible and opinionated, powerful and easy to use.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
