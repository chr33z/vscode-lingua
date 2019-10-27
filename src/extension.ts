// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Scanner } from './scanner';
import { workspace, languages, Disposable, window, Uri } from 'vscode';
import TranslationReportProvider from './translation/translation-report-provider';

let inet: string;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    const provider = new TranslationReportProvider();

    // register content provider for scheme `references`
    // register document link provider for scheme `references`
    const providerRegistrations = Disposable.from(
        workspace.registerTextDocumentContentProvider(TranslationReportProvider.scheme, provider),
        languages.registerDocumentLinkProvider({ scheme: TranslationReportProvider.scheme }, provider)
    );
    context.subscriptions.push(provider, providerRegistrations);

    const scanner = new Scanner();

    let linguaAnalyse = vscode.commands.registerCommand('lingua.analyse', () => {
        // await scanner.scanLanguageFiles();
        // await scanner.analyse();

        const uri = Uri.parse('lingua:report');
        return workspace.openTextDocument(uri).then(doc => window.showTextDocument(doc));
    });
    context.subscriptions.push(linguaAnalyse);
}

// this method is called when your extension is deactivated
export function deactivate() {}
