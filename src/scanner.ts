import { TranslationSet } from './translation/translation-set';
import { TextDocument, workspace, Uri, FileType, tasks, window } from 'vscode';
import { posix } from 'path';
import * as _ from 'lodash';
import { TranslationUsage } from './translation/translation-usage';

export class Scanner {
    private i18nPath: string = '/src/assets/i18n';

    private supportedLocales: string[] = [
        'de',
        // "en",
        // "fr"
    ];

    private includeFileExtenstions: string[] = ['ts', 'html'];

    private includeDirectories: string[] = ['src'];

    private translationSets: { [locale: string]: TranslationSet } = {};

    public async scanLanguageFiles() {
        await Promise.all(
            this.supportedLocales.map(async locale => {
                console.log('Scanning for locale: ' + locale);
                await this.scanLanguageFile(locale);
            })
        );
    }

    private async scanLanguageFile(locale: string) {
        await this.getLocaleFile(locale).then(document => {
            if (document) {
                const json = document.getText();
                const translationSet = new TranslationSet();
                translationSet.build(JSON.parse(json));
                this.translationSets[locale] = translationSet;
            }
        });
    }

    // TODO: use findFiles function to get json
    private getLocaleFile(locale: string): Thenable<TextDocument> {
        const workspaceFolder = workspace.rootPath;
        return workspace.openTextDocument(
            Uri.file(`${workspaceFolder}/${this.i18nPath}/${locale}.json`)
        );
    }

    public async analyse(locale: string = '') {
        const urisThenable = this.findFiles(this.includeFileExtenstions);

        await urisThenable.then(async uris => {
            const usage = new TranslationUsage();

            await usage.analyseUsage(uris, this.translationSets);
        });
    }

    private findFiles(includeExt: string[]) {
        const searchPattern = `**/src/**/*.{${includeExt.reduce(
            (i, j) => i + ',' + j
        )}}`;
        const excludePattern = `**/node_modules/**`;
        return workspace.findFiles(searchPattern, excludePattern);
    }
}
