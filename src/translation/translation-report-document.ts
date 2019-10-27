import * as vscode from 'vscode';
import { TranslationUsage } from './translation-usage';
import { TranslationEntry } from './translation-entry';
import { TranslationMatch } from './translation-match';

export default class TranslationReportDocument {
    private readonly _uri: vscode.Uri;
    private readonly _emitter: vscode.EventEmitter<vscode.Uri>;
    private readonly _translationUsage: TranslationUsage;

    private readonly _lines: string[];
    private readonly _links: vscode.DocumentLink[];

    constructor(uri: vscode.Uri, translationUsage: TranslationUsage, emitter: vscode.EventEmitter<vscode.Uri>) {
        this._uri = uri;
        this._translationUsage = translationUsage;

        // The TranslationReportDocument has access to the event emitter from
        // the containg provider. This allows it to signal changes
        this._emitter = emitter;
        this._links = [];

        // Start with printing a header and start resolving

        this._lines = [`Translation Usage Analysis`, `------------------------------------------------`];
        this._lines.push('Looking for direct matches of the translation path but also partial matches');
        this._lines.push('that might be a valida translation, but can only be determined at runtime.');
        this._lines.push('');

        this._lines.push(`Translation strings:`);
        Object.keys(this._translationUsage.totalTranslations).forEach(locale => {
            this._lines.push(`\t[${locale}]:\t\t\t\t${this._translationUsage.totalTranslations[locale]}`);
        });
        this._lines.push(`Scanned files:\t\t\t${this._translationUsage.totalFiles}`);
        this._lines.push(`Found translations:\t\t${Object.keys(this._translationUsage.found).length}`);

        this._lines.push('');

        this._lines.push(`Direct Translation Matches`);
        this._lines.push(`------------------------------------------------`);
        this._lines.push('');
        this.populateMatches();

        this._lines.push('');
        this._lines.push(`Partial Translation Matches`);
        this._lines.push(`------------------------------------------------`);
        this._lines.push('');
        this.populatePartialMatches();
    }

    get value() {
        return this._lines.join('\n');
    }

    get links() {
        return this._links;
    }

    private populateMatches() {
        for (const path of Object.keys(this._translationUsage.found)) {
            const entry = this._translationUsage.found[path];

            if (entry.match === TranslationMatch.Match) {
                this._lines.push(`Path (${entry.locale}):\t\t${entry.translationPath}`);
                this._lines.push(`Translation:\t${entry.translation}`);

                for (const location of entry.locations) {
                    this._lines.push(`In file:\t\t${location.uri} (${location.line})`);
                }
                this._lines.push('');
            }
        }
    }

    private populatePartialMatches() {
        for (const path of Object.keys(this._translationUsage.found)) {
            const entry = this._translationUsage.found[path];

            if (entry.match === TranslationMatch.PartialMatch) {
                this._lines.push(`Path (${entry.locale}):\t\t${entry.translationPath}`);
                this._lines.push(`Translation:\t---`);

                for (const location of entry.locations) {
                    this._lines.push(`In file:\t\t${location.uri} (${location.line})`);
                }
                this._lines.push('');
            }
        }
    }
}
