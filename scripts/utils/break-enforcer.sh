#!/bin/bash
# break-enforcer.sh - ADHD-friendly break management system
# FORCES breaks after 25-minute work sessions to prevent hyperfocus burnout

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_header() { echo -e "${BLUE}🧠 $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_focus() { echo -e "${PURPLE}🎯 $1${NC}"; }

# Configuration
WORK_SESSION_MINUTES=25
BREAK_MINUTES=5
LONG_BREAK_MINUTES=15
SESSIONS_BEFORE_LONG_BREAK=4
BREAK_STATE_FILE=".git/break-state"
WORK_LOG_FILE=".git/work-sessions.log"

# Ensure state directory exists
mkdir -p "$(dirname "$BREAK_STATE_FILE")"

print_header "ADHD Break Enforcer - Protecting Your Focus Energy"
echo ""

# Function to get current timestamp
get_timestamp() {
    date +%s
}

# Function to format duration
format_duration() {
    local seconds=$1
    local minutes=$((seconds / 60))
    local hours=$((minutes / 60))
    minutes=$((minutes % 60))
    
    if [[ $hours -gt 0 ]]; then
        echo "${hours}h ${minutes}m"
    else
        echo "${minutes}m"
    fi
}

# Function to load break state
load_break_state() {
    if [[ -f "$BREAK_STATE_FILE" ]]; then
        source "$BREAK_STATE_FILE"
    else
        # Initialize state
        LAST_WORK_START=0
        LAST_BREAK_END=0
        SESSION_COUNT=0
        TOTAL_WORK_TIME=0
        TOTAL_BREAKS_TAKEN=0
        save_break_state
    fi
}

# Function to save break state
save_break_state() {
    cat > "$BREAK_STATE_FILE" << EOF
LAST_WORK_START=$LAST_WORK_START
LAST_BREAK_END=$LAST_BREAK_END
SESSION_COUNT=$SESSION_COUNT
TOTAL_WORK_TIME=$TOTAL_WORK_TIME
TOTAL_BREAKS_TAKEN=$TOTAL_BREAKS_TAKEN
EOF
}

# Function to log work session
log_work_session() {
    local duration=$1
    local action="$2"
    echo "$(date +'%Y-%m-%d %H:%M:%S') | Session ${SESSION_COUNT} | Duration: $(format_duration $duration) | Action: $action" >> "$WORK_LOG_FILE"
}

# Function to check if currently in hyperfocus (working too long)
check_hyperfocus() {
    local current_time=$(get_timestamp)
    local work_duration=$((current_time - LAST_WORK_START))
    local work_minutes=$((work_duration / 60))
    
    if [[ $work_minutes -ge $WORK_SESSION_MINUTES ]]; then
        return 0  # In hyperfocus
    else
        return 1  # Not in hyperfocus
    fi
}

# Function to start work session
start_work_session() {
    local current_time=$(get_timestamp)
    
    # Check if we need to take a break first
    if [[ $LAST_WORK_START -gt 0 ]] && check_hyperfocus; then
        print_error "🚫 WORK BLOCKED: Break required after $(format_duration $((current_time - LAST_WORK_START)))"
        force_break
        return 1
    fi
    
    LAST_WORK_START=$current_time
    ((SESSION_COUNT++))
    save_break_state
    
    print_success "🎯 Work session $SESSION_COUNT started"
    print_info "💡 ADHD Tip: Focus on ONE task for the next $WORK_SESSION_MINUTES minutes"
    echo ""
    print_info "📋 Session guidelines:"
    echo "  • Disable notifications and distractions"
    echo "  • Use ./scripts/safe-commit.sh for commits"
    echo "  • Work will be blocked after $WORK_SESSION_MINUTES minutes"
    echo "  • Focus on completing small, testable changes"
    echo ""
    
    # Set up automatic break reminder
    print_info "⏰ Break reminder set for $WORK_SESSION_MINUTES minutes"
}

# Function to force a break
force_break() {
    local current_time=$(get_timestamp)
    local work_duration=$((current_time - LAST_WORK_START))
    local work_minutes=$((work_duration / 60))
    
    print_error "🚫 MANDATORY BREAK TIME!"
    echo ""
    print_warning "🧠 ADHD Protection Active:"
    echo "  • You've been working for $(format_duration $work_duration)"
    echo "  • Hyperfocus can lead to burnout and decreased quality"
    echo "  • Breaks improve focus, creativity, and code quality"
    echo ""
    
    # Determine break type
    local break_duration=$BREAK_MINUTES
    if [[ $((SESSION_COUNT % SESSIONS_BEFORE_LONG_BREAK)) -eq 0 ]]; then
        break_duration=$LONG_BREAK_MINUTES
        print_focus "🌟 LONG BREAK TIME: $break_duration minutes"
        echo ""
        echo "🎉 You've completed $SESSIONS_BEFORE_LONG_BREAK Pomodoro sessions!"
        echo "Take a longer break to recharge your ADHD brain:"
        echo "  • Go for a walk outside"
        echo "  • Do some stretching or light exercise"
        echo "  • Have a healthy snack and water"
        echo "  • Practice mindfulness or breathing exercises"
    else
        print_focus "☕ SHORT BREAK: $break_duration minutes"
        echo ""
        echo "🔄 Quick recharge activities:"
        echo "  • Stand up and stretch"
        echo "  • Look away from screen (20-20-20 rule)"
        echo "  • Hydrate with water"
        echo "  • Take 5 deep breaths"
    fi
    
    echo ""
    print_warning "⏰ Break Timer: $break_duration minutes"
    print_info "Work will remain BLOCKED until break is completed"
    echo ""
    
    # Block all work until break is taken
    local break_start=$current_time
    local break_end=$((break_start + break_duration * 60))
    
    # Interactive break timer
    echo "Press ENTER when you're ready to start your break..."
    read -r
    
    print_info "🕐 Break started - timer running..."
    local remaining=$break_duration
    
    while [[ $remaining -gt 0 ]]; do
        printf "\r⏰ Break time remaining: %02d:%02d" $((remaining / 60)) $((remaining % 60))
        sleep 60
        ((remaining--))
    done
    
    echo ""
    echo ""
    print_success "🎉 Break completed!"
    
    # Update state
    LAST_BREAK_END=$(get_timestamp)
    TOTAL_WORK_TIME=$((TOTAL_WORK_TIME + work_duration))
    ((TOTAL_BREAKS_TAKEN++))
    save_break_state
    
    # Log the session
    log_work_session $work_duration "Break completed after $(format_duration $work_duration)"
    
    echo ""
    print_focus "🧠 Post-break check-in:"
    echo "  • How are you feeling? (energized/tired/focused/scattered)"
    echo "  • What's your next priority task?"
    echo "  • Any distractions to address before resuming?"
    echo ""
    
    print_success "✅ Ready to start next work session!"
    echo "Use: ./scripts/break-enforcer.sh start"
}

# Function to show current status
show_status() {
    load_break_state
    local current_time=$(get_timestamp)
    
    print_header "📊 ADHD Focus Session Status"
    echo ""
    
    if [[ $LAST_WORK_START -gt 0 ]]; then
        local work_duration=$((current_time - LAST_WORK_START))
        local work_minutes=$((work_duration / 60))
        local remaining_minutes=$((WORK_SESSION_MINUTES - work_minutes))
        
        if [[ $remaining_minutes -gt 0 ]]; then
            print_success "🎯 Currently in work session $SESSION_COUNT"
            echo "  • Time elapsed: $(format_duration $work_duration)"
            echo "  • Time remaining: $(format_duration $((remaining_minutes * 60)))"
            echo "  • Next break: $(date -d "+${remaining_minutes} minutes" +'%H:%M')"
        else
            print_error "⚠️  OVERDUE FOR BREAK by $(format_duration $((-remaining_minutes * 60)))"
            print_warning "Work is now BLOCKED until break is taken"
        fi
    else
        print_info "📴 Not currently in a work session"
        echo "Start with: ./scripts/break-enforcer.sh start"
    fi
    
    echo ""
    print_info "📈 Today's Statistics:"
    echo "  • Sessions completed: $SESSION_COUNT"
    echo "  • Total work time: $(format_duration $TOTAL_WORK_TIME)"
    echo "  • Breaks taken: $TOTAL_BREAKS_TAKEN"
    echo "  • Next break type: $([[ $((SESSION_COUNT % SESSIONS_BEFORE_LONG_BREAK)) -eq 0 ]] && echo "Long ($LONG_BREAK_MINUTES min)" || echo "Short ($BREAK_MINUTES min)")"
    
    if [[ -f "$WORK_LOG_FILE" ]]; then
        echo ""
        print_info "📝 Recent sessions:"
        tail -5 "$WORK_LOG_FILE" | while read -r line; do
            echo "    $line"
        done
    fi
}

# Function to check if work is allowed
check_work_allowed() {
    load_break_state
    
    if [[ $LAST_WORK_START -gt 0 ]] && check_hyperfocus; then
        print_error "❌ WORK BLOCKED: Break required"
        echo ""
        echo "🧠 ADHD brain protection active:"
        echo "  • You've been working too long without a break"
        echo "  • Take a break to maintain focus quality"
        echo "  • Use: ./scripts/break-enforcer.sh break"
        return 1
    fi
    
    return 0
}

# Function to integrate with git operations
block_commit_if_needed() {
    if ! check_work_allowed; then
        print_error "🚫 COMMIT BLOCKED: Take a break first"
        echo ""
        echo "Your ADHD brain needs rest to maintain code quality."
        echo "Take a break, then commit with fresh focus."
        exit 1
    fi
}

# Main command handling
case "${1:-status}" in
    "start")
        load_break_state
        start_work_session
        ;;
    "break")
        load_break_state
        if [[ $LAST_WORK_START -gt 0 ]]; then
            force_break
        else
            print_warning "No active work session to break from"
        fi
        ;;
    "status")
        show_status
        ;;
    "check")
        load_break_state
        check_work_allowed
        ;;
    "block-commit")
        load_break_state
        block_commit_if_needed
        ;;
    "reset")
        print_warning "Resetting break state..."
        rm -f "$BREAK_STATE_FILE"
        print_success "Break state reset"
        ;;
    "log")
        if [[ -f "$WORK_LOG_FILE" ]]; then
            echo "📝 Work session history:"
            cat "$WORK_LOG_FILE"
        else
            print_info "No work sessions logged yet"
        fi
        ;;
    "help"|"-h"|"--help")
        echo "🧠 ADHD Break Enforcer - Usage:"
        echo ""
        echo "Commands:"
        echo "  start        Start a new work session"
        echo "  break        Take a break (end current session)"
        echo "  status       Show current session status"
        echo "  check        Check if work is allowed (exit 1 if blocked)"
        echo "  block-commit Block commits during overdue break periods"
        echo "  reset        Reset break state"
        echo "  log          Show work session history"
        echo "  help         Show this help"
        echo ""
        echo "🎯 ADHD-Friendly Features:"
        echo "  • Enforces 25-minute work sessions"
        echo "  • Mandatory 5-minute breaks"
        echo "  • Long breaks every 4 sessions"
        echo "  • Blocks work during overdue break periods"
        echo "  • Tracks daily focus statistics"
        echo ""
        echo "💡 Integration:"
        echo "  • Add to safe-commit.sh: ./scripts/break-enforcer.sh block-commit"
        echo "  • Check before coding: ./scripts/break-enforcer.sh check"
        echo "  • Start work session: ./scripts/break-enforcer.sh start"
        ;;
    *)
        print_error "Unknown command: $1"
        echo "Use: ./scripts/break-enforcer.sh help"
        exit 1
        ;;
esac