#!/bin/bash

# notify.sh - Cross-platform notification and file viewer script for Claude Code
# Usage: 
#   ./scripts/notify.sh "Your message here" [title]          # Send notification
#   ./scripts/notify.sh --md-view /path/to/file.md           # Open markdown file in browser as HTML
#   ./scripts/notify.sh --html-view /path/to/file.html       # Open HTML file in browser
#   ./scripts/notify.sh --mermaid-view /path/to/file.mmd     # Open Mermaid diagram in browser
#   ./scripts/notify.sh --with-buttons "message" "title" "button1:command1" "button2:command2" # Interactive notification

set -e

# Check if this is an interactive notification with buttons
if [[ "$1" == "--with-buttons" ]]; then
    if [[ $# -lt 4 ]]; then
        echo "Usage: $0 --with-buttons \"message\" \"title\" \"button1:command1\" [\"button2:command2\" ...]"
        echo "       $0 --with-buttons --md-file /path/to/file.md \"title\" \"button1:command1\" [\"button2:command2\" ...]"
        echo "Example: $0 --with-buttons \"Build complete!\" \"WorkFlo\" \"View Report:./scripts/notify.sh --html-view report.html\" \"Run Tests:npm test\""
        echo "Example: $0 --with-buttons --md-file PROGRESS.md \"Development Status\" \"Continue:echo next\" \"Review:echo review\""
        exit 1
    fi
    
    # Check if we're loading content from a markdown file
    if [[ "$2" == "--md-file" ]]; then
        if [[ ! -f "$3" ]]; then
            echo "Error: Markdown file '$3' not found"
            exit 1
        fi
        
        # Read and process markdown content
        MD_CONTENT=$(cat "$3")
        # Convert basic markdown to plain text for dialogs
        MESSAGE=$(echo "$MD_CONTENT" | sed 's/^#\+\s*//g' | sed 's/\*\*\(.*\)\*\*/\1/g' | sed 's/\*\(.*\)\*/\1/g' | head -20 | tr '\n' ' ')
        TITLE="$4"
        shift 4  # Remove the first 4 arguments
        
        # For platforms that support it, we'll use the full markdown content
        FULL_MD_CONTENT="$MD_CONTENT"
    else
        MESSAGE="$2"
        TITLE="$3" 
        shift 3  # Remove the first 3 arguments, leaving button definitions
        FULL_MD_CONTENT=""
    fi
    
    # Parse button definitions
    BUTTON_TEXTS=()
    BUTTON_COMMANDS=()
    
    for button_def in "$@"; do
        if [[ "$button_def" == *":"* ]]; then
            BUTTON_TEXT="${button_def%%:*}"
            BUTTON_CMD="${button_def#*:}"
            BUTTON_TEXTS+=("$BUTTON_TEXT")
            BUTTON_COMMANDS+=("$BUTTON_CMD")
        fi
    done
    
    echo "Creating interactive dialog with ${#BUTTON_TEXTS[@]} buttons..."
    
    # Platform-specific dialog implementation
    if [[ -n "$WSL_DISTRO_NAME" || -n "$WSLENV" ]]; then
        # WSL/Windows - Use PowerShell with Windows Forms
        BUTTONS_PS=""
        for i in "${!BUTTON_TEXTS[@]}"; do
            BUTTONS_PS="$BUTTONS_PS'${BUTTON_TEXTS[$i]}',"
        done
        BUTTONS_PS=${BUTTONS_PS%,}  # Remove trailing comma
        
        # Prepare content for PowerShell - use markdown content if available
        if [[ -n "$FULL_MD_CONTENT" ]]; then
            # Convert markdown to HTML for rich display
            MD_CONTENT_ESCAPED=$(echo "$FULL_MD_CONTENT" | sed "s/'/\'\'/g" | head -50)
            # Create HTML content with basic markdown conversion
            HTML_CONTENT="<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            padding: 15px; 
            margin: 0; 
            background: #f8f9fa; 
        }
        h1, h2, h3 { color: #333; margin-top: 20px; margin-bottom: 10px; }
        h1 { border-bottom: 2px solid #eee; padding-bottom: 5px; }
        h2 { border-bottom: 1px solid #eee; padding-bottom: 3px; }
        code { 
            background: #f1f3f4; 
            padding: 2px 4px; 
            border-radius: 3px; 
            font-family: 'Consolas', monospace; 
        }
        pre { 
            background: #f8f8f8; 
            border: 1px solid #ddd; 
            border-radius: 4px; 
            padding: 10px; 
            overflow-x: auto; 
        }
        ul, ol { padding-left: 20px; }
        li { margin: 5px 0; }
        .emoji { font-size: 1.2em; }
        .status { font-weight: bold; }
        .completed { color: #28a745; }
        .in-progress { color: #ffc107; }
        .pending { color: #6c757d; }
    </style>
</head>
<body>"
            
            # Basic markdown to HTML conversion
            HTML_BODY=$(echo "$MD_CONTENT_ESCAPED" | \
                sed 's/^### \(.*\)/<h3>\1<\/h3>/' | \
                sed 's/^## \(.*\)/<h2>\1<\/h2>/' | \
                sed 's/^# \(.*\)/<h1>\1<\/h1>/' | \
                sed 's/^\* \(.*\)/<li>\1<\/li>/' | \
                sed 's/^- \(.*\)/<li>\1<\/li>/' | \
                sed 's/\*\*\([^*]*\)\*\*/<strong>\1<\/strong>/g' | \
                sed 's/`\([^`]*\)`/<code>\1<\/code>/g' | \
                sed 's/✅/<span class="emoji completed">✅<\/span>/g' | \
                sed 's/🚀/<span class="emoji">🚀<\/span>/g' | \
                sed 's/📋/<span class="emoji">📋<\/span>/g' | \
                sed 's/^$/<br>/' | \
                sed ':a;N;$!ba;s/\(<li>.*<\/li>\)\n\(<li>.*<\/li>\)/<ul>\1\n\2<\/ul>/g')
            
            HTML_CONTENT="$HTML_CONTENT$HTML_BODY</body></html>"
            
            # Escape for PowerShell
            PS_HTML_CONTENT=$(echo "$HTML_CONTENT" | sed "s/'/\'\'/g")
            USE_HTML=true
        else
            PS_MESSAGE=$(echo "$MESSAGE" | sed "s/'/\'\'/g")
            USE_HTML=false
        fi
        
        RESULT=$(powershell.exe -Command "
            Add-Type -AssemblyName System.Windows.Forms
            Add-Type -AssemblyName System.Drawing
            
            \$buttons = @($BUTTONS_PS)
            \$buttonCount = \$buttons.Length
            
            # Calculate form dimensions based on screen size (2/3 of screen, square)
            \$buttonHeight = 35
            \$buttonWidth = 120
            \$spacing = 10
            
            # Get screen dimensions
            \$screen = [System.Windows.Forms.Screen]::PrimaryScreen
            \$screenWidth = \$screen.Bounds.Width
            \$screenHeight = \$screen.Bounds.Height
            
            # Calculate 2/3 of screen size, make it square
            \$targetSize = [Math]::Min(\$screenWidth, \$screenHeight) * 0.67
            \$formWidth = [Math]::Max(\$targetSize, (\$buttonCount * (\$buttonWidth + \$spacing)) + 100)
            \$formHeight = \$formWidth  # Make it square
            
            \$form = New-Object System.Windows.Forms.Form
            \$form.Text = '$TITLE'
            \$form.Size = New-Object System.Drawing.Size(\$formWidth, \$formHeight)
            \$form.MinimumSize = New-Object System.Drawing.Size(500, 400)
            \$form.StartPosition = 'CenterScreen'
            \$form.FormBorderStyle = 'Sizable'  # Allow resizing
            \$form.MaximizeBox = \$true
            \$form.MinimizeBox = \$true
            \$form.TopMost = \$true
            
            # Content display area - use WebBrowser for HTML or TextBox for plain text
            \$contentPadding = 20
            \$contentHeight = \$formHeight - 120  # Leave space for buttons at bottom
            
            if ('$USE_HTML' -eq 'true') {
                # Use WebBrowser control for rich HTML content
                \$webBrowser = New-Object System.Windows.Forms.WebBrowser
                \$webBrowser.Size = New-Object System.Drawing.Size((\$formWidth - (\$contentPadding * 2)), \$contentHeight)
                \$webBrowser.Location = New-Object System.Drawing.Point(\$contentPadding, \$contentPadding)
                \$webBrowser.Anchor = 'Top,Left,Right,Bottom'  # Resize with form
                \$webBrowser.ScrollBarsEnabled = \$true
                \$webBrowser.DocumentText = '$PS_HTML_CONTENT'
                \$webBrowser.AllowNavigation = \$false  # Prevent navigation for security
                \$form.Controls.Add(\$webBrowser)
                \$contentControl = \$webBrowser
            } else {
                # Use TextBox for plain text content
                \$textBox = New-Object System.Windows.Forms.TextBox
                \$textBox.Text = '$PS_MESSAGE'
                \$textBox.Size = New-Object System.Drawing.Size((\$formWidth - (\$contentPadding * 2)), \$contentHeight)
                \$textBox.Location = New-Object System.Drawing.Point(\$contentPadding, \$contentPadding)
                \$textBox.Anchor = 'Top,Left,Right,Bottom'  # Resize with form
                \$textBox.Multiline = \$true
                \$textBox.ReadOnly = \$true
                \$textBox.ScrollBars = 'Vertical'
                \$textBox.WordWrap = \$true
                \$textBox.Font = New-Object System.Drawing.Font('Consolas', 10)  # Slightly larger font for bigger dialog
                \$textBox.BackColor = [System.Drawing.Color]::FromArgb(248, 249, 250)
                \$textBox.BorderStyle = 'Fixed3D'
                \$form.Controls.Add(\$textBox)
                \$contentControl = \$textBox
            }
            
            # All buttons inline - including cancel button in the same row
            \$buttonStartY = \$formHeight - 80  # Position from bottom for single row
            \$cancelButtonWidth = 100
            \$totalButtonWidth = (\$buttonCount * \$buttonWidth) + ((\$buttonCount - 1) * \$spacing) + \$spacing + \$cancelButtonWidth
            \$startX = (\$formWidth - \$totalButtonWidth) / 2
            
            # Action buttons
            for (\$i = 0; \$i -lt \$buttonCount; \$i++) {
                \$button = New-Object System.Windows.Forms.Button
                \$button.Text = \$buttons[\$i]
                \$button.Size = New-Object System.Drawing.Size(\$buttonWidth, \$buttonHeight)
                \$button.Location = New-Object System.Drawing.Point((\$startX + (\$i * (\$buttonWidth + \$spacing))), \$buttonStartY)
                \$button.Anchor = 'Bottom'
                \$button.Tag = \$i
                \$button.Add_Click({
                    \$form.DialogResult = 'OK'
                    \$form.Tag = \$this.Tag
                    \$form.Close()
                })
                \$form.Controls.Add(\$button)
            }
            
            # Cancel button - inline with action buttons
            \$cancelButton = New-Object System.Windows.Forms.Button
            \$cancelButton.Text = 'Cancel'
            \$cancelButton.Size = New-Object System.Drawing.Size(\$cancelButtonWidth, \$buttonHeight)
            \$cancelButtonX = \$startX + (\$buttonCount * (\$buttonWidth + \$spacing))  # Position after last action button
            \$cancelButton.Location = New-Object System.Drawing.Point(\$cancelButtonX, \$buttonStartY)
            \$cancelButton.Anchor = 'Bottom'
            \$cancelButton.Add_Click({ 
                \$form.Tag = -1
                \$form.Close() 
            })
            \$form.Controls.Add(\$cancelButton)
            
            # Adjust content control size to not overlap with buttons
            \$contentBottomMargin = 60  # Less space needed for single row of buttons
            \$contentControl.Size = New-Object System.Drawing.Size((\$formWidth - 40), (\$formHeight - 60 - \$contentBottomMargin))
            
            \$result = \$form.ShowDialog()
            if (\$form.Tag -ne \$null) {
                Write-Host \$form.Tag
            } else {
                Write-Host '-1'
            }
        " 2>/dev/null | tr -d '\r')
        
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux - Use zenity if available
        if command -v zenity > /dev/null 2>&1; then
            # Use markdown content if available, otherwise use the regular message
            if [[ -n "$FULL_MD_CONTENT" ]]; then
                # For markdown content, show it in a scrollable text dialog first
                DISPLAY_MESSAGE=$(echo "$FULL_MD_CONTENT" | head -30)  # Limit lines for readability
                ZENITY_MESSAGE=$(echo "$DISPLAY_MESSAGE" | sed 's/&/\&amp;/g' | sed 's/</\&lt;/g' | sed 's/>/\&gt;/g')
            else
                ZENITY_MESSAGE=$(echo "$MESSAGE" | sed 's/&/\&amp;/g' | sed 's/</\&lt;/g' | sed 's/>/\&gt;/g')
            fi
            
            # For zenity, we'll use a list dialog for multiple options
            if [[ ${#BUTTON_TEXTS[@]} -gt 2 ]]; then
                # Use list dialog for more than 2 buttons with info display
                LIST_OPTIONS=""
                for i in "${!BUTTON_TEXTS[@]}"; do
                    LIST_OPTIONS="$LIST_OPTIONS FALSE \"${BUTTON_TEXTS[$i]}\""
                done
                
                # Show content dialog first
                if [[ -n "$FULL_MD_CONTENT" ]]; then
                    # Use text-info dialog for better markdown display
                    echo "$FULL_MD_CONTENT" | zenity --text-info --title="$TITLE - Content" --width=600 --height=400 --font="monospace 10" 2>/dev/null || \
                    zenity --info --title="$TITLE" --text="$ZENITY_MESSAGE" --width=600 --height=300 2>/dev/null
                else
                    zenity --info --title="$TITLE" --text="$ZENITY_MESSAGE" --width=500 --height=200 2>/dev/null
                fi
                
                RESULT=$(eval "zenity --list --title=\"$TITLE - Choose Action\" --text=\"Select an action:\" --radiolist --column=\"Select\" --column=\"Action\" $LIST_OPTIONS --width=400 --height=300" 2>/dev/null)
                
                if [[ -n "$RESULT" ]]; then
                    # Find which button was selected
                    for i in "${!BUTTON_TEXTS[@]}"; do
                        if [[ "${BUTTON_TEXTS[$i]}" == "$RESULT" ]]; then
                            RESULT="$i"
                            break
                        fi
                    done
                else
                    RESULT="-1"
                fi
            else
                # Use question dialog for 2 buttons
                # Show content first if we have markdown
                if [[ -n "$FULL_MD_CONTENT" ]]; then
                    echo "$FULL_MD_CONTENT" | zenity --text-info --title="$TITLE - Content" --width=600 --height=400 --font="monospace 10" 2>/dev/null || \
                    zenity --info --title="$TITLE" --text="$ZENITY_MESSAGE" --width=600 --height=300 2>/dev/null
                fi
                
                # Now show the action buttons
                if zenity --question --title="$TITLE" --text="Choose your action:" --ok-label="${BUTTON_TEXTS[0]}" --cancel-label="${BUTTON_TEXTS[1]:-Cancel}" 2>/dev/null; then
                    RESULT="0"
                else
                    RESULT="1"
                fi
            fi
        else
            echo "zenity not found. Install with: sudo apt-get install zenity"
            echo "Falling back to terminal selection..."
            
            # Terminal fallback
            echo ""
            echo "=== $TITLE ==="
            
            # Display markdown content if available
            if [[ -n "$FULL_MD_CONTENT" ]]; then
                echo "Content:"
                echo "--------"
                echo "$FULL_MD_CONTENT" | head -20  # Show first 20 lines
                echo "--------"
            else
                echo "$MESSAGE"
            fi
            
            echo ""
            echo "Actions:"
            for i in "${!BUTTON_TEXTS[@]}"; do
                echo "$((i + 1)). ${BUTTON_TEXTS[$i]}"
            done
            echo "0. Cancel"
            echo ""
            read -p "Select option: " choice
            
            if [[ "$choice" =~ ^[1-9][0-9]*$ ]] && [[ $choice -le ${#BUTTON_TEXTS[@]} ]]; then
                RESULT=$((choice - 1))
            else
                RESULT="-1"
            fi
        fi
        
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS - Use osascript
        BUTTONS_AS=""
        for button_text in "${BUTTON_TEXTS[@]}"; do
            BUTTONS_AS="$BUTTONS_AS\"$button_text\", "
        done
        BUTTONS_AS=${BUTTONS_AS%, }  # Remove trailing comma and space
        
        # Use markdown content if available for display
        if [[ -n "$FULL_MD_CONTENT" ]]; then
            # For markdown content, use a larger dialog with better formatting
            DISPLAY_TEXT=$(echo "$FULL_MD_CONTENT" | head -30 | sed 's/"/\\"/g')  # Escape quotes and limit lines
            RESULT=$(osascript -e "
                set buttonList to {$BUTTONS_AS}
                set contentText to \"$DISPLAY_TEXT\"
                
                # Show content first if it's substantial
                if length of contentText > 100 then
                    try
                        display dialog contentText with title \"$TITLE - Content\" buttons {\"Continue\"} default button 1 giving up after 30
                    end try
                end if
                
                set theResult to display dialog \"Choose your action:\" with title \"$TITLE\" buttons buttonList default button 1
                set buttonPressed to button returned of theResult
                
                repeat with i from 1 to count of buttonList
                    if item i of buttonList is buttonPressed then
                        return (i - 1) as string
                    end if
                end repeat
                return \"-1\"
            " 2>/dev/null)
        else
            RESULT=$(osascript -e "
                set buttonList to {$BUTTONS_AS}
                set theResult to display dialog \"$MESSAGE\" with title \"$TITLE\" buttons buttonList default button 1
                set buttonPressed to button returned of theResult
                
                repeat with i from 1 to count of buttonList
                    if item i of buttonList is buttonPressed then
                        return (i - 1) as string
                    end if
                end repeat
                return \"-1\"
            " 2>/dev/null)
        fi
        
    else
        echo "Platform not supported for interactive dialogs. Falling back to terminal."
        # Terminal fallback
        echo ""
        echo "=== $TITLE ==="
        
        # Display markdown content if available
        if [[ -n "$FULL_MD_CONTENT" ]]; then
            echo "Content:"
            echo "--------"
            echo "$FULL_MD_CONTENT" | head -20  # Show first 20 lines
            echo "--------"
        else
            echo "$MESSAGE"
        fi
        
        echo ""
        echo "Actions:"
        for i in "${!BUTTON_TEXTS[@]}"; do
            echo "$((i + 1)). ${BUTTON_TEXTS[$i]}"
        done
        echo "0. Cancel"
        echo ""
        read -p "Select option: " choice
        
        if [[ "$choice" =~ ^[1-9][0-9]*$ ]] && [[ $choice -le ${#BUTTON_TEXTS[@]} ]]; then
            RESULT=$((choice - 1))
        else
            RESULT="-1"
        fi
    fi
    
    # Execute the selected command
    if [[ "$RESULT" =~ ^[0-9]+$ ]] && [[ $RESULT -ge 0 ]] && [[ $RESULT -lt ${#BUTTON_COMMANDS[@]} ]]; then
        SELECTED_CMD="${BUTTON_COMMANDS[$RESULT]}"
        SELECTED_BUTTON="${BUTTON_TEXTS[$RESULT]}"
        
        echo "Executing: $SELECTED_BUTTON -> $SELECTED_CMD"
        
        # Execute the command
        eval "$SELECTED_CMD"
    else
        echo "Dialog cancelled or invalid selection."
    fi
    
    exit 0
fi

# Check if this is a file viewer request
if [[ "$1" == "--md-view" || "$1" == "--html-view" || "$1" == "--mermaid-view" ]]; then
    if [[ -z "$2" ]]; then
        echo "Usage: $0 --md-view /path/to/file.md"
        echo "       $0 --html-view /path/to/file.html"
        echo "       $0 --mermaid-view /path/to/file.mmd"
        exit 1
    fi
    
    INPUT_FILE="$2"
    if [[ ! -f "$INPUT_FILE" ]]; then
        echo "Error: File '$INPUT_FILE' not found"
        exit 1
    fi
    
    # Determine the file to open in browser
    if [[ "$1" == "--html-view" ]]; then
        # HTML file - open directly
        HTML_FILE="$INPUT_FILE"
        echo "Opening HTML file '$INPUT_FILE' in browser"
    elif [[ "$1" == "--mermaid-view" ]]; then
        # Mermaid file - convert to HTML with Mermaid.js
        convert_mermaid_to_html() {
            local mermaid_file="$1"
            local html_file="/tmp/$(basename "$mermaid_file" .mmd).html"
            
            cat > "$html_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>$(basename "$mermaid_file")</title>
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #fff;
            scroll-behavior: auto;
        }
        .controls {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(255, 255, 255, 0.95);
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border: 1px solid #ddd;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        .controls label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #333;
        }
        .controls input[type="range"] {
            width: 150px;
            margin-bottom: 5px;
        }
        .controls .scale-value {
            color: #666;
            font-size: 12px;
        }
        .mermaid {
            width: 100%;
            border: 2px solid #ddd;
            border-radius: 8px;
            margin: 20px 0;
            padding: 20px;
            background: #fafafa;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            overflow: hidden;
            position: relative;
            max-height: 400px; /* Constrain height */
            overscroll-behavior: contain;
        }
        .mermaid-header {
            position: absolute;
            top: 5px;
            right: 5px;
            z-index: 10;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        .mermaid:hover .mermaid-header {
            opacity: 1;
        }
        .fullscreen-btn {
            background: rgba(0, 123, 255, 0.9);
            color: white;
            border: none;
            border-radius: 4px;
            padding: 6px 10px;
            font-size: 12px;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .fullscreen-btn:hover {
            background: rgba(0, 123, 255, 1);
        }
        #mermaidDiagram {
            width: 100%;
            height: auto;
        }
        #mermaidDiagram svg {
            width: 100% !important;
            height: auto !important;
            max-width: none !important;
            max-height: 360px; /* Limit SVG height within container */
        }
        
        /* Fullscreen modal */
        .fullscreen-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.9);
            z-index: 1000;
            overflow: auto;
        }
        .fullscreen-content {
            position: relative;
            width: 95%;
            height: 95%;
            margin: 2.5% auto;
            background: white;
            border-radius: 8px;
            padding: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            display: flex;
            flex-direction: column;
        }
        .close-fullscreen {
            position: absolute;
            top: 10px;
            right: 15px;
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
        }
        .close-fullscreen:hover {
            color: #000;
        }
        .fullscreen-diagram {
            flex: 1;
            width: 100%;
            overflow: hidden;
            position: relative;
            cursor: grab;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .fullscreen-diagram.dragging {
            cursor: grabbing;
        }
        h1 {
            text-align: center;
            color: #333;
            margin-bottom: 30px;
        }
        .mermaid.dragging {
            cursor: grabbing;
        }
    </style>
</head>
<body>
    <div class="controls">
        <div style="font-size: 14px; color: #666; text-align: center;">
            Scroll over diagram to zoom<br>
            Right-click to reset
        </div>
    </div>
    
    <h1>$(basename "$mermaid_file")</h1>
    <div class="mermaid" id="mermaidDiagram">
        <div class="mermaid-header">
            <button class="fullscreen-btn" onclick="openFullscreen()">⛶ Fullscreen</button>
        </div>
$(cat "$mermaid_file")
    </div>
    
    <!-- Fullscreen Modal -->
    <div id="fullscreenModal" class="fullscreen-modal">
        <div class="fullscreen-content">
            <button class="close-fullscreen" onclick="closeFullscreen()">&times;</button>
            <div class="fullscreen-diagram" id="fullscreenDiagram"></div>
        </div>
    </div>
    
    <script>
        let currentScale = 1;
        
        function initializeMermaid() {
            mermaid.initialize({ 
                startOnLoad: false,
                theme: 'default',
                flowchart: { 
                    useMaxWidth: true, 
                    htmlLabels: true 
                }
            });
        }
        
        function updateDiagram(scale) {
            const diagram = document.getElementById('mermaidDiagram');
            const mermaidContainer = document.querySelector('.mermaid');
            
            // Apply scale transform
            diagram.style.transform = 'scale(' + scale + ')';
            diagram.style.transformOrigin = 'center center';
            
            // Adjust container height for scaled content
            if (diagram.querySelector('svg')) {
                const svg = diagram.querySelector('svg');
                const originalHeight = svg.getBoundingClientRect().height / scale;
                mermaidContainer.style.height = (originalHeight * scale + 40) + 'px';
                
                // Enable scrolling when zoomed
                if (scale > 1) {
                    mermaidContainer.style.overflow = 'auto';
                    mermaidContainer.style.cursor = 'grab';
                } else {
                    mermaidContainer.style.overflow = 'hidden';
                    mermaidContainer.style.cursor = 'default';
                }
            }
        }
        
        // Global wheel event handler to prevent page scrolling on mermaid elements
        document.addEventListener('wheel', (e) => {
            // Check if the event target is within a mermaid diagram
            if (e.target.closest('.mermaid') || e.target.closest('.fullscreen-modal')) {
                e.preventDefault();
                // Don't stop propagation for fullscreen - let zoom handlers work
                if (!e.target.closest('.fullscreen-modal')) {
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                }
                return false;
            }
        }, { passive: false, capture: true });

        // Initialize
        initializeMermaid();
        mermaid.run().then(() => {
            // Set initial scale after diagram is rendered
            setTimeout(() => updateDiagram(currentScale), 100);
        });
        
        // Right-click reset functionality
        const mermaidContainer = document.querySelector('.mermaid');
        mermaidContainer.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            currentScale = 1;
            updateDiagram(currentScale);
        });
        
        // Pan functionality for mermaid container
        let isPanning = false;
        let startX, startY, scrollLeft, scrollTop;
        
        mermaidContainer.addEventListener('mousedown', (e) => {
            if (currentScale <= 1) return; // Only pan when zoomed in
            isPanning = true;
            mermaidContainer.classList.add('dragging');
            startX = e.pageX;
            startY = e.pageY;
            scrollLeft = mermaidContainer.scrollLeft;
            scrollTop = mermaidContainer.scrollTop;
            e.preventDefault();
        });
        
        document.addEventListener('mouseleave', () => {
            isPanning = false;
            mermaidContainer.classList.remove('dragging');
        });
        
        document.addEventListener('mouseup', () => {
            isPanning = false;
            mermaidContainer.classList.remove('dragging');
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isPanning) return;
            e.preventDefault();
            const x = e.pageX;
            const y = e.pageY;
            const walkX = (x - startX) * 2;
            const walkY = (y - startY) * 2;
            mermaidContainer.scrollLeft = scrollLeft - walkX;
            mermaidContainer.scrollTop = scrollTop - walkY;
        });
        
        // Scroll wheel zoom for regular view
        mermaidContainer.addEventListener('wheel', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
            const newScale = Math.max(0.1, Math.min(5, currentScale + zoomDelta));
            
            if (newScale !== currentScale) {
                currentScale = newScale;
                updateDiagram(currentScale);
            }
            return false;
        }, { passive: false });
        
        // Fullscreen functionality
        function openFullscreen() {
            const modal = document.getElementById('fullscreenModal');
            const fullscreenDiagram = document.getElementById('fullscreenDiagram');
            const originalDiagram = document.getElementById('mermaidDiagram');
            
            // Clone the diagram content
            const diagramClone = originalDiagram.cloneNode(true);
            diagramClone.id = 'fullscreenMermaidDiagram';
            
            // Remove the header from clone
            const header = diagramClone.querySelector('.mermaid-header');
            if (header) header.remove();
            
            // Clear and add the cloned diagram
            fullscreenDiagram.innerHTML = '';
            fullscreenDiagram.appendChild(diagramClone);
            
            // Apply optimal scaling for ultrawide monitors
            const svg = diagramClone.querySelector('svg');
            if (svg) {
                // Reset any transform scaling for fullscreen
                diagramClone.style.transform = 'none';
                diagramClone.style.width = '100%';
                diagramClone.style.height = '100%';
                diagramClone.style.display = 'flex';
                diagramClone.style.alignItems = 'center';
                diagramClone.style.justifyContent = 'center';
                
                // Get viewport dimensions for optimal scaling
                const container = document.getElementById('fullscreenDiagram');
                const containerRect = container.getBoundingClientRect();
                
                // Make SVG responsive to container size
                svg.style.maxWidth = '100%';
                svg.style.maxHeight = '100%';
                svg.style.width = 'auto';
                svg.style.height = 'auto';
                svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
                
                // For very wide viewports, limit height to ensure diagram fits
                if (containerRect.width / containerRect.height > 2) {
                    svg.style.height = '90%';
                    svg.style.width = 'auto';
                }
            }
            
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            
            // Add pan functionality to fullscreen
            setupFullscreenPan();
        }
        
        function closeFullscreen() {
            const modal = document.getElementById('fullscreenModal');
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        
        function setupFullscreenPan() {
            const container = document.getElementById('fullscreenDiagram');
            const diagram = container.querySelector('.mermaid') || container.firstElementChild;
            let isPanning = false;
            let startX, startY, currentX = 0, currentY = 0;
            
            // Enable overflow for panning when diagram is larger than container
            container.style.overflow = 'auto';
            
            container.addEventListener('mousedown', (e) => {
                isPanning = true;
                container.classList.add('dragging');
                startX = e.pageX - currentX;
                startY = e.pageY - currentY;
                e.preventDefault();
            });
            
            document.addEventListener('mouseup', () => {
                isPanning = false;
                container.classList.remove('dragging');
            });
            
            document.addEventListener('mousemove', (e) => {
                if (!isPanning) return;
                e.preventDefault();
                currentX = e.pageX - startX;
                currentY = e.pageY - startY;
                
                if (diagram) {
                    diagram.style.transform = 'translate(' + currentX + 'px, ' + currentY + 'px)';
                }
            });
            
            // Add zoom capability in fullscreen
            container.addEventListener('wheel', (e) => {
                const svg = diagram.querySelector('svg');
                if (!svg) return;
                
                // Get current scale from SVG transform
                const currentTransform = svg.style.transform;
                const scaleMatch = currentTransform.match(/scale\\\\(([^)]+)\\\\)/);
                const currentScale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;
                
                const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
                const newScale = Math.max(0.5, Math.min(5, currentScale + zoomDelta));
                
                // Apply new scale while preserving any existing transforms
                const otherTransforms = currentTransform.replace(/scale\\\\([^)]+\\\\)/, '').trim();
                svg.style.transform = otherTransforms + ' scale(' + newScale + ')';
            });
        }
        
        // Close fullscreen on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeFullscreen();
            }
        });
        
    </script>
</body>
</html>
EOF
            
            echo "$html_file"
        }
        
        HTML_FILE=$(convert_mermaid_to_html "$INPUT_FILE")
        echo "Converting Mermaid diagram '$INPUT_FILE' to HTML"
    else
        # Markdown file - convert to HTML first
        convert_md_to_html() {
            local md_file="$1"
            local html_file="/tmp/$(basename "$md_file" .md).html"
            
            # Check if pandoc is available
            if command -v pandoc > /dev/null 2>&1; then
                # Create HTML with pandoc and add Mermaid support
                pandoc "$md_file" -o "$html_file" --standalone \
                    --css=https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.2.0/github-markdown-light.min.css \
                    --include-in-header=<(cat << 'HEADER'
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
<style>.mermaid { background: #fff; border-radius: 4px; margin: 20px 0; }</style>
HEADER
) \
                    --include-after-body=<(cat << 'FOOTER'
<script>
mermaid.initialize({ startOnLoad: true, theme: 'default', flowchart: { useMaxWidth: true, htmlLabels: true } });
// Convert mermaid code blocks to mermaid divs
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('pre code.language-mermaid, pre code.mermaid').forEach(function(block) {
        const mermaidDiv = document.createElement('div');
        mermaidDiv.className = 'mermaid';
        mermaidDiv.textContent = block.textContent;
        block.parentNode.parentNode.replaceChild(mermaidDiv, block.parentNode);
    });
    mermaid.run();
});
</script>
FOOTER
)
            else
                # Fallback: Use marked.js for client-side markdown conversion with Mermaid support
                cat > "$html_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>$(basename "$md_file")</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.2.0/github-markdown-light.min.css">
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
    <style>
        .controls {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(255, 255, 255, 0.95);
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border: 1px solid #ddd;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        .controls label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #333;
            font-size: 14px;
        }
        .controls input[type="range"] {
            width: 150px;
            margin-bottom: 5px;
        }
        .controls .scale-value {
            color: #666;
            font-size: 12px;
        }
        body {
            overflow: auto;
            height: 100vh;
            cursor: grab;
        }
        body.dragging {
            cursor: grabbing;
        }
        .markdown-body { 
            box-sizing: border-box; 
            min-width: 200px; 
            max-width: 980px; 
            margin: 0 auto; 
            padding: 45px;
            transition: transform 0.3s ease;
        }
        .mermaid-container { 
            background: #fafafa; 
            border: 2px solid #ddd;
            border-radius: 8px; 
            margin: 20px 0;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            width: 100%;
            position: relative;
            max-height: 400px; /* Constrain height */
            overflow: hidden;
        }
        .mermaid {
            transition: transform 0.3s ease;
            overflow: hidden;
        }
        .mermaid svg {
            width: 100% !important;
            height: auto !important;
            max-width: none !important;
            max-height: 360px; /* Limit SVG height within container */
        }
        .mermaid-container.dragging .mermaid {
            cursor: grabbing;
        }
        .mermaid-header {
            position: absolute;
            top: 5px;
            right: 5px;
            z-index: 10;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        .mermaid-container:hover .mermaid-header {
            opacity: 1;
        }
        .fullscreen-btn {
            background: rgba(0, 123, 255, 0.9);
            color: white;
            border: none;
            border-radius: 4px;
            padding: 6px 10px;
            font-size: 12px;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .fullscreen-btn:hover {
            background: rgba(0, 123, 255, 1);
        }
        
        /* Fullscreen modal */
        .fullscreen-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.9);
            z-index: 1000;
            overflow: auto;
        }
        .fullscreen-content {
            position: relative;
            width: 95%;
            height: 95%;
            margin: 2.5% auto;
            background: white;
            border-radius: 8px;
            padding: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            display: flex;
            flex-direction: column;
        }
        .close-fullscreen {
            position: absolute;
            top: 10px;
            right: 15px;
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
        }
        .close-fullscreen:hover {
            color: #000;
        }
        .fullscreen-diagram {
            flex: 1;
            width: 100%;
            overflow: hidden;
            position: relative;
            cursor: grab;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .fullscreen-diagram.dragging {
            cursor: grabbing;
        }
    </style>
</head>
<body class="markdown-body">
    <div class="controls">
        <div style="font-size: 14px; color: #666; text-align: center;">
            Scroll over diagrams to zoom<br>
            Right-click to reset
        </div>
    </div>
    
    <div id="content"></div>
    
    <!-- Fullscreen Modal -->
    <div id="fullscreenModal" class="fullscreen-modal">
        <div class="fullscreen-content">
            <button class="close-fullscreen" onclick="closeFullscreen()">&times;</button>
            <div class="fullscreen-diagram" id="fullscreenDiagram"></div>
        </div>
    </div>
    
    <script>
        let currentScale = 1;
        
        // Initialize Mermaid
        function initializeMermaid() {
            mermaid.initialize({ 
                startOnLoad: false,
                theme: 'default',
                flowchart: { useMaxWidth: true, htmlLabels: true },
                securityLevel: 'loose',
                logLevel: 'error'
            });
        }
        
        function updateScale(scale) {
            // Update scale for all mermaid diagrams
            const mermaidDivs = document.querySelectorAll('.mermaid');
            mermaidDivs.forEach(div => {
                div.style.transform = 'scale(' + scale + ')';
                div.style.transformOrigin = 'center center';
                
                // Adjust container height for scaled content
                const container = div.closest('.mermaid-container');
                const svg = div.querySelector('svg');
                if (svg && container) {
                    const originalHeight = svg.getBoundingClientRect().height / scale;
                    container.style.height = (originalHeight * scale + 80) + 'px';
                    
                    // Enable scrolling when zoomed
                    if (scale > 1) {
                        container.style.overflow = 'auto';
                        container.style.cursor = 'grab';
                    } else {
                        container.style.overflow = 'hidden';
                        container.style.cursor = 'default';
                    }
                }
            });
        }
        
        function renderMarkdown() {
            // Parse markdown with marked
            let html = marked.parse(window.originalMarkdown);
            
            // Replace mermaid code blocks with mermaid divs 
            let diagramCounter = 0;
            html = html.replace(/<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g, 
                (match, diagramContent) => {
                    diagramCounter++;
                    return '<div class="mermaid-container" data-diagram-id="' + diagramCounter + '">' +
                        '<div class="mermaid-header">' +
                            '<button class="fullscreen-btn" onclick="openFullscreen(this)">⛶ Fullscreen</button>' +
                        '</div>' +
                        '<div class="mermaid">' + diagramContent.trim() + '</div>' +
                    '</div>';
                });
            
            // Also handle plain mermaid blocks without language specification
            html = html.replace(/<pre><code>mermaid\n([\s\S]*?)<\/code><\/pre>/g, 
                (match, diagramContent) => {
                    diagramCounter++;
                    return '<div class="mermaid-container" data-diagram-id="' + diagramCounter + '">' +
                        '<div class="mermaid-header">' +
                            '<button class="fullscreen-btn" onclick="openFullscreen(this)">⛶ Fullscreen</button>' +
                        '</div>' +
                        '<div class="mermaid">' + diagramContent.trim() + '</div>' +
                    '</div>';
                });
            
            document.getElementById('content').innerHTML = html;
            
            // Initialize and render mermaid diagrams with error handling
            initializeMermaid();
            mermaid.run().catch(error => {
                console.error('Mermaid rendering error:', error);
                // Replace failed diagrams with error message
                document.querySelectorAll('.mermaid').forEach(div => {
                    if (!div.querySelector('svg')) {
                        div.innerHTML = '<div style="color: red; padding: 20px; border: 2px dashed red;">Mermaid diagram failed to render. Check console for details.</div>';
                    }
                });
            });
        }
        
        // Global wheel event handler to prevent page scrolling on mermaid elements
        document.addEventListener('wheel', (e) => {
            // Check if the event target is within a mermaid diagram
            if (e.target.closest('.mermaid-container') || e.target.closest('.fullscreen-modal')) {
                e.preventDefault();
                // Don't stop propagation for fullscreen - let zoom handlers work
                if (!e.target.closest('.fullscreen-modal')) {
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                }
                return false;
            }
        }, { passive: false, capture: true });
        
        // Store original markdown content globally
        window.originalMarkdown = \`$(cat "$md_file" | sed 's/`/\\`/g; s/\$/\\$/g')\`;
        
        // Initial render
        renderMarkdown();
        
        // Right-click reset functionality for all diagrams
        document.addEventListener('contextmenu', (e) => {
            const mermaidContainer = e.target.closest('.mermaid-container');
            if (mermaidContainer) {
                e.preventDefault();
                currentScale = 1;
                updateScale(currentScale);
            }
        });
        
        // Pan functionality for mermaid diagrams
        let isPanning = false;
        let startX, startY, scrollLeft, scrollTop, panningElement;
        
        document.addEventListener('mousedown', (e) => {
            const mermaidContainer = e.target.closest('.mermaid-container');
            if (!mermaidContainer || currentScale <= 1) return;
            if (e.target.closest('.controls') || e.target.closest('.mermaid-header')) return;
            
            isPanning = true;
            panningElement = mermaidContainer;
            mermaidContainer.classList.add('dragging');
            startX = e.pageX;
            startY = e.pageY;
            scrollLeft = mermaidContainer.scrollLeft;
            scrollTop = mermaidContainer.scrollTop;
            e.preventDefault();
        });
        
        document.addEventListener('mouseleave', () => {
            if (panningElement) {
                isPanning = false;
                panningElement.classList.remove('dragging');
                panningElement = null;
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (panningElement) {
                isPanning = false;
                panningElement.classList.remove('dragging');
                panningElement = null;
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isPanning || !panningElement) return;
            e.preventDefault();
            const x = e.pageX;
            const y = e.pageY;
            const walkX = (x - startX) * 2;
            const walkY = (y - startY) * 2;
            panningElement.scrollLeft = scrollLeft - walkX;
            panningElement.scrollTop = scrollTop - walkY;
        });
        
        // Scroll wheel zoom for each mermaid diagram  
        document.addEventListener('wheel', (e) => {
            const mermaidContainer = e.target.closest('.mermaid-container');
            if (!mermaidContainer) return;
            
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
            const newScale = Math.max(0.1, Math.min(5, currentScale + zoomDelta));
            
            if (newScale !== currentScale) {
                currentScale = newScale;
                updateScale(currentScale);
            }
            return false;
        }, { passive: false });
        
        // Fullscreen functionality
        function openFullscreen(button) {
            const modal = document.getElementById('fullscreenModal');
            const fullscreenDiagram = document.getElementById('fullscreenDiagram');
            const mermaidContainer = button.closest('.mermaid-container');
            const mermaidDiv = mermaidContainer.querySelector('.mermaid');
            
            // Clone the diagram content
            const diagramClone = mermaidDiv.cloneNode(true);
            
            // Remove the header from clone
            const header = diagramClone.querySelector('.mermaid-header');
            if (header) header.remove();
            
            // Clear and add the cloned diagram
            fullscreenDiagram.innerHTML = '';
            fullscreenDiagram.appendChild(diagramClone);
            
            // Apply optimal scaling for ultrawide monitors
            const svg = diagramClone.querySelector('svg');
            if (svg) {
                // Reset any transform scaling for fullscreen
                diagramClone.style.transform = 'none';
                diagramClone.style.width = '100%';
                diagramClone.style.height = '100%';
                diagramClone.style.display = 'flex';
                diagramClone.style.alignItems = 'center';
                diagramClone.style.justifyContent = 'center';
                
                // Get viewport dimensions for optimal scaling
                const container = document.getElementById('fullscreenDiagram');
                const containerRect = container.getBoundingClientRect();
                
                // Make SVG responsive to container size
                svg.style.maxWidth = '100%';
                svg.style.maxHeight = '100%';
                svg.style.width = 'auto';
                svg.style.height = 'auto';
                svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
                
                // For very wide viewports, limit height to ensure diagram fits
                if (containerRect.width / containerRect.height > 2) {
                    svg.style.height = '90%';
                    svg.style.width = 'auto';
                }
            }
            
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            
            // Add pan functionality to fullscreen
            setupFullscreenPan();
        }
        
        function closeFullscreen() {
            const modal = document.getElementById('fullscreenModal');
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        
        function setupFullscreenPan() {
            const container = document.getElementById('fullscreenDiagram');
            let isPanning = false;
            let startX, startY, scrollLeft, scrollTop;
            
            // Remove existing listeners to avoid duplicates
            container.replaceWith(container.cloneNode(true));
            const newContainer = document.getElementById('fullscreenDiagram');
            
            newContainer.addEventListener('mousedown', (e) => {
                isPanning = true;
                newContainer.classList.add('dragging');
                startX = e.pageX;
                startY = e.pageY;
                scrollLeft = newContainer.scrollLeft;
                scrollTop = newContainer.scrollTop;
                e.preventDefault();
            });
            
            document.addEventListener('mouseup', () => {
                isPanning = false;
                newContainer.classList.remove('dragging');
            });
            
            document.addEventListener('mousemove', (e) => {
                if (!isPanning) return;
                e.preventDefault();
                const x = e.pageX;
                const y = e.pageY;
                const walkX = (x - startX) * 2;
                const walkY = (y - startY) * 2;
                newContainer.scrollLeft = scrollLeft - walkX;
                newContainer.scrollTop = scrollTop - walkY;
            });
            
            // Add zoom capability in fullscreen for markdown
            newContainer.addEventListener('wheel', (e) => {
                const diagram = newContainer.querySelector('.mermaid') || newContainer.firstElementChild;
                const svg = diagram.querySelector('svg');
                if (!svg) return;
                
                // Get current scale from SVG transform
                const currentTransform = svg.style.transform;
                const scaleMatch = currentTransform.match(/scale\\\\(([^)]+)\\\\)/);
                const currentScale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;
                
                const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
                const newScale = Math.max(0.5, Math.min(5, currentScale + zoomDelta));
                
                // Apply new scale while preserving any existing transforms
                const otherTransforms = currentTransform.replace(/scale\\\\([^)]+\\\\)/, '').trim();
                svg.style.transform = otherTransforms + ' scale(' + newScale + ')';
            });
        }
        
        // Close fullscreen on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeFullscreen();
            }
        });
        
    </script>
</body>
</html>
EOF
            fi
            
            echo "$html_file"
        }
        
        HTML_FILE=$(convert_md_to_html "$INPUT_FILE")
        echo "Converting markdown file '$INPUT_FILE' to HTML"
    fi
    
    # Open in browser based on platform
    if [[ -n "$WSL_DISTRO_NAME" || -n "$WSLENV" ]]; then
        # WSL - convert Linux path to Windows path and use Windows browser
        WIN_PATH=$(wslpath -w "$HTML_FILE")
        powershell.exe -Command "Start-Process '$WIN_PATH'"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        xdg-open "$HTML_FILE" 2>/dev/null || firefox "$HTML_FILE" 2>/dev/null || chromium "$HTML_FILE" 2>/dev/null
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        open "$HTML_FILE"
    else
        echo "Platform not supported for browser opening. HTML file created at: $HTML_FILE"
    fi
    
    echo "Markdown file '$MD_FILE' opened in browser as HTML"
    exit 0
fi

MESSAGE="${1:-Claude has something to tell you!}"
TITLE="${2:-Claude Notification}"

# Function to send notification on WSL/Windows
send_windows_notification() {
    powershell.exe -Command "
        Add-Type -AssemblyName System.Windows.Forms
        [System.Windows.Forms.MessageBox]::Show('$MESSAGE', '$TITLE', 'OK', 'Information')
    " > /dev/null
}

# Function to send notification on Linux with notify-send
send_linux_notification() {
    if command -v notify-send > /dev/null 2>&1; then
        notify-send "$TITLE" "$MESSAGE"
    else
        echo "notify-send not found. Install with: sudo apt-get install libnotify-bin"
        return 1
    fi
}

# Function to send notification on macOS
send_macos_notification() {
    if command -v osascript > /dev/null 2>&1; then
        osascript -e "display notification \"$MESSAGE\" with title \"$TITLE\""
    else
        echo "osascript not found (macOS required)"
        return 1
    fi
}

# Detect platform and send appropriate notification
if [[ -n "$WSL_DISTRO_NAME" || -n "$WSLENV" ]]; then
    # WSL environment
    echo "Sending Windows notification..."
    send_windows_notification
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    echo "Sending Linux notification..."
    send_linux_notification
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "Sending macOS notification..."
    send_macos_notification
else
    # Fallback - just echo and beep
    echo "Platform not detected. Falling back to terminal notification."
    echo "🔔 $TITLE: $MESSAGE"
    echo -e "\a"  # Terminal bell
fi

echo "Notification sent: $MESSAGE"