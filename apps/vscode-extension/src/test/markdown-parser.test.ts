import * as assert from 'assert';

// Import the markdownToHtml function - this will fail since it's not exported
import { markdownToHtml } from '../extension';

// Test for markdown parsing functionality
suite('Markdown Parser Tests', () => {

    test('markdown_headers_convert_to_proper_html', () => {
        // Given: Markdown text with headers
        const markdownInput = '# Title\n## Subtitle\n### Section';
        
        // When: Converting markdown to HTML
        const htmlOutput = markdownToHtml(markdownInput);
        
        // Then: Headers should be converted to proper HTML tags
        assert.ok(htmlOutput.includes('<h1>Title</h1>'), 'H1 header should be converted');
        assert.ok(htmlOutput.includes('<h2>Subtitle</h2>'), 'H2 header should be converted');
        assert.ok(htmlOutput.includes('<h3>Section</h3>'), 'H3 header should be converted');
    });

    test('markdown_bold_and_italic_formatting_converts_correctly', () => {
        // Given: Markdown text with bold and italic formatting
        const markdownInput = '**bold text** and *italic text*';
        
        // When: Converting markdown to HTML
        const htmlOutput = markdownToHtml(markdownInput);
        
        // Then: Formatting should be converted to HTML tags
        assert.ok(htmlOutput.includes('<strong>bold text</strong>'), 'Bold text should be converted');
        assert.ok(htmlOutput.includes('<em>italic text</em>'), 'Italic text should be converted');
    });

    test('markdown_code_blocks_and_inline_code_convert_properly', () => {
        // Given: Markdown with code blocks and inline code
        const markdownInput = '```\ncode block\n```\nSome `inline code` here';
        
        // When: Converting markdown to HTML
        const htmlOutput = markdownToHtml(markdownInput);
        
        // Then: Code should be converted to proper HTML
        assert.ok(htmlOutput.includes('<pre><code>'), 'Code block should be converted');
        assert.ok(htmlOutput.includes('<code>inline code</code>'), 'Inline code should be converted');
    });

    test('markdown_links_convert_with_vscode_styling', () => {
        // Given: Markdown with links
        const markdownInput = '[Link Text](https://example.com)';
        
        // When: Converting markdown to HTML
        const htmlOutput = markdownToHtml(markdownInput);
        
        // Then: Links should have VS Code styling
        assert.ok(htmlOutput.includes('href="https://example.com"'), 'Link href should be correct');
        assert.ok(htmlOutput.includes('var(--vscode-textLink-foreground)'), 'VS Code styling should be applied');
        assert.ok(htmlOutput.includes('Link Text'), 'Link text should be preserved');
    });

    test('markdown_task_lists_convert_to_checkboxes', () => {
        // Given: Markdown with task lists
        const markdownInput = '- [ ] Unchecked task\n- [x] Checked task\n- Regular list item';
        
        // When: Converting markdown to HTML
        const htmlOutput = markdownToHtml(markdownInput);
        
        // Then: Task lists should become checkboxes and regular lists should be normal
        assert.ok(htmlOutput.includes('type="checkbox"'), 'Checkboxes should be created');
        assert.ok(htmlOutput.includes('checked disabled'), 'Checked tasks should be marked');
        assert.ok(htmlOutput.includes('Unchecked task'), 'Task text should be preserved');
        assert.ok(htmlOutput.includes('Regular list item'), 'Regular list items should be handled');
    });
});