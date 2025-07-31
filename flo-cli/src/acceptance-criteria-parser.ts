/**
 * Parses acceptance criteria from a GitHub issue body.
 * Extracts all unchecked checkbox items (- [ ]) as acceptance criteria.
 * 
 * @param issueBody - The raw markdown content of a GitHub issue
 * @returns Array of acceptance criteria strings
 */
export function parseAcceptanceCriteria(issueBody: string): string[] {
  if (!issueBody) {
    return [];
  }

  // Match unchecked checkbox items: - [ ] text
  const UNCHECKED_CHECKBOX_PATTERN = /^- \[ \] (.+)$/gm;
  
  const matches = Array.from(issueBody.matchAll(UNCHECKED_CHECKBOX_PATTERN));
  return matches.map(match => match[1].trim());
}