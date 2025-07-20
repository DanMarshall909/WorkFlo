#!/bin/bash
# create-bridge.sh - Bridge Script Generator
# Creates new bridge scripts from template for WorkFlo CLI dogfooding

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[BRIDGE-GEN]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
    exit 1
}

# Usage information
usage() {
    echo "Bridge Script Generator for WorkFlo CLI Dogfooding"
    echo ""
    echo "Usage: $0 <bridge_type> <command_name> [options...]"
    echo ""
    echo "Bridge Types:"
    echo "  cli     - CLI bridge (calls workflo CLI commands)"
    echo "  script  - Script bridge (calls existing bash scripts)"
    echo ""
    echo "CLI Bridge Options:"
    echo "  --cli-command <cmd>    CLI command to call (e.g., 'quality check')"
    echo "  --description <desc>   Description of the bridge"
    echo "  --icon <icon>         Icon for bridge output (e.g., '🔍')"
    echo "  --title <title>       Title for bridge output"
    echo ""
    echo "Script Bridge Options:"
    echo "  --target-script <path>  Target script path (e.g., './scripts/example.sh')"
    echo "  --description <desc>    Description of the bridge"
    echo "  --icon <icon>          Icon for bridge output (e.g., '📋')"
    echo "  --title <title>        Title for bridge output"
    echo ""
    echo "Examples:"
    echo "  # Create CLI bridge for quality check"
    echo "  $0 cli qc --cli-command 'quality check' --description 'Quality Check' --icon '🔍' --title 'WorkFlo Quality Check'"
    echo ""
    echo "  # Create script bridge for board management"
    echo "  $0 script gb --target-script './scripts/gh-board-sync.sh' --description 'GitHub Board' --icon '📋' --title 'WorkFlo GitHub Board Management'"
}

# Parse arguments
if [[ $# -lt 2 ]]; then
    usage
    exit 1
fi

BRIDGE_TYPE="$1"
COMMAND_NAME="$2"
shift 2

# Initialize variables
CLI_COMMAND=""
TARGET_SCRIPT=""
DESCRIPTION=""
ICON=""
TITLE=""

# Parse options
while [[ $# -gt 0 ]]; do
    case $1 in
        --cli-command)
            CLI_COMMAND="$2"
            shift 2
            ;;
        --target-script)
            TARGET_SCRIPT="$2"
            shift 2
            ;;
        --description)
            DESCRIPTION="$2"
            shift 2
            ;;
        --icon)
            ICON="$2"
            shift 2
            ;;
        --title)
            TITLE="$2"
            shift 2
            ;;
        *)
            error "Unknown option: $1"
            ;;
    esac
done

# Validate bridge type
case "$BRIDGE_TYPE" in
    "cli")
        if [[ -z "$CLI_COMMAND" ]]; then
            error "CLI bridge requires --cli-command option"
        fi
        ;;
    "script")
        if [[ -z "$TARGET_SCRIPT" ]]; then
            error "Script bridge requires --target-script option"
        fi
        ;;
    *)
        error "Invalid bridge type: $BRIDGE_TYPE. Use 'cli' or 'script'"
        ;;
esac

# Set defaults
DESCRIPTION="${DESCRIPTION:-$COMMAND_NAME}"
ICON="${ICON:-🔧}"
TITLE="${TITLE:-WorkFlo $DESCRIPTION}"

# Check if template exists
TEMPLATE_FILE="./scripts/templates/bridge-template.sh"
if [[ ! -f "$TEMPLATE_FILE" ]]; then
    error "Template file not found: $TEMPLATE_FILE"
fi

# Check if output file already exists
OUTPUT_FILE="./$COMMAND_NAME"
if [[ -f "$OUTPUT_FILE" ]]; then
    read -p "File $OUTPUT_FILE already exists. Overwrite? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Cancelled"
        exit 0
    fi
fi

log "Creating $BRIDGE_TYPE bridge for command '$COMMAND_NAME'"

# Read template
template_content=$(cat "$TEMPLATE_FILE")

# Replace placeholders
result="$template_content"
result="${result//\{\{COMMAND_NAME\}\}/$COMMAND_NAME}"
result="${result//\{\{DESCRIPTION\}\}/$DESCRIPTION}"
result="${result//\{\{BRIDGE_ICON\}\}/$ICON}"
result="${result//\{\{BRIDGE_TITLE\}\}/$TITLE}"

# Handle bridge type specific replacements
case "$BRIDGE_TYPE" in
    "cli")
        result="${result//\{\{CLI_COMMAND\}\}/$CLI_COMMAND}"
        result="${result//\{\{TARGET_DESCRIPTION\}\}/WorkFlo CLI}"
        result="${result//\{\{EXECUTION_TYPE\}\}/native .NET implementation}"
        result="${result//\{\{SUCCESS_MESSAGE\}\}/$DESCRIPTION completed via WorkFlo CLI}"
        result="${result//\{\{ERROR_MESSAGE\}\}/$DESCRIPTION failed via WorkFlo CLI}"
        
        # Remove script bridge sections
        result=$(echo "$result" | sed '/{{#SCRIPT_BRIDGE}}/,/{{\/SCRIPT_BRIDGE}}/d')
        # Remove CLI bridge markers
        result="${result//\{\{#CLI_BRIDGE\}\}/}"
        result="${result//\{\{\/CLI_BRIDGE\}\}/}"
        ;;
    "script")
        result="${result//\{\{TARGET_SCRIPT\}\}/$TARGET_SCRIPT}"
        result="${result//\{\{TARGET_DESCRIPTION\}\}/existing script}"
        result="${result//\{\{EXECUTION_TYPE\}\}/existing bash implementation}"
        result="${result//\{\{SUCCESS_MESSAGE\}\}/$DESCRIPTION operation completed}"
        result="${result//\{\{ERROR_MESSAGE\}\}/$DESCRIPTION operation failed}"
        
        # Remove CLI bridge sections
        result=$(echo "$result" | sed '/{{#CLI_BRIDGE}}/,/{{\/CLI_BRIDGE}}/d')
        # Remove script bridge markers
        result="${result//\{\{#SCRIPT_BRIDGE\}\}/}"
        result="${result//\{\{\/SCRIPT_BRIDGE\}\}/}"
        ;;
esac

# Write the result
echo "$result" > "$OUTPUT_FILE"
chmod +x "$OUTPUT_FILE"

success "Bridge script created: $OUTPUT_FILE"
log "Bridge type: $BRIDGE_TYPE"
log "Command: $COMMAND_NAME"
case "$BRIDGE_TYPE" in
    "cli")
        log "CLI command: $CLI_COMMAND"
        ;;
    "script")
        log "Target script: $TARGET_SCRIPT"
        ;;
esac
log "Description: $DESCRIPTION"

echo ""
echo "Test the bridge with: ./$COMMAND_NAME --help"