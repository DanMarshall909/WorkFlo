#!/bin/bash

# progress-examples.sh
# Examples of how to use the enhanced update-progress.sh script

echo "📚 Enhanced Progress Tracker Usage Examples"
echo "==========================================="
echo ""

echo "🔧 Basic Usage:"
echo "./scripts/update-progress.sh                                    # Auto-detect changes"
echo "./scripts/update-progress.sh \"testing\" \"Added new tests\"       # Manual entry"
echo "./scripts/update-progress.sh \"complete\" \"Finished feature\" \"session-timer\" --commit"
echo ""

echo "📝 Action Types Available:"
echo "  auto        - Auto-detect changes from git status (default)"
echo "  testing     - 🧪 Testing work"
echo "  complete    - ✅ Completed work"
echo "  blocked     - 🚫 Blocked work"
echo "  working     - 🔧 Work in progress"
echo "  phase1      - 🔧 Phase 1 work"
echo "  phase2      - 🎯 Phase 2 work" 
echo "  phase3      - 📊 Phase 3 work"
echo "  phase4      - 💾 Phase 4 work"
echo ""

echo "🎯 What the script automatically detects:"
echo "  • New test files (*.test.ts, *.test.tsx)"
echo "  • New component files (*.tsx)"
echo "  • New hook files (*.ts in hooks/)"
echo "  • Modified files (excluding PROGRESS.md)"
echo "  • Deleted files"
echo "  • Current feature being worked on"
echo ""

echo "📊 What gets automatically updated:"
echo "  • Recent Updates section with timestamped entries"
echo "  • Quality metrics (test count, component count)"
echo "  • File counts (created/modified)"
echo "  • Last updated timestamp"
echo ""

echo "💡 Pro Tips:"
echo "  • Use --commit flag to auto-commit progress updates"
echo "  • Run without parameters for quick status updates"
echo "  • Use specific action types for better tracking"
echo "  • Feature names are auto-detected but can be overridden"
echo ""

echo "🔗 Integration with TDD workflow:"
echo "  • Integrates with existing TDD scripts"
echo "  • Tracks test file creation automatically"
echo "  • Updates metrics after each development cycle"
echo "  • Provides git status analysis for better insights"