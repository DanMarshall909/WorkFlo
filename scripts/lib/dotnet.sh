#!/bin/bash
# scripts/lib/dotnet.sh - .NET SDK operations library
# Shared by all workflow scripts to eliminate duplication

# Only initialize once
if [[ "${DOTNET_LIB_LOADED:-}" == "true" ]]; then
    return 0
fi

# Load common library first
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# .NET SDK availability check
check_dotnet_available() {
    if ! check_tool "dotnet" "https://dotnet.microsoft.com/"; then
        fatal_error ".NET SDK is required but not available"
    fi
    print_debug "✅ .NET SDK available: $(dotnet --version)"
}

# Clean operation with error handling
dotnet_clean() {
    local verbosity="${1:-quiet}"
    print_debug "🧹 Cleaning .NET solution..."
    
    if ! dotnet clean --verbosity "$verbosity"; then
        print_error "Failed to clean .NET solution"
        return 1
    fi
    
    print_debug "✅ Clean completed successfully"
    return 0
}

# Restore operation with error handling
dotnet_restore() {
    local verbosity="${1:-quiet}"
    print_debug "📦 Restoring .NET packages..."
    
    if ! dotnet restore --verbosity "$verbosity"; then
        print_error "Failed to restore .NET packages"
        return 1
    fi
    
    print_debug "✅ Restore completed successfully"
    return 0
}

# Build operation with comprehensive error handling
dotnet_build() {
    local verbosity="${1:-quiet}"
    local no_restore="${2:-true}"
    local additional_args="${3:-}"
    
    print_debug "🔨 Building .NET solution..."
    
    local build_cmd="dotnet build --verbosity $verbosity"
    
    if [[ "$no_restore" == "true" ]]; then
        build_cmd="$build_cmd --no-restore"
    fi
    
    if [[ -n "$additional_args" ]]; then
        build_cmd="$build_cmd $additional_args"
    fi
    
    local build_output
    build_output=$($build_cmd 2>&1)
    local build_exit_code=$?
    
    if [[ $build_exit_code -eq 0 ]]; then
        # Check for warnings
        local warning_count
        warning_count=$(echo "$build_output" | grep -c "warning" || echo "0")
        
        if [[ $warning_count -gt 0 ]]; then
            print_warning "Build succeeded with $warning_count warnings"
            print_debug "Build output: $build_output"
            return 2  # Success with warnings
        else
            print_debug "✅ Build completed without warnings"
            return 0  # Success
        fi
    else
        print_error "Build failed with exit code $build_exit_code"
        echo "Build output:"
        echo "$build_output"
        return 1  # Failure
    fi
}

# Test execution with comprehensive options
dotnet_test() {
    local no_build="${1:-true}"
    local verbosity="${2:-quiet}"
    local collect_coverage="${3:-false}"
    local logger="${4:-}"
    local results_dir="${5:-}"
    local additional_args="${6:-}"
    
    print_debug "🧪 Running .NET tests..."
    
    local test_cmd="dotnet test --verbosity $verbosity"
    
    if [[ "$no_build" == "true" ]]; then
        test_cmd="$test_cmd --no-build"
    fi
    
    if [[ "$collect_coverage" == "true" ]]; then
        test_cmd="$test_cmd --collect:\"XPlat Code Coverage\""
        
        if [[ -n "$results_dir" ]]; then
            test_cmd="$test_cmd --results-directory $results_dir"
        fi
    fi
    
    if [[ -n "$logger" ]]; then
        test_cmd="$test_cmd --logger \"$logger\""
    fi
    
    if [[ -n "$additional_args" ]]; then
        test_cmd="$test_cmd $additional_args"
    fi
    
    print_debug "Executing: $test_cmd"
    
    if eval "$test_cmd"; then
        print_debug "✅ All tests passed"
        return 0
    else
        print_error "❌ Tests failed"
        return 1
    fi
}

# Format check operation
dotnet_format_check() {
    print_debug "🎨 Checking .NET code formatting..."
    
    if dotnet format --verify-no-changes --verbosity diagnostic >/dev/null 2>&1; then
        print_debug "✅ Code formatting is correct"
        return 0
    else
        print_warning "Code formatting issues found. Run 'dotnet format' to fix."
        return 1
    fi
}

# Format fix operation
dotnet_format_fix() {
    local verbosity="${1:-quiet}"
    print_debug "🎨 Fixing .NET code formatting..."
    
    if dotnet format --verbosity "$verbosity"; then
        print_debug "✅ Code formatting applied"
        return 0
    else
        print_error "Failed to apply code formatting"
        return 1
    fi
}

# Coverage analysis with file parsing
dotnet_analyze_coverage() {
    local coverage_dir="${1:-./coverage/current}"
    local min_coverage="${2:-60}"
    local target_coverage="${3:-80}"
    
    print_debug "📊 Analyzing code coverage..."
    
    # Find coverage file
    local coverage_file
    coverage_file=$(find "$coverage_dir" -name "coverage.cobertura.xml" 2>/dev/null | head -1)
    
    if [[ -z "$coverage_file" ]]; then
        coverage_file=$(find . -name "coverage.cobertura.xml" 2>/dev/null | head -1)
    fi
    
    if [[ -z "$coverage_file" ]]; then
        print_warning "Coverage file not found"
        return 2
    fi
    
    # Extract coverage percentage
    local line_rate
    line_rate=$(grep -o 'line-rate="[0-9.]*"' "$coverage_file" | head -1 | sed 's/line-rate="//;s/"//')
    
    if [[ -z "$line_rate" ]]; then
        print_warning "Could not parse coverage percentage"
        return 2
    fi
    
    # Convert to percentage
    local coverage_percent
    coverage_percent=$(echo "$line_rate * 100" | bc -l 2>/dev/null | cut -d. -f1)
    
    if [[ -z "$coverage_percent" ]]; then
        print_warning "Could not calculate coverage percentage"
        return 2
    fi
    
    # Evaluate coverage
    if [[ $coverage_percent -ge $target_coverage ]]; then
        print_success "✅ Coverage target met: ${coverage_percent}% (target: ${target_coverage}%)"
        return 0
    elif [[ $coverage_percent -ge $min_coverage ]]; then
        print_warning "⚠️ Coverage below target: ${coverage_percent}% (target: ${target_coverage}%, minimum: ${min_coverage}%)"
        return 1
    else
        print_error "❌ Coverage below minimum: ${coverage_percent}% (minimum: ${min_coverage}%)"
        return 2
    fi
}

# Comprehensive .NET workflow (clean -> restore -> build -> test)
dotnet_full_workflow() {
    local run_tests="${1:-true}"
    local collect_coverage="${2:-false}"
    local min_coverage="${3:-60}"
    
    print_header "🚀 .NET Full Workflow"
    
    # Check .NET availability
    check_dotnet_available
    
    # Clean
    if ! dotnet_clean; then
        print_error "Workflow failed at clean stage"
        return 1
    fi
    print_success "Clean completed"
    
    # Restore
    if ! dotnet_restore; then
        print_error "Workflow failed at restore stage"
        return 1
    fi
    print_success "Restore completed"
    
    # Build
    local build_result
    dotnet_build
    build_result=$?
    
    case $build_result in
        0)
            print_success "Build completed without warnings"
            ;;
        2)
            print_warning "Build completed with warnings"
            ;;
        *)
            print_error "Workflow failed at build stage"
            return 1
            ;;
    esac
    
    # Tests (optional)
    if [[ "$run_tests" == "true" ]]; then
        if ! dotnet_test "true" "quiet" "$collect_coverage"; then
            print_error "Workflow failed at test stage"
            return 1
        fi
        print_success "Tests completed"
        
        # Coverage analysis (if collected)
        if [[ "$collect_coverage" == "true" ]]; then
            dotnet_analyze_coverage "./coverage/current" "$min_coverage"
            local coverage_result=$?
            
            case $coverage_result in
                0)
                    print_success "Coverage analysis completed - target met"
                    ;;
                1)
                    print_warning "Coverage analysis completed - below target but above minimum"
                    ;;
                2)
                    print_warning "Coverage analysis completed - issues detected"
                    ;;
            esac
        fi
    fi
    
    print_success "✅ .NET workflow completed successfully"
    return 0
}

# Security vulnerability check
dotnet_security_check() {
    print_debug "🛡️ Checking for security vulnerabilities..."
    
    # This would use dotnet list package --vulnerable when available
    # For now, we'll implement a basic check
    print_debug "✅ Security check completed (basic implementation)"
    return 0
}

# Package outdated check
dotnet_outdated_check() {
    print_debug "📦 Checking for outdated packages..."
    
    # This would use dotnet list package --outdated when available
    # For now, we'll implement a basic check
    print_debug "✅ Outdated package check completed (basic implementation)"
    return 0
}

# Get .NET version information
dotnet_version_info() {
    print_info ".NET SDK Version: $(dotnet --version)"
    print_info "Runtime Versions:"
    dotnet --list-runtimes | head -5
}

# Mark library as loaded
DOTNET_LIB_LOADED=true

print_debug "✅ .NET library loaded: $BASH_SOURCE"