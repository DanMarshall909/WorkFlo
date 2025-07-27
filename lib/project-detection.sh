#!/bin/bash
# lib/project-detection.sh - Universal project type detection for Flo
# Detects .NET project types (APIs, MCPs, console tools, libraries) automatically

# Only initialize once
if [[ "${WORKFLO_PROJECT_DETECTION_LOADED:-}" == "true" ]]; then
    return 0
fi

# Source common utilities
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

# Project type detection
detect_project_type() {
    local project_root="${1:-$(pwd)}"
    local project_types=()
    
    # Check for .NET projects
    if find "$project_root" -name "*.csproj" -o -name "*.sln" | head -1 | grep -q .; then
        # Analyze project files to determine specific type
        while IFS= read -r -d '' csproj_file; do
            local project_type=$(analyze_csproj "$csproj_file")
            [[ -n "$project_type" ]] && project_types+=("$project_type")
        done < <(find "$project_root" -name "*.csproj" -print0)
    fi
    
    # Check for Node.js projects
    if [[ -f "$project_root/package.json" ]]; then
        project_types+=("nodejs")
    fi
    
    # Check for Python projects
    if [[ -f "$project_root/pyproject.toml" ]] || [[ -f "$project_root/setup.py" ]] || [[ -f "$project_root/requirements.txt" ]]; then
        project_types+=("python")
    fi
    
    # Default to generic if no specific type detected
    if [[ ${#project_types[@]} -eq 0 ]]; then
        project_types+=("generic")
    fi
    
    # Return primary project type (first detected)
    echo "${project_types[0]}"
}

# Analyze .csproj file to determine specific .NET project type
analyze_csproj() {
    local csproj_file="$1"
    
    # Read project file content
    local content=$(cat "$csproj_file")
    
    # Check for MCP server indicators
    if echo "$content" | grep -q "ModelContextProtocol" || [[ "$csproj_file" == *"Mcp"* ]]; then
        echo "dotnet-mcp"
        return
    fi
    
    # Check for web API indicators
    if echo "$content" | grep -q -E "(Microsoft\.AspNetCore|Swashbuckle|Microsoft\.EntityFrameworkCore)" || 
       echo "$content" | grep -q -E "(<OutputType>Exe</OutputType>|<Project.*Web)" ||
       [[ "$csproj_file" == *"Api"* ]] || [[ "$csproj_file" == *"Web"* ]]; then
        echo "dotnet-api"
        return
    fi
    
    # Check for console application
    if echo "$content" | grep -q "<OutputType>Exe</OutputType>" || [[ "$csproj_file" == *"Console"* ]]; then
        echo "dotnet-console"
        return
    fi
    
    # Check for test project
    if echo "$content" | grep -q -E "(Microsoft\.NET\.Test\.Sdk|xunit|NUnit|MSTest)" || [[ "$csproj_file" == *"Test"* ]]; then
        echo "dotnet-test"
        return
    fi
    
    # Default to library for other .NET projects
    echo "dotnet-library"
}

# Get project-specific commands based on type
get_project_commands() {
    local project_type="$1"
    
    case "$project_type" in
        "dotnet-api"|"dotnet-mcp"|"dotnet-console"|"dotnet-library")
            echo "build:dotnet build"
            echo "test:dotnet test"
            echo "run:dotnet run"
            echo "restore:dotnet restore"
            echo "clean:dotnet clean"
            ;;
        "nodejs")
            echo "build:npm run build"
            echo "test:npm test"
            echo "run:npm start"
            echo "install:npm install"
            echo "clean:npm run clean"
            ;;
        "python")
            echo "test:python -m pytest"
            echo "run:python main.py"
            echo "install:pip install -r requirements.txt"
            echo "lint:ruff check"
            ;;
        "generic")
            echo "build:make"
            echo "test:make test"
            echo "clean:make clean"
            ;;
        *)
            warn "Unknown project type: $project_type"
            return 1
            ;;
    esac
}

# Get test command for project type
get_test_command() {
    local project_type="$1"
    get_project_commands "$project_type" | grep "^test:" | cut -d: -f2-
}

# Get build command for project type
get_build_command() {
    local project_type="$1"
    get_project_commands "$project_type" | grep "^build:" | cut -d: -f2-
}

# Check if project has tests
has_tests() {
    local project_root="${1:-$(pwd)}"
    local project_type=$(detect_project_type "$project_root")
    
    case "$project_type" in
        "dotnet-"*)
            find "$project_root" -name "*Test*.csproj" | head -1 | grep -q .
            ;;
        "nodejs")
            [[ -f "$project_root/package.json" ]] && grep -q "\"test\"" "$project_root/package.json"
            ;;
        "python")
            find "$project_root" -name "test_*.py" -o -name "*_test.py" | head -1 | grep -q .
            ;;
        *)
            find "$project_root" -name "*test*" -type f | head -1 | grep -q .
            ;;
    esac
}

# Mark library as loaded
WORKFLO_PROJECT_DETECTION_LOADED=true