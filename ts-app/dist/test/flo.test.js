"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../src/commands/index");
const commander_1 = require("commander");
describe('flo commands', () => {
    let program;
    let stdoutSpy;
    let stderrSpy;
    let exitSpy;
    beforeEach(() => {
        stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
        stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
        exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => { throw new Error('process.exit was called'); }));
        program = new commander_1.Command();
        program.name('flo');
        program.addCommand(index_1.featureCommand);
        program.addCommand(index_1.statusCommand);
    });
    afterEach(() => {
        stdoutSpy.mockRestore();
        stderrSpy.mockRestore();
        exitSpy.mockRestore();
    });
    test('flo feature command exists and shows help', () => __awaiter(void 0, void 0, void 0, function* () {
        process.argv = ['node', 'flo', 'feature', '--help'];
        try {
            yield program.parseAsync(process.argv);
        }
        catch (e) {
            // Expected to throw due to mocked process.exit
        }
        expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('Usage: flo feature [options] <issue>'));
        expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('Complete end-to-end automated feature development'));
        expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('Arguments:'));
        expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('issue       Issue number to automate'));
        expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('Options:'));
        expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('-h, --help  display help for command'));
        expect(exitSpy).toHaveBeenCalledWith(0);
    }));
    test('flo feature command handles basic invocation', () => __awaiter(void 0, void 0, void 0, function* () {
        const mockIssue = '123';
        process.argv = ['node', 'flo', 'feature', mockIssue];
        try {
            yield program.parseAsync(process.argv);
        }
        catch (e) {
            // Expected to throw due to mocked process.exit
        }
        expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining(`Starting automated feature development for issue #${mockIssue}`));
        expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('TDD workflow'));
        expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('90% confident'));
        expect(exitSpy).toHaveBeenCalledWith(0);
    }));
    test('confidence scoring system calculates basic scores', () => __awaiter(void 0, void 0, void 0, function* () {
        const mockIssue = '456';
        process.argv = ['node', 'flo', 'feature', mockIssue];
        try {
            yield program.parseAsync(process.argv);
        }
        catch (e) {
            // Expected to throw due to mocked process.exit
        }
        expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('90% confident'));
        expect(exitSpy).toHaveBeenCalledWith(0);
    }));
    test('flo commands provide consistent help output', () => __awaiter(void 0, void 0, void 0, function* () {
        process.argv = ['node', 'flo', '--help'];
        try {
            yield program.parseAsync(process.argv);
        }
        catch (e) {
            // Expected to throw due to mocked process.exit
        }
        expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('Usage: flo [options] [command]'));
        expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('Commands:'));
        expect(exitSpy).toHaveBeenCalledWith(0);
    }));
    test('tdd workflow commands basic functionality (status)', () => __awaiter(void 0, void 0, void 0, function* () {
        process.argv = ['node', 'flo', 'status'];
        try {
            yield program.parseAsync(process.argv);
        }
        catch (e) {
            // Expected to throw due to mocked process.exit
        }
        expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('No active TDD session'));
        expect(exitSpy).toHaveBeenCalledWith(0);
    }));
});
