import * as vscode from 'vscode';
import UsageReportDocument from './usage-report-document';
import { TranslationSets } from '../translation/translation-sets';
import { TranslationUsage } from '../translation/translation-usage';
import { LinguaSettings } from '../lingua-settings';
import MissingReportDocument from './missing-report-document';

export default class AnalysisReportProvider implements vscode.TextDocumentContentProvider, vscode.DocumentLinkProvider {
    static scheme = 'lingua';
    static usageSchemePath = 'report-usage';
    static missingSchemePath = 'report-missing';

    private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
    private _documents = new Map<string, UsageReportDocument>();
    private _subscriptions: vscode.Disposable;

    constructor(private _linguaSettings: LinguaSettings, private _translationSets: TranslationSets) {
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
        const extensionSettings = vscode.workspace.getConfiguration('lingua').get<string>('analysisExtensions') || '';
        const extensions = extensionSettings.replace(/\s*/, '').split(',');

        if (uri.path === AnalysisReportProvider.usageSchemePath) {
            return new TranslationUsage().analyse(extensions, this._translationSets).then(translationUsage => {
                let document = new UsageReportDocument(uri, translationUsage);
                return document.value;
            });
        } else if (uri.path === AnalysisReportProvider.missingSchemePath) {
            return new TranslationUsage().analyse(extensions, this._translationSets).then(translationUsage => {
                let document = new MissingReportDocument(uri, translationUsage);
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
