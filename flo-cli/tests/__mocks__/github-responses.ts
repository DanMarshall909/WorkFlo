/**
 * Mock GitHub API responses for testing
 */

export const mockIssueWithUncheckedCriteria = {
  body: `## Overview
Test issue for auto-subcommand testing

## Acceptance Criteria
- [ ] First unchecked acceptance criteria
- [ ] Second unchecked acceptance criteria
- [ ] Third unchecked acceptance criteria

## Additional Context
This is a mock issue for testing purposes.`,
  title: 'Test Issue with Unchecked Criteria',
  number: 999
};

export const mockIssueWithCheckedCriteria = {
  body: `## Overview
Test issue with completed criteria

## Acceptance Criteria
- [x] First checked acceptance criteria
- [x] Second checked acceptance criteria
- [x] Third checked acceptance criteria`,
  title: 'Test Issue with Checked Criteria',
  number: 998
};

export const mockIssueWithMixedCriteria = {
  body: `## Acceptance Criteria
- [x] First checked acceptance criteria
- [ ] Second unchecked acceptance criteria
- [x] Third checked acceptance criteria
- [ ] Fourth unchecked acceptance criteria`,
  title: 'Test Issue with Mixed Criteria',
  number: 997
};

export const mockIssueWithNoCriteria = {
  body: `## Overview
This issue has no acceptance criteria.

## Description
Just a regular issue without ACs.`,
  title: 'Test Issue without Criteria',
  number: 996
};

export const mockIssueWithInvalidFormat = {
  body: `## Acceptance Criteria
* First criteria with asterisk
+ Second criteria with plus
- Third criteria without checkbox`,
  title: 'Test Issue with Invalid Format',
  number: 995
};