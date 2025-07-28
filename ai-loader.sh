#!/bin/bash
# AI Provider Loader for WorkFlo TDD
# Dynamically loads the appropriate AI provider based on configuration

# Load AI provider based on PERSONA setting
load_ai_provider() {
    local persona="${PERSONA:-claude}"
    local provider_script="ai-providers/${persona}.sh"
    
    # Check if the specific provider exists
    if [[ -f "$provider_script" ]]; then
        # Only show loading message in debug mode
        [[ "${DEBUG_MODE:-0}" == "1" ]] && echo "Loading AI provider: $persona" >&2
        source "$provider_script"
        export AI_PROVIDER="$persona"
        return 0
    else
        [[ "${DEBUG_MODE:-0}" == "1" ]] && echo "Warning: AI provider '$persona' not found, falling back to basic analysis" >&2
        source "ai-providers/fallback.sh"
        export AI_PROVIDER="fallback"
        return 1
    fi
}

# List available AI providers
list_ai_providers() {
    echo "Available AI providers:"
    for provider in ai-providers/*.sh; do
        if [[ -f "$provider" ]]; then
            local name=$(basename "$provider" .sh)
            echo "  - $name"
        fi
    done
}

# Validate AI provider exists
validate_ai_provider() {
    local persona="$1"
    local provider_script="ai-providers/${persona}.sh"
    
    if [[ -f "$provider_script" ]]; then
        return 0
    else
        return 1
    fi
}

# Switch AI provider
switch_ai_provider() {
    local new_persona="$1"
    
    if validate_ai_provider "$new_persona"; then
        # Update configuration
        if [[ -f "$CONFIG_FILE" ]]; then
            # Update existing config
            sed -i "s/^PERSONA=.*/PERSONA=\"$new_persona\"/" "$CONFIG_FILE"
        else
            # Create new config
            echo "PERSONA=\"$new_persona\"" > "$CONFIG_FILE"
        fi
        
        # Reload the provider
        load_ai_provider
        echo "Switched to AI provider: $new_persona"
        return 0
    else
        echo "Error: AI provider '$new_persona' not found"
        echo "Available providers:"
        list_ai_providers
        return 1
    fi
}

# Export functions
export -f load_ai_provider
export -f list_ai_providers
export -f validate_ai_provider
export -f switch_ai_provider