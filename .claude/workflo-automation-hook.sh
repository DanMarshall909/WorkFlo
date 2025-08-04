#!/bin/bash

# WorkFlo Project Hook: Enforce flo Workflow Automation
# Project-specific reminder for WorkFlo repository

echo ""
echo "🚫 WORKFLO PROJECT: GitHub automation is MANDATORY"
echo ""
echo "✅ Available flo commands:"
echo "   flo auto:run <issue> --auto-pr    # Auto-create PRs with intelligent descriptions"
echo "   flo auto:run <issue> --no-pr      # Skip PR creation"
echo "   flo auto:run <issue> --draft-pr   # Create draft PR"
echo "   flo tdd:start <issue>             # Auto-create branch and initialize"
echo "   flo tdd:red/green/refactor/cover  # Auto-commit with structured messages"
echo "   flo board:create                  # Create issues with acceptance criteria"
echo ""
echo "🎯 Epic #328 Phase 2 COMPLETE: Intelligent PR automation is active"
echo "📋 See: AI_GUIDELINES.md § GitHub Command Restrictions"
echo "🛡️  Enforcement: Claude Code permissions deny direct GitHub commands"
echo ""