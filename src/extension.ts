// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { workspace, languages, Disposable, window, Uri } from 'vscode';
import TranslationReportProvider from './translation/translation-report-provider';
import { TranslationSets } from './translation/translation-sets';
import { locateTranslation } from './translation/translation-locator';

let inet: string;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    const provider = new TranslationReportProvider();
    const providerRegistrations = Disposable.from(
        workspace.registerTextDocumentContentProvider(TranslationReportProvider.scheme, provider),
        languages.registerDocumentLinkProvider({ scheme: TranslationReportProvider.scheme }, provider)
    );
    context.subscriptions.push(provider, providerRegistrations);

    context.subscriptions.push(
        vscode.commands.registerCommand('lingua.analyse', async () => {
            const uri = Uri.parse('lingua:report');
            const doc = await workspace.openTextDocument(uri);
            return await window.showTextDocument(doc);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand('lingua.gotoTranslation', async editor => {
            const localeFiles = [{ locale: 'de', uri: Uri.file(`${workspace.rootPath}/src/assets/i18n/de.json`) }];
            const translationSets = await TranslationSets.build(localeFiles);

            const selection: vscode.Selection = editor.selection;
            const selectedText = editor.document.getText(selection);

            locateTranslation(translationSets.get['de'], selectedText);
        })
    );
}

// this method is called when your extension is deactivated
export function deactivate() {}
