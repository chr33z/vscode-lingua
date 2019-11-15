import * as vscode from 'vscode';
import { TranslationUsage } from '../translation/translation-usage';
import { TranslationMatch } from '../translation/translation-match';

export default class UsageReportDocument {
    private readonly _translationUsage: TranslationUsage;

    private readonly _lines: string[];

    constructor(uri: vscode.Uri, translationUsage: TranslationUsage) {
        this._translationUsage = translationUsage;

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
