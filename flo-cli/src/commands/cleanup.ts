import { Flags } from '@oclif/core'
import * as fs from 'fs/promises'
import * as path from 'path'
import { glob } from 'glob'
import chalk from 'chalk'
import { BaseCommand } from '../base-command'

export default class Cleanup extends BaseCommand {
  static override description = 'Clean up generated files, temporary files, and organize project structure'

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --coverage',
    '<%= config.bin %> <%= command.id %> --temp --docs',
    '<%= config.bin %> <%= command.id %> --all --dry-run',
  ]

  static override flags = {
    ...BaseCommand.flags,
    coverage: Flags.boolean({
      char: 'c',
      description: 'Remove coverage reports',
      default: false,
    }),
    temp: Flags.boolean({
      char: 't',
      description: 'Remove temporary and debug files',
      default: false,
    }),
    docs: Flags.boolean({
      char: 'd',
      description: 'Clean up obsolete documentation',
      default: false,
    }),
    all: Flags.boolean({
      char: 'a',
      description: 'Clean all categories',
      default: false,
    }),
    'dry-run': Flags.boolean({
      description: 'Preview what will be cleaned without actually deleting',
      default: false,
    }),
    interactive: Flags.boolean({
      char: 'i',
      description: 'Confirm each cleanup action',
      default: false,
    }),
  }

  private deletedCount = 0
  private skippedCount = 0

  async run(): Promise<void> {
    const { flags } = await this.parse(Cleanup)
    
    this.log(chalk.blue('🧹 WorkFlo Cleanup Tool'))
    this.log('')

    const isDryRun = flags['dry-run']
    if (isDryRun) {
      this.log(chalk.yellow('DRY RUN MODE - No files will be deleted'))
      this.log('')
    }

    // If no specific flags, show help
    if (!flags.coverage && !flags.temp && !flags.docs && !flags.all) {
      this.log('Please specify what to clean:')
      this.log('  --coverage (-c)  Remove coverage reports')
      this.log('  --temp (-t)      Remove temporary files')
      this.log('  --docs (-d)      Clean obsolete documentation')
      this.log('  --all (-a)       Clean all categories')
      this.log('')
      this.log('Additional options:')
      this.log('  --dry-run        Preview what will be cleaned')
      this.log('  --interactive    Confirm each action')
      return
    }

    // Determine what to clean
    const cleanCoverage = flags.all || flags.coverage
    const cleanTemp = flags.all || flags.temp
    const cleanDocs = flags.all || flags.docs

    try {
      if (cleanCoverage) {
        await this.cleanCoverage(isDryRun, flags.interactive)
      }

      if (cleanTemp) {
        await this.cleanTempFiles(isDryRun, flags.interactive)
      }

      if (cleanDocs) {
        await this.cleanObsoleteDocs(isDryRun, flags.interactive)
      }

      this.log('')
      this.log(chalk.green(`✅ Cleanup complete!`))
      this.log(`   Deleted: ${this.deletedCount} items`)
      this.log(`   Skipped: ${this.skippedCount} items`)
    } catch (error) {
      this.error(`Cleanup failed: ${error}`)
    }
  }

  private async cleanCoverage(dryRun: boolean, interactive: boolean): Promise<void> {
    this.log(chalk.blue('\n📊 Cleaning coverage reports...'))
    
    const coveragePatterns = [
      'flo-cli/coverage/**/*.html',
      'flo-cli/coverage/**/*.css',
      'flo-cli/coverage/**/*.js',
      'flo-cli/coverage/lcov.info',
      'vscode-extension/coverage/**/*.html',
    ]

    for (const pattern of coveragePatterns) {
      const files = await glob(pattern, { cwd: process.cwd() })
      for (const file of files) {
        await this.deleteFile(file, dryRun, interactive, 'coverage report')
      }
    }
  }

  private async cleanTempFiles(dryRun: boolean, interactive: boolean): Promise<void> {
    this.log(chalk.blue('\n🗑️  Cleaning temporary files...'))
    
    const tempFiles = [
      'debug_test.sh',
      '.temp-key-loader.js',
      '**/*.bak',
      '**/*.tmp',
      '**/*.temp',
      '**/*.old',
      '.auto-progress.log',
      '.auto-progress.pid',
      '.progress-server.pid',
      '.gh-api-server.pid',
    ]

    for (const pattern of tempFiles) {
      const files = await glob(pattern, { cwd: process.cwd() })
      for (const file of files) {
        await this.deleteFile(file, dryRun, interactive, 'temporary file')
      }
    }
  }

  private async cleanObsoleteDocs(dryRun: boolean, interactive: boolean): Promise<void> {
    this.log(chalk.blue('\n📄 Cleaning obsolete documentation...'))
    
    const obsoleteDocs = [
      'docs/OLD_README.md',
      'progresse.md', // Appears to be a typo of PROGRESS.md
    ]

    for (const file of obsoleteDocs) {
      if (await this.fileExists(file)) {
        await this.deleteFile(file, dryRun, interactive, 'obsolete documentation')
      }
    }
  }

  private async deleteFile(
    filePath: string,
    dryRun: boolean,
    interactive: boolean,
    fileType: string
  ): Promise<void> {
    const fullPath = path.resolve(process.cwd(), filePath)
    
    if (interactive && !dryRun) {
      const confirm = await this.confirm(`Delete ${fileType}: ${filePath}?`)
      if (!confirm) {
        this.log(chalk.gray(`  Skipped: ${filePath}`))
        this.skippedCount++
        return
      }
    }

    if (dryRun) {
      this.log(chalk.yellow(`  Would delete: ${filePath}`))
    } else {
      try {
        await fs.unlink(fullPath)
        this.log(chalk.red(`  Deleted: ${filePath}`))
        this.deletedCount++
      } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'EISDIR') {
          await fs.rmdir(fullPath, { recursive: true })
          this.log(chalk.red(`  Deleted directory: ${filePath}`))
          this.deletedCount++
        } else if (error instanceof Error) {
          this.warn(`  Failed to delete ${filePath}: ${error.message}`)
        }
      }
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(path.resolve(process.cwd(), filePath))
      return true
    } catch {
      return false
    }
  }

  private async confirm(message: string): Promise<boolean> {
    const inquirer = await import('inquirer')
    const { confirm } = await inquirer.default.prompt([
      {
        name: 'confirm',
        message,
        type: 'confirm',
        default: false,
      },
    ])
    return confirm
  }
}