import * as path from 'path';
import * as Mocha from 'mocha';

export async function run(): Promise<void> {
    // Create the mocha test
    const mocha = new Mocha({
        ui: 'tdd',
        color: true
    });

    const testsRoot = path.resolve(__dirname, '..');

    // Directly add the test files
    mocha.addFile(path.resolve(testsRoot, 'extension.test.js'));
    mocha.addFile(path.resolve(testsRoot, 'workflo-status-provider.test.js'));
    mocha.addFile(path.resolve(testsRoot, 'markdown-parser.test.js'));

    try {
        return new Promise((resolve, reject) => {
            mocha.run(failures => {
                if (failures > 0) {
                    reject(new Error(`${failures} tests failed.`));
                } else {
                    resolve();
                }
            });
        });
    } catch (err) {
        console.error(err);
        throw err;
    }
}