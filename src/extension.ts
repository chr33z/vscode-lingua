// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Scanner } from './scanner';

let inet: string;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "lingua" is now active!');

    const scanner = new Scanner();

    let linguaAnalyse = vscode.commands.registerCommand('lingua.analyse', async () => {
        await scanner.scanLanguageFiles();
        await scanner.analyse();
    });
    context.subscriptions.push(linguaAnalyse);
}

// this method is called when your extension is deactivated
export function deactivate() {}
