import * as vscode from 'vscode';
import TranslationReportDocument from './translation-report-document';
import { TranslationSets } from './translation-sets';
import { Uri, workspace } from 'vscode';
import { TranslationUsage } from './translation-usage';

export default class TranslationReportProvider
    implements vscode.TextDocumentContentProvider, vscode.DocumentLinkProvider {
    static scheme = 'lingua';

    private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
    private _documents = new Map<string, TranslationReportDocument>();
    private _subscriptions: vscode.Disposable;

    constructor(private _linguaSettings: any, private _translationSets: TranslationSets) {
        // Listen to the `closeTextDocument`-event which means we must
        // clear the corresponding model object - `TranslationReportDocument`
        this._subscriptions = vscode.workspace.onDidCloseTextDocument(doc =>
            this._documents.delete(doc.uri.toString())
        );
    }

    dispose() {
        this._subscriptions.dispose();
        this._documents.clear();
        this._onDidChange.dispose();
    }

    get onDidChange() {
        return this._onDidChange.event;
    }

    async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
        return new TranslationUsage()
            .analyse(this._linguaSettings.scanFiles, this._translationSets)
            .then(translationUsage => {
                let document = new TranslationReportDocument(uri, translationUsage, this._onDidChange);
                return document.value;
            });
    }

    provideDocumentLinks(
        document: vscode.TextDocument,
        token: vscode.CancellationToken
    ): vscode.DocumentLink[] | undefined {
        const doc = this._documents.get(document.uri.toString());
        if (doc) {
            return doc.links;
        }
    }
}
