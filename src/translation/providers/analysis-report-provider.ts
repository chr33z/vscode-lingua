import * as vscode from 'vscode';
import AnalysisReportDocument from '../documents/analysis-report-document';
import { TranslationSets } from '../translation-sets';
import { TranslationUsage } from '../analysis/translation-usage';
import { LinguaSettings } from '../../lingua-settings';
import { Configuration } from '../../configuration-settings';

export default class AnalysisReportProvider implements vscode.TextDocumentContentProvider, vscode.DocumentLinkProvider {
    static scheme = 'lingua';
    static analysisScheme = 'analysis-report';

    private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
    private _documents = new Map<string, AnalysisReportDocument>();
    private _subscriptions: vscode.Disposable;

    constructor(private _linguaSettings: LinguaSettings, private _translationSets: TranslationSets) {
        // Listen to the `closeTextDocument`-event which means we must
        // clear the corresponding model object - `TranslationReportDocument`
        this._subscriptions = vscode.workspace.onDidCloseTextDocument((doc) =>
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
        const extensionSettings = Configuration.analysisExtension();
        const extensions = extensionSettings.split(',');

        if (uri.path === AnalysisReportProvider.analysisScheme) {
            return new TranslationUsage().analyse(extensions, this._translationSets).then((translationUsage) => {
                let document = new AnalysisReportDocument(uri, translationUsage);
                return document.value;
            });
        } else {
            return '';
        }
    }

    provideDocumentLinks(
        document: vscode.TextDocument,
        token: vscode.CancellationToken
    ): vscode.DocumentLink[] | undefined {
        return undefined;
    }
}
