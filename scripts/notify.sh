#!/bin/bash

# notify.sh - Cross-platform notification and file viewer script for Claude Code
# Usage: 
#   ./scripts/notify.sh "Your message here" [title]          # Send notification
#   ./scripts/notify.sh --md-view /path/to/file.md           # Open markdown file in browser as HTML
#   ./scripts/notify.sh --html-view /path/to/file.html       # Open HTML file in browser
#   ./scripts/notify.sh --mermaid-view /path/to/file.mmd     # Open Mermaid diagram in browser

set -e

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