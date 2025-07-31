// Testing service types

export interface TestResult {
  success: boolean;
  exitCode: number;
  duration: number;
  output?: string;
}

export interface ProjectInfo {
  type: ProjectType;
  hasRunTests: boolean;
  testCommand?: string;
  buildCommand?: string;
}

export type ProjectType = 'bash' | 'nodejs' | 'dotnet';