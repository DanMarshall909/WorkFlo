/**
 * Logger service providing colored console output similar to shell script functions
 */
export class Logger {
  private static readonly colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
  };

  static info(message: string): void {
    console.log(`${this.colors.blue}[INFO]${this.colors.reset} ${message}`);
  }

  static success(message: string): void {
    console.log(`${this.colors.green}[SUCCESS]${this.colors.reset} ${message}`);
  }

  static warn(message: string): void {
    console.log(`${this.colors.yellow}[WARNING]${this.colors.reset} ${message}`);
  }

  static error(message: string): void {
    console.error(`${this.colors.red}[ERROR]${this.colors.reset} ${message}`);
  }
}