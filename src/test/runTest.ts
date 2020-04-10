import * as path from 'path';

import { runTests } from 'vscode-test';

async function main() {
	
	try {
		// The folder containing the Extension Manifest package.json
		// Passed to `--extensionDevelopmentPath`
		const extensionDevelopmentPath = path.resolve(__dirname, '../../');
		
		// The path to test runner
		// Passed to --extensionTestsPath
		const extensionTestsPath = path.resolve(__dirname, './suite/index');

		// Testproject: https://github.com/chr33z/vscode-lingua-testproject
		const testWorkspace = path.resolve(__dirname, '../../../vscode-lingua-testproject');

		await runTests({ 
			extensionDevelopmentPath,
			extensionTestsPath,
			launchArgs: [testWorkspace]
		});
	} catch (err) {
		console.error('Failed to run tests');
		process.exit(1);
	}
}

main();
