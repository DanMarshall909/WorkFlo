#!/bin/bash
# Local CI Script - Free Tier Optimized
# Runs comprehensive checks locally to minimize GitHub Actions usage

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🚀 Starting Local CI (Free Tier Optimized)"
echo "========================================"

# Quick build check (fail fast)
echo "🔨 Quick Build Check..."
if ! dotnet build --verbosity quiet > /dev/null 2>&1; then
    echo "❌ Build failed - fix before proceeding"
    dotnet build
    exit 1
fi
echo "✅ Build successful"

# Fast unit tests (no coverage)
echo "🧪 Running Tests..."
if ! dotnet test --verbosity quiet --no-build > /dev/null 2>&1; then
    echo "❌ Tests failed"
    dotnet test --no-build
    exit 1
fi
echo "✅ Tests passed"

# Basic formatting check
echo "🎨 Format Check..."
if ! dotnet format --verbosity quiet --verify-no-changes > /dev/null 2>&1; then
    echo "❌ Code formatting issues detected"
    echo "Run: dotnet format"
    exit 1
fi
echo "✅ Formatting correct"

# Security scan (basic)
echo "🔒 Basic Security Check..."
if command -v semgrep &> /dev/null; then
    if ! semgrep --config=auto --severity=ERROR . --quiet > /dev/null 2>&1; then
        echo "❌ Security issues detected"
        exit 1
    fi
    echo "✅ Security scan passed"
else
    echo "ℹ️  Semgrep not installed - skipping security scan"
fi

echo ""
echo "🎉 Local CI Complete - Ready for push!"
echo "========================================"