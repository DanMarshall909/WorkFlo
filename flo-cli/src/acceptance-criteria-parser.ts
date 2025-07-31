export function parseAcceptanceCriteria(issueBody: string): string[] {
  if (!issueBody) {
    return [];
  }

  // Match unchecked checkbox items: - [ ] text
  const checkboxRegex = /^- \[ \] (.+)$/gm;
  const criteria: string[] = [];
  let match;

  while ((match = checkboxRegex.exec(issueBody)) !== null) {
    criteria.push(match[1].trim());
  }

  return criteria;
}