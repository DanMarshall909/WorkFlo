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
    // Match unchecked checkbox items: - [ ] text
    const UNCHECKED_CHECKBOX_PATTERN = /^- \[ \] (.+)$/gm;
    const matches = Array.from(issueBody.matchAll(UNCHECKED_CHECKBOX_PATTERN));
    return matches.map(match => match[1].trim());
}
//# sourceMappingURL=acceptance-criteria-parser.js.map