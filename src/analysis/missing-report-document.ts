import * as vscode from 'vscode';
import { TranslationUsage } from '../translation/analysis/translation-usage';

export default class MissingReportDocument {
    private readonly _translationUsage: TranslationUsage;

    private readonly _lines: string[];

    constructor(uri: vscode.Uri, translationUsage: TranslationUsage) {
        this._translationUsage = translationUsage;

        this._lines = [`Translation Usage Analysis`, `------------------------------------------------`];
        this._lines.push('Looking for translation identifiers in the language json files that have no');
        this._lines.push('corresponding match in the work project. These might be unused translations.');
        this._lines.push('');
        this._lines.push('');
        this._lines.push(`----------------WARNING-------------------------`);
        this._lines.push(`Although the analysis revealed that there are no corresponding translations`);
        this._lines.push(`in your work project, there is no guarantee that there aren't any partial strings`);
        this._lines.push(`or string interpolations that use these identifiers!`);
        this._lines.push(`The creator of lingua will not take any responsibility for loss of work`);
        this._lines.push(`or if the provided information in this analysis is miss-used!`);
        this._lines.push(`------------------------------------------------`);
        this._lines.push('');

        this._lines.push(`Translation identifiers:`);
        Object.keys(this._translationUsage.totalTranslations).forEach((locale) => {
            this._lines.push(`\t[${locale}]:\t\t\t\t${this._translationUsage.totalTranslations[locale]}`);
        });

        const totalFiles = this._translationUsage.totalFiles;
        const mmissingTranslations = Object.keys(this._translationUsage.missing).length;

        this._lines.push(`Scanned files:\t\t\t${totalFiles}`);
        this._lines.push(`Missing translations:\t${mmissingTranslations}`);
        this._lines.push('');

        this._lines.push(`(Potentially) Missing Translations`);
        this._lines.push(`------------------------------------------------`);
        this._lines.push('');
        this.populateMissing();
    }

    get value() {
        return this._lines.join('\n');
    }

    private populateMissing() {
        this._translationUsage.missing.forEach((missing) => {
            this._lines.push(`Path:\t\t${missing}`);
        });
    }
}
