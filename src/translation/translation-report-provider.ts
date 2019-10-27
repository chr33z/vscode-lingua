import * as vscode from 'vscode';
import { Scanner } from '../scanner';
import TranslationReportDocument from './translation-report-document';

export default class TranslationReportProvider
    implements vscode.TextDocumentContentProvider, vscode.DocumentLinkProvider {
    static scheme = 'lingua';

    private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
    private _documents = new Map<string, TranslationReportDocument>();
    private _subscriptions: vscode.Disposable;

    constructor() {
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

    // Expose an event to signal changes of _virtual_ documents
    // to the editor
    get onDidChange() {
        return this._onDidChange.event;
    }

    // Provider method that takes an uri of the `lingua`-scheme and
    // resolves its content by (1) running the reference search command
    // and (2) formatting the results
    provideTextDocumentContent(uri: vscode.Uri): string | Thenable<string> {
        // already loaded?
        // let document = this._documents.get(uri.toString());
        // if (document) {
        //     return document.value;
        // }

        const scanner = new Scanner();
        scanner.scanLanguageFiles();
        return scanner.analyse().then(translationUsage => {
            let document = new TranslationReportDocument(uri, translationUsage, this._onDidChange);
            return document.value;
        });
    }

    provideDocumentLinks(
        document: vscode.TextDocument,
        token: vscode.CancellationToken
    ): vscode.DocumentLink[] | undefined {
        // While building the virtual document we have already created the links.
        // Those are composed from the range inside the document and a target uri
        // to which they point
        const doc = this._documents.get(document.uri.toString());
        if (doc) {
            return doc.links;
        }
    }
}
