import { promises as fs } from 'fs'
import * as path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

describe('flo cleanup command', () => {
  const testDir = path.join(__dirname, 'test-cleanup-workspace')
  const cliPath = path.join(__dirname, '..', 'dist', 'cli.js')

  beforeEach(async () => {
    // Create test directory structure
    await fs.mkdir(testDir, { recursive: true })
    
    // Create coverage files
    await fs.mkdir(path.join(testDir, 'flo-cli', 'coverage', 'lcov-report'), { recursive: true })
    await fs.writeFile(path.join(testDir, 'flo-cli', 'coverage', 'index.html'), '<html>coverage</html>')
    await fs.writeFile(path.join(testDir, 'flo-cli', 'coverage', 'lcov-report', 'index.html'), '<html>lcov</html>')
    await fs.writeFile(path.join(testDir, 'flo-cli', 'coverage', 'lcov.info'), 'coverage data')
    
    // Create temp files
    await fs.writeFile(path.join(testDir, 'debug_test.sh'), '#!/bin/bash\necho test')
    await fs.writeFile(path.join(testDir, 'file.tmp'), 'temp file')
    await fs.writeFile(path.join(testDir, 'backup.bak'), 'backup file')
    
    // Create docs
    await fs.mkdir(path.join(testDir, 'docs'), { recursive: true })
    await fs.writeFile(path.join(testDir, 'docs', 'OLD_README.md'), '# Old readme')
    await fs.writeFile(path.join(testDir, 'progresse.md'), '# Progress typo')
  })

  afterEach(async () => {
    // Clean up test directory
    await fs.rm(testDir, { recursive: true, force: true })
  })

  describe('dry run mode', () => {
    it('should not delete files in dry run mode', async () => {
      const { stdout } = await execAsync(`node ${cliPath} cleanup --all --dry-run`, {
        cwd: testDir
      })

      expect(stdout).toContain('DRY RUN MODE')
      expect(stdout).toContain('Would delete')
      
      // Verify files still exist
      const coverageExists = await fs.access(path.join(testDir, 'flo-cli', 'coverage', 'index.html'))
        .then(() => true)
        .catch(() => false)
      expect(coverageExists).toBe(true)
    })
  })

  describe('coverage cleanup', () => {
    it('should delete coverage files', async () => {
      await execAsync(`node ${cliPath} cleanup --coverage`, {
        cwd: testDir
      })

      // Verify coverage files are deleted
      const coverageExists = await fs.access(path.join(testDir, 'flo-cli', 'coverage', 'index.html'))
        .then(() => true)
        .catch(() => false)
      expect(coverageExists).toBe(false)
      
      // Verify other files still exist
      const tempExists = await fs.access(path.join(testDir, 'debug_test.sh'))
        .then(() => true)
        .catch(() => false)
      expect(tempExists).toBe(true)
    })
  })

  describe('temp files cleanup', () => {
    it('should delete temporary files', async () => {
      await execAsync(`node ${cliPath} cleanup --temp`, {
        cwd: testDir
      })

      // Verify temp files are deleted
      const debugExists = await fs.access(path.join(testDir, 'debug_test.sh'))
        .then(() => true)
        .catch(() => false)
      expect(debugExists).toBe(false)
      
      const tmpExists = await fs.access(path.join(testDir, 'file.tmp'))
        .then(() => true)
        .catch(() => false)
      expect(tmpExists).toBe(false)
      
      const bakExists = await fs.access(path.join(testDir, 'backup.bak'))
        .then(() => true)
        .catch(() => false)
      expect(bakExists).toBe(false)
    })
  })

  describe('docs cleanup', () => {
    it('should delete obsolete documentation', async () => {
      await execAsync(`node ${cliPath} cleanup --docs`, {
        cwd: testDir
      })

      // Verify docs are deleted
      const oldReadmeExists = await fs.access(path.join(testDir, 'docs', 'OLD_README.md'))
        .then(() => true)
        .catch(() => false)
      expect(oldReadmeExists).toBe(false)
      
      const progresseExists = await fs.access(path.join(testDir, 'progresse.md'))
        .then(() => true)
        .catch(() => false)
      expect(progresseExists).toBe(false)
    })
  })

  describe('all cleanup', () => {
    it('should delete all categories when using --all', async () => {
      await execAsync(`node ${cliPath} cleanup --all`, {
        cwd: testDir
      })

      // Verify all target files are deleted
      const coverageExists = await fs.access(path.join(testDir, 'flo-cli', 'coverage', 'index.html'))
        .then(() => true)
        .catch(() => false)
      expect(coverageExists).toBe(false)
      
      const debugExists = await fs.access(path.join(testDir, 'debug_test.sh'))
        .then(() => true)
        .catch(() => false)
      expect(debugExists).toBe(false)
      
      const oldReadmeExists = await fs.access(path.join(testDir, 'docs', 'OLD_README.md'))
        .then(() => true)
        .catch(() => false)
      expect(oldReadmeExists).toBe(false)
    })
  })

  describe('help output', () => {
    it('should show help when no flags provided', async () => {
      const { stdout } = await execAsync(`node ${cliPath} cleanup`, {
        cwd: testDir
      })

      expect(stdout).toContain('Please specify what to clean')
      expect(stdout).toContain('--coverage')
      expect(stdout).toContain('--temp')
      expect(stdout).toContain('--docs')
      expect(stdout).toContain('--all')
    })
  })
})