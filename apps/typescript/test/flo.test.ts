import { featureCommand, statusCommand } from '../src/commands/index';
import { Command } from 'commander';

describe('flo commands', () => {
  let program: Command;
  let stdoutSpy: jest.SpyInstance;
  let stderrSpy: jest.SpyInstance;
  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
    exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => { throw new Error('process.exit was called'); }) as any);

    program = new Command();
    program.name('flo');
    program.addCommand(featureCommand);
    program.addCommand(statusCommand);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
    exitSpy.mockRestore();
  });

  test('flo feature command exists and shows help', async () => {
    process.argv = ['node', 'flo', 'feature', '--help'];
    try {
      await program.parseAsync(process.argv);
    } catch (e) {
      // Expected to throw due to mocked process.exit
    }
    expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('Usage: flo feature [options] <issue>'));
    expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('Complete end-to-end automated feature development'));
    expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('Arguments:'));
    expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('issue       Issue number to automate'));
    expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('Options:'));
    expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('-h, --help  display help for command'));
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('flo feature command handles basic invocation', async () => {
    const mockIssue = '123';
    process.argv = ['node', 'flo', 'feature', mockIssue];
    try {
      await program.parseAsync(process.argv);
    } catch (e) {
      // Expected to throw due to mocked process.exit
    }
    expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining(`Starting automated feature development for issue #${mockIssue}`));
    expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('TDD workflow'));
    expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('90% confident'));
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('confidence scoring system calculates basic scores', async () => {
    const mockIssue = '456';
    process.argv = ['node', 'flo', 'feature', mockIssue];
    try {
      await program.parseAsync(process.argv);
    } catch (e) {
      // Expected to throw due to mocked process.exit
    }
    expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('90% confident'));
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('flo commands provide consistent help output', async () => {
    process.argv = ['node', 'flo', '--help'];
    try {
      await program.parseAsync(process.argv);
    } catch (e) {
      // Expected to throw due to mocked process.exit
    }
    expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('Usage: flo [options] [command]'));
    expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('Commands:'));
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('tdd workflow commands basic functionality (status)', async () => {
    process.argv = ['node', 'flo', 'status'];
    try {
      await program.parseAsync(process.argv);
    } catch (e) {
      // Expected to throw due to mocked process.exit
    }
    expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('No active TDD session'));
    expect(exitSpy).toHaveBeenCalledWith(0);
  });
});