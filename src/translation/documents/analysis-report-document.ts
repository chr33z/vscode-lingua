import * as vscode from 'vscode';
import { TranslationUsage } from '../analysis/translation-usage';
import { TranslationMatch } from '../analysis/translation-match';

export default class AnalysisReportDocument {
    private readonly _translationUsage: TranslationUsage;

    private readonly _lines: string[];

    constructor(uri: vscode.Uri, translationUsage: TranslationUsage) {
        this._translationUsage = translationUsage;

        // Start with printing a header and start resolving
        this._lines = [`Translation Analysis Report`, `------------------------------------------------`];
        this._lines.push('Looking for direct matches of the translation path but also partial matches');
        this._lines.push('that might be a valida translation, but can only be determined at runtime.');
        this._lines.push('');

        this._lines.push('Summary');
        this._lines.push(`------------------------------------------------`);
        this._lines.push(`Translation strings:`);
        for (let [locale, count] of this._translationUsage.totalTranslations) {
            this._lines.push(`\t[${locale}]:\t\t\t\t${count}`);
        }
        this._lines.push(`Scanned files:\t\t\t${this._translationUsage.totalFiles}`);
        this._lines.push(`Found translations:\t\t${this._translationUsage.found.size}`);
        this._lines.push('');

        this._lines.push('Contents');
        this._lines.push(`------------------------------------------------`);
        this._lines.push(`(#1) Direct Translation Matches: (${this.foundCount})`);
        this._lines.push(`(#2) Partial Translation Matches: (${this.foundCount})`);
        this._lines.push(`(#3) Missing: (${this.missingCount})`);

        this._lines.push('');

        this._lines.push(`(#1) Direct Translation Matches: (${this.foundCount})`);
        this._lines.push(`------------------------------------------------`);
        this._lines.push('');
        this.populateMatches();

        this._lines.push('');
        this._lines.push(`(#2) Partial Translation Matches: (${this.foundCount})`);
        this._lines.push(`------------------------------------------------`);
        this._lines.push('');
        this.populatePartialMatches();

        this._lines.push('');
        this._lines.push(`(#3) Missing: (${this.missingCount})`);
        this._lines.push(`------------------------------------------------`);
        this._lines.push('');
        this._lines.push(`----------------WARNING-------------------------`);
        this._lines.push(`Although the analysis revealed that there are no corresponding translations`);
        this._lines.push(`in your work project for the following identifiers, there is no guarantee that there`);
        this._lines.push(`aren't any partial strings or string interpolations that use these identifiers!`);
        this._lines.push(`The creators of lingua will not take any responsibility for loss of work`);
        this._lines.push(`or if the provided information in this analysis is miss-used!`);
        this._lines.push(`------------------------------------------------`);

        this._lines.push('');
        this.populateMissing();
    }

    get value() {
        return this._lines.join('\n');
    }

    get foundCount(): number {
        return Array.from(this._translationUsage.found.values()).filter(
            (entry) => entry.match === TranslationMatch.Match
        ).length;
    }

    get partialCount(): number {
        return Array.from(this._translationUsage.found.values()).filter(
            (entry) => entry.match === TranslationMatch.PartialMatch
        ).length;
    }

    get missingCount(): number {
        return this._translationUsage.missing.length;
    }

    private populateMatches() {
        for (let entry of this._translationUsage.found.values()) {
            if (entry && entry.match === TranslationMatch.Match) {
                this._lines.push(`Identifier (${entry.locale}):\t${entry.translationPath}`);
                this._lines.push(`Translation:\t\t${entry.translation}`);
                this._lines.push('');
            }
        }
    }

    private populatePartialMatches() {
        for (let entry of this._translationUsage.found.values()) {
            if (entry && entry.match === TranslationMatch.PartialMatch) {
                this._lines.push(`Identifier (${entry.locale}):\t\t${entry.translationPath}`);
                this._lines.push(`Translation:\t---`);
                this._lines.push('');
            }
        }
    }

    private populateMissing() {
        this._translationUsage.missing.forEach((missing) => {
            this._lines.push(`Identifier:\t\t${missing}`);
        });
    }
}
