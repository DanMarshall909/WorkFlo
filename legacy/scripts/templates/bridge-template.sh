#!/bin/bash
# {{COMMAND_NAME}} - {{DESCRIPTION}} Bridge Script
# Bridges ./{{COMMAND_NAME}} calls to {{TARGET_DESCRIPTION}} for dogfooding
# This enables the wf script to call ./{{COMMAND_NAME}} while using {{EXECUTION_TYPE}}

set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if we're in the WorkFlo project directory
if [[ ! -f "WorkFlo.sln" ]]; then
    echo "❌ Error: Must be run from WorkFlo project root directory" >&2
    exit 1
fi

{{#CLI_BRIDGE}}
# Set up .NET environment for global tool
export DOTNET_ROOT=/home/dan/.dotnet
export PATH="$PATH:/home/dan/.dotnet/tools"
{{/CLI_BRIDGE}}

# Print bridge info
echo -e "${BLUE}{{BRIDGE_ICON}} {{BRIDGE_TITLE}}${NC}"
{{#CLI_BRIDGE}}
# Try to use global tool first, fallback to dotnet run
if command -v workflo >/dev/null 2>&1 && workflo --version >/dev/null 2>&1; then
    echo -e "${BLUE}Bridge: ./{{COMMAND_NAME}} → workflo {{CLI_COMMAND}} (global tool)${NC}"
    echo ""
    workflo {{CLI_COMMAND}} "$@"
else
    echo -e "${YELLOW}Global tool not available, using dotnet run fallback${NC}"
    echo -e "${BLUE}Bridge: ./{{COMMAND_NAME}} → dotnet run --project src/WorkFlo.Cli -- {{CLI_COMMAND}}${NC}"
    echo ""
    dotnet run --project src/WorkFlo.Cli --verbosity quiet -- {{CLI_COMMAND}} "$@"
fi
{{/CLI_BRIDGE}}
{{#SCRIPT_BRIDGE}}
echo -e "${BLUE}Bridge: ./{{COMMAND_NAME}} → {{TARGET_SCRIPT}}${NC}"
echo ""

# Check if the target script exists
TARGET_SCRIPT="{{TARGET_SCRIPT}}"
if [[ ! -f "$TARGET_SCRIPT" ]]; then
    echo "❌ Error: Target script not found at $TARGET_SCRIPT" >&2
    exit 1
fi

# Execute the target script with all arguments
"$TARGET_SCRIPT" "$@"
{{/SCRIPT_BRIDGE}}

# Capture the exit code to pass through
exit_code=$?

# Show completion message
if [[ $exit_code -eq 0 ]]; then
    echo ""
    echo -e "${GREEN}✅ {{SUCCESS_MESSAGE}}${NC}"
else
    echo ""
    echo "❌ {{ERROR_MESSAGE}}"
fi

exit $exit_code