#!/bin/bash
# qc - Quality Check Bridge Script
# Bridges ./qc calls to WorkFlo CLI for dogfooding
# This enables the wf script to call ./qc while using native .NET implementation

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

# Set up .NET environment for global tool
export DOTNET_ROOT=/home/dan/.dotnet
export PATH="$PATH:/home/dan/.dotnet/tools"

# Print bridge info
echo -e "${BLUE}🔍 WorkFlo Quality Check (Native .NET Implementation)${NC}"

# Try to use global tool first, fallback to dotnet run
if command -v workflo >/dev/null 2>&1 && workflo --version >/dev/null 2>&1; then
    echo -e "${BLUE}Bridge: ./qc → workflo quality check (global tool)${NC}"
    echo ""
    workflo quality check "$@"
else
    echo -e "${YELLOW}Global tool not available, using dotnet run fallback${NC}"
    echo -e "${BLUE}Bridge: ./qc → dotnet run --project src/WorkFlo.Cli -- quality check${NC}"
    echo ""
    dotnet run --project src/WorkFlo.Cli --verbosity quiet -- quality check "$@"
fi

# Capture the exit code to pass through
exit_code=$?

# Show completion message
if [[ $exit_code -eq 0 ]]; then
    echo ""
    echo -e "${GREEN}✅ Quality check completed via WorkFlo CLI${NC}"
else
    echo ""
    echo "❌ Quality check failed via WorkFlo CLI"
fi

exit $exit_code