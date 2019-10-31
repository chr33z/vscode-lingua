import { workspace, Uri } from 'vscode';
import { TranslationSet } from './translation-set';

export class TranslationSets {
    public translationSets: { [path: string]: TranslationSet } = {};

    public uris: { [locale: string]: Uri } = {};

    public get get(): { [locale: string]: TranslationSet } {
        return this.translationSets;
    }

    static async build(localeFiles: { locale: string; uri: Uri }[]) {
        const translationSets = new TranslationSets();
        await Promise.all(
            localeFiles.map(async localeFile => {
                await workspace.openTextDocument(localeFile.uri).then(document => {
                    if (document) {
                        const json = document.getText();
                        const translationSet = new TranslationSet();
                        translationSet.build(localeFile.uri, JSON.parse(json));
                        translationSets.translationSets[localeFile.locale] = translationSet;
                    }
                });
            })
        );

        return translationSets;
    }
}
