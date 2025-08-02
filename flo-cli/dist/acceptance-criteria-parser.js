"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseAcceptanceCriteria = parseAcceptanceCriteria;
/**
 * Parses acceptance criteria from a GitHub issue body.
 * Extracts all unchecked checkbox items (- [ ]) as acceptance criteria.
 *
 * @param issueBody - The raw markdown content of a GitHub issue
 * @returns Array of acceptance criteria strings
 */
function parseAcceptanceCriteria(issueBody) {
    if (!issueBody) {
        return [];
    }
    const criteria = [];
    // Normalize line endings for Windows compatibility
    const normalizedBody = issueBody.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = normalizedBody.split('\n');
    for (const line of lines) {
        // Only match standard format with exactly one space between elements: "- [ ] text"
        // This ensures we don't match malformed checkboxes
        const match = line.match(/^(\s*)- \[ \] (.+)$/);
        if (match && match[2]) {
            // Only include top-level items (no indentation)
            const indentation = match[1] || '';
            if (indentation.length === 0) {
                criteria.push(match[2].trim());
            }
        }
    }
    return criteria;
}
//# sourceMappingURL=acceptance-criteria-parser.js.map