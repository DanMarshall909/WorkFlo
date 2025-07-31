// Command types

import { Result } from './core/result';
import { Context } from './core/context';

// Command function type
export type CommandFunction = (args: string[], context: Context) => Promise<Result<void>>;

// Command registry type
export type CommandRegistry = Record<string, CommandFunction>;