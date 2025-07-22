#!/bin/bash

# WorkFlo Project Configuration
# This file defines project-specific settings for workflow scripts

PROJECT_NAME="WorkFlo"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOLUTION_FILE="$ROOT_DIR/WorkFlo.sln"

# Workflow tools integration
WORKFLOW_TOOLS_PATH="$ROOT_DIR/../workflow-tools"

# Quality check thresholds
RESHARPER_ISSUE_THRESHOLD=10
COVERAGE_MINIMUM=60
COVERAGE_TARGET=80

# Test configuration
TEST_TIMEOUT=300  # 5 minutes
BUILD_TIMEOUT=180 # 3 minutes

# Export variables for use by other scripts
export PROJECT_NAME
export ROOT_DIR
export SOLUTION_FILE
export WORKFLOW_TOOLS_PATH
export RESHARPER_ISSUE_THRESHOLD
export COVERAGE_MINIMUM
export COVERAGE_TARGET
export TEST_TIMEOUT
export BUILD_TIMEOUT