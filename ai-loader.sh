#!/bin/bash
# AI Provider Loader for WorkFlo TDD
# Dynamically loads the appropriate AI provider based on configuration
# Enhanced with creative task detection and automatic invocation

# AI invocation configuration
AI_INVOCATION_CONFIG="${AI_INVOCATION_CONFIG:-.ai-config}"

# Initialize AI invocation configuration
init_ai_config() {
    if [[ ! -f "$AI_INVOCATION_CONFIG" ]]; then
        cat > "$AI_INVOCATION_CONFIG" << EOF
# AI Invocation Configuration for WorkFlo
AI_ENABLED=true
AI_AUTO_INVOKE=true
AI_TEST_GENERATION=true
AI_CODE_REVIEW=true
AI_REFACTOR_SUGGESTIONS=true
AI_ERROR_DIAGNOSIS=true
AI_FALLBACK_MODE=enhanced
AI_TIMEOUT=30
AI_MAX_RETRIES=3
EOF
    fi
    source "$AI_INVOCATION_CONFIG"
}

# Load AI provider based on PERSONA setting
load_ai_provider() {
    local persona="${PERSONA:-claude}"
    local provider_script="ai-providers/${persona}.sh"
    
    # Initialize AI configuration
    init_ai_config
    
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

# Detect if current task requires creative AI input
is_creative_task() {
    local context="$1"
    local phase="$2"
    
    case "$phase" in
        RED|TEST_GENERATION)
            # Test design requires creative thinking
            return 0
            ;;
        GREEN|IMPLEMENTATION)
            # Implementation strategy requires creative decisions
            return 0
            ;;
        REFACTOR)
            # Code quality improvements require judgment
            return 0
            ;;
        COVER|EDGE_CASES)
            # Comprehensive test strategy requires creative thinking
            return 0
            ;;
        ERROR_DIAGNOSIS)
            # Debugging complex issues requires creative problem-solving
            return 0
            ;;
        CODE_REVIEW)
            # Code review requires critical analysis
            return 0
            ;;
        *)
            # Mechanical tasks like git operations, file management
            return 1
            ;;
    esac
}

# Conditionally invoke AI based on task type and configuration
invoke_ai_if_creative() {
    local task_type="$1"
    local context="$2"
    shift 2
    local ai_function="$1"
    shift
    local ai_args=("$@")
    
    # Check if AI is enabled and task is creative
    if [[ "${AI_ENABLED:-true}" != "true" ]]; then
        [[ "${DEBUG_MODE:-0}" == "1" ]] && echo "AI disabled, skipping creative task: $task_type" >&2
        return 1
    fi
    
    if ! is_creative_task "$context" "$task_type"; then
        [[ "${DEBUG_MODE:-0}" == "1" ]] && echo "Mechanical task detected, no AI needed: $task_type" >&2
        return 1
    fi
    
    # Check if auto-invocation is enabled
    if [[ "${AI_AUTO_INVOKE:-true}" != "true" ]]; then
        echo "Creative task detected: $task_type"
        echo "AI available but auto-invoke disabled. Run manually if needed."
        return 1
    fi
    
    # Invoke AI function with error handling
    echo "🤖 Creative task detected: $task_type - invoking AI assistance"
    
    if declare -f "$ai_function" > /dev/null; then
        if timeout "${AI_TIMEOUT:-30}" "$ai_function" "${ai_args[@]}"; then
            echo "✅ AI assistance completed for: $task_type"
            return 0
        else
            echo "⚠️ AI invocation failed for: $task_type, falling back to manual process"
            return 1
        fi
    else
        echo "⚠️ AI function '$ai_function' not available, using fallback"
        return 1
    fi
}

# Check if AI tools are available in the environment
check_ai_availability() {
    local available_tools=()
    
    # Check for Claude Code CLI
    if command -v claude-code >/dev/null 2>&1; then
        available_tools+=("claude-code")
    fi
    
    # Check for custom AI providers
    for provider in ai-providers/*.sh; do
        if [[ -f "$provider" ]]; then
            local name=$(basename "$provider" .sh)
            available_tools+=("$name")
        fi
    done
    
    if [[ ${#available_tools[@]} -eq 0 ]]; then
        echo "⚠️ No AI tools detected. Creative tasks will use enhanced fallbacks."
        return 1
    else
        echo "🤖 AI tools available: ${available_tools[*]}"
        return 0
    fi
}

# Configuration management for AI invocation
configure_ai_invocation() {
    local setting="$1"
    local value="$2"
    
    case "$setting" in
        enable|disable)
            if [[ "$setting" == "enable" ]]; then
                sed -i 's/AI_ENABLED=.*/AI_ENABLED=true/' "$AI_INVOCATION_CONFIG"
                echo "AI invocation enabled"
            else
                sed -i 's/AI_ENABLED=.*/AI_ENABLED=false/' "$AI_INVOCATION_CONFIG"
                echo "AI invocation disabled"
            fi
            ;;
        auto-invoke)
            sed -i "s/AI_AUTO_INVOKE=.*/AI_AUTO_INVOKE=$value/" "$AI_INVOCATION_CONFIG"
            echo "AI auto-invocation set to: $value"
            ;;
        timeout)
            sed -i "s/AI_TIMEOUT=.*/AI_TIMEOUT=$value/" "$AI_INVOCATION_CONFIG"
            echo "AI timeout set to: $value seconds"
            ;;
        *)
            echo "Available settings: enable|disable|auto-invoke|timeout"
            return 1
            ;;
    esac
    
    # Reload configuration
    source "$AI_INVOCATION_CONFIG"
}

# Export functions
export -f load_ai_provider
export -f list_ai_providers
export -f validate_ai_provider
export -f switch_ai_provider
export -f is_creative_task
export -f invoke_ai_if_creative
export -f check_ai_availability
export -f configure_ai_invocation