#!/bin/bash

# Claude Code Hook: GitHub Automation Reminder
# Reminds AI agents to use flo workflow automation instead of direct GitHub commands

echo ""
echo "🚫 REMINDER: Direct GitHub commands are DISABLED"
echo "   Use flo workflow automation instead:"
echo ""
echo "❌ gh pr create     → ✅ flo auto:run <issue> --auto-pr"
echo "❌ gh pr merge      → ✅ flo workflow automation" 
echo "❌ gh issue create  → ✅ flo board:create"
echo "❌ git commit       → ✅ flo tdd:red/green/refactor/cover"
echo "❌ git push         → ✅ flo workflow automation"
echo "❌ git checkout -b  → ✅ flo tdd:start <issue>"
echo ""
echo "📋 Policy: AI_GUIDELINES.md § GitHub Command Restrictions"
echo "🎯 Use flo automation for consistency and quality control"
echo ""