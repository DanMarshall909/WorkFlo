/**
 * Parses acceptance criteria from a GitHub issue body.
 * Extracts all unchecked checkbox items (- [ ]) as acceptance criteria.
 *
 * @param issueBody - The raw markdown content of a GitHub issue
 * @returns Array of acceptance criteria strings
 */
export function parseAcceptanceCriteria(issueBody: string): string[] {
  const criteria: string[] = [];
  const lines = issueBody.split('\n');
  
  for (const line of lines) {
    // Match unchecked checkbox items: - [ ] Some criteria text
    const match = line.match(/^\s*-\s*\[\s*\]\s*(.+)$/);
    if (match && match[1]) {
      criteria.push(match[1].trim());
    }
  }
  
  return criteria;
}