// Git and GitHub service types

export interface IssueData {
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
}

export interface PullRequestData {
  number: number;
  title: string;
  body: string;
  url: string;
  state: 'open' | 'closed' | 'merged';
}

export interface AcceptanceCriteria {
  text: string;
  completed: boolean;
  index: number;
}

export interface CreateIssueOptions {
  title: string;
  body: string;
  labels?: string[];
}